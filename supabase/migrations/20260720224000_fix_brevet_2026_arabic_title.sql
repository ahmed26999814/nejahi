update public.published_exams
set title_ar = 'ابريفه 2026',
    description_ar = 'نتائج ابريفه الرسمية لسنة 2026.'
where source_key = 'upload:brevet_2026';

select public.refresh_published_exam_dashboard_cache('upload:brevet_2026');
