import { describe, expect, it } from 'vitest';
import { reference } from '../src/data/reference';
import {
  coefficientForSelection,
  coefficientsForEcosystem,
  getLocation,
  median,
  studyCategoryTotal,
  summarizePortfolio,
  valueRecord,
} from '../src/lib/valuation/engine';
import { createRecord } from '../src/lib/portfolio/storage';
import type { PortfolioRecord, ServiceCategory } from '../src/types';

const ACEH = reference.locations.find((location) => location.name === 'Provinsi Aceh');
if (!ACEH) throw new Error('Aceh UMP not found');

/**
 * Expected values are the cached C17:C20 cells of the nine
 * "Rangkuman Nilai Jasa Lingkungan" sheets, with Provinsi Aceh selected.
 * Workbook values are shown at 2–3 decimals; the engine keeps full precision.
 */
const WORKBOOK: Record<
  string,
  { Cultural: number | null; Provisioning: number | null; Regulating: number | null; Total: number }
> = {
  Hutan: {
    Cultural: 14514491.54,
    Provisioning: 4542534.272,
    Regulating: 3837977.897,
    Total: 22895003.71,
  },
  'Terumbu Karang': {
    Cultural: 192437490.1,
    Provisioning: 153960820.4,
    Regulating: 180749484.8,
    Total: 527147795.3,
  },
  Mangrove: {
    Cultural: 9225534.138,
    Provisioning: 78277685.36,
    Regulating: 26107208.91,
    Total: 113610428.4,
  },
  'Padang Lamun': {
    Cultural: 202097833.1,
    Provisioning: 406205780.3,
    Regulating: 5760750.064,
    Total: 614064363.5,
  },
  Danau: {
    Cultural: 1153523.56,
    Provisioning: 32696942.12,
    Regulating: null,
    Total: 33850465.68,
  },
  Sungai: {
    Cultural: 248426.3938,
    Provisioning: 15192655.32,
    Regulating: 11216771.31,
    Total: 26657853.02,
  },
  Karst: {
    Cultural: 5955462.71,
    Provisioning: 251316836.5,
    Regulating: 5036083.002,
    Total: 262308382.2,
  },
  Gambut: {
    Cultural: 7218372.18,
    Provisioning: 6089111.51,
    Regulating: 74529206.6,
    Total: 87836690.29,
  },
  'Lahan Basah': {
    Cultural: null,
    Provisioning: null,
    Regulating: 14270895.48,
    Total: 14270895.48,
  },
};

const CATEGORIES: ServiceCategory[] = ['Cultural', 'Provisioning', 'Regulating'];

describe('reference dataset', () => {
  it('contains 62 studies, 475 components, 9 ecosystems and 23 kawasan types', () => {
    expect(reference.meta.studyCount).toBe(62);
    expect(reference.meta.componentCount).toBe(475);
    expect(reference.ecosystems).toHaveLength(9);
    expect(reference.kawasan).toHaveLength(23);
    expect(reference.locations.length).toBe(566);
  });

  it('maps every study to a 2025 UMP location', () => {
    expect(reference.studies.every((study) => study.studyUmp && study.studyUmp > 0)).toBe(true);
  });
});

describe('coefficients versus workbook (Aceh, 2025)', () => {
  for (const ecosystem of Object.keys(WORKBOOK)) {
    it(`reproduces ${ecosystem}`, () => {
      const expected = WORKBOOK[ecosystem];
      const coefficients = coefficientsForEcosystem(ecosystem, ACEH.ump, ACEH.id);
      for (const category of CATEGORIES) {
        const actual = coefficients.categories[category].value;
        if (expected[category] === null) {
          expect(actual, `${ecosystem} ${category}`).toBeNull();
        } else {
          expect(actual, `${ecosystem} ${category}`).not.toBeNull();
          expect(actual ?? 0).toBeCloseTo(expected[category] ?? 0, 1);
        }
      }
      expect(coefficients.total).not.toBeNull();
      expect(coefficients.total ?? 0).toBeCloseTo(expected.Total, 1);
    });
  }
});

describe('calculator arithmetic', () => {
  it('reproduces the workbook example: Hutan Total Aceh 145.290 ha', () => {
    const coefficient = coefficientForSelection('Hutan', ACEH.ump, 'Total', ACEH.id);
    expect(coefficient).not.toBeNull();
    const result = (coefficient ?? 0) * 145290;
    // Workbook D16 = Rp 3.326.415.089.133,00. The engine differs by about
    // Rp 0.48 due to the workbook's rounded cached medians; relative error < 1e-12.
    expect(Math.round(result)).toBe(3326415089133);
    expect(Math.abs(result - 3326415089133) / 3326415089133).toBeLessThan(1e-12);
  });

  it('returns zero for zero area and scales linearly', () => {
    const coefficient = coefficientForSelection('Hutan', ACEH.ump, 'Total', ACEH.id) ?? 0;
    expect(coefficient * 0).toBe(0);
    expect(coefficient * 100).toBeCloseTo(coefficient * 10 * 10, 6);
  });

  it('does not treat a missing category as zero', () => {
    const danau = coefficientsForEcosystem('Danau', ACEH.ump, ACEH.id);
    expect(danau.categories.Regulating.value).toBeNull();
    expect(danau.categories.Regulating.sampleSize).toBe(0);
    expect(danau.total).toBeCloseTo(
      (danau.categories.Cultural.value ?? 0) + (danau.categories.Provisioning.value ?? 0),
      6,
    );
  });

  it('calculates total as the sum of medians, not median of study totals', () => {
    const hutan = coefficientsForEcosystem('Hutan', ACEH.ump, ACEH.id);
    const sum =
      (hutan.categories.Cultural.value ?? 0) +
      (hutan.categories.Provisioning.value ?? 0) +
      (hutan.categories.Regulating.value ?? 0);
    expect(hutan.total).toBeCloseTo(sum, 6);
  });

  it('scales with the target UMP ratio', () => {
    const papua = reference.locations.find((location) => location.name === 'Provinsi Papua');
    if (!papua) throw new Error('Papua UMP not found');
    const aceh = coefficientsForEcosystem('Hutan', ACEH.ump, ACEH.id);
    const papuaCoefficients = coefficientsForEcosystem('Hutan', papua.ump, papua.id);
    const ratio = papua.ump / ACEH.ump;
    expect(papuaCoefficients.categories.Provisioning.value).toBeCloseTo(
      (aceh.categories.Provisioning.value ?? 0) * ratio,
      4,
    );
  });

  it('computes medians of odd and even samples', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  it('marks a study category with no usable component as null', () => {
    const study = reference.studies.find((item) => item.ecosystem === 'Lahan Basah');
    if (!study) throw new Error('Lahan Basah study not found');
    const totals = studyCategoryTotal(study, ACEH.ump);
    expect(totals.Cultural).toBeNull();
    expect(totals.Provisioning).toBeNull();
    expect(totals.Regulating).not.toBeNull();
  });
});

describe('portfolio reconciliation', () => {
  function record(overrides: Partial<PortfolioRecord> = {}): PortfolioRecord {
    return {
      ...createRecord({
        label: 'Uji',
        locationId: ACEH.id,
        province: 'Aceh',
        ecosystem: 'Hutan',
        kawasanStatus: 'KL',
        kawasanTypeId: 'kl01',
        areaHa: 100,
        notes: null,
      }),
      ...overrides,
    };
  }

  it('values only kawasan lindung records', () => {
    const kl = record();
    const nonKl = record({ kawasanStatus: 'NON_KL', areaHa: 50 });
    const unknown = record({ kawasanStatus: 'UNKNOWN', areaHa: 25 });
    const summary = summarizePortfolio([kl, nonKl, unknown]);

    const coefficient = coefficientsForEcosystem('Hutan', ACEH.ump, ACEH.id).total ?? 0;
    expect(summary.totalAreaHa).toBe(175);
    expect(summary.supportedAreaHa).toBe(100);
    expect(summary.nonKlAreaHa).toBe(50);
    expect(summary.unknownStatusAreaHa).toBe(25);
    expect(summary.totalValue).toBeCloseTo(coefficient * 100, 4);
    expect(summary.supportedCount).toBe(1);
    expect(summary.unsupportedCount).toBe(2);
  });

  it('reports an unsupported reason for non-KL records', () => {
    const valuation = valueRecord(record({ kawasanStatus: 'NON_KL' }));
    expect(valuation.supported).toBe(false);
    expect(valuation.totalValue).toBeNull();
    expect(valuation.reason).toMatch(/non-kawasan lindung/i);
  });

  it('returns null when the location is unknown', () => {
    const valuation = valueRecord(record({ locationId: 'loc-tidak-ada' }));
    expect(valuation.supported).toBe(false);
    expect(valuation.location).toBeNull();
  });

  it('finds locations by id', () => {
    expect(getLocation(ACEH.id)?.name).toBe('Provinsi Aceh');
    expect(getLocation('missing')).toBeUndefined();
  });
});
