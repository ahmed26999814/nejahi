-- Keep extension-owned objects out of the exposed public schema. The ranking
-- preparation function uses a fixed search_path so future trigram indexes keep
-- resolving after the move.

alter extension pg_trgm set schema extensions;
alter function public.ensure_persisted_exam_rank(text,text,text,text,text,text,text)
  set search_path = public, extensions;

notify pgrst, 'reload schema';
