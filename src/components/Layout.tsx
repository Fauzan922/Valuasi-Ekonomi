import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { meta } from '../data/reference';

const NAV_ITEMS = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/identifikasi', label: 'Identifikasi' },
  { to: '/kalkulator', label: 'Kalkulator' },
  { to: '/analisis', label: 'Analisis' },
  { to: '/referensi', label: 'Referensi' },
  { to: '/metodologi', label: 'Metodologi' },
];

export function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          // HashRouter uses the URL hash for routing. Prevent the browser from
          // treating "#main-content" as a new route and move focus manually.
          event.preventDefault();
          const main = document.getElementById('main-content');
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        Lewati ke konten utama
      </a>
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>Portal valuasi ekonomi jasa ekosistem</span>
          <span className="top-strip-meta">
            Tahun harga {meta.priceYear} · Dataset {meta.datasetVersion}
          </span>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <NavLink to="/" className="brand">
            <span className="brand-mark" aria-hidden="true">
              VE
            </span>
            <span className="brand-text">
              <span className="brand-title">Valuasi Ekosistem</span>
              <span className="brand-subtitle">Kawasan Lindung &amp; Berfungsi Lindung</span>
            </span>
          </NavLink>
          <button
            type="button"
            className="nav-toggle"
            aria-expanded={open}
            aria-controls="primary-navigation"
            onClick={() => setOpen((current) => !current)}
          >
            <span className="nav-toggle-lines" aria-hidden="true" />
            Menu
          </button>
          <nav
            id="primary-navigation"
            className={`site-nav ${open ? 'is-open' : ''}`}
            aria-label="Navigasi utama"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main id="main-content" className="container main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="container footer-inner">
          <div className="footer-copy">
            <p className="footer-title">Portal Valuasi Ekonomi Jasa Ekosistem</p>
            <p>
              Alat bantu perhitungan berbasis metode benefit transfer. Bukan dokumen resmi
              instansi dan tidak menggantikan kajian lapangan atau keputusan kewenangan.
            </p>
          </div>
          <div className="footer-meta">
            <p>
              Sumber data: <em>{meta.sourceWorkbook}</em>
            </p>
            <p>
              Dataset {meta.datasetVersion} · Mesin {meta.engineVersion}
            </p>
            <p>
              <NavLink to="/metodologi">Baca metodologi dan keterbatasan</NavLink>
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
