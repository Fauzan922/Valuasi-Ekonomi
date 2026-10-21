import { formatNumber, formatRupiah } from '../lib/valuation/format';
import type { CategoryCoefficient } from '../types';

interface StudyBreakdownProps {
  coefficient: CategoryCoefficient;
  label: string;
}

export function StudyBreakdown({ coefficient, label }: StudyBreakdownProps) {
  if (coefficient.sampleSize === 0) {
    return (
      <p className="muted">
        Tidak ada studi dengan nilai {label} yang dapat digunakan untuk ekosistem ini.
      </p>
    );
  }
  return (
    <details className="study-breakdown">
      <summary>
        Lihat {formatNumber(coefficient.sampleSize)} studi pembentuk median {label}
      </summary>
      <div className="table-wrap">
        <table className="data-table compact">
          <thead>
            <tr>
              <th scope="col">Studi</th>
              <th scope="col">Wilayah studi</th>
              <th scope="col">Tahun</th>
              <th scope="col" className="numeric">
                Nilai kategori (Rp/ha/tahun)
              </th>
              <th scope="col">Peran</th>
            </tr>
          </thead>
          <tbody>
            {coefficient.studies.map((study) => {
              const isMedian = coefficient.medianStudyIds.includes(study.studyId);
              return (
                <tr key={study.studyId} className={isMedian ? 'is-median' : undefined}>
                  <td className="wrap-cell">{study.title}</td>
                  <td>{study.region ?? '—'}</td>
                  <td>{study.year ?? '—'}</td>
                  <td className="numeric">{formatRupiah(study.value)}</td>
                  <td>{isMedian ? <strong>Median</strong> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="table-note">
        {coefficient.sampleSize % 2 === 1
          ? 'Jumlah studi ganjil: median adalah nilai studi yang ditandai.'
          : 'Jumlah studi genap: median adalah rata-rata dua studi yang ditandai.'}{' '}
        Nilai sudah dikonversi ke tingkat UMP lokasi acuan.
      </p>
    </details>
  );
}
