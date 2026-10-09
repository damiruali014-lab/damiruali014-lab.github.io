-- Live Stage + "How I built it": new, optional columns on public.works.
-- Run this once in the Supabase SQL editor. It is safe to re-run.
--
-- Existing RLS policies (0001) are table-level, so they already cover these
-- columns: anyone can read published rows, only allow-listed admins can write.

alter table public.works
  add column if not exists embed_kind text default 'none',
  add column if not exists embed_url text,
  add column if not exists try_hint text,
  add column if not exists tools text[] not null default '{}',
  add column if not exists build_story jsonb;

-- Added separately so a re-run does not fail when the constraint exists.
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'works_embed_kind_check'
      and conrelid = 'public.works'::regclass
  ) then
    alter table public.works
      add constraint works_embed_kind_check
      check (embed_kind in ('iframe', 'video', 'none'));
  end if;
end $$;

comment on column public.works.embed_kind is
  'How the Live Stage renders this work: iframe | video | none (image carousel).';
comment on column public.works.embed_url is
  'iframe or video URL. For iframe it falls back to project_url when empty.';
comment on column public.works.try_hint is
  'One-line "Try it: ..." hint shown under the stage frame.';
comment on column public.works.tools is
  'Stack / tools shown as small rows in the side panel.';
comment on column public.works.build_story is
  'jsonb: { steps: [{ type, title, text, prompt, image_path, date, public }], stats: { prompts, days, commits }, lesson }. Only steps with public = true are shown to visitors.';
