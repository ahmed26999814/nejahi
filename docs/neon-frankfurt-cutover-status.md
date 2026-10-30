# MauriResults: Frankfurt Neon migration status

Verified: 2026-10-30. This is a staging migration report, **not a production-cutover approval**.

## Current architecture
- Current public site: Vercel production, still uses Supabase.
- Previous Neon project (London): `floral-sunset-63707907`, staging branch `br-snowy-shadow-zaqg3mrf`. A complete 28-table snapshot remains here.
- New Neon project (Frankfurt): `ancient-scene-33057731`, branch `br-snowy-block-badutuyr`. This region supports Neon Object Storage, unlike London.
- The Frankfurt branch has a `public_read` Neon bucket named `site-images`. Future site-image upload handlers have been switched to native Neon Storage in the **isolated preview code**. S3 access keys are restricted to Vercel preview environment variables, not embedded in code.

## Verified Frankfurt schema
- 28 tables
- 31 security-invoker views
- 34 SQL/PLpgSQL functions
- 121 indexes
- 22 sequences
- 48 table constraints, 3 application triggers
- RLS enabled for all 28 tables; 0 imported Supabase-specific RLS policies

## Remaining database blocker
- Source London snapshot contains 632,988 records in 28 tables.
- Frankfurt contains 511,848 records.
- **27/28 tables match their source row counts exactly.**
- Only `public.concour_2026` differs: London 121,140 rows, Frankfurt 0.
- An attempted import was refused by execution safety checks. Do not bypass the restriction or publish the Frankfurt database as complete.
- The temporary London FDW connection, foreign tables, and stored source connection mapping have been deleted from Frankfurt, so credentials are not left in the database.
- `migration_stage.copy_progress` records the incomplete status.
- A complete, verified migration must populate that missing table using an approved secure import, confirm column/data fidelity, check role/security configuration, and rerun the 28-table comparison.

## Object storage
- Native Frankfurt Neon Object Storage was verified by uploading a PNG, reading it via S3, downloading it anonymously from the public bucket, and deleting the test PNG.
- The existing repository logo (`public/logo.png`, 940,999 bytes) was uploaded and verified in Neon Storage. The preview database's `site_content.logo` was updated to its Frankfurt Neon Storage URL.
- The previous Supabase Storage catalog lists 23 public site images; most **have not been recovered**. The old storage host returned HTTP 402 and cannot supply reliable copies. Upload any still-used originals to Neon Storage before removing Supabase links.
- Android APK releases are intentionally excluded at the owner's request.
- No Vercel Blob API is used by the new preview image handler.

## Production-cutover gates
1. Complete the missing `concour_2026` data copy and verify 28/28 exact row counts and sample hashes.
2. Review 0 imported RLS policies. Keep production access server-only, use least-privilege roles, and validate authorization for admin endpoints and all SECURITY DEFINER functions.
3. Test candidate lookups for Bac, Brevet, Concours, Excellence, and all active uploaded examinations against Frankfurt.
4. Reconcile Supabase changes since the staging snapshot. Freeze writes only for a short, announced maintenance period if necessary.
5. Recover/re-upload the used site images into Frankfurt Neon Storage, and replace old Supabase storage URLs.
6. Validate admin upload, publication, reset, analytics, chat, notifications, counters, and public pages end-to-end.
7. Switch Vercel environment configuration in a controlled deployment with rollback, then monitor. Do not remove Supabase until verified.

Do **not** merge this draft PR or update the production Vercel database variables based only on the partial staging copy.
