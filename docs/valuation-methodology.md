# Valuation Methodology

**Engine version:** `bt-ump-median-1.0.0`
**Dataset version:** `workbook-2025.1`
**Price year:** 2025
**Source:** `Perhitungan Valuasi Ekonomi Lingkungan Hidup.xlsx`
**Status:** reproduces the workbook's calculator; not an independent valuation study.

---

## 1. Purpose and scope

The engine estimates the annual economic value of ecosystem services for a user-specified area of a given ecosystem type. It is a **benefit-transfer** engine: it transfers per-hectare values from published/reference studies to a target location, then multiplies by area.

It covers:

- nine ecosystems: Hutan, Mangrove, Danau, Sungai, Terumbu Karang, Gambut, Karst, Padang Lamun, Lahan Basah;
- three service categories: Cultural, Provisioning, Regulating;
- a Total that is the sum of the three category coefficients;
- 566 target locations with 2025 UMP values.

It does **not** cover:

- non-kawasan lindung valuation;
- site-specific primary valuation;
- spatial analysis or boundary verification;
- provincial area inventories;
- uncertainty intervals or significance tests.

---

## 2. Notation

| Symbol | Meaning |
|---|---|
| `b[s,c]` | Workbook `NILAI SATUAN 2025 (RUMUS)` for study `s`, component `c`, Rp/ha/year |
| `U_target` | 2025 UMP of the target location, Rp/month |
| `U_s` | 2025 UMP of study `s`'s region, Rp/month |
| `r_s` | `U_target / U_s` |
| `T[s,k]` | Category total for study `s`, category `k`, Rp/ha/year |
| `K[k]` | Coefficient for category `k`, Rp/ha/year |
| `A` | Area, hectares |
| `V[k]` | Value for category `k`, Rp/year |
| `V_total` | Total value, Rp/year |

`k ∈ {Cultural, Provisioning, Regulating}`.

---

## 3. Calculation order

The order matters. The workbook applies it in this sequence:

1. **Take the 2025 per-hectare base.** `b[s,c]` already contains the time adjustment to 2025. Do not apply the compound factor again.
2. **Apply the spatial UMP ratio.** `b[s,c] × U_target / U_s`.
3. **Sum components into category totals per study.** `T[s,k] = Σ b[s,c] × r_s` over components `c` in category `k`.
4. **Take the median of non-zero study totals.** `K[k] = median({T[s,k] : T[s,k] ≠ 0})`.
5. **Multiply by area.** `V[k] = A × K[k]`.
6. **Total coefficient.** `K_total = K[Cultural] + K[Provisioning] + K[Regulating]`, using only available categories.
7. **Total value.** `V_total = A × K_total = V[Cultural] + V[Provisioning] + V[Regulating]` (available categories only).

### 3.1 Why the base is not re-inflated

The workbook's `NILAI SATUAN 2025 (RUMUS)` column already contains a compound adjustment using 4.75% per year (BI Rate October 2025, as recorded in the workbook). Applying it again would produce values that do not reconcile with the workbook.

The audit found that some rows' cached factors are not exactly `1.0475^(2025 − year)`. The engine deliberately uses the cached column M value, not a recomputation, so that it matches the workbook. This is a fidelity choice, not a claim that the cached factors are correct.

---

## 4. UMP adjustment

The only regional adjustment is:

```
r_s = UMP 2025 target location / UMP 2025 study location
```

Properties:

- Both UMP values are 2025 values.
- The study year does not affect the UMP lookup.
- The ratio is applied to every component of the study, including components whose original unit is not per hectare.
- The ratio is not a full price index; it only reflects the minimum-wage level.

The workbook's target UMP comes from `Database UMP 2025`; the study UMP comes from `Database UMP Transfer Benefit`. All 62 studies have a UMP match.

---

## 5. Median rule

For each ecosystem and category, the engine builds a sample of **study-level category totals**. It excludes:

- studies with no components in the category (`null`);
- category totals equal to zero.

It does **not** exclude negative values (none were found in the dataset). It sorts ascending and takes:

- the middle value for an odd sample;
- the average of the two middle values for an even sample.

The coefficient is therefore a median of study totals, not a median of component values and not a weighted average.

### 5.1 Missing versus zero

The workbook distinguishes:

- `"Tidak ada data"` — no usable study/component; coefficient is missing.
- `0` — a study/component exists but the value is zero; excluded from the median sample.

The engine models missing as `null` and zero as `0`. In the UI:

- missing categories show **Tidak tersedia** and are excluded from the total;
- zero coefficients show **Nilai nol** and are not treated as missing.

A category with no data does not contribute `0` to the total; it is simply omitted. This matches `C20 = SUM(IF(C17:C19<>0,C17:C19))`.

---

## 6. Total coefficient

The Total is **not** the median of per-study grand totals. It is:

```
K_total = K_Cultural + K_Provisioning + K_Regulating
```

This is a deliberate workbook rule (cell `C20` on each summary sheet). It can differ from the median of grand totals, sometimes substantially. The application labels this explicitly.

If one category is missing, the Total is the sum of the remaining categories. If all are missing, the Total is missing.

---

## 7. Worked example — Hutan, Total, Aceh, 145,290 ha

Inputs:

- Ecosystem: Hutan
- Service: Total
- Target: Provinsi Aceh, UMP 2025 = Rp 3,685,616
- Area: 145,290 ha

Workbook coefficients for Aceh:

| Category | Median (Rp/ha/year) | n studies |
|---|---:|---:|
| Cultural | 14,514,491.54 | 5 |
| Provisioning | 4,542,534.272 | 7 |
| Regulating | 3,837,977.897 | 3 |
| **Total** | **22,895,003.71** | — |

Calculation:

```
K_total = 14,514,491.541384 + 4,542,534.272310 + 3,837,977.897046
        = 22,895,003.710740 Rp/ha/year

V_total = 145,290 ha × 22,895,003.710740 Rp/ha/year
        = 3,326,415,089,133.48 Rp/year
```

Engine result with full precision: **Rp 3,326,415,089,133.48**.

Difference from the workbook's cached `D16`: **Rp 0.48**, or about `1.4 × 10⁻¹³` relative. Cause: the workbook caches medians at limited precision before multiplying. The engine keeps full precision and rounds only for display. This is documented in `docs/workbook-audit.md` §11.

---

## 8. Worked example — Danau, Total, Aceh

Danau has no Regulating data.

| Category | Median (Rp/ha/year) | n |
|---|---:|---:|
| Cultural | 1,153,523.56 | 4 |
| Provisioning | 32,696,942.12 | 5 |
| Regulating | missing | 0 |
| **Total** | **33,850,465.68** | — |

For 1,000 ha:

```
Cultural     = 1,153,523,560 Rp/year
Provisioning = 32,696,942,120 Rp/year
Regulating   = tidak tersedia (not zero)
Total        = 33,850,465,680 Rp/year
```

The missing Regulating value is not shown as Rp 0 and does not add zero to the total; it is omitted, which happens to leave the same arithmetic result as adding zero, but the distinction is displayed to the user.

---

## 9. Portfolio aggregation

A portfolio record represents one area of one ecosystem at one UMP location. It is valued across all three service categories to avoid double counting.

```
record total = area × K_total(location, ecosystem)
```

Province totals sum records whose `province` field matches. The application does **not** infer province from a kabupaten/kota name; the user supplies the province for aggregation. If the location itself is a province, the UI seeds the province field with that name.

### 9.1 Non-kawasan lindung

Records may carry status:

- `KL` — kawasan lindung/berfungsi lindung;
- `NON_KL` — non-kawasan lindung;
- `UNKNOWN` — not determined.

Only `KL` records are valued. `NON_KL` and `UNKNOWN` records contribute area and record counts but not value. Reason: the workbook supplies no coefficients or rule for non-KL. Valuing them with KL coefficients would be an extension, not a reproduction.

### 9.2 Double counting

- One record values all categories, so users do not create separate Cultural/Provisioning/Regulating records for the same area.
- The application does not detect overlapping polygons or duplicate areas. Users must avoid entering the same area twice.
- A user could still create two records for the same physical area under different labels. The app does not silently merge them.

---

## 10. Rounding and display

- Calculations use double-precision floating point.
- Currency is displayed with `Intl.NumberFormat('id-ID')`, zero decimals for totals and two decimals for coefficients where useful.
- Area is displayed with up to two decimals.
- CSV and Excel exports contain full numeric values (not formatted strings), except textual labels.
- Tests compare at tolerances appropriate to the workbook's cached precision.

---

## 11. Validation

The test suite (`tests/valuation.test.ts`) covers:

1. **All nine ecosystems × three categories** against cached workbook medians for Aceh.
2. **Total coefficient** as the sum of medians.
3. **Missing categories** (Danau, Lahan Basah) as `null`.
4. **Workbook example** 145,290 ha Hutan Total.
5. **Zero area** and linear scaling.
6. **UMP ratio** against a second province.
7. **Odd/even medians.**
8. **Study with only Regulating data** (Lahan Basah).
9. **Portfolio reconciliation** with KL/non-KL/unknown statuses.
10. **Unknown location** handling.

Result: 58 tests pass across valuation, classification, validation, and export.

### 11.1 Known discrepancies

| Item | Difference | Resolution |
|---|---|---|
| Hutan Total 145,290 ha | Rp 0.48 on Rp 3.326 T | Workbook cached rounding; explained and accepted. |
| Gambut regulating median | Reproduced exactly when using column M; not reproduced if re-inflating from raw year | Engine uses column M, matching workbook. |
| D8 dropdown | Only 2 options in workbook | App uses 9 supported by formula; documented. |
| Units | Some components are not per ha | Preserved as workbook; flagged in UI/reference. |

---

## 12. Assumptions and limitations

1. **Benefit transfer is an approximation.** Values are transferred from other sites and years; they are not site-specific measurements.
2. **UMP is a crude spatial deflator.** It does not capture regional differences in land, food, energy, or ecosystem-service prices.
3. **The 2025 base values are taken as given.** The engine does not audit or correct the workbook's compound factors.
4. **The median is unweighted.** A study covering a large area has the same influence as a small study.
5. **No confidence interval.** The workbook's mean and standard deviation are not used; no interval is reported.
6. **No spatial validation.** The app cannot confirm that an area is legally a kawasan lindung.
7. **No non-KL coefficients.** Non-KL records are not valued.
8. **No provincial area inventory.** Totals require user-entered areas.
9. **Data are static.** UMP and studies are not refreshed automatically.
10. **Units are preserved, not harmonized.** Some source units are not per hectare; this can bias coefficients.
11. **Total is sum of medians, not median of totals.** This is a workbook convention and can differ from a more conventional aggregate.
12. **Zero vs missing matters.** The UI distinguishes them, but downstream users of the CSV should also preserve the distinction.

---

## 13. Versioning and change control

The reference dataset is versioned independently from the application:

- **Dataset version:** `workbook-2025.1`
- **Engine version:** `bt-ump-median-1.0.0`
- **Workbook hash:** `1d30931b10ffec1e` (first 16 hex characters of SHA-256)

If the workbook changes:

1. replace the workbook file;
2. run `npm run data:extract`;
3. run `npm test`;
4. review the diff in `src/data/reference.json` and update expected fixtures only after explaining differences;
5. bump the dataset version and document the change;
6. rebuild and redeploy.

No coefficient should be edited by hand in the JSON. All values must come from the extractor.

---

## 14. Reproduction commands

```bash
npm run data:extract   # regenerate reference.json from the workbook
npm test               # 58 regression/unit tests
npm run typecheck      # strict TypeScript
npm run build          # production build
npm run preview        # local preview of dist
```

---

## 15. Related documents

- `docs/workbook-audit.md` — full workbook inventory and formula audit.
- `docs/classification-rules.md` — kawasan-to-ecosystem mapping and limitations.
- `docs/data-dictionary.md` — field definitions and provenance.
- `docs/implementation-plan.md` — architecture, phases, and test plan.
