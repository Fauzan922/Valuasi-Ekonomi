const idNumber = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const idDecimal = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatNumber(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatDecimal(value: number): string {
  return idDecimal.format(value);
}

export function formatRupiah(value: number | null | undefined, decimals = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `Rp ${formatNumber(value, decimals)}`;
}

export function formatRupiahPerHa(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${formatRupiah(value)} /ha/tahun`;
}

export function formatCompactRupiah(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e15) return `Rp ${idDecimal.format(value / 1e15)} kuadriliun`;
  if (abs >= 1e12) return `Rp ${idDecimal.format(value / 1e12)} triliun`;
  if (abs >= 1e9) return `Rp ${idDecimal.format(value / 1e9)} miliar`;
  if (abs >= 1e6) return `Rp ${idDecimal.format(value / 1e6)} juta`;
  if (abs >= 1e3) return `Rp ${idNumber.format(value / 1e3)} ribu`;
  return formatRupiah(value);
}

export function formatArea(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${formatNumber(value, Number.isInteger(value) ? 0 : 2)} ha`;
}

export function formatCount(value: number): string {
  return idNumber.format(value);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
