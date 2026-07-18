update public.published_exams
set title_ar = 'أبريفه 2026',
    description_ar = 'نتائج أبريفه الرسمية لسنة 2026.'
where source_key = 'upload:brevet_2026';

update public.site_content
set value = replace(replace(value, 'نتائج البريفيه 2026', 'أبريفه 2026'), 'البريفيه', 'أبريفه')
where value like '%البريفيه%';

select public.refresh_published_exam_dashboard_cache('upload:brevet_2026');
