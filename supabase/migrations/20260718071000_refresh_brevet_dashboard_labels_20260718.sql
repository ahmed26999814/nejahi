-- Rebuild the cached Brevet dashboard after correcting its public labels.
select public.refresh_published_exam_dashboard_cache('upload:brevet_2026');
