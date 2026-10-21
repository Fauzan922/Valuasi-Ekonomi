import { Link } from 'react-router-dom';
import { PageHeader } from '../components/PageHeader';

export function NotFoundPage() {
  return (
    <div className="page">
      <PageHeader
        eyebrow="404"
        title="Halaman tidak ditemukan"
        lead="Tautan yang Anda buka tidak tersedia. Gunakan navigasi utama untuk kembali ke portal."
      />
      <div className="button-row">
        <Link className="button button-primary" to="/">
          Kembali ke Beranda
        </Link>
        <Link className="button button-secondary" to="/metodologi">
          Baca metodologi
        </Link>
      </div>
    </div>
  );
}
