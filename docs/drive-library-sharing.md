# MauriResults — internal study library maintenance

The student-facing interface is the on-site library at `/lessons?tab=resources`. Do not display third-party folder URLs in its cards. File reading takes place under `/study/reader?id=...`, and downloads under `/api/study-files/download?id=...`.

- The two owned-copy mapping files currently map **558** indexed educational resources to corresponding files in the MauriResults Drive library.
- The literary archive adds 142 entries, with 4 shared IDs. The combined catalog contains **696 unique items**.
- The library root and representative files at different levels have Google Drive `anyone:reader` access, verified 2026-10-30.
- A PDF converted from a native Google document is stored under its original ID in the catalog and a new PDF Drive ID in the owned-copy mapping.
- The reader supports PDF and MP4. DOC/DOCX documents are downloaded from the same domain.
- Folder shortcuts and one provisional-results document are not included as educational resources; the archive video is included.
- The MediaFire folder contents have **not been enumerated**, so no unverified MediaFire items appear in the catalog.
- Year filters use explicitly tagged years; where not provided, they are extracted from document filenames, not assumed to be 2027.

Google Drive is storage; the website does not link to the upstream folder or expose direct file links in the visible UI. The on-site download endpoint chooses publicly readable MauriResults copies first and returns 424 when no verified binary source is reachable.
