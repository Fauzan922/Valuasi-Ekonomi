import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Metric } from '../components/Metric';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { CompositionPieChart } from '../components/Charts';
import { useAppState } from '../state/AppState';
import { reference } from '../data/reference';
import { getKawasanById } from '../lib/classification/rules';
import { summarizePortfolio, valueRecord } from '../lib/valuation/engine';
import {
  formatArea,
  formatDate,
  formatNumber,
  formatRupiah,
} from '../lib/valuation/format';
import { downloadCsv, downloadExcel } from '../lib/export/exporters';
import {
  KAWASAN_STATUS_LABELS,
  SERVICE_CATEGORIES,
  type KawasanStatus,
  type PortfolioRecord,
} from '../types';

type SortKey = 'label' | 'province' | 'ecosystem' | 'areaHa' | 'totalValue' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface Row {
  record: PortfolioRecord;
  valuation: ReturnType<typeof valueRecord>;
}

function compareRows(a: Row, b: Row, key: SortKey): number {
  switch (key) {
    case 'label':
      return a.record.label.localeCompare(b.record.label, 'id');
    case 'province':
      return (a.record.province ?? '').localeCompare(b.record.province ?? '', 'id');
    case 'ecosystem':
      return a.record.ecosystem.localeCompare(b.record.ecosystem, 'id');
    case 'areaHa':
      return a.record.areaHa - b.record.areaHa;
    case 'totalValue':
      return (a.valuation.totalValue ?? 0) - (b.valuation.totalValue ?? 0);
    case 'createdAt':
      return a.record.createdAt.localeCompare(b.record.createdAt);
  }
}

export function AnalysisPage() {
  const { records, removeRecord, clearRecords, storageAvailable } = useAppState();
  const [search, setSearch] = useState('');
  const [provinceFilter, setProvinceFilter] = useState('');
  const [ecosystemFilter, setEcosystemFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const provinces = useMemo(() => {
    const set = new Set<string>();
    records.forEach((record) => {
      if (record.province?.trim()) set.add(record.province.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'id'));
  }, [records]);

  const rows = useMemo<Row[]>(
    () => records.map((record) => ({ record, valuation: valueRecord(record) })),
    [records],
  );

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (provinceFilter && (row.record.province ?? '') !== provinceFilter) return false;
        if (ecosystemFilter && row.record.ecosystem !== ecosystemFilter) return false;
        if (statusFilter && row.record.kawasanStatus !== statusFilter) return false;
        if (!needle) return true;
        const haystack = [
          row.record.label,
          row.record.province ?? '',
          row.record.ecosystem,
          row.record.notes ?? '',
          row.valuation.location?.name ?? '',
        ]
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => {
        const direction = sortDirection === 'asc' ? 1 : -1;
        return compareRows(a, b, sortKey) * direction;
      });
  }, [rows, search, provinceFilter, ecosystemFilter, statusFilter, sortKey, sortDirection]);

  const filteredRecords = useMemo(() => filtered.map((row) => row.record), [filtered]);
  const summary = useMemo(() => summarizePortfolio(filteredRecords), [filteredRecords]);
  const filteredProvinces = useMemo(() => {
    const set = new Set<string>();
    filteredRecords.forEach((record) => {
      if (record.province?.trim()) set.add(record.province.trim());
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'id'));
  }, [filteredRecords]);
  const unvaluedAreaHa = summary.nonKlAreaHa + summary.unknownStatusAreaHa;

  const valueByEcosystem = summary.byEcosystem
    .filter((item) => item.value > 0)
    .map((item) => ({ name: item.ecosystem, value: item.value }));
  const serviceData = SERVICE_CATEGORIES.map((category) => ({
    name: category,
    value: summary.byService[category],
  })).filter((item) => item.value > 0);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection(key === 'createdAt' || key === 'areaHa' || key === 'totalValue' ? 'desc' : 'asc');
    }
  }

  function sortIndicator(key: SortKey) {
    if (key !== sortKey) return null;
    return <span aria-hidden="true">{sortDirection === 'asc' ? ' ↑' : ' ↓'}</span>;
  }

  function sortAria(key: SortKey) {
    if (key !== sortKey) return 'none';
    return sortDirection === 'asc' ? 'ascending' : 'descending';
  }

  const exportSuffix = new Date().toISOString().slice(0, 10);
  const filtersActive = Boolean(search || provinceFilter || ecosystemFilter || statusFilter);

  return (
    <div className="page page-analysis">
      <PageHeader
        eyebrow="Analisis portofolio"
        title="Rekonsiliasi dan ekspor catatan wilayah"
        lead="Kelola catatan luas ekosistem, saring menurut wilayah dan status kawasan, lalu telusuri nilai hingga tingkat catatan. Seluruh total dihitung ulang dari koefisien referensi dan luas yang tercatat."
        actions={
          <>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => window.print()}
              disabled={filtered.length === 0}
            >
              Cetak laporan
            </button>
            <button
              type="button"
              className="button button-primary"
              onClick={() => downloadCsv(filteredRecords, `valuasi-ekosistem-${exportSuffix}.csv`)}
              disabled={filtered.length === 0}
            >
              Ekspor CSV
            </button>
          </>
        }
      />

      {!storageAvailable ? (
        <Alert tone="warning" title="Penyimpanan peramban tidak tersedia">
          Catatan mungkin tidak bertahan setelah halaman ditutup. Ekspor CSV/Excel secara berkala.
        </Alert>
      ) : null}

      <div className="print-only print-header">
        <p className="print-kicker">Portal Valuasi Ekonomi Jasa Ekosistem</p>
        <h1>Laporan analisis portofolio</h1>
        <p>Dicetak pada {formatDate(new Date().toISOString())}</p>
      </div>

      <div className="metric-grid">
        <Metric
          label="Total nilai tervaluasi"
          value={filtered.length ? formatRupiah(summary.totalValue) : 'Belum ada catatan'}
          hint={
            filtered.length
              ? `${formatNumber(summary.supportedCount)} dari ${formatNumber(filtered.length)} catatan`
              : 'Tambahkan catatan melalui kalkulator.'
          }
          tone="accent"
        />
        <Metric
          label="Luas tercatat"
          value={filtered.length ? formatArea(summary.totalAreaHa) : '—'}
          hint={
            unvaluedAreaHa > 0
              ? `${formatArea(summary.supportedAreaHa)} kawasan lindung; ${formatArea(unvaluedAreaHa)} tidak dihitung`
              : 'Seluruh catatan berstatus kawasan lindung.'
          }
        />
        <Metric
          label="Jumlah catatan"
          value={formatNumber(filtered.length)}
          hint={filtersActive ? 'Mengikuti filter aktif.' : 'Seluruh catatan pada perangkat ini.'}
        />
        <Metric
          label="Provinsi tercatat"
          value={formatNumber(filteredProvinces.length)}
          hint={filteredProvinces.length ? filteredProvinces.slice(0, 3).join(', ') : 'Belum ada provinsi.'}
          tone="muted"
        />
      </div>

      {records.length === 0 ? (
        <EmptyState
          title="Portofolio masih kosong"
          action={
            <Link className="button button-primary button-small" to="/kalkulator">
              Buka kalkulator
            </Link>
          }
        >
          Catatan luas yang ditambahkan dari kalkulator akan muncul di sini. Workbook tidak
          menyediakan luas wilayah siap pakai, sehingga tidak ada angka yang diisi otomatis.
        </EmptyState>
      ) : (
        <>
          <div className="filter-bar">
            <div className="field field-grow">
              <label htmlFor="analysis-search">Cari catatan</label>
              <input
                id="analysis-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Label, provinsi, ekosistem, atau catatan"
              />
            </div>
            <div className="field">
              <label htmlFor="province-filter">Provinsi</label>
              <select
                id="province-filter"
                value={provinceFilter}
                onChange={(event) => setProvinceFilter(event.target.value)}
              >
                <option value="">Semua provinsi</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="ecosystem-filter">Ekosistem</label>
              <select
                id="ecosystem-filter"
                value={ecosystemFilter}
                onChange={(event) => setEcosystemFilter(event.target.value)}
              >
                <option value="">Semua ekosistem</option>
                {reference.ecosystems.map((ecosystem) => (
                  <option key={ecosystem.id} value={ecosystem.name}>
                    {ecosystem.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="status-filter">Status kawasan</label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="">Semua status</option>
                {(['KL', 'NON_KL', 'UNKNOWN'] as KawasanStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {KAWASAN_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-actions">
              <button
                type="button"
                className="button button-secondary button-small"
                onClick={() => {
                  setSearch('');
                  setProvinceFilter('');
                  setEcosystemFilter('');
                  setStatusFilter('');
                }}
                disabled={!filtersActive}
              >
                Reset filter
              </button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="Tidak ada catatan yang cocok">
              Ubah kata kunci atau filter. Total tidak dihitung dari catatan yang tersaring keluar.
            </EmptyState>
          ) : (
            <>
              <div className="table-wrap">
                <table className="data-table analysis-table">
                    <caption>
                      Catatan valuasi tersaring ({formatNumber(filtered.length)}). Klik judul
                      kolom untuk mengurutkan; klik “Rincian” untuk membuka perhitungan.
                    </caption>
                    <thead>
                      <tr>
                        <th scope="col" aria-sort={sortAria('label')}>
                          <button type="button" className="sort-button" onClick={() => toggleSort('label')}>
                            Catatan {sortIndicator('label')}
                          </button>
                        </th>
                        <th scope="col" aria-sort={sortAria('province')}>
                          <button type="button" className="sort-button" onClick={() => toggleSort('province')}>
                            Provinsi {sortIndicator('province')}
                          </button>
                        </th>
                        <th scope="col" aria-sort={sortAria('ecosystem')}>
                          <button type="button" className="sort-button" onClick={() => toggleSort('ecosystem')}>
                            Ekosistem {sortIndicator('ecosystem')}
                          </button>
                        </th>
                        <th scope="col">Status</th>
                        <th scope="col" className="numeric" aria-sort={sortAria('areaHa')}>
                          <button type="button" className="sort-button" onClick={() => toggleSort('areaHa')}>
                            Luas (ha) {sortIndicator('areaHa')}
                          </button>
                        </th>
                        <th scope="col" className="numeric" aria-sort={sortAria('totalValue')}>
                          <button type="button" className="sort-button" onClick={() => toggleSort('totalValue')}>
                            Nilai total (Rp/tahun) {sortIndicator('totalValue')}
                          </button>
                        </th>
                        <th scope="col" className="action-cell">
                          <span className="sr-only">Tindakan</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((row) => {
                        const isOpen = expanded === row.record.id;
                        return (
                          <FragmentRow
                            key={row.record.id}
                            row={row}
                            isOpen={isOpen}
                            onToggle={() =>
                              setExpanded((current) => (current === row.record.id ? null : row.record.id))
                            }
                            onDelete={() => {
                              if (window.confirm(`Hapus catatan “${row.record.label}”?`)) {
                                removeRecord(row.record.id);
                              }
                            }}
                          />
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan={4}>
                          Total tersaring
                        </th>
                        <td className="numeric">{formatNumber(summary.totalAreaHa, 2)}</td>
                        <td className="numeric">{formatRupiah(summary.totalValue)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="chart-grid-2">
                  <div className="panel">
                    <h3 className="panel-title">Komposisi nilai tersaring</h3>
                    <CompositionPieChart
                      data={valueByEcosystem}
                      ariaLabel="Komposisi nilai menurut ekosistem pada catatan tersaring"
                    />
                  </div>
                  <div className="panel">
                    <h3 className="panel-title">Distribusi jasa</h3>
                    <CompositionPieChart
                      data={serviceData}
                      ariaLabel="Distribusi nilai menurut kategori jasa pada catatan tersaring"
                    />
                  </div>
                </div>

              <div className="table-wrap">
                <table className="data-table">
                  <caption>Rekonsiliasi menurut provinsi (catatan tersaring)</caption>
                  <thead>
                    <tr>
                      <th scope="col">Provinsi</th>
                      <th scope="col" className="numeric">
                        Catatan
                      </th>
                      <th scope="col" className="numeric">
                        Luas (ha)
                      </th>
                      <th scope="col" className="numeric">
                        Nilai total (Rp/tahun)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.byProvince.map((row) => (
                      <tr key={row.province}>
                        <th scope="row">{row.province}</th>
                        <td className="numeric">{formatNumber(row.recordCount)}</td>
                        <td className="numeric">{formatNumber(row.areaHa, 2)}</td>
                        <td className="numeric">{formatRupiah(row.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => void downloadExcel(filteredRecords, `valuasi-ekosistem-${exportSuffix}.xlsx`)}
                >
                  Ekspor Excel
                </button>
                {!confirmClear ? (
                  <button
                    type="button"
                    className="button button-secondary button-danger"
                    onClick={() => setConfirmClear(true)}
                  >
                    Hapus semua catatan
                  </button>
                ) : (
                  <span className="confirm-inline">
                    <span>Hapus {formatNumber(records.length)} catatan secara permanen?</span>
                    <button
                      type="button"
                      className="button button-danger button-small"
                      onClick={() => {
                        clearRecords();
                        setConfirmClear(false);
                        setExpanded(null);
                      }}
                    >
                      Ya, hapus
                    </button>
                    <button
                      type="button"
                      className="button button-secondary button-small"
                      onClick={() => setConfirmClear(false)}
                    >
                      Batal
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </>
      )}

      <p className="table-note">
        Nilai non-kawasan lindung dan status belum diketahui tetap muncul di tabel dengan luas,
        tetapi nilai totalnya tidak dihitung dan tidak masuk total. Ini sesuai cakupan workbook.
      </p>
    </div>
  );
}

function FragmentRow({
  row,
  isOpen,
  onToggle,
  onDelete,
}: {
  row: Row;
  isOpen: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const { record, valuation } = row;
  const kawasan = record.kawasanTypeId ? getKawasanById(record.kawasanTypeId) : null;
  return (
    <>
      <tr className={isOpen ? 'is-open' : undefined}>
        <th scope="row">
          <span className="row-title">{record.label}</span>
          <span className="row-subtitle">{formatDate(record.createdAt)}</span>
        </th>
        <td>{record.province ?? '—'}</td>
        <td>{record.ecosystem}</td>
        <td>
          <span className={`status ${record.kawasanStatus === 'KL' ? 'status-ok' : 'status-missing'}`}>
            {KAWASAN_STATUS_LABELS[record.kawasanStatus]}
          </span>
        </td>
        <td className="numeric">{formatNumber(record.areaHa, 2)}</td>
        <td className="numeric">
          {valuation.totalValue === null ? (
            <span className="muted">Tidak dihitung</span>
          ) : (
            formatRupiah(valuation.totalValue)
          )}
        </td>
        <td className="action-cell">
          <button type="button" className="text-button" onClick={onToggle} aria-expanded={isOpen}>
            {isOpen ? 'Tutup' : 'Rincian'}
          </button>
        </td>
      </tr>
      {isOpen ? (
        <tr className="detail-row">
          <td colSpan={7}>
            <div className="detail-panel">
              <div className="detail-columns">
                <div>
                  <p className="detail-label">Lokasi acuan UMP</p>
                  <p>
                    {valuation.location
                      ? `${valuation.location.name} — ${formatRupiah(valuation.location.ump)}`
                      : 'Tidak ditemukan'}
                  </p>
                </div>
                <div>
                  <p className="detail-label">Jenis kawasan</p>
                  <p>{kawasan?.name ?? 'Tidak diisi'}</p>
                </div>
                <div>
                  <p className="detail-label">Koefisien total</p>
                  <p>
                    {valuation.coefficients?.total === null || !valuation.coefficients
                      ? '—'
                      : `${formatRupiah(valuation.coefficients.total, 2)} /ha/tahun`}
                  </p>
                </div>
                <div>
                  <p className="detail-label">Catatan</p>
                  <p>{record.notes ?? '—'}</p>
                </div>
              </div>
              <table className="data-table compact">
                <thead>
                  <tr>
                    <th scope="col">Kategori jasa</th>
                    <th scope="col" className="numeric">
                      Koefisien (Rp/ha/tahun)
                    </th>
                    <th scope="col" className="numeric">
                      Nilai (Rp/tahun)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {SERVICE_CATEGORIES.map((category) => (
                    <tr key={category}>
                      <th scope="row">{category}</th>
                      <td className="numeric">
                        {valuation.coefficients?.categories[category].value === null ||
                        !valuation.coefficients
                          ? '—'
                          : formatRupiah(valuation.coefficients.categories[category].value, 2)}
                      </td>
                      <td className="numeric">
                        {valuation.categoryValues[category] === null
                          ? 'Tidak tersedia'
                          : formatRupiah(valuation.categoryValues[category])}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td className="numeric">
                      {valuation.coefficients?.total === null || !valuation.coefficients
                        ? '—'
                        : formatRupiah(valuation.coefficients.total, 2)}
                    </td>
                    <td className="numeric">
                      {valuation.totalValue === null ? 'Tidak dihitung' : formatRupiah(valuation.totalValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
              <p className="table-note">
                Nilai kategori dan total dibulatkan secara independen dari nilai penuh. Karena
                itu, penjumlahan angka yang ditampilkan dapat berbeda Rp1 dari baris total.
              </p>
              {!valuation.supported ? (
                <Alert tone="warning" title="Catatan tidak tervaluasi">
                  {valuation.reason}
                </Alert>
              ) : null}
              <div className="detail-actions">
                <button
                  type="button"
                  className="button button-secondary button-small button-danger"
                  onClick={onDelete}
                >
                  Hapus catatan
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
