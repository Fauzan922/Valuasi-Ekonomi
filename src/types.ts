export const SERVICE_CATEGORIES = ['Cultural', 'Provisioning', 'Regulating'] as const;
export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];
export type ServiceSelection = ServiceCategory | 'Total';

export const SERVICE_LABELS: Record<ServiceSelection, string> = {
  Cultural: 'Budaya (Cultural)',
  Provisioning: 'Penyedia (Provisioning)',
  Regulating: 'Pengaturan (Regulating)',
  Total: 'Total jasa ekosistem',
};

export const SERVICE_SHORT_LABELS: Record<ServiceCategory, string> = {
  Cultural: 'Budaya',
  Provisioning: 'Penyedia',
  Regulating: 'Pengaturan',
};

export interface ReferenceComponent {
  service: ServiceCategory;
  component: string;
  method: string | null;
  unit: string | null;
  rawPerHa: number | null;
  basePerHa2025: number | null;
  totalStudyYear: number | null;
  total2025: number | null;
  total2025Formula: number | null;
}

export interface ReferenceStudy {
  id: string;
  title: string;
  ecosystem: string;
  year: number | null;
  source: string | null;
  region: string | null;
  regionLocationId: string | null;
  studyUmp: number | null;
  components: ReferenceComponent[];
}

export interface Ecosystem {
  id: string;
  name: string;
  description: string | null;
  order: number;
}

export interface Kawasan {
  id: string;
  name: string;
  ecosystems: string[];
}

export interface Location {
  id: string;
  name: string;
  ump: number;
  type: 'province' | 'kabupaten_kota' | 'other';
}

export interface DatasetMeta {
  datasetVersion: string;
  engineVersion: string;
  sourceWorkbook: string;
  workbookSha256_16: string;
  extractedAt: string;
  sheetCount: number;
  baseYear: number;
  priceYear: number;
  interestRate: number;
  interestRateNote: string;
  umpSourceSheet: string;
  studyCount: number;
  componentCount: number;
  locationCount: number;
  kawasanCount: number;
  ecosystemCount: number;
  findings: string[];
}

export interface ReferenceDataset {
  meta: DatasetMeta;
  ecosystems: Ecosystem[];
  kawasan: Kawasan[];
  locations: Location[];
  studies: ReferenceStudy[];
}

export interface CoefficientStudyValue {
  studyId: string;
  title: string;
  region: string | null;
  year: number | null;
  value: number;
}

export interface CategoryCoefficient {
  category: ServiceCategory;
  value: number | null;
  sampleSize: number;
  studies: CoefficientStudyValue[];
  medianStudyIds: string[];
}

export interface EcosystemCoefficients {
  ecosystem: string;
  locationId: string;
  targetUmp: number;
  categories: Record<ServiceCategory, CategoryCoefficient>;
  total: number | null;
}

export type KawasanStatus = 'KL' | 'NON_KL' | 'UNKNOWN';

export const KAWASAN_STATUS_LABELS: Record<KawasanStatus, string> = {
  KL: 'Kawasan Lindung / Berfungsi Lindung',
  NON_KL: 'Non-Kawasan Lindung',
  UNKNOWN: 'Status belum diketahui',
};

export interface PortfolioRecord {
  id: string;
  label: string;
  locationId: string;
  province: string | null;
  ecosystem: string;
  kawasanStatus: KawasanStatus;
  kawasanTypeId: string | null;
  areaHa: number;
  notes: string | null;
  createdAt: string;
}
