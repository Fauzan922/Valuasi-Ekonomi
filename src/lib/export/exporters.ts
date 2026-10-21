import type { PortfolioRecord } from '../../types';
import { KAWASAN_STATUS_LABELS } from '../../types';
import { getKawasanById } from '../classification/rules';
import { valueRecord } from '../valuation/engine';

function escapeCsv(value: string | number | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  if (/["\n\r,;]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export interface ExportRow {
  No: number;
  Label: string;
  Provinsi: string;
  Lokasi: string;
  'Jenis Ekosistem': string;
  'Status Kawasan': string;
  'Jenis Kawasan': string;
  'Luas (ha)': number;
  'Koefisien Cultural (Rp/ha/tahun)': number | null;
  'Koefisien Provisioning (Rp/ha/tahun)': number | null;
  'Koefisien Regulating (Rp/ha/tahun)': number | null;
  'Koefisien Total (Rp/ha/tahun)': number | null;
  'Nilai Cultural (Rp/tahun)': number | null;
  'Nilai Provisioning (Rp/tahun)': number | null;
  'Nilai Regulating (Rp/tahun)': number | null;
  'Nilai Total (Rp/tahun)': number | null;
  Catatan: string;
  'Dibuat pada': string;
}

export function buildExportRows(records: PortfolioRecord[]): ExportRow[] {
  return records.map((record, index) => {
    const valuation = valueRecord(record);
    const kawasan = record.kawasanTypeId ? getKawasanById(record.kawasanTypeId) : null;
    return {
      No: index + 1,
      Label: record.label,
      Provinsi: record.province ?? '',
      Lokasi: valuation.location?.name ?? record.locationId,
      'Jenis Ekosistem': record.ecosystem,
      'Status Kawasan': KAWASAN_STATUS_LABELS[record.kawasanStatus],
      'Jenis Kawasan': kawasan?.name ?? '',
      'Luas (ha)': record.areaHa,
      'Koefisien Cultural (Rp/ha/tahun)': valuation.coefficients?.categories.Cultural.value ?? null,
      'Koefisien Provisioning (Rp/ha/tahun)': valuation.coefficients?.categories.Provisioning.value ?? null,
      'Koefisien Regulating (Rp/ha/tahun)': valuation.coefficients?.categories.Regulating.value ?? null,
      'Koefisien Total (Rp/ha/tahun)': valuation.coefficients?.total ?? null,
      'Nilai Cultural (Rp/tahun)': valuation.categoryValues.Cultural,
      'Nilai Provisioning (Rp/tahun)': valuation.categoryValues.Provisioning,
      'Nilai Regulating (Rp/tahun)': valuation.categoryValues.Regulating,
      'Nilai Total (Rp/tahun)': valuation.totalValue,
      Catatan: record.notes ?? '',
      'Dibuat pada': record.createdAt,
    };
  });
}

export function recordsToCsv(records: PortfolioRecord[]): string {
  const rows = buildExportRows(records);
  if (rows.length === 0) {
    return '\uFEFFTidak ada catatan.\r\n';
  }
  const headers = Object.keys(rows[0] ?? {}) as Array<keyof ExportRow>;
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(',')),
  ];
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

export function downloadCsv(records: PortfolioRecord[], filename = 'valuasi-ekosistem.csv'): void {
  const blob = new Blob([recordsToCsv(records)], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export async function downloadExcel(
  records: PortfolioRecord[],
  filename = 'valuasi-ekosistem.xlsx',
): Promise<void> {
  // SheetJS is loaded only when the user requests Excel; it is not part of the
  // initial bundle.
  const XLSX = await import('xlsx');
  const rows = buildExportRows(records);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const widths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.min(
      48,
      Math.max(
        key.length + 2,
        ...rows.map((row) => String(row[key as keyof ExportRow] ?? '').length + 2),
      ),
    ),
  }));
  worksheet['!cols'] = widths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Catatan Valuasi');
  const summary = summarySheet(XLSX, records);
  XLSX.utils.book_append_sheet(workbook, summary, 'Ringkasan');
  XLSX.writeFile(workbook, filename);
}

function summarySheet(XLSX: typeof import('xlsx'), records: PortfolioRecord[]) {
  const supported = records.map(valueRecord).filter((valuation) => valuation.supported);
  const totalValue = supported.reduce((sum, valuation) => sum + (valuation.totalValue ?? 0), 0);
  const totalArea = records.reduce((sum, record) => sum + record.areaHa, 0);
  const rows = [
    { Keterangan: 'Jumlah catatan', Nilai: records.length },
    { Keterangan: 'Catatan tervaluasi', Nilai: supported.length },
    { Keterangan: 'Total luas (ha)', Nilai: totalArea },
    { Keterangan: 'Total nilai (Rp/tahun)', Nilai: totalValue },
    { Keterangan: 'Tahun harga', Nilai: 2025 },
    {
      Keterangan: 'Catatan',
      Nilai:
        'Nilai non-kawasan lindung dan status tidak diketahui tidak dihitung karena workbook tidak menyediakan koefisien untuk status tersebut.',
    },
  ];
  return XLSX.utils.json_to_sheet(rows);
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
