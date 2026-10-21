# Portal Valuasi Ekonomi Jasa Ekosistem

A static, client-side web application for identifying ecosystems on kawasan lindung/berfungsi lindung and estimating the economic value of their services using the benefit-transfer method from the reference workbook.

**Live deployment:** not yet published. This repository includes a GitHub Pages workflow; follow §7 to publish and verify.

---

## 1. What this application does

- **Identifikasi ekosistem** — select a kawasan type, see the ecosystems listed for it in the workbook, and record the observed ecosystem with an explicit rule trail.
- **Kalkulator valuasi** — select a UMP location, ecosystem, service, and area (ha); get the coefficient, calculation breakdown, contributing studies, and annual value.
- **Analisis portofolio** — add areas to a local portfolio, filter/sort/drill down, reconcile totals, and export CSV/Excel or print a report.
- **Referensi** — inspect all 62 studies and 475 components, including original and 2025 per-hectare values, units, methods, and sources; search the 566-row UMP 2025 table.
- **Metodologi** — read the formulas, assumptions, data-quality notes, limitations, and version information.

All figures are calculated from the extracted workbook dataset and user-entered areas. There are no illustrative or placeholder statistics in the production interface.

### What it does not do

- It does not contain provincial ecosystem-area data. A province total requires user-entered areas.
- It does not perform GIS analysis or verify protected-area boundaries.
- It does not value non-kawasan lindung records; the workbook has no coefficients or rule for them.
- It does not claim to be an official government product or to replace field studies.

Read `docs/workbook-audit.md` and the in-app **Metodologi** page before using results.

---

## 2. Source and methodology

**Source workbook:** `Perhitungan Valuasi Ekonomi Lingkungan Hidup.xlsx`

**Calculation chain reproduced:**

```
per-ha 2025 value
  × (UMP 2025 target ÷ UMP 2025 study region)
  → sum components per service category per study
  → median of non-zero study totals = category coefficient
  → area × category coefficient = category value
  → total coefficient = sum of the three category medians
  → area × total coefficient = total value
```

Key details:

- The per-ha 2025 column already contains the workbook's 4.75% compound factor; the engine does not apply it twice.
- The total is the sum of the three medians, not the median of per-study totals.
- Missing categories are not treated as zero.
- Non-kawasan lindung records are stored but not valued.

Full documentation:

- `docs/workbook-audit.md` — sheet inventory, formulas, named ranges, validations, data-quality findings.
- `docs/valuation-methodology.md` — formulas, worked examples, validation, limitations.
- `docs/data-dictionary.md` — field definitions and source column mapping.
- `docs/classification-rules.md` — full kawasan-to-ecosystem table and classification limits.
- `docs/implementation-plan.md` — architecture, phases, test plan, deployment.

---

## 3. Tech stack

- React 19 + TypeScript (strict)
- Vite 6
- React Router (HashRouter)
- Recharts
- SheetJS (`xlsx`) — dynamically loaded only for Excel export
- Vitest

No backend, database, secrets, or external API keys.

---

## 4. Local development

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

### Available scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run typecheck` | Strict TypeScript check |
| `npm test` | Run all Vitest tests |
| `npm run test:watch` | Watch mode |
| `npm run data:extract` | Regenerate `src/data/reference.json` from the workbook |
| `npm run lint` | Alias for typecheck |

---

## 5. Project structure

```
src/
  components/        presentation components
  pages/             route pages
  lib/
    classification/  kawasan/ecosystem rules
    valuation/       engine, median logic, formatting
    validation/      input parsing
    portfolio/       localStorage persistence
    export/          CSV and Excel exports
  data/              reference.json + typed loader
  state/             app state
  types.ts
tests/               unit and regression tests
docs/                audit and methodology documents
tools/               workbook extractor
public/              static assets (.nojekyll)
```

Separation is intentional: UI components do not contain valuation formulas, and pages do not reimplement the engine.

---

## 6. Updating the reference dataset

1. Replace `Perhitungan Valuasi Ekonomi Lingkungan Hidup.xlsx` with the new workbook (or pass a path to the extractor).
2. Run:

   ```bash
   npm run data:extract
   ```

   To use a different path:

   ```bash
   node tools/extract-workbook.mjs "path/to/new-workbook.xlsx"
   ```

3. Review the diff of `src/data/reference.json`, especially:
   - `meta.studyCount`, `meta.componentCount`, `meta.findings`
   - `meta.workbookSha256_16`
   - study/component values
   - UMP locations
   - kawasan mapping (23) and ecosystems (9)
4. Run the tests:

   ```bash
   npm test
   npm run typecheck
   npm run build
   ```

5. If expected workbook values changed, update the fixtures in `tests/valuation.test.ts` **only after** explaining the difference in `docs/workbook-audit.md`.
6. Bump `meta.datasetVersion` in `tools/extract-workbook.mjs` and update the docs/version references.
7. Commit the workbook, extractor, dataset, tests, and docs together.

Never hand-edit coefficients in `reference.json`.

---

## 7. Deploying to GitHub Pages

### 7.1 One-time setup

1. Create a repository on GitHub and push this project:

   ```bash
   git init
   git add .
   git commit -m "Initial portal implementation"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

2. In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

3. Ensure the workflow `.github/workflows/deploy.yml` is present on `main`.

### 7.2 Deployment

- Push to `main` or run the workflow manually from the **Actions** tab.
- The workflow:
  1. checks out the repository;
  2. sets up Node;
  3. runs `npm ci` and rebuilds esbuild;
  4. runs `npm test`;
  5. runs `npm run build`;
  6. uploads `dist/` as a Pages artifact;
  7. deploys it.

- `vite.config.ts` computes the base path from `GITHUB_REPOSITORY` during GitHub Actions, so assets resolve under `https://<user>.github.io/<repo>/`.
- `HashRouter` means routes such as `/#/kalkulator` work without server rewrites.
- `public/.nojekyll` disables Jekyll processing.

### 7.3 Verification after deployment

Do not call the deployment complete until you have:

- [ ] a green **Deploy to GitHub Pages** workflow run;
- [ ] opened the published URL;
- [ ] verified that the logo/assets load (no 404s in DevTools);
- [ ] navigated to every page, including a hard refresh on a nested route;
- [ ] run one calculation and compared it with the workbook example;
- [ ] exported CSV and Excel;
- [ ] tested at mobile width.

### 7.4 Root-domain or custom-domain hosting

For a user/organization site or a custom domain, set the Vite `base` to `/` and configure Pages accordingly. The current configuration only auto-prefixes for project sites on GitHub Actions.

---

## 8. Data quality and known limitations

These are documented in detail in the docs and the in-app methodology page:

- The workbook's `D8` data validation lists only Hutan and Lahan Basah, while the formula supports nine ecosystems. The app uses the nine supported by the formula.
- Kawasan type does not affect the workbook's valuation formula.
- Some component units are not per hectare (per KK, per kg, per batang), but the workbook treats them as per hectare. Values are preserved and flagged.
- Some cached compound factors are inconsistent with the stated study year. The engine uses the workbook's cached 2025 value, not a recomputation.
- The workbook has no provincial area dataset, no geometry, and no non-KL coefficients.
- The total is the sum of medians, not the median of totals.
- No uncertainty interval is provided.

---

## 9. Accessibility and browser support

- Semantic landmarks, skip link, labelled controls, visible focus styles.
- `aria-sort` on sortable tables, `aria-expanded` on disclosure controls.
- Reduced-motion support.
- Print stylesheet for the analysis report.
- Tested in current Chromium-based browsers. A full screen-reader audit is recommended before public launch.

---

## 10. Version information

| Item | Value |
|---|---|
| Dataset version | `workbook-2025.1` |
| Engine version | `bt-ump-median-1.0.0` |
| Price year | 2025 |
| Workbook SHA-256 prefix | `1d30931b10ffec1e` |
| Tests | 58 passing |

Metadata is also displayed in the app footer and on the **Metodologi** page.

---

## 11. Disclaimer

This portal is an analytical aid based on a benefit-transfer workbook. It is not an official document, does not represent government endorsement, and does not replace site-specific valuation, field verification, or decisions by the competent authority. Use the assumptions, limitations, and data-quality notes on the **Metodologi** page when interpreting results.
