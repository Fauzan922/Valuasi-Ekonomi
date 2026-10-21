import { reference } from '../../data/reference';
import {
  SERVICE_CATEGORIES,
  type CategoryCoefficient,
  type CoefficientStudyValue,
  type EcosystemCoefficients,
  type Location,
  type PortfolioRecord,
  type ReferenceStudy,
  type ServiceCategory,
} from '../../types';

/**
 * Valuation engine — reproduces the workbook's benefit-transfer method.
 *
 * Source order in the workbook:
 *  1. Pivot per study/component: NILAI SATUAN 2025 (RUMUS)  [per hectare]
 *  2. BT sheet: base x (UMP lokasi target / UMP lokasi studi)
 *  3. Category total per study = sum of converted components
 *  4. Coefficient = median of non-zero category totals across studies
 *  5. Total = sum of the three category medians
 *
 * The engine deliberately does not re-inflate the base values: the workbook's
 * 2025 per-hectare column already contains the compound adjustment. Applying
 * it again would diverge from the workbook.
 */

const coefficientCache = new Map<string, EcosystemCoefficients>();

export function getLocation(locationId: string): Location | undefined {
  return reference.locations.find((location) => location.id === locationId);
}

export function getProvinceLocations(): Location[] {
  return reference.locations.filter((location) => location.type === 'province');
}

export function getKabupatenLocations(): Location[] {
  return reference.locations.filter((location) => location.type === 'kabupaten_kota');
}

export function getOtherLocations(): Location[] {
  return reference.locations.filter((location) => location.type === 'other');
}

export function getEcosystem(name: string) {
  return reference.ecosystems.find((ecosystem) => ecosystem.name === name);
}

export function getKawasan(id: string) {
  return reference.kawasan.find((kawasan) => kawasan.id === id);
}

export function studiesForEcosystem(ecosystem: string): ReferenceStudy[] {
  return reference.studies.filter((study) => study.ecosystem === ecosystem);
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[middle] ?? null;
  const lower = sorted[middle - 1];
  const upper = sorted[middle];
  if (lower === undefined || upper === undefined) return null;
  return (lower + upper) / 2;
}

/**
 * Category total for one study, in Rp/ha/year at the target location's
 * 2025 purchasing-power level. Returns null when the study has no usable
 * component for that category; returns 0 when components exist but sum to 0.
 */
export function studyCategoryTotal(
  study: ReferenceStudy,
  targetUmp: number,
): Record<ServiceCategory, number | null> {
  const result: Record<ServiceCategory, number | null> = {
    Cultural: null,
    Provisioning: null,
    Regulating: null,
  };
  if (!study.studyUmp || study.studyUmp <= 0 || targetUmp <= 0) return result;

  const ratio = targetUmp / study.studyUmp;
  for (const category of SERVICE_CATEGORIES) {
    const components = study.components.filter(
      (component) =>
        component.service === category &&
        component.basePerHa2025 !== null &&
        Number.isFinite(component.basePerHa2025),
    );
    if (components.length === 0) continue;
    result[category] = components.reduce(
      (sum, component) => sum + (component.basePerHa2025 ?? 0) * ratio,
      0,
    );
  }
  return result;
}

export function coefficientsForEcosystem(
  ecosystem: string,
  targetUmp: number,
  locationId = '',
): EcosystemCoefficients {
  const cacheKey = `${ecosystem}|${targetUmp}|${locationId}`;
  const cached = coefficientCache.get(cacheKey);
  if (cached) return cached;

  const studies = studiesForEcosystem(ecosystem);
  const categories = {} as Record<ServiceCategory, CategoryCoefficient>;

  for (const category of SERVICE_CATEGORIES) {
    const studyValues: CoefficientStudyValue[] = [];
    for (const study of studies) {
      const totals = studyCategoryTotal(study, targetUmp);
      const value = totals[category];
      if (value === null || value === 0) continue;
      studyValues.push({
        studyId: study.id,
        title: study.title,
        region: study.region,
        year: study.year,
        value,
      });
    }
    studyValues.sort((a, b) => a.value - b.value);
    const values = studyValues.map((item) => item.value);
    const value = median(values);
    let medianStudyIds: string[] = [];
    if (studyValues.length > 0) {
      const middle = Math.floor(studyValues.length / 2);
      medianStudyIds =
        studyValues.length % 2 === 1
          ? [studyValues[middle]?.studyId ?? '']
          : [studyValues[middle - 1]?.studyId ?? '', studyValues[middle]?.studyId ?? ''];
      medianStudyIds = medianStudyIds.filter(Boolean);
    }
    categories[category] = {
      category,
      value,
      sampleSize: values.length,
      studies: studyValues,
      medianStudyIds,
    };
  }

  const available = SERVICE_CATEGORIES.map((category) => categories[category].value).filter(
    (value): value is number => value !== null,
  );
  const total = available.length > 0 ? available.reduce((sum, value) => sum + value, 0) : null;

  const result: EcosystemCoefficients = {
    ecosystem,
    locationId,
    targetUmp,
    categories,
    total,
  };
  coefficientCache.set(cacheKey, result);
  return result;
}

export function coefficientForSelection(
  ecosystem: string,
  targetUmp: number,
  selection: ServiceCategory | 'Total',
  locationId = '',
): number | null {
  const coefficients = coefficientsForEcosystem(ecosystem, targetUmp, locationId);
  if (selection === 'Total') return coefficients.total;
  return coefficients.categories[selection].value;
}

export interface RecordValuation {
  record: PortfolioRecord;
  location: Location | null;
  coefficients: EcosystemCoefficients | null;
  categoryValues: Record<ServiceCategory, number | null>;
  totalValue: number | null;
  supported: boolean;
  reason: string | null;
}

/**
 * Non-KL records are intentionally not valued: the workbook only supplies
 * coefficients for kawasan lindung / berfungsi lindung and does not state that
 * the same coefficient may be transferred to non-protected areas.
 */
export function valueRecord(record: PortfolioRecord): RecordValuation {
  const location = getLocation(record.locationId);
  if (!location) {
    return {
      record,
      location: null,
      coefficients: null,
      categoryValues: { Cultural: null, Provisioning: null, Regulating: null },
      totalValue: null,
      supported: false,
      reason: 'Lokasi UMP tidak ditemukan pada tabel referensi.',
    };
  }
  const coefficients = coefficientsForEcosystem(record.ecosystem, location.ump, location.id);
  if (record.kawasanStatus !== 'KL') {
    return {
      record,
      location,
      coefficients,
      categoryValues: { Cultural: null, Provisioning: null, Regulating: null },
      totalValue: null,
      supported: false,
      reason:
        record.kawasanStatus === 'NON_KL'
          ? 'Workbook tidak menyediakan koefisien untuk non-kawasan lindung.'
          : 'Status kawasan belum diketahui; nilai tidak dihitung.',
    };
  }
  if (coefficients.total === null) {
    return {
      record,
      location,
      coefficients,
      categoryValues: { Cultural: null, Provisioning: null, Regulating: null },
      totalValue: null,
      supported: false,
      reason: 'Tidak ada koefisien jasa ekosistem untuk ekosistem ini.',
    };
  }
  const categoryValues = {
    Cultural:
      coefficients.categories.Cultural.value === null
        ? null
        : coefficients.categories.Cultural.value * record.areaHa,
    Provisioning:
      coefficients.categories.Provisioning.value === null
        ? null
        : coefficients.categories.Provisioning.value * record.areaHa,
    Regulating:
      coefficients.categories.Regulating.value === null
        ? null
        : coefficients.categories.Regulating.value * record.areaHa,
  };
  return {
    record,
    location,
    coefficients,
    categoryValues,
    totalValue: coefficients.total * record.areaHa,
    supported: true,
    reason: null,
  };
}

export interface PortfolioSummary {
  recordCount: number;
  supportedCount: number;
  unsupportedCount: number;
  totalAreaHa: number;
  supportedAreaHa: number;
  nonKlAreaHa: number;
  unknownStatusAreaHa: number;
  totalValue: number;
  byEcosystem: Array<{
    ecosystem: string;
    areaHa: number;
    value: number;
    recordCount: number;
  }>;
  byService: Record<ServiceCategory, number>;
  byStatus: Record<string, { areaHa: number; value: number; recordCount: number }>;
  byProvince: Array<{ province: string; areaHa: number; value: number; recordCount: number }>;
}

export function summarizePortfolio(records: PortfolioRecord[]): PortfolioSummary {
  const byEcosystemMap = new Map<
    string,
    { ecosystem: string; areaHa: number; value: number; recordCount: number }
  >();
  const byStatusMap = new Map<
    string,
    { areaHa: number; value: number; recordCount: number }
  >();
  const byProvinceMap = new Map<
    string,
    { province: string; areaHa: number; value: number; recordCount: number }
  >();
  const byService: Record<ServiceCategory, number> = {
    Cultural: 0,
    Provisioning: 0,
    Regulating: 0,
  };

  let supportedCount = 0;
  let unsupportedCount = 0;
  let totalAreaHa = 0;
  let supportedAreaHa = 0;
  let nonKlAreaHa = 0;
  let unknownStatusAreaHa = 0;
  let totalValue = 0;

  for (const record of records) {
    totalAreaHa += record.areaHa;
    if (record.kawasanStatus === 'NON_KL') nonKlAreaHa += record.areaHa;
    if (record.kawasanStatus === 'UNKNOWN') unknownStatusAreaHa += record.areaHa;

    const valuation = valueRecord(record);
    const eco = byEcosystemMap.get(record.ecosystem) ?? {
      ecosystem: record.ecosystem,
      areaHa: 0,
      value: 0,
      recordCount: 0,
    };
    eco.areaHa += record.areaHa;
    eco.recordCount += 1;
    eco.value += valuation.totalValue ?? 0;
    byEcosystemMap.set(record.ecosystem, eco);

    const status = byStatusMap.get(record.kawasanStatus) ?? {
      areaHa: 0,
      value: 0,
      recordCount: 0,
    };
    status.areaHa += record.areaHa;
    status.recordCount += 1;
    status.value += valuation.totalValue ?? 0;
    byStatusMap.set(record.kawasanStatus, status);

    const province = record.province?.trim() || 'Tidak diisi';
    const prov = byProvinceMap.get(province) ?? {
      province,
      areaHa: 0,
      value: 0,
      recordCount: 0,
    };
    prov.areaHa += record.areaHa;
    prov.recordCount += 1;
    prov.value += valuation.totalValue ?? 0;
    byProvinceMap.set(province, prov);

    if (valuation.supported) {
      supportedCount += 1;
      supportedAreaHa += record.areaHa;
      totalValue += valuation.totalValue ?? 0;
      for (const category of SERVICE_CATEGORIES) {
        byService[category] += valuation.categoryValues[category] ?? 0;
      }
    } else {
      unsupportedCount += 1;
    }
  }

  return {
    recordCount: records.length,
    supportedCount,
    unsupportedCount,
    totalAreaHa,
    supportedAreaHa,
    nonKlAreaHa,
    unknownStatusAreaHa,
    totalValue,
    byEcosystem: [...byEcosystemMap.values()].sort((a, b) => b.value - a.value || b.areaHa - a.areaHa),
    byService,
    byStatus: Object.fromEntries(byStatusMap),
    byProvince: [...byProvinceMap.values()].sort((a, b) => b.value - a.value || b.areaHa - a.areaHa),
  };
}
