/**
 * Extract the reference dataset from the authoritative workbook.
 *
 * The workbook is the source of truth. This script does not "improve" values:
 * it preserves the workbook's per-hectare 2025 values, service labels, study
 * metadata and UMP reference table so the web engine can reproduce the
 * workbook's benefit-transfer calculation.
 *
 * Usage: node tools/extract-workbook.mjs [path-to-workbook]
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const ROOT = process.cwd();
const WORKBOOK =
  process.argv[2] ||
  path.join(ROOT, 'Perhitungan Valuasi Ekonomi Lingkungan Hidup.xlsx');
const OUT_DIR = path.join(ROOT, 'src', 'data');
const OUT_FILE = path.join(OUT_DIR, 'reference.json');

const ECOSYSTEM_ORDER = [
  'Hutan',
  'Mangrove',
  'Danau',
  'Sungai',
  'Terumbu Karang',
  'Gambut',
  'Karst',
  'Padang Lamun',
  'Lahan Basah',
];

const ECOSYSTEM_ALIASES = new Map(
  [
    ...ECOSYSTEM_ORDER.map((name) => [name.toLowerCase(), name]),
    ['padang lamun', 'Padang Lamun'],
    ['lahan basah', 'Lahan Basah'],
  ],
);

const SERVICES = ['Cultural', 'Provisioning', 'Regulating'];

function canonicalEcosystem(value) {
  if (value === null || value === undefined) return null;
  const key = String(value).replace(/\s+/g, ' ').trim().toLowerCase();
  return ECOSYSTEM_ALIASES.get(key) ?? String(value).replace(/\s+/g, ' ').trim();
}

function text(value) {
  if (value === null || value === undefined) return null;
  const out = String(value).replace(/\r/g, ' ').replace(/\s+/g, ' ').trim();
  return out.length ? out : null;
}

function num(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value)
    .replace(/\s/g, '')
    .replace(/,/g, '')
    .trim();
  if (!cleaned || cleaned === '-' || /tidak\s*ada\s*data/i.test(cleaned)) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function rowsOf(sheetName) {
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  return XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    raw: true,
    blankrows: true,
  });
}

const wb = XLSX.readFile(WORKBOOK, { cellFormula: true, cellDates: false });

// ---------------------------------------------------------------------------
// 1. Locations and 2025 UMP (province + kabupaten/kota)
// ---------------------------------------------------------------------------
const umpRows = rowsOf('Database UMP 2025');
const locations = [];
const locationByName = new Map();
for (let i = 4; i < umpRows.length; i++) {
  const row = umpRows[i] || [];
  const name = text(row[1]);
  const ump = num(row[2]);
  if (!name || ump === null) continue;
  const type = /^provinsi\b/i.test(name)
    ? 'province'
    : /^(kabupaten|kota)\b/i.test(name)
      ? 'kabupaten_kota'
      : 'other';
  const location = {
    id: `loc${String(locations.length + 1).padStart(3, '0')}`,
    name,
    ump,
    type,
  };
  locations.push(location);
  locationByName.set(name.toLowerCase(), location);
}

// ---------------------------------------------------------------------------
// 2. Study-level UMP mapping (authoritative study -> location)
// ---------------------------------------------------------------------------
const studyUmpRows = rowsOf('Database UMP Transfer Benefit');
const studyUmp = new Map();
for (let i = 4; i < studyUmpRows.length; i++) {
  const row = studyUmpRows[i] || [];
  const title = text(row[1]);
  if (!title) continue;
  const region = text(row[3]);
  const ump = num(row[4]);
  const location = region ? locationByName.get(region.toLowerCase()) : undefined;
  studyUmp.set(title.toLowerCase(), {
    region,
    regionLocationId: location?.id ?? null,
    ump,
    studyYear: num(row[2]),
  });
}

// ---------------------------------------------------------------------------
// 3. Benefit-transfer records
// ---------------------------------------------------------------------------
const dbRows = rowsOf('Database Transfer Benefit');
const studies = [];
let current = null;

for (let i = 1; i < dbRows.length; i++) {
  const row = dbRows[i] || [];
  const title = text(row[1]);
  if (title && (!current || current.title !== title)) {
    const ecosystem = canonicalEcosystem(row[2]);
    const source = text(row[14]);
    const year = num(row[15]);
    const umpRecord = studyUmp.get(title.toLowerCase());
    current = {
      id: `study${String(studies.length + 1).padStart(3, '0')}`,
      title,
      ecosystem,
      year,
      source,
      region: umpRecord?.region ?? null,
      regionLocationId: umpRecord?.regionLocationId ?? null,
      studyUmp: umpRecord?.ump ?? null,
      components: [],
    };
    studies.push(current);
  }
  if (!current) continue;

  const service = text(row[3]);
  const component = text(row[4]);
  const base = num(row[12]); // NILAI SATUAN 2025 (RUMUS) — workbook pivot input
  const raw = num(row[10]); // NILAI SATUAN (study year)
  if (!service || !component) continue;
  if (!SERVICES.includes(service)) {
    throw new Error(`Unexpected service "${service}" in row ${i + 1}`);
  }
  current.components.push({
    service,
    component,
    method: text(row[5]),
    unit: text(row[13]),
    rawPerHa: raw,
    basePerHa2025: base,
    totalStudyYear: num(row[6]),
    total2025: num(row[7]),
    total2025Formula: num(row[8]),
  });
}

// ---------------------------------------------------------------------------
// 4. Kawasan lindung -> compatible ecosystems table
// ---------------------------------------------------------------------------
const kawasanRows = rowsOf('Ekosistem pada Kawasan Lindung ');
const header = kawasanRows[0] || [];
const kawasan = [];
for (let c = 0; c < header.length; c++) {
  const name = text(header[c]);
  if (!name) continue;
  const ecosystems = [];
  for (let r = 1; r <= 7; r++) {
    const eco = canonicalEcosystem(kawasanRows[r]?.[c]);
    if (eco && ECOSYSTEM_ORDER.includes(eco) && !ecosystems.includes(eco)) {
      ecosystems.push(eco);
    }
  }
  if (!ecosystems.length) continue;
  kawasan.push({
    id: `kl${String(kawasan.length + 1).padStart(2, '0')}`,
    name,
    ecosystems,
  });
}

// ---------------------------------------------------------------------------
// 5. Ecosystem descriptions (short summaries from the workbook)
// ---------------------------------------------------------------------------
const characteristicsRows = rowsOf('Karakteristik Ekosistem');
const ecosystems = [];
for (let r = 3; r < characteristicsRows.length; r++) {
  const row = characteristicsRows[r] || [];
  const name = canonicalEcosystem(row[1]);
  if (!name || !ECOSYSTEM_ORDER.includes(name)) continue;
  ecosystems.push({
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    description: text(row[5]),
    order: ECOSYSTEM_ORDER.indexOf(name),
  });
}
ecosystems.sort((a, b) => a.order - b.order);

// Ensure every ecosystem exists even if a description is missing.
for (const name of ECOSYSTEM_ORDER) {
  if (!ecosystems.some((e) => e.name === name)) {
    ecosystems.push({
      id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name,
      description: null,
      order: ECOSYSTEM_ORDER.indexOf(name),
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Sanity checks + dataset metadata
// ---------------------------------------------------------------------------
const findings = [];
const studyTitles = new Set(studies.map((s) => s.title));
if (studyTitles.size !== studies.length) {
  findings.push('Duplicate study titles found in Database Transfer Benefit.');
}
const missingUmp = studies.filter((s) => !s.studyUmp);
if (missingUmp.length) {
  findings.push(`${missingUmp.length} studies have no UMP mapping.`);
}
const missingBase = studies.flatMap((s) =>
  s.components.filter((c) => c.basePerHa2025 === null).map((c) => `${s.title} :: ${c.component}`),
);
if (missingBase.length) {
  findings.push(`${missingBase.length} component rows have no numeric 2025 per-ha value.`);
}
const unknownEcosystems = [
  ...new Set(studies.map((s) => s.ecosystem).filter((e) => !ECOSYSTEM_ORDER.includes(e))),
];
if (unknownEcosystems.length) {
  findings.push(`Unknown ecosystems: ${unknownEcosystems.join(', ')}`);
}

const workbookHash = crypto
  .createHash('sha256')
  .update(fs.readFileSync(WORKBOOK))
  .digest('hex')
  .slice(0, 16);

const payload = {
  meta: {
    datasetVersion: 'workbook-2025.1',
    engineVersion: 'bt-ump-median-1.0.0',
    sourceWorkbook: path.basename(WORKBOOK),
    workbookSha256_16: workbookHash,
    extractedAt: new Date().toISOString().slice(0, 10),
    sheetCount: wb.SheetNames.length,
    baseYear: 2025,
    priceYear: 2025,
    interestRate: 0.0475,
    interestRateNote:
      'Suku bunga majemuk 4,75% (BI Rate, Oktober 2025) digunakan pada kolom NILAI 2025 (RUMUS) di workbook. Nilai per hektare yang dipakai kalkulator adalah kolom NILAI SATUAN 2025 (RUMUS), sehingga faktor majemuk sudah melekat pada data referensi.',
    umpSourceSheet: 'Database UMP 2025',
    studyCount: studies.length,
    componentCount: studies.reduce((n, s) => n + s.components.length, 0),
    locationCount: locations.length,
    kawasanCount: kawasan.length,
    ecosystemCount: ecosystems.length,
    findings,
  },
  ecosystems,
  kawasan,
  locations,
  studies,
};

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT_FILE, JSON.stringify(payload));

console.log(`Wrote ${OUT_FILE}`);
console.log(
  JSON.stringify(
    {
      studies: payload.meta.studyCount,
      components: payload.meta.componentCount,
      locations: payload.meta.locationCount,
      kawasan: payload.meta.kawasanCount,
      ecosystems: payload.meta.ecosystemCount,
      findings: payload.meta.findings,
    },
    null,
    2,
  ),
);
