import type { KawasanStatus, PortfolioRecord } from '../../types';

const STORAGE_KEY = 'valuasi-ekosistem.portfolio.v1';

export interface NewRecordInput {
  label: string;
  locationId: string;
  province: string | null;
  ecosystem: string;
  kawasanStatus: KawasanStatus;
  kawasanTypeId: string | null;
  areaHa: number;
  notes: string | null;
}

function isKawasanStatus(value: unknown): value is KawasanStatus {
  return value === 'KL' || value === 'NON_KL' || value === 'UNKNOWN';
}

function parseRecord(value: unknown): PortfolioRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const record = value as Record<string, unknown>;
  const status = record.kawasanStatus ?? 'KL';
  if (
    typeof record.id !== 'string' ||
    typeof record.label !== 'string' ||
    typeof record.locationId !== 'string' ||
    typeof record.ecosystem !== 'string' ||
    typeof record.areaHa !== 'number' ||
    !Number.isFinite(record.areaHa) ||
    record.areaHa < 0 ||
    typeof record.createdAt !== 'string' ||
    !isKawasanStatus(status)
  ) {
    return null;
  }
  return {
    id: record.id,
    label: record.label,
    locationId: record.locationId,
    province: typeof record.province === 'string' ? record.province : null,
    ecosystem: record.ecosystem,
    kawasanStatus: status,
    kawasanTypeId:
      typeof record.kawasanTypeId === 'string' ? record.kawasanTypeId : null,
    areaHa: record.areaHa,
    notes: typeof record.notes === 'string' ? record.notes : null,
    createdAt: record.createdAt,
  };
}

export function loadPortfolio(): PortfolioRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parseRecord)
      .filter((record): record is PortfolioRecord => record !== null);
  } catch {
    return [];
  }
}

export function savePortfolio(records: PortfolioRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage can be unavailable in private browsing; the UI reports this.
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createRecord(input: NewRecordInput): PortfolioRecord {
  return {
    id: createId(),
    label: input.label,
    locationId: input.locationId,
    province: input.province,
    ecosystem: input.ecosystem,
    kawasanStatus: input.kawasanStatus,
    kawasanTypeId: input.kawasanTypeId,
    areaHa: input.areaHa,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };
}
