# Dependency security remediation — PR #80

The failing GitHub job was `audit-and-build`, job `123531614506`, run `40897817847`, on commit `8c90118262709e473b6bd5dd6cc0d403d74d9591`. Its production audit reported seven vulnerable dependency groups: one critical, five high, one moderate. A complete audit additionally identified build-tool findings.

## Affected versions and replacements

| Dependency | Installed before | Installed after | Remediation |
| --- | --- | --- | --- |
| Next.js | 15.5.20 | 15.5.28 | Pin the maintained 15.x security backport; no major framework migration. |
| PostCSS | 8.5.16 and nested 8.4.31 | 8.5.32 | Update the direct dependency and override every transitive copy to the same patched 8.x version. |
| sharp | 0.34.5 | 0.35.5 | Pin the patched native image stack, allowed by Next.js 15.5.28's optional dependency range. |
| nanoid | 3.3.15 | 3.3.20 | Refresh the compatible 3.x transitive dependency. |
| source-map-js | 1.2.1 | 1.2.2 | Refresh the compatible transitive dependency. |
| SheetJS / xlsx | npm 0.18.5 | official CE 0.20.3 | Replace the obsolete npm distribution with the upstream release tarball. |
| browserslist | 4.28.4 | 4.29.5 | Refresh the compatible transitive dependency. |
| baseline-browser-mapping | 2.10.41 | 2.11.34 | Refresh the compatible transitive dependency. |
| postcss-selector-parser | 6.1.4 | 6.1.5 | Refresh the compatible 6.x transitive dependency. |

The original audit included Next.js Server Actions, image optimization and cache advisories; PostCSS source-map/file-disclosure and CSS-stringification advisories; vulnerable sharp native libraries; nanoid and source-map denial-of-service findings; and the SheetJS issues below. Full before/after machine-readable audit evidence is retained in the review bundle. Compatible transitive dependencies were refreshed with npm, including matching React/React DOM 19.3.1.

## Excel import remains supported

`xlsx` on the public npm registry stops at 0.18.5. `npm audit fix` cannot obtain the patched upstream release from that registry. The package now points to the exact distribution recommended by [the SheetJS installation documentation](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/):

`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`

Version 0.20.3 includes the fixes for [prototype pollution, GHSA-4r6h-8v6p-xvw6](https://github.com/advisories/GHSA-4r6h-8v6p-xvw6), fixed upstream in 0.19.3, and [ReDoS, GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9), fixed upstream in 0.20.2. The exact URL and npm-generated SHA-512 integrity are committed in `package-lock.json`; the reader tests verify the real library version and lockfile provenance. This does not rename or conceal an old vulnerable implementation. An external tarball is not fully covered by npm registry advisory matching, so its upstream version and these fixes were checked separately.

Both admin upload components use a shared, lazy-loaded reader with the previous formatted-cell, worksheet-selection, date and null-handling behavior. Legacy BIFF8 `.xls` and OOXML `.xlsx` imports remain supported. Row-normalization dictionaries have no prototype. No audit exclusions, audit-level relaxation, advisory ignores or skipped failing checks were added.

## Verification

- Re-generated the lockfile using `npm install` / compatible `npm update`, followed by a clean `npm ci`; no manual lockfile edits.
- `npm audit --omit=dev`: zero findings in production dependencies.
- `npm audit`: zero findings including development dependencies.
- `npm run build`: successful production build and type checking. `prebuild` now runs all 15 regression tests, so the existing GitHub build jobs also exercise Excel imports and the real upload route handler.
- Reader tests: both workbook formats; Arabic and accented French names; text and formatted numeric candidate numbers with leading zeroes; decimal scores; dates; empty worksheets; selected/fallback worksheets; prototype-shaped column names.
- Actual upload-handler tests: authorized create/insert/prepare flow with intercepted upstream requests, rejection of unauthorized/oversized requests, and insert failure without a false success response.
- Public route/API smoke checks: passed, including the 10 competition/year pages and candidate validation/redirects.
- Browser search checks: all 11 sources for 2025/2026 passed, including mobile, desktop, Arabic/French and dark mode.
- Browser upload checks: 1002 synthetic students per format, split into 1000 + 2 rows; preview caused zero requests; mappings, text, leading zeroes, prepare and publish validation all passed against intercepted API fixtures.

No real student data was read or written by these new upload tests. Test credentials are synthetic and isolated to the test process. Supabase schemas, settings, keys, passwords and billing were not changed. No merge or deployment was performed, and branch-specific Vercel deployment remains disabled.

The remaining Supabase quota restriction and live advisor-access limitation from the earlier report are operational audit limitations, not unresolved findings from this dependency audit. GitHub CI status must be checked on the final uploaded commit before declaring the PR checks green.
