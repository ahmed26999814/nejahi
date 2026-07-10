# Release checklist

- [x] Preview build passes on Vercel.
- [x] Secondary preview check passes.
- [x] No preview runtime error or fatal logs were observed.
- [x] Dynamic years depend on active published exams.
- [x] Uploaded ranks use ranked-view values.
- [x] Uploaded analytics and toppers use the dynamic dashboard API.
- [x] Uploaded concours supports guided location search.
- [x] Empty and unmapped result fields are hidden.
- [x] Shared result links preserve source and candidate.
- [x] Responsive homepage and dark-mode visual polish completed.

Manual database step: apply `supabase/migrations/20260711_uploaded_results_dashboard_validation.sql` in Supabase before publishing newly uploaded results.
