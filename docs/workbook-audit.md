# Audit Workbook — Perhitungan Valuasi Ekonomi Lingkungan Hidup

**Audit date:** 21 October 2026
**Source file:** `Perhitungan Valuasi Ekonomi Lingkungan Hidup.xlsx`
**Size:** 14,025,355 bytes
**SHA-256 (first 16 characters):** `1d30931b10ffec1e`
**Sheets:** 46, all visible; no hidden worksheets and no VBA project (`.xlsx`).
**Audit method:** direct OOXML inspection plus SheetJS (`xlsx@0.18.5`) value/formula extraction. All sheet values and formulas were dumped and cross-checked against the workbook's cached results.

This document records what the workbook actually does. It does not propose new methodology and does not fill gaps with assumptions.

---

## 1. Executive summary

The workbook is a **benefit-transfer calculator**, not a provincial inventory. Its main calculator takes five inputs:

| Input | Cell | Meaning |
|---|---|---|
| Jenis kawasan | `D7` | One of 23 kawasan lindung/berfungsi lindung types. **Not used by the valuation formula.** |
| Jenis ekosistem | `D8` | One of 9 ecosystem types in the formula (Hutan, Mangrove, Danau, Sungai, Terumbu Karang, Gambut, Karst, Padang Lamun, Lahan Basah). |
| Jenis jasa | `D13` | `Cultural`, `Provisioning`, `Regulating`, or `Total`. |
| Lokasi | `D14` | One of 566 province/kabupaten/kota names in the 2025 UMP table. |
| Luas | `D15` | Hectares. |

The output is `D16`, in Rp/year for 2025. The formula is a large nested `IF` that selects one of nine summary sheets. The summary coefficient is multiplied by `D15`.

The workbook contains **no provincial ecosystem area dataset, no coordinates, no polygon boundaries, and no GIS operations**. Consequently, a province-level total cannot be derived from the workbook alone. The web application therefore computes totals only from user-entered areas.

### Reproduced calculation chain

```
per-ha 2025 value (workbook column M)
  × (UMP 2025 target location ÷ UMP 2025 study location)
  = converted component value per ha
  → sum components within a service category per study
  → median of non-zero study category totals = category coefficient
  → area × category coefficient = category value
  → total coefficient = sum of the three category medians
  → area × total coefficient = total value
```

This chain was verified against all nine summary sheets for Provinsi Aceh. Observed differences are below Rp 0.05 per hectare and are explained by the workbook's cached rounding (see §11).

---

## 2. Sheet inventory

The 46 sheets fall into seven groups.

### 2.1 Calculator

| # | Sheet | Range | Role |
|---|---|---|---|
| 1 | `Otomatisasi Perhitungan Valek` | UI area | Main calculator. Inputs `D7`, `D8`, `D13`–`D15`; output `D16`. Title: “OTOMATISASI PERHITUNGAN VALUASI EKONOMI LINGKUNGAN HIDUP TERHADAP BERBAGAI TIPE EKOSISTEM PADA KAWASAN LINDUNG DAN KAWASAN BERFUNGSI LINDUNG”. |

### 2.2 Benefit-transfer database

| # | Sheet | Range | Role |
|---|---|---|---|
| 2 | `Database Transfer Benefit` | `A1:Q551`; filter `A1:Q476` | 475 component rows from 62 studies. Columns: study, ecosystem, service, component, method, total at study year, 2025 totals, per-ha values, unit, source, year, abstract. |
| 42 | `Yang Belum masuk database trans` | `A1:Q375`; filter `A1:Q312` | 311 component rows of studies **not yet included** in the transfer database. Not used by the calculator. |
| 43 | `Database Jenis Jasa Lingkungan` | `A1:M430` | 429 rows of component descriptions, approaches, values and sources. Supporting catalogue; not the calculator's coefficient source. |

### 2.3 Nine ecosystem workbooks

Each ecosystem has four linked sheets:

1. `… Pivot Table Nilai Satuan` — pivot of per-ha values per study/component.
2. `… BT Nilai Konversi Satuan` — raw pivot value, study UMP, target UMP, converted value.
3. `… Rangkuman Nilai Konversi` — layout of converted values by study and category.
4. `… Rangkuman Nilai Jasa Lingkungan` — descriptive statistics (mean, median, standard deviation) and the coefficients used by the calculator.

| Ecosystem | Pivot | BT conversion | Rangkuman konversi | Rangkuman jasa |
|---|---|---|---|---|
| Danau | 3 | 4 | 5 | 6 |
| Hutan | 7 | 8 | 9 | 10 |
| Padang Lamun | 11 | 12 | 13 | 14 |
| Terumbu Karang | 15 | 16 | 17 | 18 (`Sheet11`) |
| Sungai | 19 | 20 | 21 | 22 |
| Karst | 23 | 24 | 25 | 26 |
| Gambut | 27 | 28 | 29 | 30 |
| Lahan Basah | 31 | 32 | 33 | 34 |
| Mangrove | 35 | 36 | 37 | 38 |

There are **9 pivot tables**. Several sheet names are truncated at Excel's 31-character limit (for example `Padang Lamun Rangkuman Nilai Ja`). The Terumbu Karang summary sheet is named `Sheet11`, not a descriptive name.

### 2.4 UMP data

| # | Sheet | Range | Role |
|---|---|---|---|
| 39 | `Database UMP Transfer Benefit` | `A1:V158`; 62 records | Study title, study year, study region, 2025 UMP for that region. All 62 studies in the transfer database have a match. |
| 40 | `Database UMP 2025` | `A1:D998`; 566 records | 2025 UMP reference table: 38 provinces, 525 kabupaten/kota, and 3 locations written without a `Kabupaten`/`Kota` prefix (`Kotabaru`, `Kotawaringin Barat pangkalan bun`, `Kotawaringin Timur Sampit, Sanggata`). |

The 566-row table is the source for input `D14` and for the target-location UMP. Values are 2025 UMP levels, not study-year UMP levels.

### 2.5 Alternative 2025 calculation

| # | Sheet | Range | Role |
|---|---|---|---|
| 41 | `Perhitungan Nilai 2025` | `A1:L988` | 987 rows showing two alternative 2025 conversions. It is **not** the sheet used by the per-ecosystem BT conversions. See §7. |

### 2.6 Classification and descriptions

| # | Sheet | Range | Role |
|---|---|---|---|
| 45 | `Ekosistem pada Kawasan Lindung ` (trailing space) | `B4:X25` | 23 kawasan columns × 4 possible-ecosystem rows. Also a short ecosystem list at `B17:B18` used by the stale `D8` validation. |
| 46 | `Karakteristik Ekosistem` | `A1:G12` | Ecosystem descriptions: No, Ekosistem, Deskripsi, Karakteristik, Fungsi, Rangkuman, Gambar (images). |

### 2.7 Legacy interface

| # | Sheet | Range | Role |
|---|---|---|---|
| 44 | `Copy of Graphical User Interfac` | `A1:Z1000` | Old practice interface. Not referenced by the calculator and not a source of rules. |

---

## 3. Named ranges and data validation

### 3.1 Defined names

The workbook defines `KL_1` … `KL_23`, each covering one kawasan column in `'Ekosistem pada Kawasan Lindung '!$B$4:$X$11`.

| Name | Column | Kawasan |
|---|---|---|
| KL_1 | B | Kawasan Hutan Lindung |
| KL_2 | C | Kawasan Lindung gambut |
| KL_3 | D | Kawasan Resapan Air |
| KL_4 | E | Sempadan Pantai |
| KL_5 | F | Sempadan Sungai |
| KL_6 | G | Kawasan Sekitar Danau atau Waduk |
| KL_7 | H | Suaka Margasatwa dan Suaka Margasatwa laut |
| KL_8 | I | Cagar Alam dan Cagar Alam Laut |
| KL_9 | J | Kawasan pantai Berhutan Bakau |
| KL_10 | K | Taman Nasional dan Taman Nasional Laut |
| KL_11 | L | Taman Hutan raya |
| KL_12 | M | Taman Wisata Alam dan taman Wisata Alam Laut |
| KL_13 | N | Kawasan Cagar Budaya dan Ilmu Pengetahuan |
| KL_14 | O | Kawasan Cagar Alam Geologi |
| KL_15 | P | Kawasan Imbuhan Air tanah |
| KL_16 | Q | Sempadan Mata Air |
| KL_17 | R | Kawasan Perlindungan Plasma Nutfah |
| KL_18 | S | Kawasan Pengungsian Satwa |
| KL_19 | T | Terumbu Karang |
| KL_20 | U | Kawasan Konservasi Pesisir dan Pulau-Pulau Kecil |
| KL_21 | V | Kawasan Konservasi Maritim |
| KL_22 | W | Kawasan Konservasi Perairan |
| KL_23 | X | Kawasan Koridor Bagi Jenis Satwa dan Biota Laut yang Dilindungi |

Two hidden filter names also exist for sheets 2 and 42. No other named ranges were found.

### 3.2 Data validation on the calculator

| Cell | Validation | Finding |
|---|---|---|
| `D7` | Inline list of 23 kawasan names | Matches the 23 columns. |
| `D8` | List `'Ekosistem pada Kawasan Lindung '!$B$17:$B$25` | **Stale/incorrect.** That range contains only `Hutan` and `Lahan Basah`. The `D16` formula supports 9 ecosystems, and the nine summary sheets exist. The workbook's dropdown therefore does not expose all supported ecosystems. |
| `D13` | List `"Cultural,Provisioning,Regulating,Total"` | Matches the formula. |
| `D14` | List `'Database UMP 2025'!$B$5:$B$570` | Matches the 566 locations. |
| `D15` | No data validation | Area is free input. |

The web application uses the full nine-ecosystem list supported by the formula and documents the stale validation. It does not silently inherit the broken two-item dropdown.

---

## 4. Calculator formula and behaviour

### 4.1 `D16` output

`D16` is a nested `IFERROR(IF(AND(ecosystem=…, service=…), area×summary!C17/C18/C19/C20, …))`. It selects:

- `C17` = Cultural median
- `C18` = Provisioning median
- `C19` = Regulating median
- `C20` = sum of the three medians

Important observations:

- **`D7` (kawasan type) is not referenced in `D16`.** Kawasan selection changes only the displayed context; it does not change the coefficient or the result.
- **`D8` is the only ecosystem selector used in valuation.**
- **`D14` changes the target UMP**, which recalculates the BT conversion columns and therefore the summary medians.
- The same ecosystem/service mapping exists in all nine branches. `Mangrove` appears first, then Danau, Hutan, Padang Lamun, Sungai, Terumbu Karang, Karst, Gambut, Lahan Basah; branch order has no valuation effect.
- If no branch matches, the formula returns `"Pilih Ekosistem"`; errors are wrapped by `IFERROR(...,"Tidak ada data")`.

### 4.2 Example cached in the workbook

| Input | Value |
|---|---|
| `D7` | Kawasan Hutan Lindung |
| `D8` | Hutan |
| `D13` | Total |
| `D14` | Provinsi Aceh |
| `D15` | 145,290 ha |
| `D16` | 3,326,415,089,133.00 |

This is the primary regression case used by the application tests.

---

## 5. BT conversion sheets

For each ecosystem, the BT sheet has one pair of columns per study:

- **Raw column** (`C`, `E`, `G`, …) = a cell from the ecosystem pivot table.
- **Converted column** (`D`, `F`, `H`, …) = raw × target UMP ÷ study UMP.

Formula pattern (Hutan example):

```
D20 = C20 * $D$5 / $D$4
C4  = VLOOKUP(C8, 'Database UMP Transfer Benefit'!$B$4:$E$66, 3, 0)  → study region name
D4  = VLOOKUP(C8, 'Database UMP Transfer Benefit'!$B$4:$E$66, 4, 0)  → study region UMP
C5  = VLOOKUP('Otomatisasi Perhitungan Valek'!$D$14, 'Database UMP 2025'!$B$5:$C$570, 1, 0)
D5  = VLOOKUP('Otomatisasi Perhitungan Valek'!$D$14, 'Database UMP 2025'!$B$5:$C$570, 2, 0)  → target UMP
```

Thus the raw pivot value is already a 2025 per-hectare value; the BT sheet applies only the **spatial UMP ratio**, not another time adjustment.

The category total rows in the BT sheet reference the pivot table's category-total cells, for example:

```
C17 = 'Hutan Pivot Table Nilai Satuan'!C12   (Cultural Total)
C56 = 'Hutan Pivot Table Nilai Satuan'!C51   (Provisioning Total)
C60 = 'Hutan Pivot Table Nilai Satuan'!C55   (Regulating Total)
C61 = 'Hutan Pivot Table Nilai Satuan'!C56   (Grand Total)
```

The web engine reconstructs these totals by summing all component rows of the same study and service from the database. This produced the same values as the cached workbook summaries for all nine ecosystems.

---

## 6. Summary statistics and coefficient rule

On each `Rangkuman Nilai Jasa Lingkungan` sheet, rows 9–12 hold the converted category totals per study, and rows 16–20 hold statistics.

Exact formulas (Hutan example):

```
B17 = IFERROR(AVERAGE(IF(B9:I9<>0,B9:I9)),"Tidak ada data")          → mean Cultural
C17 = IFERROR(MEDIAN(IF(B9:I9<>0,B9:I9)),"Tidak ada data")           → median Cultural
D17 = IFERROR(STDEV(IF(B9:I9<>0,B9:I9)),"Tidak ada data")            → stdev Cultural
C18 = IFERROR(MEDIAN(IF(B10:I10<>0,B10:I10)),"Tidak ada data")       → median Provisioning
C19 = IFERROR(MEDIAN(IF(B11:I11<>0,B11:I11)),"Tidak ada data")       → median Regulating
C20 = IFERROR(SUM(IF(C17:C19<>0,C17:C19)),"Tidak ada data")          → total coefficient
```

Consequences:

- The median sample **excludes zero and blank cells** (`<>0`).
- A category with no data is text (`"Tidak ada data"`), not zero. `SUM` ignores it, so `C20` equals the sum of available medians.
- `C20` is **not** the median of the per-study Grand Total. It is the sum of the three category medians. This can differ materially from the median of totals.
- Mean and standard deviation are present but are not used by the calculator.

The nine summary sheets currently show (Provinsi Aceh selected):

| Ecosystem | Cultural | Provisioning | Regulating | Total |
|---|---:|---:|---:|---:|
| Hutan | 14,514,491.54 | 4,542,534.272 | 3,837,977.897 | 22,895,003.71 |
| Mangrove | 9,225,534.138 | 78,277,685.36 | 26,107,208.91 | 113,610,428.4 |
| Danau | 1,153,523.56 | 32,696,942.12 | Tidak ada data | 33,850,465.68 |
| Sungai | 248,426.3938 | 15,192,655.32 | 11,216,771.31 | 26,657,853.02 |
| Terumbu Karang | 192,437,490.1 | 153,960,820.4 | 180,749,484.8 | 527,147,795.3 |
| Karst | 5,955,462.71 | 251,316,836.5 | 5,036,083.002 | 262,308,382.2 |
| Gambut | 7,218,372.18 | 6,089,111.51 | 74,529,206.6 | 87,836,690.29 |
| Padang Lamun | 202,097,833.1 | 406,205,780.3 | 5,760,750.064 | 614,064,363.5 |
| Lahan Basah | Tidak ada data | Tidak ada data | 14,270,895.48 | 14,270,895.48 |

Values above are copied from the cached cells and displayed at the workbook's precision. They are not alternative estimates.

---

## 7. `Perhitungan Nilai 2025` (alternative sheet)

This sheet is a flat table with columns:

`NO`, `SUMBERDAYA ALAM`, `NILAI TOTAL`, `NILAI TOTAL 2025`, `NILAI TOTAL 2025 (RUMUS)`, `NILAI SATUAN`, `NILAI SATUAN 2025`, `NILAI SATUAN 2025 (RUMUS)`, `TAHUN`, `Selisih dengan tahun 2025`, `Suku Bunga Bank BI Rate Oktober 2025`, `ABSTRAKSI`.

Formulas (row 2 pattern):

```
E2 = C2 * (1+K2)^J2          → compound-interest total
G2 = F2 * $D$2/$C$2          → alternative 2025 per-ha (ratio anchored to row 2)
H2 = F2 * (1+K2)^J2          → compound-interest per-ha
J2 = 2025 - I2
K2 = 0.0475
```

The workbook also contains comments citing an online inflation calculator and describing the method as “compound dan penyesuai daya beli”. The **calculator itself does not use columns E/G/H of this sheet**. It uses the per-ecosystem pivot values, converted by the UMP ratio. `Perhitungan Nilai 2025` is therefore an alternative/reference calculation, not the production path.

The `G` formula's use of `$D$2/$C$2` for every row is noteworthy: it anchors the ratio to the first record, not to each row's own study year/location. This sheet should not be treated as a general per-row conversion formula.

---

## 8. Transfer database reconstruction

The `Database Transfer Benefit` sheet is the authoritative component-level source. Extraction found:

- **62 unique studies** (study title repeats on every component row).
- **475 component rows**.
- **9 ecosystems**: Hutan 8 studies, Terumbu Karang 6, Mangrove 23, Padang Lamun 2, Danau 6, Sungai 9, Karst 4, Gambut 3, Lahan Basah 1.
- **3 service labels**: `Provisioning` (306 rows), `Cultural` (116), `Regulating` (53).
- **222 distinct component labels**, with many repeats across studies.
- All 62 studies have a matching `Database UMP Transfer Benefit` record (case-insensitive title match).
- Study year and source are present only on the first component row of each study in some cases; the extractor forward-fills them.

Column `M` (`NILAI SATUAN 2025 (RUMUS)`) is the base per-ha value used by the pivot/BT/summary chain. Column `K` (`NILAI SATUAN`) is the value at the study year. Column `L` (`NILAI SATUAN 2025`) is a different cached value and is **not** the one used by the BT sheets.

The extraction script (`tools/extract-workbook.mjs`) preserves all component rows, including rows with `null` or `0` base values, and records the original unit string.

---

## 9. UMP and price-level handling

- The target location can be any of the 566 names in `Database UMP 2025`.
- The study location is the `Daerah` column in `Database UMP Transfer Benefit`.
- The conversion uses **2025 UMP for both sides**, even when the study year is much earlier. There is no study-year UMP lookup in the BT sheets.
- The compound factor to 2025 is already embedded in the pivot's per-ha value. The exact factor is not recomputed by the calculator.
- The BI rate is hard-coded as `0.0475` in `Perhitungan Nilai 2025` column K and described as “Suku Bunga Bank BI Rate Oktober 2025”.
- UMP values are stored as numbers with Indonesian formatting; extraction converts them to numeric values.

This is a **purchasing-power / wage-ratio** adjustment, not a full regional price index and not a formal benefit-transfer transfer function.

---

## 10. Classification table

The sheet `Ekosistem pada Kawasan Lindung ` (note trailing space) is laid out as:

- Header row 4, columns B–X: 23 kawasan types.
- Rows 5–8, columns B–X: up to four ecosystems per kawasan.
- Row 16 onward: a separate short ecosystem list (`Hutan`, `Lahan Basah`).

The table is informational for the dropdown; `D16` does not reference it and `D8` validation does not use it. The web application treats the table as the identification rule set, but clearly labels that the workbook itself does not enforce compatibility in the calculator. Full mapping is in `docs/classification-rules.md`.

**There is no rule for non-kawasan lindung.** No sheet defines a non-protected-area status, coefficient, or lookup. The application therefore does not value non-KL records.

---

## 11. Verification against the workbook

The engine was compared with all nine summary sheets using Provinsi Aceh (`UMP 2025 = 3,685,616`).

| Check | Result |
|---|---|
| All 9 ecosystems × 3 category medians | Match within Rp 0.05 per ha (workbook cells are cached at limited precision). |
| All 9 total coefficients | Match within Rp 0.05 per ha. |
| Missing categories (Danau Regulating, Lahan Basah Cultural/Provisioning) | Reproduced as `null`, not zero. |
| Hutan Total, 145,290 ha | Engine `3,326,415,089,133.48`; workbook `3,326,415,089,133.00`. Difference **Rp 0.48** = `1.4 × 10⁻¹³` relative, caused by the workbook's rounded cached medians. |
| Study-to-UMP joins | 62/62 matched. |
| Classification mapping | 23/23 kawasan parsed; 9 ecosystems represented. |

The automated suite contains 58 tests covering coefficients, calculator arithmetic, classification, validation, portfolio reconciliation, and CSV export. All pass.

### Discrepancy log

1. **Workbook rounding vs full precision.** Coefficients cached at limited precision produce a Rp 0.48 difference on a Rp 3.3 trillion example. The application keeps full precision and displays rounded values. No methodological difference.
2. **Stale `D8` validation.** Workbook dropdown offers only Hutan/Lahan Basah although the formula supports nine ecosystems. The application uses nine and documents the defect.
3. **Kawasan type not used in valuation.** `D7` is context only. The application does not imply that kawasan type changes the coefficient.
4. **Compound inconsistency in some rows.** In Gambut, the Merang study's second regulating component is cached with a factor of about 1.3458, while the first is about 1.5906 for a 2015 study. The application uses the cached 2025 column as-is, matching the calculator.
5. **Non-per-ha units.** Several components are labelled per KK, per kg, per batang, etc., but the workbook divides total value by study area. The application preserves these values and surfaces the original unit.
6. **Alternative 2025 method not used.** `Perhitungan Nilai 2025` columns G/H are not the calculator path; using them would produce different numbers.

---

## 12. GIS assessment

**No GIS is required to reproduce the workbook.** The workbook contains:

- no coordinates, geometry, shapefiles, or spatial joins;
- no distance/buffer/overlay operations;
- no lookup of protected status from location names;
- no provincial area table.

The only location logic is a text lookup of a UMP value. Any map or boundary overlay would require an external authoritative dataset, which is out of scope and is not silently substituted.

---

## 13. Missing information and unresolved questions

These are recorded so that future maintainers do not mistake them for validated facts:

1. **Provincial ecosystem areas** are not in the workbook. A true provincial total cannot be produced without an external area dataset.
2. **The reason for using 2025 UMP for earlier studies** is not stated. It is the workbook's method, not necessarily a recommended one.
3. **The exact construction of `NILAI SATUAN 2025` vs `NILAI SATUAN 2025 (RUMUS)`** in the database is not documented. The calculator uses column M.
4. **Why `D8` validation points to a two-item range** is unknown; likely a leftover from an earlier version.
5. **Whether the 311 “Yang Belum masuk database trans” rows should eventually be included** is a data-governance decision. They are excluded here to match the current workbook.
6. **Component-level unit validity** is not assessed. Some units are clearly not per hectare.
7. **No uncertainty intervals** are provided by the workbook. Mean and standard deviation exist but are not used.
8. **No update date** is attached to the 2025 UMP table beyond the sheet title.

---

## 14. Reproduction

```bash
# Inspect the workbook and regenerate the typed reference dataset
npm run data:extract

# Verify the engine against workbook fixtures
npm test

# Type-check and build
npm run typecheck
npm run build
```

The extractor reads the workbook in the repository root. If the file name changes, pass the path as an argument:

```bash
node tools/extract-workbook.mjs "path/to/workbook.xlsx"
```

Output: `src/data/reference.json` plus the metadata embedded in `meta`.

---

## 15. Files produced by the audit

- `docs/workbook-audit.md` (this file)
- `docs/valuation-methodology.md`
- `docs/data-dictionary.md`
- `docs/classification-rules.md`
- `docs/implementation-plan.md`
- `src/data/reference.json` (generated)
- `tools/extract-workbook.mjs` (extractor)
- `tests/valuation.test.ts` (regression fixtures)
