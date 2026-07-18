-- Keep public labels and CMS copy consistent with the correct Arabic name.

update public.published_exams
set title_ar = 'نتائج البريفيه 2026',
    title_fr = 'Résultats BEPC 2026',
    description_ar = 'نتائج شهادة ختم الدروس الإعدادية الرسمية لسنة 2026.',
    description_fr = 'Résultats officiels du BEPC 2026.'
where source_key = 'upload:brevet_2026';

update public.site_content
set value = replace(value, 'ابريفه', 'البريفيه')
where value like '%ابريفه%';

notify pgrst, 'reload schema';
