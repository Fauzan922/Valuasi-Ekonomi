import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Alert } from '../components/Alert';
import { LocationSelect } from '../components/LocationSelect';
import { EcosystemSelect } from '../components/EcosystemSelect';
import { StudyBreakdown } from '../components/StudyBreakdown';
import { useAppState } from '../state/AppState';
import { reference } from '../data/reference';
import { getKawasanById } from '../lib/classification/rules';
import { coefficientsForEcosystem, getLocation } from '../lib/valuation/engine';
import { formatArea, formatRupiah } from '../lib/valuation/format';
import { parseAreaInput } from '../lib/validation/inputs';
import {
  SERVICE_CATEGORIES,
  SERVICE_LABELS,
  type KawasanStatus,
  type ServiceSelection,
} from '../types';

function initialEcosystem(value: string | null): string {
  return value && reference.ecosystems.some((item) => item.name === value) ? value : 'Hutan';
}

function initialService(value: string | null): ServiceSelection {
  const candidate = value ?? '';
  if (
    candidate === 'Total' ||
    (SERVICE_CATEGORIES as readonly string[]).includes(candidate)
  ) {
    return candidate as ServiceSelection;
  }
  return 'Total';
}

export function CalculatorPage() {
  const [searchParams] = useSearchParams();
  const { locationId, setLocationId, addRecord } = useAppState();

  const [ecosystem, setEcosystem] = useState(() =>
    initialEcosystem(searchParams.get('ekosistem')),
  );
  const [service, setService] = useState<ServiceSelection>(() =>
    initialService(searchParams.get('jasa')),
  );
  const [areaInput, setAreaInput] = useState(searchParams.get('luas') ?? '');
  const [kawasanId, setKawasanId] = useState(searchParams.get('kawasan') ?? '');
  const [label, setLabel] = useState('');
  const [labelTouched, setLabelTouched] = useState(false);
  const [province, setProvince] = useState('');
  const [status, setStatus] = useState<KawasanStatus>('KL');
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const nextEcosystem = searchParams.get('ekosistem');
    const nextService = searchParams.get('jasa');
    const nextLocation = searchParams.get('lokasi');
    const nextArea = searchParams.get('luas');
    const nextKawasan = searchParams.get('kawasan');
    if (nextEcosystem !== null) setEcosystem(initialEcosystem(nextEcosystem));
    if (nextService !== null) setService(initialService(nextService));
    if (nextLocation) setLocationId(nextLocation);
    if (nextArea) setAreaInput(nextArea);
    if (nextKawasan) setKawasanId(nextKawasan);
  }, [searchParams, setLocationId]);

  const location = getLocation(locationId) ?? reference.locations[0];
  const category = SERVICE_CATEGORIES.includes(service as (typeof SERVICE_CATEGORIES)[number])
    ? (service as (typeof SERVICE_CATEGORIES)[number])
    : null;

  const area = parseAreaInput(areaInput);
  const areaValue = area.ok ? area.value : null;

  const coefficients = useMemo(
    () => (location ? coefficientsForEcosystem(ecosystem, location.ump, location.id) : null),
    [ecosystem, location],
  );

  const selectedCoefficient = coefficients
    ? service === 'Total'
      ? coefficients.total
      : coefficients.categories[service].value
    : null;

  const selectedValue =
    selectedCoefficient !== null && areaValue !== null ? selectedCoefficient * areaValue : null;

  const categoryValues = coefficients
    ? SERVICE_CATEGORIES.map((item) => ({
        category: item,
        coefficient: coefficients.categories[item].value,
        value:
          coefficients.categories[item].value !== null && areaValue !== null
            ? coefficients.categories[item].value * areaValue
            : null,
        sampleSize: coefficients.categories[item].sampleSize,
      }))
    : [];

  const computedTotal =
    coefficients && coefficients.total !== null && areaValue !== null
      ? coefficients.total * areaValue
      : null;

  const kawasan = kawasanId ? getKawasanById(kawasanId) : null;

  useEffect(() => {
    if (!labelTouched) {
      setLabel(`${ecosystem} — ${location?.name ?? 'lokasi'}`);
    }
  }, [ecosystem, location?.id, location?.name, labelTouched]);

  useEffect(() => {
    // A province can seed the aggregation field directly. For a kabupaten/kota
    // the workbook has no province mapping, so the field is cleared rather
    // than keeping a stale auto-seeded province from a previous selection.
    setProvince(location?.type === 'province' ? location.name : '');
  }, [location?.id, location?.name, location?.type]);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setFeedback(null);
    if (!location) {
      setFormError('Lokasi acuan tidak ditemukan.');
      return;
    }
    if (!area.ok || area.value === null) {
      setFormError(area.message ?? 'Luas tidak valid.');
      return;
    }
    if (!label.trim()) {
      setFormError('Label catatan wajib diisi.');
      return;
    }
    if (!province.trim()) {
      setFormError('Provinsi wajib diisi untuk agregasi analisis.');
      return;
    }
    if (status !== 'KL') {
      addRecord({
        label: label.trim(),
        locationId: location.id,
        province: province.trim(),
        ecosystem,
        kawasanStatus: status,
        kawasanTypeId: kawasan?.id ?? null,
        areaHa: area.value,
        notes: notes.trim() || null,
      });
      setFeedback(
        'Catatan ditambahkan tanpa nilai karena status kawasan bukan kawasan lindung/berfungsi lindung.',
      );
      setLabelTouched(false);
      return;
    }
    addRecord({
      label: label.trim(),
      locationId: location.id,
      province: province.trim(),
      ecosystem,
      kawasanStatus: status,
      kawasanTypeId: kawasan?.id ?? null,
      areaHa: area.value,
      notes: notes.trim() || null,
    });
    setFeedback('Catatan berhasil ditambahkan ke portofolio analisis.');
    setLabelTouched(false);
  }

  if (!location) {
    return (
      <Alert tone="error" title="Data lokasi tidak tersedia">
        Tabel UMP tidak dapat dibaca dari dataset referensi.
      </Alert>
    );
  }

  return (
    <div className="page">
      <PageHeader
        eyebrow="Kalkulator valuasi"
        title="Hitung nilai ekonomi jasa ekosistem"
        lead="Masukkan lokasi, jenis ekosistem, jasa yang ingin dilihat, dan luas. Kalkulator menampilkan koefisien median, jumlah studi, rincian perhitungan, serta nilai tiap kategori jasa."
      />

      <div className="calculator-layout">
        <form className="panel panel-form" onSubmit={(event) => event.preventDefault()}>
          <h2 className="panel-title">Masukan perhitungan</h2>
          <LocationSelect
            value={locationId}
            onChange={setLocationId}
            hint={`UMP 2025 ${location.name}: ${formatRupiah(location.ump)}.`}
          />
          <EcosystemSelect
            value={ecosystem}
            onChange={(value) => {
              setEcosystem(value);
              setFeedback(null);
            }}
          />
          <div className="field">
            <label htmlFor="service-select">Jenis jasa ekosistem</label>
            <select
              id="service-select"
              value={service}
              onChange={(event) => setService(event.target.value as ServiceSelection)}
            >
              <option value="Total">Total jasa ekosistem</option>
              {SERVICE_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {SERVICE_LABELS[item]}
                </option>
              ))}
            </select>
            <p className="field-hint">
              Total adalah jumlah median Cultural, Provisioning, dan Regulating.
            </p>
          </div>
          <div className="field">
            <label htmlFor="area-input">Luas ekosistem (ha)</label>
            <div className="input-suffix">
              <input
                id="area-input"
                type="text"
                inputMode="decimal"
                value={areaInput}
                onChange={(event) => setAreaInput(event.target.value)}
                placeholder="Contoh: 145.290"
                aria-describedby="area-hint area-error"
                aria-invalid={!area.ok && areaInput.length > 0}
              />
              <span className="input-suffix-unit">ha</span>
            </div>
            <p className="field-hint" id="area-hint">
              Gunakan satuan hektare sesuai workbook. Pemisah ribuan Indonesia dan desimal
              koma diterima.
            </p>
            {!area.ok && areaInput.length > 0 ? (
              <p className="field-error" id="area-error">
                {area.message}
              </p>
            ) : null}
          </div>

          <div className="calculation-strip">
            <p className="calculation-strip-label">Nilai terpilih</p>
            <p className="calculation-strip-value">
              {selectedValue === null ? '—' : formatRupiah(selectedValue)}
            </p>
            <p className="calculation-strip-note">
              {selectedCoefficient === null
                ? 'Koefisien tidak tersedia untuk pilihan ini.'
                : `${formatRupiah(selectedCoefficient, 2)} /ha/tahun × ${
                    areaValue === null ? 'luas belum valid' : formatArea(areaValue)
                  }`}
            </p>
          </div>
        </form>

        <section className="panel result-panel" aria-live="polite">
          <p className="eyebrow">Hasil estimasi</p>
          <p className="result-value">
            {selectedValue === null ? 'Belum dapat dihitung' : formatRupiah(selectedValue)}
          </p>
          <p className="result-caption">
            {selectedValue === null
              ? 'Lengkapi luas dan pastikan koefisien tersedia.'
              : `Rp/tahun · ${formatArea(areaValue)} · ${ecosystem} · ${location.name}`}
          </p>
          <dl className="result-facts">
            <div>
              <dt>Jenis jasa</dt>
              <dd>{SERVICE_LABELS[service]}</dd>
            </div>
            <div>
              <dt>Koefisien terpilih</dt>
              <dd>
                {selectedCoefficient === null
                  ? 'Tidak tersedia'
                  : `${formatRupiah(selectedCoefficient, 2)} /ha/tahun`}
              </dd>
            </div>
            <div>
              <dt>Jumlah studi</dt>
              <dd>
                {coefficients
                  ? service === 'Total'
                    ? `${coefficients.categories.Cultural.sampleSize} / ${coefficients.categories.Provisioning.sampleSize} / ${coefficients.categories.Regulating.sampleSize}`
                    : `${coefficients.categories[service].sampleSize} studi`
                  : '—'}
              </dd>
            </div>
            <div>
              <dt>UMP acuan</dt>
              <dd>{formatRupiah(location.ump)}</dd>
            </div>
          </dl>
          <p className="result-note">
            Estimasi ini menggunakan nilai per hektare yang sudah bertahun harga 2025 dan
            disesuaikan daya beli wilayah. Bukan hasil survei lapangan.
          </p>
        </section>
      </div>

      <Section
        title="Rincian perhitungan per jasa"
        description="Setiap kategori dihitung dari median studi, lalu dikalikan luas. Kategori tanpa studi non-nol ditandai tidak tersedia dan tidak dianggap nol."
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Kategori jasa</th>
                <th scope="col" className="numeric">
                  Koefisien (Rp/ha/tahun)
                </th>
                <th scope="col" className="numeric">
                  n studi
                </th>
                <th scope="col" className="numeric">
                  Nilai (Rp/tahun)
                </th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {categoryValues.map((item) => (
                <tr key={item.category} className={category === item.category ? 'is-selected' : undefined}>
                  <th scope="row">{SERVICE_LABELS[item.category]}</th>
                  <td className="numeric">
                    {item.coefficient === null ? '—' : formatRupiah(item.coefficient, 2)}
                  </td>
                  <td className="numeric">{item.sampleSize}</td>
                  <td className="numeric">
                    {item.value === null ? 'Tidak tersedia' : formatRupiah(item.value)}
                  </td>
                  <td>
                    {item.coefficient === null ? (
                      <span className="status status-missing">Tidak ada data</span>
                    ) : item.coefficient === 0 ? (
                      <span className="status status-zero">Nilai nol</span>
                    ) : (
                      <span className="status status-ok">Tersedia</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td className="numeric">
                  {coefficients?.total === null || !coefficients
                    ? '—'
                    : formatRupiah(coefficients.total, 2)}
                </td>
                <td className="numeric">—</td>
                <td className="numeric">
                  {computedTotal === null ? 'Tidak tersedia' : formatRupiah(computedTotal)}
                </td>
                <td>
                  <span className="status status-ok">Jumlah kategori tersedia</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="table-note">
          Nilai kategori dan total dibulatkan secara independen dari nilai penuh sebelum
          dikalikan luas. Penjumlahan angka yang ditampilkan dapat berbeda Rp1 dari baris total.
        </p>

        <div className="formula-box">
          <p className="formula-label">Urutan perhitungan</p>
          <p>
            <code>nilai jasa = luas (ha) × median nilai kategori (Rp/ha/tahun)</code>
          </p>
          <p>
            <code>nilai total = nilai Cultural + nilai Provisioning + nilai Regulating</code>
          </p>
          <p className="formula-note">
            Median dihitung dari total per studi, bukan dari rata-rata komponen. Nilai nol tidak
            masuk sampel median; kategori tanpa data tidak dianggap nol.
          </p>
        </div>

        <div className="breakdown-grid">
          {SERVICE_CATEGORIES.map((item) =>
            coefficients ? (
              <div className="panel panel-compact" key={item}>
                <h3 className="panel-title">{SERVICE_LABELS[item]}</h3>
                <p className="panel-figure">
                  {coefficients.categories[item].value === null
                    ? 'Tidak tersedia'
                    : formatRupiah(coefficients.categories[item].value, 2)}
                  <span className="panel-figure-unit"> /ha/tahun</span>
                </p>
                <StudyBreakdown
                  coefficient={coefficients.categories[item]}
                  label={SERVICE_LABELS[item]}
                />
              </div>
            ) : null,
          )}
        </div>
      </Section>

      <Section
        title="Tambahkan ke portofolio analisis"
        description="Satu catatan mewakili satu luas ekosistem dan dihitung untuk seluruh kategori jasa, sehingga tidak terjadi penghitungan ganda antar-jasa."
      >
        {feedback ? (
          <Alert tone="success" title="Tersimpan">
            {feedback} <Link to="/analisis">Buka halaman Analisis</Link>.
          </Alert>
        ) : null}
        {formError ? (
          <Alert tone="error" title="Periksa masukan">
            {formError}
          </Alert>
        ) : null}
        <form className="form-grid" onSubmit={handleAdd}>
          <div className="field field-span-2">
            <label htmlFor="record-label">Label catatan</label>
            <input
              id="record-label"
              type="text"
              value={label}
              onChange={(event) => {
                setLabel(event.target.value);
                setLabelTouched(true);
              }}
              maxLength={160}
            />
          </div>
          <div className="field">
            <label htmlFor="record-province">Provinsi</label>
            <input
              id="record-province"
              type="text"
              value={province}
              onChange={(event) => setProvince(event.target.value)}
              placeholder="Contoh: Aceh"
              list="province-list"
            />
            <datalist id="province-list">
              {reference.locations
                .filter((item) => item.type === 'province')
                .map((item) => (
                  <option key={item.id} value={item.name.replace(/^Provinsi\s+/, '')} />
                ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="record-status">Status kawasan</label>
            <select
              id="record-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as KawasanStatus)}
            >
              <option value="KL">Kawasan lindung / berfungsi lindung</option>
              <option value="NON_KL">Non-kawasan lindung</option>
              <option value="UNKNOWN">Status belum diketahui</option>
            </select>
          </div>
          <div className="field field-span-2">
            <label htmlFor="record-notes">Catatan (opsional)</label>
            <textarea
              id="record-notes"
              rows={2}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={500}
              placeholder="Sumber luas, nomor berita acara, atau keterangan lain"
            />
          </div>
          <div className="form-actions field-span-2">
            <button type="submit" className="button button-primary">
              {status === 'KL' ? 'Tambahkan catatan' : 'Tambahkan tanpa valuasi'}
            </button>
            <p className="field-hint">
              Tersimpan di peramban ini. Ekspor CSV/Excel tersedia di halaman Analisis.
            </p>
          </div>
        </form>
        {status !== 'KL' ? (
          <Alert tone="warning" title="Nilai tidak dihitung">
            Workbook hanya menyediakan koefisien untuk kawasan lindung/berfungsi lindung. Catatan
            non-kawasan lindung atau status belum diketahui tetap disimpan untuk kelengkapan luas,
            tetapi tidak diberi nilai.
          </Alert>
        ) : null}
        {areaValue !== null && computedTotal !== null ? (
          <p className="section-footnote">
            Nilai total yang akan tercatat: {formatRupiah(computedTotal)} per tahun untuk luas{' '}
            {formatArea(areaValue)}. Nilai ini menjumlahkan seluruh kategori jasa yang tersedia,
            bukan hanya jasa yang sedang dipilih di kalkulator.
          </p>
        ) : null}
      </Section>

      <Section title="Catatan metodologis" description="Hal yang perlu diketahui sebelum memakai hasil.">
        <ul className="plain-list">
          <li>
            Nilai per hektare berasal dari kolom <em>NILAI SATUAN 2025 (RUMUS)</em> di workbook,
            yang sudah memuat faktor majemuk 4,75% per tahun.
          </li>
          <li>
            Penyesuaian wilayah memakai rasio UMP 2025 lokasi acuan terhadap UMP 2025 lokasi
            studi. Ini bukan indeks harga spasial resmi.
          </li>
          <li>
            Kategori total adalah penjumlahan median, sehingga dapat berbeda dari median total
            per studi. Ini mengikuti rumus workbook.
          </li>
          <li>
            Beberapa baris komponen mempunyai satuan yang tidak konsisten (misalnya per KK atau
            per kg) tetapi tetap diperlakukan sebagai nilai per hektare oleh workbook. Nilai
            dipertahankan tanpa koreksi agar dapat direkonsiliasi.
          </li>
        </ul>
        <p className="section-footnote">
          Lihat <Link to="/metodologi">Metodologi</Link> untuk rumus lengkap, contoh tervalidasi,
          dan daftar keterbatasan.
        </p>
      </Section>
    </div>
  );
}
