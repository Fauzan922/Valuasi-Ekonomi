import { describe, expect, it } from 'vitest';
import {
  buildExportRows,
  recordsToCsv,
} from '../src/lib/export/exporters';
import { createRecord } from '../src/lib/portfolio/storage';
import { reference } from '../src/data/reference';
import { coefficientsForEcosystem } from '../src/lib/valuation/engine';

const ACEH = reference.locations.find((location) => location.name === 'Provinsi Aceh');
if (!ACEH) throw new Error('Aceh not found');

const record = createRecord({
  label: 'Hutan uji',
  locationId: ACEH.id,
  province: 'Aceh',
  ecosystem: 'Hutan',
  kawasanStatus: 'KL',
  kawasanTypeId: 'kl01',
  areaHa: 100,
  notes: 'Catatan uji',
});

const nonKl = createRecord({
  label: 'Non KL',
  locationId: ACEH.id,
  province: 'Aceh',
  ecosystem: 'Hutan',
  kawasanStatus: 'NON_KL',
  kawasanTypeId: null,
  areaHa: 50,
  notes: null,
});

describe('export rows', () => {
  it('builds one row per record with coefficients and values', () => {
    const rows = buildExportRows([record]);
    expect(rows).toHaveLength(1);
    const row = rows[0];
    if (!row) throw new Error('row missing');
    const coefficient = coefficientsForEcosystem('Hutan', ACEH.ump, ACEH.id).total ?? 0;
    expect(row.Label).toBe('Hutan uji');
    expect(row.Provinsi).toBe('Aceh');
    expect(row['Luas (ha)']).toBe(100);
    expect(row['Nilai Total (Rp/tahun)']).toBeCloseTo(coefficient * 100, 4);
    expect(row['Jenis Ekosistem']).toBe('Hutan');
  });

  it('leaves values null for non-KL records', () => {
    const [row] = buildExportRows([nonKl]);
    if (!row) throw new Error('row missing');
    expect(row['Nilai Total (Rp/tahun)']).toBeNull();
    expect(row['Status Kawasan']).toMatch(/Non-Kawasan Lindung/);
  });
});

describe('CSV export', () => {
  it('starts with a UTF-8 BOM and includes Indonesian headers', () => {
    const csv = recordsToCsv([record]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('Provinsi');
    expect(csv).toContain('Nilai Total (Rp/tahun)');
    expect(csv).toContain('Hutan uji');
  });

  it('escapes commas and quotes', () => {
    const tricky = createRecord({
      label: 'Catatan, "khusus"',
      locationId: ACEH.id,
      province: 'Aceh',
      ecosystem: 'Hutan',
      kawasanStatus: 'KL',
      kawasanTypeId: null,
      areaHa: 1,
      notes: 'Baris, dengan koma',
    });
    const csv = recordsToCsv([tricky]);
    expect(csv).toContain('"Catatan, ""khusus"""');
  });

  it('returns a readable message when there are no records', () => {
    const csv = recordsToCsv([]);
    expect(csv).toContain('Tidak ada catatan');
  });
});
