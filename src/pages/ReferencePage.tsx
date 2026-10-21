import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Alert } from '../components/Alert';
import { Metric } from '../components/Metric';
import { reference, meta } from '../data/reference';
import { formatNumber, formatRupiah } from '../lib/valuation/format';
import { SERVICE_CATEGORIES, type ReferenceStudy } from '../types';

type Tab = 'studi' | 'ump';

export function ReferencePage() {
  const [tab, setTab] = useState<Tab>('studi');
  const [search, setSearch] = useState('');
  const [ecosystemFilter, setEcosystemFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [visible, setVisible] = useState(20);

  const filteredStudies = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return reference.studies.filter((study) => {
      if (ecosystemFilter && study.ecosystem !== ecosystemFilter) return false;
      if (!needle) return true;
      const haystack = [
        study.title,
        study.region ?? '',
        study.source ?? '',
        study.ecosystem,
        String(study.year ?? ''),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [search, ecosystemFilter]);

  const filteredLocations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return reference.locations;
    return reference.locations.filter((location) =>
      location.name.toLowerCase().includes(needle),
    );
  }, [search]);

  const shownStudies = filteredStudies.slice(0, visible);
  const shownLocations = filteredLocations.slice(0, visible);

  return (
    <div className="page">
      <PageHeader
        eyebrow="Referensi data"
        title="Studi, komponen, dan tabel UMP"
        lead="Telusuri sumber nilai yang membentuk setiap koefisien. Data di halaman ini berasal langsung dari workbook, termasuk nilai per hektare tahun studi dan nilai tahun 2025 yang dipakai kalkulator."
      />

      <div className="metric-grid metric-grid-compact">
        <Metric
          label="Studi"
          value={formatNumber(meta.studyCount)}
          hint="Database Transfer Benefit"
          tone="accent"
        />
        <Metric
          label="Komponen nilai"
          value={formatNumber(meta.componentCount)}
          hint="Baris komponen jasa"
        />
        <Metric
          label="Lokasi UMP"
          value={formatNumber(meta.locationCount)}
          hint="Provinsi dan kabupaten/kota"
        />
        <Metric
          label="Ekosistem"
          value={formatNumber(meta.ecosystemCount)}
          hint="Sembilan tipe ekosistem"
          tone="muted"
        />
      </div>

      <Alert tone="info" title="Cara membaca nilai per hektare">
        Kolom <strong>Nilai 2025</strong> adalah <em>NILAI SATUAN 2025 (RUMUS)</em> dari workbook.
        Nilai ini sudah memuat faktor majemuk dan menjadi dasar median setelah disesuaikan dengan
        rasio UMP. Kolom <strong>Nilai tahun studi</strong> adalah nilai asli sebelum penyesuaian.
      </Alert>

      <div className="tab-list" role="tablist" aria-label="Jenis data referensi">
        <button
          type="button"
          role="tab"
          id="tab-studi"
          aria-selected={tab === 'studi'}
          aria-controls="panel-studi"
          className={`tab ${tab === 'studi' ? 'is-active' : ''}`}
          onClick={() => {
            setTab('studi');
            setVisible(20);
          }}
        >
          Studi benefit transfer
        </button>
        <button
          type="button"
          role="tab"
          id="tab-ump"
          aria-selected={tab === 'ump'}
          aria-controls="panel-ump"
          className={`tab ${tab === 'ump' ? 'is-active' : ''}`}
          onClick={() => {
            setTab('ump');
            setVisible(20);
          }}
        >
          Tabel UMP 2025
        </button>
      </div>

      {tab === 'studi' ? (
        <div role="tabpanel" id="panel-studi" aria-labelledby="tab-studi">
          <div className="filter-bar">
            <div className="field field-grow">
              <label htmlFor="study-search">Cari studi</label>
              <input
                id="study-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisible(20);
                }}
                placeholder="Judul, wilayah, sumber, atau tahun"
              />
            </div>
            <div className="field">
              <label htmlFor="study-ecosystem">Ekosistem</label>
              <select
                id="study-ecosystem"
                value={ecosystemFilter}
                onChange={(event) => {
                  setEcosystemFilter(event.target.value);
                  setVisible(20);
                }}
              >
                <option value="">Semua ekosistem</option>
                {reference.ecosystems.map((ecosystem) => (
                  <option key={ecosystem.id} value={ecosystem.name}>
                    {ecosystem.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="result-count">
            Menampilkan {formatNumber(shownStudies.length)} dari {formatNumber(filteredStudies.length)}{' '}
            studi.
          </p>

          <div className="study-list">
            {shownStudies.map((study) => (
              <StudyCard
                key={study.id}
                study={study}
                expanded={expanded === study.id}
                onToggle={() =>
                  setExpanded((current) => (current === study.id ? null : study.id))
                }
              />
            ))}
          </div>

          {filteredStudies.length === 0 ? (
            <p className="muted">Tidak ada studi yang cocok dengan pencarian.</p>
          ) : null}

          {shownStudies.length < filteredStudies.length ? (
            <div className="button-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setVisible((current) => current + 20)}
              >
                Tampilkan 20 studi berikutnya
              </button>
            </div>
          ) : null}
        </div>
      ) : (
        <div role="tabpanel" id="panel-ump" aria-labelledby="tab-ump">
          <div className="filter-bar">
            <div className="field field-grow">
              <label htmlFor="ump-search">Cari provinsi atau kabupaten/kota</label>
              <input
                id="ump-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setVisible(20);
                }}
                placeholder="Contoh: Aceh, Bogor, Kota"
              />
            </div>
          </div>
          <p className="result-count">
            Menampilkan {formatNumber(shownLocations.length)} dari{' '}
            {formatNumber(filteredLocations.length)} lokasi.
          </p>
          <div className="table-wrap">
            <table className="data-table">
              <caption>Tabel UMP 2025 untuk penyesuaian daya beli</caption>
              <thead>
                <tr>
                  <th scope="col" className="numeric">
                    No
                  </th>
                  <th scope="col">Wilayah</th>
                  <th scope="col">Jenis</th>
                  <th scope="col" className="numeric">
                    UMP 2025 (Rp)
                  </th>
                  <th scope="col">Dipakai sebagai</th>
                </tr>
              </thead>
              <tbody>
                {shownLocations.map((location) => (
                  <tr key={location.id}>
                    <td className="numeric">{location.id.replace('loc', '')}</td>
                    <th scope="row">{location.name}</th>
                    <td>
                      {location.type === 'province'
                        ? 'Provinsi'
                        : location.type === 'kabupaten_kota'
                          ? 'Kabupaten/Kota'
                          : 'Lainnya'}
                    </td>
                    <td className="numeric">{formatRupiah(location.ump)}</td>
                    <td className="muted">Lokasi acuan atau lokasi studi</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {shownLocations.length < filteredLocations.length ? (
            <div className="button-row">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setVisible((current) => current + 50)}
              >
                Tampilkan 50 lokasi berikutnya
              </button>
            </div>
          ) : null}
        </div>
      )}

      <Section
        title="Integritas dataset"
        description="Metadata teknis yang dapat dipakai untuk memverifikasi versi data."
      >
        <dl className="definition-list definition-list-grid">
          <div>
            <dt>Berkas sumber</dt>
            <dd>{meta.sourceWorkbook}</dd>
          </div>
          <div>
            <dt>Versi dataset</dt>
            <dd>{meta.datasetVersion}</dd>
          </div>
          <div>
            <dt>Versi mesin</dt>
            <dd>{meta.engineVersion}</dd>
          </div>
          <div>
            <dt>Tanggal ekstraksi</dt>
            <dd>{meta.extractedAt}</dd>
          </div>
          <div>
            <dt>SHA-256 (16 karakter)</dt>
            <dd>
              <code>{meta.workbookSha256_16}</code>
            </dd>
          </div>
          <div>
            <dt>Jumlah sheet</dt>
            <dd>{formatNumber(meta.sheetCount)}</dd>
          </div>
        </dl>
        <p className="section-footnote">
          Nilai tidak diubah dari workbook. Lihat{' '}
          <Link to="/metodologi">Metodologi</Link> untuk daftar ketidaksesuaian satuan dan asumsi
          yang dipertahankan.
        </p>
      </Section>
    </div>
  );
}

function StudyCard({
  study,
  expanded,
  onToggle,
}: {
  study: ReferenceStudy;
  expanded: boolean;
  onToggle: () => void;
}) {
  const counts = SERVICE_CATEGORIES.map((category) => ({
    category,
    count: study.components.filter((component) => component.service === category).length,
  }));
  return (
    <article className="study-card">
      <div className="study-card-main">
        <div className="study-card-copy">
          <p className="study-card-ecosystem">
            {study.ecosystem}
            {study.year ? ` · ${study.year}` : ''}
          </p>
          <h3>{study.title}</h3>
          <p className="study-card-meta">
            Wilayah studi: {study.region ?? 'tidak tercatat'} · UMP wilayah:{' '}
            {study.studyUmp === null ? 'tidak tersedia' : formatRupiah(study.studyUmp)}
          </p>
          <p className="study-card-counts">
            {counts.map((item) => (
              <span key={item.category}>
                {item.category}: {item.count}
              </span>
            ))}
            <span>Total komponen: {study.components.length}</span>
          </p>
        </div>
        <button type="button" className="button button-secondary button-small" onClick={onToggle} aria-expanded={expanded}>
          {expanded ? 'Tutup komponen' : 'Lihat komponen'}
        </button>
      </div>
      {expanded ? (
        <div className="study-card-detail">
          <div className="table-wrap">
            <table className="data-table compact">
              <thead>
                <tr>
                  <th scope="col">Jasa</th>
                  <th scope="col">Komponen</th>
                  <th scope="col">Metode</th>
                  <th scope="col" className="numeric">
                    Nilai tahun studi (Rp/ha)
                  </th>
                  <th scope="col" className="numeric">
                    Nilai 2025 (Rp/ha)
                  </th>
                  <th scope="col">Satuan asli</th>
                </tr>
              </thead>
              <tbody>
                {study.components.map((component, index) => (
                  <tr key={`${component.component}-${index}`}>
                    <td>{component.service}</td>
                    <th scope="row" className="wrap-cell">
                      {component.component}
                    </th>
                    <td>{component.method ?? '—'}</td>
                    <td className="numeric">
                      {component.rawPerHa === null ? '—' : formatRupiah(component.rawPerHa, 2)}
                    </td>
                    <td className="numeric">
                      {component.basePerHa2025 === null
                        ? 'Tidak tersedia'
                        : formatRupiah(component.basePerHa2025, 2)}
                    </td>
                    <td>{component.unit ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="study-source">
            <strong>Sumber:</strong> {study.source ?? 'Tidak tercatat di workbook.'}
          </p>
          <p className="table-note">
            Satuan asli ditampilkan apa adanya. Workbook membagi nilai total dengan luas studi untuk
            memperoleh nilai per hektare; beberapa satuan asli bukan per hektare. Lihat catatan
            metodologi.
          </p>
        </div>
      ) : null}
    </article>
  );
}
