import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Metric } from '../components/Metric';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/EmptyState';
import { CoefficientTable } from '../components/CoefficientTable';
import { CompositionPieChart, HorizontalBarChart } from '../components/Charts';
import { LocationSelect } from '../components/LocationSelect';
import { useAppState } from '../state/AppState';
import { meta, reference } from '../data/reference';
import {
  coefficientsForEcosystem,
  getLocation,
  summarizePortfolio,
} from '../lib/valuation/engine';
import {
  formatArea,
  formatCompactRupiah,
  formatCount,
  formatNumber,
  formatRupiah,
} from '../lib/valuation/format';
import { KAWASAN_STATUS_LABELS, SERVICE_CATEGORIES, type KawasanStatus } from '../types';

export function OverviewPage() {
  const { locationId, setLocationId, records } = useAppState();
  const location = getLocation(locationId) ?? reference.locations[0];
  const summary = useMemo(() => summarizePortfolio(records), [records]);

  const barData = useMemo(() => {
    if (!location) return [];
    return reference.ecosystems
      .map((ecosystem) => {
        const coefficients = coefficientsForEcosystem(ecosystem.name, location.ump, location.id);
        return { name: ecosystem.name, value: coefficients.total ?? 0 };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [location]);

  const ecosystemValueData = summary.byEcosystem
    .filter((item) => item.value > 0)
    .map((item) => ({ name: item.ecosystem, value: item.value }));

  const serviceData = SERVICE_CATEGORIES.map((category) => ({
    name: category,
    value: summary.byService[category],
  })).filter((item) => item.value > 0);

  const areaData = summary.byEcosystem
    .filter((item) => item.areaHa > 0)
    .map((item) => ({ name: item.ecosystem, value: item.areaHa }));

  if (!location) {
    return (
      <Alert tone="error" title="Data lokasi tidak tersedia">
        Tabel UMP tidak dapat dibaca dari dataset referensi.
      </Alert>
    );
  }

  const hasRecords = records.length > 0;
  const largestEcosystemValue =
    summary.byEcosystem.find((item) => item.value > 0)?.value ?? null;
  const statusRows: KawasanStatus[] = ['KL', 'NON_KL', 'UNKNOWN'];

  return (
    <div className="page">
      <PageHeader
        eyebrow="Ringkasan wilayah"
        title="Valuasi jasa ekosistem pada kawasan lindung"
        lead="Estimasi nilai ekonomi jasa ekosistem berdasarkan metode benefit transfer, disesuaikan dengan upah minimum wilayah dan tahun harga 2025. Seluruh angka dihitung dari dataset referensi dan catatan yang Anda tambahkan."
        actions={
          <Link className="button button-primary" to="/kalkulator">
            Mulai perhitungan
          </Link>
        }
      />

      <div className="control-bar">
        <LocationSelect
          value={locationId}
          onChange={setLocationId}
          label="Lokasi acuan"
          hint={`UMP 2025: ${formatRupiah(location.ump)}. Pilih provinsi atau kabupaten/kota sesuai lokasi ekosistem.`}
        />
        <div className="control-meta">
          <p className="control-meta-label">Periode harga</p>
          <p className="control-meta-value">Tahun {meta.priceYear}</p>
          <p className="control-meta-note">Tidak ada periode laporan lain di workbook.</p>
        </div>
      </div>

      <div className="metric-grid">
        <Metric
          label="Total nilai tervaluasi"
          value={
            !hasRecords
              ? 'Belum ada catatan'
              : summary.supportedCount === 0
                ? 'Tidak ada nilai tervaluasi'
                : formatRupiah(summary.totalValue)
          }
          hint={
            !hasRecords
              ? 'Tambahkan catatan luas melalui kalkulator untuk menghitung total.'
              : summary.supportedCount === 0
                ? 'Catatan yang ada tidak berstatus kawasan lindung atau tidak memiliki koefisien.'
                : `${formatNumber(summary.supportedCount)} catatan kawasan lindung tervaluasi`
          }
          tone="accent"
        />
        <Metric
          label="Luas kawasan lindung tervaluasi"
          value={hasRecords ? formatArea(summary.supportedAreaHa) : '—'}
          hint="Hanya catatan berstatus kawasan lindung/berfungsi lindung."
        />
        <Metric
          label="Catatan wilayah"
          value={formatCount(records.length)}
          hint={
            records.length > 0
              ? `${formatNumber(summary.unsupportedCount)} catatan tidak tervaluasi`
              : 'Belum ada catatan pada perangkat ini.'
          }
        />
        <Metric
          label="UMP acuan"
          value={formatRupiah(location.ump)}
          hint={location.name}
          tone="muted"
        />
      </div>

      {!hasRecords ? (
        <Alert tone="info" title="Total provinsi belum dapat dihitung dari workbook">
          Workbook sumber tidak memuat luas ekosistem per provinsi atau kabupaten/kota. Karena
          itu portal tidak menampilkan angka total provinsi yang tidak berdasar. Tambahkan luas
          ekosistem yang Anda miliki melalui kalkulator; total, komposisi, dan ekspor akan
          dihitung dari catatan tersebut.
          <div className="alert-actions">
            <Link className="button button-primary button-small" to="/kalkulator">
              Tambah catatan luas
            </Link>
            <Link className="button button-secondary button-small" to="/referensi">
              Lihat studi referensi
            </Link>
          </div>
        </Alert>
      ) : null}

      <Section
        title="Nilai satuan referensi menurut ekosistem"
        description={
          <>
            Median nilai per hektare per tahun untuk lokasi <strong>{location.name}</strong>.
            Bersumber dari {formatNumber(meta.studyCount)} studi benefit transfer di workbook;
            setiap sel mencantumkan jumlah studi non-nol yang membentuk median, setelah
            disesuaikan dengan rasio UMP lokasi acuan terhadap UMP lokasi studi.
          </>
        }
      >
        <CoefficientTable locationId={location.id} targetUmp={location.ump} />
        <div className="panel coefficient-chart">
          <h3 className="panel-title">Peringkat nilai total per hektare</h3>
          {barData.length > 0 ? (
            <HorizontalBarChart
              data={barData}
              ariaLabel="Diagram batang nilai total per hektare menurut jenis ekosistem"
              height={360}
            />
          ) : (
            <p className="muted">Tidak ada koefisien yang dapat ditampilkan.</p>
          )}
        </div>
      </Section>

      <Section
        title="Komposisi portofolio"
        description="Komposisi dihitung hanya dari catatan yang Anda tambahkan pada perangkat ini. Tidak ada data ilustratif."
      >
        {hasRecords ? (
          <>
            <div className="chart-grid">
              <div className="panel">
                <h3 className="panel-title">Nilai menurut ekosistem</h3>
                <CompositionPieChart
                  data={ecosystemValueData}
                  ariaLabel="Komposisi nilai ekonomi menurut jenis ekosistem"
                />
              </div>
              <div className="panel">
                <h3 className="panel-title">Distribusi nilai jasa</h3>
                <CompositionPieChart
                  data={serviceData}
                  ariaLabel="Distribusi nilai menurut kategori jasa ekosistem"
                />
              </div>
              <div className="panel">
                <h3 className="panel-title">Luas menurut ekosistem</h3>
                {areaData.length > 0 ? (
                  <HorizontalBarChart
                    data={areaData}
                    ariaLabel="Diagram batang luas menurut jenis ekosistem"
                    height={280}
                    formatValue={(value) => `${formatNumber(value, 2)} ha`}
                    formatAxis={(value) => formatNumber(value, 0)}
                    valueLabel="Luas"
                  />
                ) : (
                  <p className="muted">Belum ada luas yang dapat ditampilkan.</p>
                )}
              </div>
            </div>
            <div className="table-wrap">
              <table className="data-table">
                <caption>Rekonsiliasi portofolio menurut ekosistem</caption>
                <thead>
                  <tr>
                    <th scope="col">Ekosistem</th>
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
                  {summary.byEcosystem.map((row) => (
                    <tr key={row.ecosystem}>
                      <th scope="row">{row.ecosystem}</th>
                      <td className="numeric">{formatNumber(row.recordCount)}</td>
                      <td className="numeric">{formatNumber(row.areaHa, 2)}</td>
                      <td className="numeric">{formatRupiah(row.value)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th scope="row">Total</th>
                    <td className="numeric">{formatNumber(summary.recordCount)}</td>
                    <td className="numeric">{formatNumber(summary.totalAreaHa, 2)}</td>
                    <td className="numeric">{formatRupiah(summary.totalValue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        ) : (
          <EmptyState
            title="Belum ada catatan wilayah"
            action={
              <Link className="button button-primary button-small" to="/kalkulator">
                Buka kalkulator
              </Link>
            }
          >
            Komposisi ekosistem dan distribusi jasa akan muncul setelah Anda menambahkan luas
            ekosistem pada kalkulator. Data tersimpan di peramban ini dan dapat diekspor dari
            halaman Analisis.
          </EmptyState>
        )}
      </Section>

      <Section
        title="Kawasan lindung dan non-kawasan lindung"
        description="Status kawasan diisi oleh pengguna. Workbook tidak memuat aturan valuasi untuk non-kawasan lindung."
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Status kawasan</th>
                <th scope="col" className="numeric">
                  Catatan
                </th>
                <th scope="col" className="numeric">
                  Luas (ha)
                </th>
                <th scope="col" className="numeric">
                  Nilai tervaluasi (Rp/tahun)
                </th>
                <th scope="col">Keterangan</th>
              </tr>
            </thead>
            <tbody>
              {statusRows.map((status) => {
                const row = summary.byStatus[status] ?? {
                  areaHa: 0,
                  value: 0,
                  recordCount: 0,
                };
                return (
                  <tr key={status}>
                    <th scope="row">{KAWASAN_STATUS_LABELS[status]}</th>
                    <td className="numeric">{formatNumber(row.recordCount)}</td>
                    <td className="numeric">{formatNumber(row.areaHa, 2)}</td>
                    <td className="numeric">
                      {status === 'KL' ? formatRupiah(row.value) : 'Tidak dihitung'}
                    </td>
                    <td className="wrap-cell">
                      {status === 'KL'
                        ? 'Koefisien benefit transfer diterapkan.'
                        : status === 'NON_KL'
                          ? 'Workbook tidak menyediakan koefisien non-kawasan lindung.'
                          : 'Status belum diketahui; nilai tidak dihitung.'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="table-note">
          Luas non-kawasan lindung tetap tercatat untuk kelengkapan, tetapi tidak diberi nilai.
          Ini mencegah penggunaan koefisien di luar cakupan metodologi workbook.
        </p>
      </Section>

      <Section
        title="Metodologi ringkas dan sumber data"
        description="Tiga langkah utama yang direproduksi dari workbook."
      >
        <div className="process-grid">
          <div className="process-step">
            <p className="process-number">01</p>
            <h3>Nilai satuan 2025</h3>
            <p>
              Nilai per hektare dari studi terpilih sudah memuat penyesuaian majemuk 4,75% per
              tahun ke tahun 2025, sesuai kolom <em>NILAI SATUAN 2025 (RUMUS)</em>.
            </p>
          </div>
          <div className="process-step">
            <p className="process-number">02</p>
            <h3>Penyesuaian daya beli</h3>
            <p>
              Nilai dikalikan rasio UMP 2025 lokasi acuan terhadap UMP 2025 lokasi studi. Rasio
              ini menggantikan perbedaan daya beli antarwilayah.
            </p>
          </div>
          <div className="process-step">
            <p className="process-number">03</p>
            <h3>Median dan agregasi</h3>
            <p>
              Total per kategori jasa dihitung per studi, lalu diambil median dari nilai non-nol.
              Nilai total adalah jumlah median Cultural, Provisioning, dan Regulating.
            </p>
          </div>
        </div>
        <div className="source-strip">
          <div>
            <p className="source-label">Sumber data</p>
            <p className="source-value">{meta.sourceWorkbook}</p>
          </div>
          <div>
            <p className="source-label">Versi dataset</p>
            <p className="source-value">{meta.datasetVersion}</p>
          </div>
          <div>
            <p className="source-label">Studi / komponen</p>
            <p className="source-value">
              {formatNumber(meta.studyCount)} studi · {formatNumber(meta.componentCount)} komponen
            </p>
          </div>
          <div>
            <p className="source-label">Cakupan</p>
            <p className="source-value">
              {formatNumber(meta.ecosystemCount)} ekosistem · {formatNumber(meta.locationCount)}{' '}
              lokasi UMP
            </p>
          </div>
        </div>
        <Alert tone="warning" title="Keterbatasan penting">
          Angka adalah estimasi benefit transfer, bukan hasil survei lapangan. Workbook tidak
          memuat batas spasial, luas ekosistem per wilayah, atau koefisien khusus non-kawasan
          lindung. Beberapa satuan komponen di workbook tidak konsisten per hektare; nilai
          dipertahankan sebagaimana workbook. Baca{' '}
          <Link to="/metodologi">metodologi dan keterbatasan</Link> sebelum menggunakan hasil.
        </Alert>
        <p className="section-footnote">
          Tidak ada peta pada halaman ini karena dataset referensi tidak memuat geometri wilayah.
          Menampilkan peta akan memerlukan data batas kawasan dari sumber lain yang tidak tersedia
          di workbook.
        </p>
      </Section>

      <div className="page-end-note">
        <p>
          Ringkasan ini dihitung pada {formatCount(records.length)} catatan dan{' '}
          {formatNumber(meta.locationCount)} pilihan lokasi UMP. Nilai terbesar pada portofolio
          saat ini: {formatCompactRupiah(largestEcosystemValue)}.
        </p>
      </div>
    </div>
  );
}
