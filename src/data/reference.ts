import raw from './reference.json';
import type { ReferenceDataset } from '../types';

/**
 * Reference data extracted from the authoritative workbook.
 * Regenerate with: npm run data:extract
 */
export const reference = raw as unknown as ReferenceDataset;

export const ecosystems = reference.ecosystems;
export const kawasanList = reference.kawasan;
export const locations = reference.locations;
export const studies = reference.studies;
export const meta = reference.meta;
