import { Link } from 'react-router-dom';
import { reference } from '../data/reference';
import { coefficientsForEcosystem } from '../lib/valuation/engine';
import { formatNumber, formatRupiah } from '../lib/valuation/format';
import { SERVICE_CATEGORIES } from '../types';

interface CoefficientTableProps {
  locationId: string;
  targetUmp: number;
  caption?: string;
  linkToCalculator?: boolean;
}

export function CoefficientTable({
  locationId,
  targetUmp,
  caption,
  linkToCalculator = true,
}: CoefficientTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table coefficient-table">
        {caption ? <caption>{caption}</caption> : null}
        <thead>
          <tr>
            <th scope="col">Jenis ekosistem</th>
            {SERVICE_CATEGORIES.map((category) => (
              <th key={category} scope="col" className="numeric">
                {category}
              </th>
            ))}
            <th scope="col" className="numeric">
              Total
            </th>
            {linkToCalculator ? <th scope="col" className="action-cell" /> : null}
          </tr>
        </thead>
        <tbody>
          {reference.ecosystems.map((ecosystem) => {
            const coefficients = coefficientsForEcosystem(ecosystem.name, targetUmp, locationId);
            return (
              <tr key={ecosystem.id}>
                <th scope="row">{ecosystem.name}</th>
                {SERVICE_CATEGORIES.map((category) => {
                  const value = coefficients.categories[category];
                  return (
                    <td key={category} className="numeric">
                      {value.value === null ? (
                        <span className="muted">Tidak tersedia</span>
                      ) : (
                        <>
                          <span className="value-main">{formatRupiah(value.value)}</span>
                          <span className="value-note">
                            n = {formatNumber(value.sampleSize)} studi
                          </span>
                        </>
                      )}
                    </td>
                  );
                })}
                <td className="numeric total-cell">
                  {coefficients.total === null ? (
                    <span className="muted">Tidak tersedia</span>
                  ) : (
                    <span className="value-main">{formatRupiah(coefficients.total)}</span>
                  )}
                </td>
                {linkToCalculator ? (
                  <td className="action-cell">
                    <Link
                      className="text-link"
                      to={`/kalkulator?ekosistem=${encodeURIComponent(ecosystem.name)}&lokasi=${encodeURIComponent(locationId)}`}
                    >
                      Hitung
                    </Link>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="table-note">
        Nilai dalam Rp/ha/tahun pada tingkat harga 2025. n = jumlah studi non-nol yang
        membentuk median. Nilai total adalah penjumlahan median Cultural, Provisioning, dan
        Regulating — bukan median dari total tiap studi. Angka kategori dan total dibulatkan
        secara independen sehingga penjumlahannya dapat berbeda Rp1.
      </p>
    </div>
  );
}
