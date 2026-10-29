# SheetJS CE 0.20.3

Official, unmodified archive vendored to make Vercel installs independent of the SheetJS CDN.

- Source: https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz
- Downloaded: 2026-10-29
- Bytes: 2409319
- SHA-256: `8dc73fc3b00203e72d176e85b50938627c7b086e607c682e8d3c22c02bb99fe8`
- SHA-512 SRI: `sha512-oLDq3jw7AcLqKWH2AhCpVTZl8mf6X2YReP+Neh0SJUzV/BdZYjth94tG5toiMB1PPrYtxOCfaoUCkvtuH+3AJA==`

The SHA-512 was matched against the npm lockfile at commit 452524f before changing the dependency source. npm verifies the archive against package-lock.json on install; the regression suite also verifies the exact archive SHA-256 and SHA-512. The archive includes the upstream Apache-2.0 LICENSE. It retains XLS/BIFF8 and XLSX support. CE 0.20.3 includes the fixes for GHSA-4r6h-8v6p-xvw6 and GHSA-5pgg-2g8v-p4x9; do not replace it with the obsolete npm-registry 0.18.5 release.

To update, download an official release with TLS verification enabled, independently verify its provenance and advisories, regenerate the lockfile with npm, and rerun the full audit, build, reader and upload tests. Never change integrity hashes to accept an unverified artifact.
