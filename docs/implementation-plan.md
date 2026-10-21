# Implementation Plan

**Project:** Portal Valuasi Ekonomi Jasa Ekosistem
**Status:** implementation complete; build and tests pass; deployment configuration prepared but optional and not yet published.
**Last updated:** 21 October 2026

---

## 1. Objective

Transform the workbook-based benefit-transfer workflow into a maintainable, transparent, client-side web application that:

- reproduces the workbook's calculator;
- documents the methodology and its limitations;
- supports identification, calculation, portfolio analysis, and export;
- can be published to GitHub Pages;
- does not invent values, rules, or institutional claims.

---

## 2. Guiding constraints

1. **Workbook is authoritative.** All coefficients and classification mappings come from the workbook.
2. **No fabrication.** Missing rules are documented, not guessed.
3. **No GIS claim.** The workbook has no geometry; no map is shown.
4. **Fidelity over improvement.** The engine preserves workbook quirks (including unit inconsistencies and the sum-of-medians total) and documents them.
5. **Static hosting.** No server, database, secrets, or API keys.
6. **Indonesian-first UI.** Technical terms follow the workbook.
7. **Institutional, understated design.** Warm off-white, forest green, charcoal, neutral borders; no gradients, glassmorphism, pills, fake live indicators, or placeholder statistics.

---

## 3. Phases

### Phase 1 — Audit and documentation (completed)

- Located the workbook, inventoried all 46 sheets, formulas, named ranges, validations, pivots, and comments.
- Traced the calculator from `D16` to the nine summary sheets and BT conversions.
- Extracted the 62 studies, 475 components, 566 UMP locations, 23 kawasan types, and 9 ecosystems.
- Verified the calculation chain against all nine summary sheets for Aceh.
- Identified discrepancies (stale `D8` validation, unit inconsistencies, compound-factor inconsistencies, no provincial area data).
- Wrote:
  - `docs/workbook-audit.md`
  - `docs/valuation-methodology.md`
  - `docs/data-dictionary.md`
  - `docs/classification-rules.md`
  - `docs/implementation-plan.md`

### Phase 2 — Typed data model and engine (completed)

- Built `tools/extract-workbook.mjs` to generate `src/data/reference.json`.
- Defined strict TypeScript types in `src/types.ts`.
- Implemented:
  - `src/lib/valuation/engine.ts` — UMP ratio, study category totals, medians, totals, portfolio valuation.
  - `src/lib/classification/rules.ts` — kawasan lookup and identification.
  - `src/lib/validation/inputs.ts` — area/text parsing.
  - `src/lib/portfolio/storage.ts` — localStorage persistence and record creation.
  - `src/lib/export/exporters.ts` — CSV and Excel export.
  - `src/lib/valuation/format.ts` — Indonesian number/currency formatting.

### Phase 3 — Tests and workbook verification (completed)

- 58 Vitest tests across four suites.
- All nine ecosystems × three categories verified against cached workbook medians.
- Hutan Total Aceh 145,290 ha verified against `D16` within explained rounding.
- Classification, validation, portfolio reconciliation, and CSV export covered.
- `npm run typecheck` passes with strict TypeScript.

### Phase 4 — Interface (completed)

- Six routes:
  - `/` — Beranda / provincial overview.
  - `/identifikasi` — ecosystem identification.
  - `/kalkulator` — valuation calculator.
  - `/analisis` — portfolio analysis, filters, drill-down, CSV/Excel, print.
  - `/referensi` — study/component explorer and UMP table.
  - `/metodologi` — methodology and transparency.
- Responsive layout, mobile navigation, accessible forms and tables, print styles.
- No dead controls: every button/link has an action.

### Phase 5 — Connect interface (completed)

- Calculator uses the verified engine and reference data.
- Portfolio persists in `localStorage`; analysis recomputes values from current coefficients.
- Exports use the same engine as the UI.
- Identification links to the calculator with prefilled query parameters.

### Phase 6 — Verification (completed)

- `npm run typecheck` — pass.
- `npm test` — 58/58 pass.
- `npm run build` — pass.
- Production bundle code-splits SheetJS (loaded only on Excel export).
- Accessibility: semantic landmarks, skip link, labelled controls, `aria-sort`, `aria-expanded`, focus-visible styles, reduced-motion support, print styles.
- Responsive review at desktop/tablet/mobile breakpoints.

### Phase 7 — Deployment configuration (optional; prepared, not published)

- Vite `base` derives from `GITHUB_REPOSITORY` on GitHub Actions, so assets work under `/<repo>/`.
- `HashRouter` avoids server-side route rewrites on GitHub Pages.
- GitHub Actions workflow builds and deploys `dist` to Pages.
- README documents setup, build, update, and deployment.
- **Not claimed as published.** No GitHub remote or credentials were used in this environment.

---

## 4. Repository structure

```
.
├─ docs/
│  ├─ workbook-audit.md
│  ├─ valuation-methodology.md
│  ├─ data-dictionary.md
│  ├─ classification-rules.md
│  └─ implementation-plan.md
├─ public/
│  ├─ .nojekyll
│  └─ robots.txt
├─ src/
│  ├─ components/       UI-only components
│  ├─ data/             reference.json + typed loader
│  ├─ lib/
│  │  ├─ classification/ kawasan/ecosystem rules
│  │  ├─ valuation/      engine + formatting
│  │  ├─ validation/     input parsing
│  │  ├─ portfolio/      persistence
│  │  └─ export/         CSV/Excel
│  ├─ pages/            route-level pages
│  ├─ state/            app state (portfolio, selected location)
│  ├─ App.tsx
│  ├─ main.tsx
│  ├─ index.css
│  └─ types.ts
├─ tests/
│  ├─ valuation.test.ts
│  ├─ classification.test.ts
│  ├─ validation.test.ts
│  └─ export.test.ts
├─ tools/
│  └─ extract-workbook.mjs
├─ .github/workflows/deploy.yml
├─ index.html
├─ package.json
├─ tsconfig*.json
├─ vite.config.ts
├─ vitest.config.ts
└─ README.md
```

---

## 5. Module responsibilities

| Layer | Files | Responsibility | Must not |
|---|---|---|---|
| Reference data | `src/data/reference.json`, `src/data/reference.ts` | Immutable dataset extracted from workbook | Contain UI logic or hand-edited coefficients |
| Types | `src/types.ts` | Shared domain contracts | Import React |
| Classification | `src/lib/classification/rules.ts` | Kawasan lookup, compatibility, limitations | Calculate values |
| Valuation | `src/lib/valuation/engine.ts` | UMP ratio, medians, totals, portfolio summary | Touch the DOM |
| Formatting | `src/lib/valuation/format.ts` | Indonesian currency/number/date formatting | Change values |
| Validation | `src/lib/validation/inputs.ts` | Parse/validate user input | Mutate storage |
| Portfolio | `src/lib/portfolio/storage.ts` | Create/load/save records | Calculate coefficients |
| Export | `src/lib/export/exporters.ts` | CSV/Excel from records | Reimplement valuation |
| State | `src/state/AppState.tsx` | Portfolio and location preferences | Contain page layout |
| Components | `src/components/` | Presentation, accessibility | Hold business rules |
| Pages | `src/pages/` | Compose components and engine | Duplicate formulas |

The single source of calculation is `engine.ts`. Pages and exporters call it; they do not reimplement it.

---

## 6. Data and calculation flow

```
Workbook
  └─ tools/extract-workbook.mjs
       └─ src/data/reference.json
            ├─ locations (UMP 2025)
            ├─ studies/components (base 2025 per-ha)
            ├─ kawasan/ecosystems
            └─ meta
                 │
User input ──────┤
                 ▼
       src/lib/valuation/engine.ts
       - UMP ratio
       - study category totals
       - median per category
       - sum-of-medians total
       - area multiplication
                 │
       ┌─────────┼──────────────┐
       ▼         ▼              ▼
    Pages    Portfolio     CSV/Excel export
```

---

## 7. Test plan

### 7.1 Unit/regression tests (implemented)

| Area | Cases |
|---|---|
| Reference integrity | 62 studies, 475 components, 9 ecosystems, 23 kawasan, 566 locations; all studies have UMP. |
| Coefficients | Nine ecosystems × three categories against workbook medians for Aceh. |
| Total rule | Sum of medians; missing categories null. |
| Calculator | Hutan Total 145,290 ha; zero area; linear scaling; UMP ratio. |
| Median | Odd/even samples; empty sample. |
| Classification | Exact mappings; compatible/incompatible/unsupported; unknown id; normalized name; reverse lookup. |
| Validation | Indonesian separators; empty; letters; negative; upper bound; text length. |
| Portfolio | KL valued; non-KL/unknown excluded; unknown location; area reconciliation. |
| Export | CSV BOM, headers, escaping; null values for non-KL; empty message. |

### 7.2 Manual verification (performed)

- Build and preview.
- Navigation across all six routes.
- Mobile menu toggle and keyboard focus.
- Calculator with area 0, empty, and large values.
- Add KL and non-KL records; analysis filters, sorting, drill-down, deletion.
- CSV/Excel downloads.
- Print layout.
- Responsive tables and charts.

### 7.3 Accessibility checks

- Skip link.
- Landmarks (`header`, `nav`, `main`, `footer`).
- Labels for every input; `aria-describedby` for hints/errors.
- `aria-expanded` on menu and study details.
- `aria-sort` on sortable columns.
- Status text is not color-only (labels accompany colors).
- Focus-visible outlines.
- Reduced-motion media query.
- Tables have captions or adjacent explanatory text.

A full screen-reader audit (NVDA/VoiceOver) is recommended before public launch; it was not possible to complete in this environment.

---

## 8. Deployment plan

### 8.1 Local

```bash
npm install
npm run dev
```

### 8.2 Production build

```bash
npm run build
npm run preview
```

### 8.3 GitHub Pages

1. Create a GitHub repository and push the project.
2. In repository settings → Pages → Source: **GitHub Actions**.
3. Push to `main`; `.github/workflows/deploy.yml` builds and deploys.
4. `vite.config.ts` computes `base` from `GITHUB_REPOSITORY` during Actions, so assets resolve under `https://<user>.github.io/<repo>/`.
5. `HashRouter` makes routes work without a 404 fallback.
6. `public/.nojekyll` prevents Jekyll processing.

**Current status:** configuration is present and the production build succeeds locally, but the site has **not** been published from this environment. Do not describe it as live until the Actions run is green and the URL is verified.

### 8.4 Custom domain / root hosting

For a root deployment, set `base: '/'` (the default when not running in GitHub Actions). Hash routes still work.

---

## 9. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Workbook changes silently | Coefficients drift | Hash + dataset version; rerun extractor; regression tests. |
| Stale `D8` validation confuses maintainers | Wrong ecosystem list | Documented; app uses formula-supported nine. |
| Unit inconsistencies bias results | Over/underestimation | Preserved and flagged; reference page shows original units. |
| No provincial area data | Users expect automatic totals | Explicit empty state and explanation; user-entered areas only. |
| Non-KL demand | Pressure to value without method | Non-KL records stored but not valued; reason shown. |
| Large bundle | Slow first load | SheetJS dynamically imported; Recharts is the remaining large dependency. |
| localStorage loss | Data loss | Warning when unavailable; CSV/Excel export; no server storage promise. |
| Print layout differences | Report formatting varies | Dedicated print CSS; tested in Chromium. |
| GitHub Pages base path | Broken assets/routes | Env-derived base; HashRouter; `.nojekyll`. |
| Misinterpretation as official | Institutional risk | Footer disclaimer; no logos/endorsements; methodology page. |

---

## 10. Future work

1. Add authoritative provincial ecosystem-area data as a separate, cited dataset.
2. Add a spatial module with citable protected-area boundaries and a documented overlay rule.
3. Add optional confidence intervals using the workbook's mean/stdev (currently unused) or bootstrap medians, clearly labeled as an extension.
4. Add CSV import for portfolio records (currently form-based entry).
5. Add a bilingual interface (Indonesian/English) if needed.
6. Add automated accessibility testing (axe) and visual regression tests.
7. Add stronger Excel export formatting (currency formats, frozen headers).
8. Add a dataset changelog and diff viewer.
9. Add unit-normalization research to resolve non-per-ha components.
10. Add a review workflow for non-KL methodology, if an authoritative rule is adopted.

---

## 11. Definition of done — current status

| Criterion | Status |
|---|---|
| Workbook audited and documented | Done |
| Typed data model and traceable engine | Done |
| Representative outputs validated against Excel | Done; discrepancies explained |
| Working navigation, filters, calculations, exports | Done |
| Missing/unsupported data handled transparently | Done |
| Polished, accessible, responsive design | Done to the extent testable here; screen-reader audit pending |
| Production build succeeds | Done |
| Documentation and deployment config included | Done |
| Published and verified on GitHub Pages | **Not done** — requires a remote repository and Actions run |

---

## 12. Commands

```bash
npm install
npm run dev
npm run data:extract
npm run typecheck
npm test
npm run build
npm run preview
```

---

## 13. Related documents

- `docs/workbook-audit.md`
- `docs/valuation-methodology.md`
- `docs/data-dictionary.md`
- `docs/classification-rules.md`
- `README.md`
