# Classification Rules

**Source sheet:** `Ekosistem pada Kawasan Lindung ` (trailing space)
**Source range:** `B4:X25`
**Extracted records:** 23 kawasan types, 9 ecosystems
**Engine module:** `src/lib/classification/rules.ts`

---

## 1. What the workbook actually provides

The workbook provides a **two-dimensional lookup table**:

- columns B–X = kawasan lindung/berfungsi lindung types;
- rows 5–8 = up to four ecosystems that may occur in that kawasan.

It does **not** provide:

- spatial boundaries or coordinates;
- a rule that derives kawasan status from province, place name, or coordinates;
- a rule for non-kawasan lindung;
- a rule that selects an ecosystem from biophysical measurements;
- a rule that validates whether an observed ecosystem is legally permissible.

The table is therefore an **identification aid**, not a spatial classifier.

### 1.1 Important workbook inconsistency

The calculator's `D8` data validation points to `B17:B25`, which contains only:

- Hutan
- Lahan Basah

The `D16` formula, however, supports nine ecosystems and the workbook contains nine summary sheets. The two-item validation is stale. The web application uses all nine ecosystems supported by the formula and documents this defect rather than inheriting it.

### 1.2 Kawasan type does not affect valuation

`D7` (kawasan type) is not referenced by `D16`. Changing it does not change the coefficient or the result. In the web application:

- kawasan type is used on the Identification page to constrain the compatible ecosystem list;
- it is stored as context on portfolio records;
- it does not alter valuation.

The Calculator page permits any of the nine ecosystems, matching the workbook's actual formula.

---

## 2. Full mapping table

The table below is generated from the workbook. Order is preserved.

| ID | Kawasan lindung / berfungsi lindung | Ekosistem yang tercantum |
|---|---|---|
| kl01 | Kawasan Hutan Lindung | Hutan, Lahan Basah |
| kl02 | Kawasan Lindung gambut | Gambut, Lahan Basah |
| kl03 | Kawasan Resapan Air | Hutan, Lahan Basah |
| kl04 | Sempadan Pantai | Mangrove, Padang Lamun, Terumbu Karang |
| kl05 | Sempadan Sungai | Sungai, Lahan Basah, Hutan |
| kl06 | Kawasan Sekitar Danau atau Waduk | Danau, Lahan Basah, Hutan |
| kl07 | Suaka Margasatwa dan Suaka Margasatwa laut | Hutan, Sungai, Danau, Mangrove, Terumbu Karang, Padang Lamun |
| kl08 | Cagar Alam dan Cagar Alam Laut | Hutan, Sungai, Danau, Mangrove, Terumbu Karang, Padang Lamun |
| kl09 | Kawasan pantai Berhutan Bakau | Mangrove |
| kl10 | Taman Nasional dan Taman Nasional Laut | Hutan, Sungai, Danau, Terumbu Karang, Mangrove, Padang Lamun, Lahan Basah |
| kl11 | Taman Hutan raya | Hutan, Lahan Basah |
| kl12 | Taman Wisata Alam dan taman Wisata Alam Laut | Hutan, Sungai, Danau, Mangrove, Terumbu Karang, Padang Lamun |
| kl13 | Kawasan Cagar Budaya dan Ilmu Pengetahuan | Hutan, Sungai, Lahan Basah |
| kl14 | Kawasan Cagar Alam Geologi | Karst, Hutan, Lahan Basah |
| kl15 | Kawasan Imbuhan Air tanah | Hutan, Karst, Lahan Basah |
| kl16 | Sempadan Mata Air | Lahan Basah, Hutan |
| kl17 | Kawasan Perlindungan Plasma Nutfah | Hutan, Lahan Basah, Sungai |
| kl18 | Kawasan Pengungsian Satwa | Hutan, Sungai, Danau, Lahan Basah |
| kl19 | Terumbu Karang | Terumbu Karang, Padang Lamun, Mangrove |
| kl20 | Kawasan Konservasi Pesisir dan Pulau-Pulau Kecil | Mangrove, Terumbu Karang, Padang Lamun, Hutan |
| kl21 | Kawasan Konservasi Maritim | Terumbu Karang, Padang Lamun, Mangrove |
| kl22 | Kawasan Konservasi Perairan | Terumbu Karang, Padang Lamun, Mangrove, Sungai |
| kl23 | Kawasan Koridor Bagi Jenis Satwa dan Biota Laut yang Dilindungi | Hutan, Mangrove, Sungai, Padang Lamun, Terumbu Karang |

### 2.1 Normalization applied

- Leading/trailing spaces removed.
- Repeated spaces collapsed.
- Case canonicalized only for ecosystem names, to map variants such as `Padang lamun` → `Padang Lamun` and `Lahan basah` → `Lahan Basah`.
- Order preserved; duplicates removed within a column.
- No kawasan column was dropped.
- No ecosystem was added.

---

## 3. Identification algorithm

The application exposes a transparent two-step form:

1. **Select kawasan type.** The user chooses one of the 23 types. This is an input, not an inference.
2. **Select ecosystem.** The form offers only the ecosystems listed for that kawasan. The user chooses the one observed in the field.

The engine returns one of three statuses:

| Status | Meaning | UI treatment |
|---|---|---|
| `supported` | Selected ecosystem appears in the kawasan's list. | Green “Ekosistem sesuai tabel”. |
| `incompatible` | Selected ecosystem is not in the kawasan's list. | Amber “Ekosistem tidak sesuai”; lists compatible options. |
| `unsupported` | No kawasan selected, unknown kawasan, or no ecosystem chosen. | Neutral prompt; no classification claim. |

Code:

```ts
identifyEcosystem(kawasanId, ecosystem)
```

Returns:

```ts
{
  status: 'supported' | 'incompatible' | 'unsupported',
  kawasan: Kawasan | null,
  compatible: string[],
  message: string
}
```

The UI always displays:

- the selected kawasan;
- the compatible ecosystem list;
- the source sheet and range;
- the statement that status is user-supplied, not inferred;
- a link to the calculator for the selected ecosystem.

---

## 4. Protected-area status

The workbook has **no** rule that determines whether a location is a kawasan lindung. It does not contain boundaries, spatial joins, or a lookup from administrative names to protection status.

Therefore:

- the application does **not** infer protected status from province/kabupaten names;
- the application does **not** infer protected status from coordinates (it has none);
- the user selects a kawasan type on the Identification page;
- the portfolio record carries `kawasanStatus` (`KL`, `NON_KL`, `UNKNOWN`) supplied by the user;
- the app cannot verify the legal status of an area.

This is a deliberate limitation, not an omission that can be fixed without authoritative spatial data.

---

## 5. Non-kawasan lindung

The workbook contains no non-KL classification table and no non-KL coefficients.

The application therefore:

- allows a record to be marked `NON_KL` or `UNKNOWN`;
- keeps its area and record count for completeness;
- does **not** assign a value;
- displays “Tidak dihitung” and the reason;
- excludes it from value totals, charts, and exports of valued amounts.

This prevents an unsupported transfer of KL coefficients to non-KL areas.

If an authoritative non-KL methodology is later adopted, it must be added as a separate, versioned rule set, not silently merged into the current engine.

---

## 6. Ambiguities and edge cases

### 6.1 Multiple ecosystems in one kawasan

Many kawasan types list several ecosystems. The table does not say which one is present. The user must select based on field observation. The app does not guess.

### 6.2 Same ecosystem under multiple kawasan

An ecosystem can appear under many kawasan types (for example, Mangrove under 15+ types). The app supports reverse lookup (`kawasanForEcosystem`) for reference, but does not use it to infer kawasan status.

### 6.3 Ecosystem not in the list

If the observed ecosystem is not listed for the selected kawasan, the app marks it incompatible. It does not silently add the ecosystem to the table. The user may:

- re-check the kawasan type;
- record the case as unsupported;
- use the calculator directly if they have an authoritative reason to value that ecosystem (the calculator does not enforce compatibility, matching the workbook).

### 6.4 Unknown kawasan

An unknown id yields `unsupported` and an empty compatible list.

### 6.5 Stale dropdown

As noted, the workbook's `D8` dropdown is incomplete. The app uses the formula-supported nine ecosystems. This is a deliberate correction of a UI defect, not a methodological change.

### 6.6 Names with inconsistent capitalization

Canonicalization is limited to whitespace and the known ecosystem aliases. Kawasan names retain the workbook's wording, including `Taman Hutan raya` and `Kawasan pantai Berhutan Bakau`. The app does not “fix” institutional names beyond whitespace.

---

## 7. Why there is no GIS

A GIS classification would require:

- authoritative kawasan boundaries (e.g., national/regional protected-area polygons);
- ecosystem boundaries or land-cover data;
- a spatial join/overlay operation;
- a rule for edge cases (overlaps, enclaves, boundary uncertainty).

The workbook provides none of these. Adding a map from external data would introduce a second, undocumented methodology and could create a false impression of official verification. The app therefore states explicitly that no map is shown and that the dataset has no geometry.

A future GIS extension would need:

1. a citable, versioned boundary dataset;
2. a documented overlay rule;
3. a spatial engine (e.g., Turf.js or a preprocessed intersection table);
4. validation of representative polygons;
5. clear provenance in the UI.

Until then, classification remains user-driven and rule-transparent.

---

## 8. Test coverage

`tests/classification.test.ts` verifies:

- 23 kawasan loaded;
- exact mapping for `kl01`, `kl04`, `kl10`;
- unknown kawasan;
- compatible/incompatible identification;
- missing ecosystem prompt;
- lookup by id and normalized name;
- reverse lookup by ecosystem;
- documented limitations (GIS, non-KL).

All tests pass.

---

## 9. Related documents

- `docs/workbook-audit.md` — source audit and stale-validation finding.
- `docs/valuation-methodology.md` — how classification context relates to valuation.
- `docs/data-dictionary.md` — `kawasan` and ecosystem fields.
- `src/lib/classification/rules.ts` — implementation.
