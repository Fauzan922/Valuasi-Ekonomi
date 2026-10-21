import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Alert } from '../components/Alert';
import { LocationSelect } from '../components/LocationSelect';
import { useAppState } from '../state/AppState';
import { reference } from '../data/reference';
import {
  CLASSIFICATION_LIMITATIONS,
  compatibleEcosystems,
  getKawasanById,
  identifyEcosystem,
} from '../lib/classification/rules';
import { coefficientsForEcosystem, getLocation } from '../lib/valuation/engine';
import { formatRupiah } from '../lib/valuation/format';
import { SERVICE_CATEGORIES } from '../types';

function Description({ text }: { text: string | null }) {
  if (!text) return <p className="muted">Deskripsi tidak tersedia di workbook.</p>;
  return (
    <>
      {text.split(/\n\s*\n/).map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </>
  );
}

export function IdentificationPage() {
  const [searchParams] = useSearchParams();
  const initialKawasan = searchParams.get('kawasan') ?? '';
  const [kawasanId, setKawasanId] = useState(
    getKawasanById(initialKawasan) ? initialKawasan : '',
  );
  const [ecosystem, setEcosystem] = useState(searchParams.get('ekosistem') ?? '');
  const { locationId, setLocationId } = useAppState();
  const location = getLocation(locationId) ?? reference.locations[0];

  const kawasan = kawasanId ? getKawasanById(kawasanId) : undefined;
  const compatible = useMemo(
    () => (kawasanId ? compatibleEcosystems(kawasanId) : []),
    [kawasanId],
  );
  const result = kawasanId ? identifyEcosystem(kawasanId, ecosystem || null) : null;
  const selectedEcosystem = ecosystem
    ? reference.ecosystems.find((item) => item.name === ecosystem)
    : null;

  const coefficients =
    ecosystem && location
      ? coefficientsForEcosystem(ecosystem, location.ump, location.id)
      : null;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Identifikasi ekosistem"
        title="Tentukan kawasan dan jenis ekosistem"
        lead="Workbook menggunakan tabel pencocokan jenis kawasan lindung/berfungsi lindung dengan ekosistem yang mungkin berada di dalamnya. Aplikasi menerapkan tabel itu secara transparan, tanpa menyimpulkan status kawasan dari nama tempat."
      />

      <Alert tone="warning" title="Status kawasan diisi, bukan ditebak">
        {CLASSIFICATION_LIMITATIONS[0]} Pilih jenis kawasan berdasarkan data kawasan yang
        berwenang, lalu pilih ekosistem yang teramati.
      </Alert>

      <div className="split-layout split-5-7">
        <div className="panel panel-form">
          <h2 className="panel-title">Masukan identifikasi</h2>
          <div className="field">
            <label htmlFor="kawasan-select">Jenis kawasan lindung / berfungsi lindung</label>
            <select
              id="kawasan-select"
              value={kawasanId}
              onChange={(event) => {
                setKawasanId(event.target.value);
                setEcosystem('');
              }}
            >
              <option value="">Pilih jenis kawasan</option>
              {reference.kawasan.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="field-hint">
              23 jenis kawasan dari sheet <em>Ekosistem pada Kawasan Lindung</em>.
            </p>
          </div>

          {kawasan ? (
            <fieldset className="field field-fieldset">
              <legend>Jenis ekosistem yang teramati</legend>
              <div className="radio-list">
                {compatible.map((name) => (
                  <label key={name} className="radio-card">
                    <input
                      type="radio"
                      name="ecosystem"
                      value={name}
                      checked={ecosystem === name}
                      onChange={() => setEcosystem(name)}
                    />
                    <span>
                      <strong>{name}</strong>
                      <span className="radio-card-note">Tercantum untuk kawasan ini</span>
                    </span>
                  </label>
                ))}
              </div>
              <p className="field-hint">
                Pilihan di atas hanya ekosistem yang tercantum pada tabel workbook untuk kawasan
                terpilih. Jika ekosistem lapangan tidak ada dalam daftar, catat sebagai kasus
                tidak didukung.
              </p>
            </fieldset>
          ) : (
            <p className="muted">
              Pilih jenis kawasan terlebih dahulu untuk melihat ekosistem yang kompatibel.
            </p>
          )}

          <LocationSelect
            value={locationId}
            onChange={setLocationId}
            label="Lokasi acuan nilai"
            hint="Dipakai untuk menampilkan koefisien indikatif pada ekosistem terpilih."
          />
        </div>

        <div className="panel">
          <h2 className="panel-title">Hasil identifikasi</h2>
          {!kawasan || !result ? (
            <p className="muted">
              Hasil akan muncul setelah jenis kawasan dipilih. Aplikasi tidak memakai koordinat
              atau nama wilayah untuk menentukan status kawasan.
            </p>
          ) : (
            <>
              <div className={`decision decision-${result.status}`}>
                <p className="decision-label">Status pencocokan</p>
                <p className="decision-title">
                  {result.status === 'supported'
                    ? 'Ekosistem sesuai tabel'
                    : result.status === 'incompatible'
                      ? 'Ekosistem tidak sesuai'
                      : 'Menunggu pilihan ekosistem'}
                </p>
                <p>{result.message}</p>
              </div>
              <dl className="definition-list">
                <div>
                  <dt>Jenis kawasan</dt>
                  <dd>{kawasan.name}</dd>
                </div>
                <div>
                  <dt>Ekosistem kompatibel</dt>
                  <dd>{kawasan.ecosystems.join(', ')}</dd>
                </div>
                <div>
                  <dt>Dasar aturan</dt>
                  <dd>
                    Sheet <em>Ekosistem pada Kawasan Lindung</em>, baris 4–8, kolom B–X.
                  </dd>
                </div>
                <div>
                  <dt>Status kawasan</dt>
                  <dd>
                    Kawasan lindung/berfungsi lindung (dipilih pengguna). Tidak disimpulkan dari
                    lokasi.
                  </dd>
                </div>
              </dl>
            </>
          )}
        </div>
      </div>

      {selectedEcosystem && result?.status === 'supported' && location ? (
        <Section
          title={`Ekosistem terpilih: ${selectedEcosystem.name}`}
          description="Ringkasan dari sheet Karakteristik Ekosistem dan koefisien indikatif untuk lokasi acuan."
          actions={
            <Link
              className="button button-primary button-small"
              to={`/kalkulator?ekosistem=${encodeURIComponent(selectedEcosystem.name)}&lokasi=${encodeURIComponent(location.id)}&kawasan=${encodeURIComponent(kawasanId)}`}
            >
              Lanjut ke kalkulator
            </Link>
          }
        >
          <div className="split-layout split-7-5">
            <div className="prose">
              <Description text={selectedEcosystem.description} />
              <p className="source-note">
                Sumber deskripsi: sheet <em>Karakteristik Ekosistem</em>, kolom Rangkuman
                Deskripsi, Karakteristik, dan Fungsi.
              </p>
            </div>
            <div className="panel">
              <h3 className="panel-title">Koefisien indikatif — {location.name}</h3>
              {coefficients ? (
                <table className="data-table compact">
                  <thead>
                    <tr>
                      <th scope="col">Jasa</th>
                      <th scope="col" className="numeric">
                        Rp/ha/tahun
                      </th>
                      <th scope="col" className="numeric">
                        n
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {SERVICE_CATEGORIES.map((category) => {
                      const item = coefficients.categories[category];
                      return (
                        <tr key={category}>
                          <th scope="row">{category}</th>
                          <td className="numeric">
                            {item.value === null ? (
                              <span className="muted">Tidak tersedia</span>
                            ) : (
                              formatRupiah(item.value)
                            )}
                          </td>
                          <td className="numeric">{item.sampleSize}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <th scope="row">Total</th>
                      <td className="numeric">
                        {coefficients.total === null
                          ? 'Tidak tersedia'
                          : formatRupiah(coefficients.total)}
                      </td>
                      <td className="numeric">—</td>
                    </tr>
                  </tfoot>
                </table>
              ) : null}
              <p className="table-note">
                Koefisien indikatif, bukan nilai final. Nilai final memerlukan luas wilayah.
              </p>
            </div>
          </div>
        </Section>
      ) : null}

      <Section
        title="Tabel aturan lengkap"
        description="Semua jenis kawasan dan ekosistem yang tercantum pada workbook. Tabel ini menjadi dasar pencocokan di atas."
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col" className="col-number">
                  No
                </th>
                <th scope="col">Jenis kawasan lindung / berfungsi lindung</th>
                <th scope="col">Ekosistem yang tercantum</th>
              </tr>
            </thead>
            <tbody>
              {reference.kawasan.map((item, index) => (
                <tr key={item.id} className={item.id === kawasanId ? 'is-selected' : undefined}>
                  <td className="col-number">{index + 1}</td>
                  <th scope="row">{item.name}</th>
                  <td>{item.ecosystems.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Batasan klasifikasi" description="Ditulis eksplisit agar tidak menjadi asumsi tersembunyi.">
        <ul className="plain-list">
          {CLASSIFICATION_LIMITATIONS.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="section-footnote">
          Untuk valuasi, status non-kawasan lindung tidak dihitung karena workbook tidak
          menyediakan koefisien atau aturan untuk status tersebut.
        </p>
      </Section>
    </div>
  );
}
