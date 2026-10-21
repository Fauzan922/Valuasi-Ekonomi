import { describe, expect, it } from 'vitest';
import {
  CLASSIFICATION_LIMITATIONS,
  compatibleEcosystems,
  getKawasanById,
  getKawasanByName,
  identifyEcosystem,
  kawasanForEcosystem,
} from '../src/lib/classification/rules';
import { reference } from '../src/data/reference';

describe('classification rules', () => {
  it('loads 23 kawasan types', () => {
    expect(reference.kawasan).toHaveLength(23);
  });

  it('maps Kawasan Hutan Lindung to Hutan and Lahan Basah', () => {
    expect(compatibleEcosystems('kl01')).toEqual(['Hutan', 'Lahan Basah']);
  });

  it('maps Sempadan Pantai to mangrove, seagrass and coral reef', () => {
    expect(compatibleEcosystems('kl04')).toEqual([
      'Mangrove',
      'Padang Lamun',
      'Terumbu Karang',
    ]);
  });

  it('maps Taman Nasional to seven ecosystems in workbook order', () => {
    expect(compatibleEcosystems('kl10')).toEqual([
      'Hutan',
      'Sungai',
      'Danau',
      'Terumbu Karang',
      'Mangrove',
      'Padang Lamun',
      'Lahan Basah',
    ]);
  });

  it('returns an empty list for an unknown kawasan', () => {
    expect(compatibleEcosystems('kl99')).toEqual([]);
  });

  it('identifies a compatible ecosystem', () => {
    const result = identifyEcosystem('kl01', 'Hutan');
    expect(result.status).toBe('supported');
    expect(result.compatible).toContain('Hutan');
  });

  it('rejects an incompatible ecosystem explicitly', () => {
    const result = identifyEcosystem('kl09', 'Terumbu Karang');
    expect(result.status).toBe('incompatible');
    expect(result.compatible).toEqual(['Mangrove']);
  });

  it('asks for an ecosystem when none is selected', () => {
    const result = identifyEcosystem('kl01', null);
    expect(result.status).toBe('unsupported');
    expect(result.compatible).toEqual(['Hutan', 'Lahan Basah']);
  });

  it('reports an unknown kawasan as unsupported', () => {
    const result = identifyEcosystem('kl99', 'Hutan');
    expect(result.status).toBe('unsupported');
    expect(result.kawasan).toBeNull();
  });

  it('finds kawasan by id and normalized name', () => {
    expect(getKawasanById('kl10')?.name).toBe('Taman Nasional dan Taman Nasional Laut');
    expect(getKawasanByName('  taman nasional dan taman nasional laut  ')?.id).toBe('kl10');
    expect(getKawasanByName('tidak ada')).toBeUndefined();
  });

  it('finds all kawasan compatible with an ecosystem', () => {
    const list = kawasanForEcosystem('Mangrove');
    expect(list.length).toBeGreaterThan(5);
    expect(list.every((kawasan) => kawasan.ecosystems.includes('Mangrove'))).toBe(true);
  });

  it('documents the limits of the workbook rules', () => {
    expect(CLASSIFICATION_LIMITATIONS.length).toBeGreaterThanOrEqual(4);
    expect(CLASSIFICATION_LIMITATIONS.join(' ')).toMatch(/GIS/i);
    expect(CLASSIFICATION_LIMITATIONS.join(' ')).toMatch(/non-kawasan lindung/i);
  });
});
