import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/Section';
import { Alert } from '../components/Alert';
import { reference, meta } from '../data/reference';
import { formatNumber, formatRupiah } from '../lib/valuation/format';

const CONTENTS = [
  { id: 'ruang-lingkup', label: 'Ruang lingkup' },
  { id: 'klasifikasi', label: 'Klasifikasi' },
  { id: 'benefit-transfer', label: 'Benefit transfer' },
  { id: 'rumus', label: 'Rumus perhitungan' },
  { id: 'contoh', label: 'Contoh tervalidasi' },
  { id: 'agregasi', label: 'Agregasi dan ekspor' },
  { id: 'kualitas-data', label: 'Kualitas data' },
  { id: 'keterbatasan', label: 'Keterbatasan' },
  { id: 'versi', label: 'Versi dan sumber' },
];

export function MethodologyPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="Metodologi dan transparansi data"
        title="Bagaimana nilai dihitung"
        lead="Halaman ini menjelaskan aturan klasifikasi, metode benefit transfer, urutan perhitungan, asumsi, dan keterbatasan yang dipertahankan dari workbook. Tidak ada aturan atau koefisien yang ditambahkan di luar workbook."
      />

      <div className="method-layout">
        <nav className="toc" aria-label="Daftar isi metodologi">
          <p className="toc-title">Daftar isi</p>
          <ol>
            {CONTENTS.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(event) => {
                    // HashRouter owns the hash; scroll and focus manually instead
                    // of letting the browser replace the route.
                    event.preventDefault();
                    const target = document.getElementById(item.id);
                    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    target?.focus({ preventScroll: true });
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="method-body">
          <Section
            id="ruang-lingkup"
            title="Ruang lingkup"
            description="Apa yang dihitung dan apa yang tidak."
          >
            <p>
              Portal ini mereproduksi kalkulator benefit transfer pada workbook{' '}
              <em>{meta.sourceWorkbook}</em>. Cakupannya adalah kawasan lindung dan kawasan
              berfungsi lindung di Indonesia, dengan sembilan tipe ekosistem: Hutan, Mangrove,
              Danau, Sungai, Terumbu Karang, Gambut, Karst, Padang Lamun, dan Lahan Basah.
            </p>
            <p>
              Workbook tidak memuat luas ekosistem per provinsi, geometri kawasan, atau data
              inventaris lapangan. Karena itu portal tidak menghasilkan total provinsi otomatis.
              Total dihitung dari catatan luas yang dimasukkan pengguna, dengan koefisien dari
              dataset referensi.
            </p>
            <ul className="plain-list">
              <li>Tahun harga: {meta.priceYear}.</li>
              <li>Jumlah studi: {formatNumber(meta.studyCount)}.</li>
              <li>Jumlah komponen nilai: {formatNumber(meta.componentCount)}.</li>
              <li>Jumlah lokasi UMP: {formatNumber(meta.locationCount)}.</li>
              <li>Jumlah jenis kawasan: {formatNumber(meta.kawasanCount)}.</li>
            </ul>
          </Section>

          <Section
            id="klasifikasi"
            title="Klasifikasi kawasan dan ekosistem"
            description="Tabel pencocokan, bukan inferensi spasial."
          >
            <p>
              Workbook memakai sheet <em>Ekosistem pada Kawasan Lindung</em> berisi 23 jenis
              kawasan (kolom B–X) dan empat baris ekosistem yang mungkin (baris 5–8). Aplikasi
              membaca tabel ini apa adanya. Pengguna memilih jenis kawasan, lalu memilih ekosistem
              yang teramati dari daftar yang kompatibel.
            </p>
            <p>
              Status kawasan <strong>tidak</strong> disimpulkan dari nama provinsi, nama tempat,
              atau koordinat. Workbook tidak memuat batas wilayah atau operasi GIS. Ini juga
              berarti aplikasi tidak dapat memverifikasi apakah sebuah poligon benar-benar berada
              di dalam kawasan lindung.
            </p>
            <p>
              Untuk non-kawasan lindung, workbook tidak memuat aturan klasifikasi maupun
              koefisien. Catatan non-kawasan lindung dapat disimpan untuk kelengkapan luas, tetapi
              tidak diberi nilai.
            </p>
            <p>
              Tabel lengkap dapat dilihat di{' '}
              <Link to="/identifikasi">halaman Identifikasi</Link>.
            </p>
          </Section>

          <Section
            id="benefit-transfer"
            title="Pendekatan benefit transfer"
            description="Memindahkan nilai per hektare dari studi ke lokasi target."
          >
            <p>
              Setiap studi menyediakan nilai total pada tahun studi. Workbook membaginya dengan
              luas studi untuk memperoleh nilai per hektare, lalu menyesuaikannya ke tahun 2025
              dan ke daya beli wilayah target.
            </p>
            <h3>Penyesuaian waktu</h3>
            <p>
              Kolom <em>NILAI SATUAN 2025 (RUMUS)</em> menggunakan faktor majemuk{' '}
              {(meta.interestRate * 100).toLocaleString('id-ID', { maximumFractionDigits: 2 })}%
              per tahun, yaitu BI Rate Oktober 2025 yang dicatat pada workbook. Kalkulator memakai
              kolom ini sebagai nilai dasar; faktor majemuk tidak diterapkan dua kali. Beberapa
              baris di workbook tampaknya memakai tahun dasar yang berbeda; nilai kolom tersebut
              dipertahankan agar hasil dapat direkonsiliasi.
            </p>
            <h3>Penyesuaian wilayah</h3>
            <p>
              Workbook menyesuaikan daya beli dengan rasio UMP 2025 lokasi target terhadap UMP
              2025 lokasi studi:
            </p>
            <pre className="formula-block">
              <code>faktor wilayah = UMP 2025 lokasi target ÷ UMP 2025 lokasi studi</code>
            </pre>
            <p>
              Rasio ini bukan indeks harga spasial resmi dan tidak memperhitungkan perbedaan harga
              selain upah. Ini adalah pilihan metodologis workbook, bukan standar universal.
            </p>
          </Section>

          <Section
            id="rumus"
            title="Rumus perhitungan"
            description="Urutan yang harus dipertahankan agar hasil sama dengan workbook."
          >
            <pre className="formula-block">
              <code>{`1. nilai komponen per studi
   = NILAI SATUAN 2025 (RUMUS) × (UMP target ÷ UMP studi)

2. total kategori per studi
   = Σ nilai komponen pada kategori yang sama

3. koefisien kategori
   = median(total kategori per studi, hanya nilai ≠ 0)

4. nilai kategori untuk luas A
   = A × koefisien kategori

5. koefisien total
   = median Cultural + median Provisioning + median Regulating

6. nilai total untuk luas A
   = A × koefisien total
   = nilai Cultural + nilai Provisioning + nilai Regulating`}</code>
            </pre>
            <p>
              Poin penting: nilai total adalah <strong>penjumlahan tiga median</strong>, bukan
              median dari total tiap studi. Ini mengikuti sel C20 pada sheet ringkasan workbook.
              Kategori yang tidak memiliki studi non-nol ditandai <em>tidak tersedia</em>, bukan
              nol. Kategori dengan komponen yang semuanya bernilai nol juga tidak masuk sampel
              median.
            </p>
            <p>
              Satuan luas adalah hektare. Workbook tidak memakai satuan lain untuk kalkulator.
            </p>
          </Section>

          <Section
            id="contoh"
            title="Contoh tervalidasi"
            description="Kasus Hutan, Total, Provinsi Aceh, 145.290 ha."
          >
            <p>
              Contoh ini diambil dari sel D16 pada sheet <em>Otomatisasi Perhitungan Valek</em>.
              Nilai yang dihasilkan mesin portal harus sama dengan workbook.
            </p>
            <div className="table-wrap">
              <table className="data-table">
                <caption>Rekonsiliasi contoh workbook</caption>
                <thead>
                  <tr>
                    <th scope="col">Komponen</th>
                    <th scope="col" className="numeric">
                      Nilai
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row">Median Cultural Hutan</th>
                    <td className="numeric">{formatRupiah(14514491.54, 2)} /ha/tahun</td>
                  </tr>
                  <tr>
                    <th scope="row">Median Provisioning Hutan</th>
                    <td className="numeric">{formatRupiah(4542534.272, 2)} /ha/tahun</td>
                  </tr>
                  <tr>
                    <th scope="row">Median Regulating Hutan</th>
                    <td className="numeric">{formatRupiah(3837977.897, 2)} /ha/tahun</td>
                  </tr>
                  <tr>
                    <th scope="row">Koefisien total (jumlah median)</th>
                    <td className="numeric">{formatRupiah(22895003.71, 2)} /ha/tahun</td>
                  </tr>
                  <tr>
                    <th scope="row">Luas</th>
                    <td className="numeric">145.290 ha</td>
                  </tr>
                  <tr>
                    <th scope="row">Hasil D16 workbook</th>
                    <td className="numeric">{formatRupiah(3326415089133, 2)}</td>
                  </tr>
                  <tr>
                    <th scope="row">Hasil mesin portal (presisi penuh)</th>
                    <td className="numeric">{formatRupiah(3326415089133.48, 2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <Alert tone="info" title="Catatan selisih pembulatan">
              Workbook menyimpan median pada presisi terbatas lalu mengalikannya. Mesin menghitung
              dengan presisi penuh dan membulatkan saat ditampilkan. Pada contoh ini selisihnya
              Rp 0,48 dari Rp 3,33 triliun, atau sekitar 1,4 × 10⁻¹³ secara relatif. Selisih
              berasal dari pembulatan, bukan perbedaan metode.
            </Alert>
          </Section>

          <Section
            id="agregasi"
            title="Agregasi portofolio dan ekspor"
            description="Satu catatan, satu luas, seluruh jasa."
          >
            <p>
              Portal menyimpan catatan luas per ekosistem dan lokasi. Setiap catatan dihitung untuk
              seluruh kategori jasa sekaligus, sehingga pengguna tidak perlu menambahkan catatan
              terpisah untuk Cultural, Provisioning, dan Regulating. Ini mencegah penghitungan
              ganda luas yang sama.
            </p>
            <p>
              Total portofolio menjumlahkan nilai seluruh catatan yang berstatus kawasan
              lindung/berfungsi lindung dan memiliki koefisien. Catatan dengan status non-kawasan
              lindung atau status belum diketahui tetap dihitung luasnya, tetapi nilai totalnya
              tidak dihitung.
            </p>
            <p>
              Ekspor CSV dan Excel memuat nilai per kategori dan total per catatan. File Excel
              menambahkan sheet ringkasan. Laporan cetak memakai tombol “Cetak laporan” pada
              halaman Analisis dan mengikuti filter yang sedang aktif.
            </p>
          </Section>

          <Section
            id="kualitas-data"
            title="Kualitas data dan ketidaksesuaian"
            description="Masalah yang ditemukan saat audit dan diperlakukan secara eksplisit."
          >
            <ul className="plain-list">
              <li>
                Workbook memiliki 46 sheet, termasuk sheet pivot, database, ringkasan, dan antarmuka
                lama. Tidak ada sheet tersembunyi. Kalkulator utama memakai sheet{' '}
                <em>Otomatisasi Perhitungan Valek</em> dan sembilan sheet ringkasan per ekosistem.
              </li>
              <li>
                Database Transfer Benefit memiliki 475 baris komponen dari 62 studi. Semua studi
                memiliki pemetaan UMP. Beberapa baris komponen memiliki satuan asli yang bukan per
                hektare (misalnya per KK, per kg, per batang), tetapi workbook tetap membagi nilai
                total dengan luas studi. Portal mempertahankan nilai tersebut dan menampilkan
                satuan asli di halaman Referensi.
              </li>
              <li>
                Faktor majemuk pada kolom 2025 tidak selalu konsisten dengan tahun studi pada setiap
                baris. Portal memakai nilai kolom 2025 yang sudah dihitung workbook, bukan
                menghitung ulang faktor majemuk.
              </li>
              <li>
                Kategori total adalah jumlah median, bukan median total studi. Perbedaan ini
                disengaja dan mengikuti workbook.
              </li>
              <li>
                Sheet <em>Yang Belum masuk database trans</em> memuat studi yang belum dimasukkan
                ke database. Studi tersebut tidak dipakai dalam valuasi karena tidak membentuk
                koefisien workbook.
              </li>
              <li>
                Sheet <em>Copy of Graphical User Interface</em> adalah antarmuka latihan lama dan
                tidak menjadi sumber aturan.
              </li>
              <li>
                Beberapa nama ekosistem dan kawasan memiliki spasi ganda atau kapitalisasi tidak
                konsisten. Ekstraksi menormalkan spasi dan kapitalisasi tanpa mengubah arti.
              </li>
            </ul>
          </Section>

          <Section
            id="keterbatasan"
            title="Keterbatasan dan ketidakpastian"
            description="Baca sebelum menggunakan hasil untuk keputusan."
          >
            <ul className="plain-list">
              <li>
                Nilai adalah estimasi benefit transfer, bukan hasil survei lapangan dan bukan
                penilaian resmi.
              </li>
              <li>
                Tidak ada analisis spasial. Kesesuaian kawasan dan ekosistem bergantung pada
                masukan pengguna.
              </li>
              <li>
                Tidak ada koefisien khusus untuk non-kawasan lindung. Nilai tidak dihitung untuk
                status tersebut.
              </li>
              <li>
                Rasio UMP hanya menyesuaikan upah, bukan seluruh struktur harga regional.
              </li>
              <li>
                Median antarstudi tidak memberikan interval kepercayaan. Sebaran studi dapat sangat
                lebar; halaman kalkulator menampilkan jumlah studi dan rincian nilai pembentuk
                median.
              </li>
              <li>
                Komponen yang memiliki satuan tidak konsisten dapat menimbulkan bias. Nilai
                dipertahankan untuk kompatibilitas dengan workbook, bukan karena satuan tersebut
                divalidasi.
              </li>
              <li>
                Data UMP dan studi adalah data statis dari workbook. Tidak ada pembaruan otomatis.
              </li>
              <li>
                Total provinsi hanya dapat dihitung jika pengguna memasukkan luas. Portal tidak
                memiliki dataset luas ekosistem provinsi.
              </li>
            </ul>
          </Section>

          <Section
            id="versi"
            title="Versi dan sumber"
            description="Metadata yang dapat diverifikasi."
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
                <dt>Tahun harga</dt>
                <dd>{meta.priceYear}</dd>
              </div>
            </dl>
            <p>
              Sumber nilai per studi, lembaga, dan tahun dapat ditelusuri di{' '}
              <Link to="/referensi">halaman Referensi</Link>. Portal tidak menambahkan afiliasi
              institusi, logo resmi, atau klaim dukungan pemerintah.
            </p>
            <p className="section-footnote">
              Rincian audit lengkap tersedia di repositori: <code>docs/workbook-audit.md</code>,{' '}
              <code>docs/valuation-methodology.md</code>, <code>docs/data-dictionary.md</code>,{' '}
              <code>docs/classification-rules.md</code>, dan{' '}
              <code>docs/implementation-plan.md</code>.
            </p>
            <p className="muted">
              Tabel referensi memuat {formatNumber(reference.studies.length)} studi dan{' '}
              {formatNumber(reference.locations.length)} lokasi UMP.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
