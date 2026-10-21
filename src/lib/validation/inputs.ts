export interface ValidationResult<T> {
  ok: boolean;
  value: T | null;
  message: string | null;
}

/**
 * Parses user-entered area. Accepts Indonesian formatting such as
 * "145.290,50" or "145,290.50" and plain "145290".
 */
export function parseAreaInput(raw: string): ValidationResult<number> {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, value: null, message: 'Luas wajib diisi.' };
  }
  if (!/^[0-9.,\s]+$/.test(trimmed)) {
    return {
      ok: false,
      value: null,
      message: 'Luas hanya boleh berisi angka, titik, dan koma.',
    };
  }

  const cleaned = trimmed.replace(/\s/g, '');
  let normalized: string;
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Whichever separator appears last is the decimal separator.
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    normalized =
      parts.length === 2 && parts[1]?.length !== 3
        ? `${parts[0]}.${parts[1]}`
        : cleaned.replace(/,/g, '');
  } else {
    const parts = cleaned.split('.');
    normalized =
      parts.length > 2 || (parts.length === 2 && parts[1]?.length === 3)
        ? cleaned.replace(/\./g, '')
        : cleaned;
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { ok: false, value: null, message: 'Luas tidak dapat dibaca sebagai angka.' };
  }
  if (value < 0) {
    return { ok: false, value: null, message: 'Luas tidak boleh negatif.' };
  }
  if (value > 1_000_000_000) {
    return {
      ok: false,
      value: null,
      message: 'Luas melebihi batas wajar yang dapat diproses (1 miliar ha).',
    };
  }
  return { ok: true, value, message: null };
}

export function validateRequiredText(
  value: string,
  label: string,
  maxLength = 160,
): ValidationResult<string> {
  const trimmed = value.trim();
  if (!trimmed) return { ok: false, value: null, message: `${label} wajib diisi.` };
  if (trimmed.length > maxLength) {
    return {
      ok: false,
      value: null,
      message: `${label} maksimal ${maxLength} karakter.`,
    };
  }
  return { ok: true, value: trimmed, message: null };
}

export function normalizeEcosystemName(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
