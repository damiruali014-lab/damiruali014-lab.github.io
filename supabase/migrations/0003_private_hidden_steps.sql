-- Hidden "How I built it" steps must not be readable by visitors.
--
-- After 0002, works.build_story holds every step and only the browser hid the
-- non-public ones, so anyone could read them through the REST API, devtools or
-- a Realtime payload. This migration keeps hidden steps in an admin-only table
-- and leaves only public steps in works.build_story.
--
-- Run AFTER 0002. Safe to re-run.
--
-- How it works:
--   * The admin app still saves ONE build_story with every step in it.
--   * A BEFORE trigger on public.works splits it inside the same statement:
--       - public steps stay in works.build_story (readable by everyone),
--       - hidden steps go to public.work_story_private (admins only),
--       - `layout` remembers the original order ('p' = public, 'h' = hidden),
--         so no position numbers leak into the public JSON.
--   * With no public step left, works.build_story becomes NULL and stats /
--     lesson move to the private row too, so nothing about the story is public.
--   * Admins read the private row and merge it back for the editor.
--
-- Not covered: images attached to hidden steps are stored in the public
-- work-images bucket, whose paths are unguessable but can be listed through
-- the storage API. Do not attach sensitive images to hidden steps.

-- ---------------------------------------------------------------------------
-- 1. Admin-only table for the hidden part of a story
-- ---------------------------------------------------------------------------
create table if not exists public.work_story_private (
  -- Deferred so the trigger can write this row before the works row exists
  -- (INSERT) and the check still passes at commit.
  work_id uuid primary key
    references public.works (id) on delete cascade
    deferrable initially deferred,
  hidden_steps jsonb not null default '[]'::jsonb,
  layout jsonb not null default '[]'::jsonb,
  -- { stats, lesson } while there is no public step to carry them.
  meta jsonb,
  updated_at timestamptz not null default now()
);

alter table public.work_story_private enable row level security;

revoke all on public.work_story_private from anon;

drop policy if exists "admins read private story" on public.work_story_private;
create policy "admins read private story"
  on public.work_story_private for select
  to authenticated
  using (public.is_admin());

drop policy if exists "admins insert private story" on public.work_story_private;
create policy "admins insert private story"
  on public.work_story_private for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update private story" on public.work_story_private;
create policy "admins update private story"
  on public.work_story_private for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete private story" on public.work_story_private;
create policy "admins delete private story"
  on public.work_story_private for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 2. Splitting a story into its public and hidden parts
-- ---------------------------------------------------------------------------
-- Only an explicit boolean true makes a step public (fail closed).
create or replace function public.split_story(
  p_story jsonb,
  out public_story jsonb,
  out hidden_steps jsonb,
  out layout jsonb,
  out meta jsonb
)
language plpgsql
immutable
set search_path = public
as $$
declare
  pub jsonb;
begin
  select
    coalesce(jsonb_agg(e.elem order by e.ord) filter (where e.is_pub), '[]'::jsonb),
    coalesce(jsonb_agg(e.elem order by e.ord) filter (where not e.is_pub), '[]'::jsonb),
    coalesce(
      jsonb_agg(case when e.is_pub then 'p' else 'h' end order by e.ord),
      '[]'::jsonb
    )
  into pub, hidden_steps, layout
  from (
    select
      s.value as elem,
      s.ordinality as ord,
      coalesce(s.value -> 'public' = 'true'::jsonb, false) as is_pub
    from jsonb_array_elements(p_story -> 'steps') with ordinality as s
  ) e;

  if jsonb_array_length(hidden_steps) = 0 then
    -- Nothing hidden: the story is stored as it is.
    public_story := jsonb_set(p_story, '{steps}', pub);
    layout := '[]'::jsonb;
    meta := null;
  elsif jsonb_array_length(pub) = 0 then
    -- Everything hidden: no public story at all.
    public_story := null;
    meta := jsonb_build_object(
      'stats', p_story -> 'stats',
      'lesson', p_story -> 'lesson'
    );
  else
    public_story := jsonb_set(p_story, '{steps}', pub);
    meta := null;
  end if;
end;
$$;

revoke all on function public.split_story(jsonb) from public, anon, authenticated;

create or replace function public.works_split_hidden_story()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parts record;
begin
  -- Used by the backfill below, which does the split itself.
  if current_setting('app.skip_story_split', true) = 'on' then
    return new;
  end if;

  -- Other updates (e.g. reordering, un-publishing) must not touch the story.
  if tg_op = 'UPDATE' and new.build_story is not distinct from old.build_story then
    return new;
  end if;

  if new.build_story is null
     or jsonb_typeof(new.build_story -> 'steps') is distinct from 'array' then
    delete from public.work_story_private where work_id = new.id;
    return new;
  end if;

  select * into parts from public.split_story(new.build_story);
  new.build_story := parts.public_story;

  if jsonb_array_length(parts.hidden_steps) = 0 then
    delete from public.work_story_private where work_id = new.id;
  else
    insert into public.work_story_private (work_id, hidden_steps, layout, meta)
    values (new.id, parts.hidden_steps, parts.layout, parts.meta)
    on conflict (work_id) do update
      set hidden_steps = excluded.hidden_steps,
          layout = excluded.layout,
          meta = excluded.meta,
          updated_at = now();
  end if;

  return new;
end;
$$;

revoke all on function public.works_split_hidden_story() from public, anon, authenticated;

drop trigger if exists works_split_hidden_story on public.works;
create trigger works_split_hidden_story
  before insert or update of build_story on public.works
  for each row execute function public.works_split_hidden_story();

-- ---------------------------------------------------------------------------
-- 3. Backfill: move hidden steps already saved under 0002
-- ---------------------------------------------------------------------------
do $$
declare
  r record;
  parts record;
begin
  perform set_config('app.skip_story_split', 'on', true);

  for r in
    select id, build_story
    from public.works
    where jsonb_typeof(build_story -> 'steps') = 'array'
  loop
    select * into parts from public.split_story(r.build_story);

    if jsonb_array_length(parts.hidden_steps) > 0 then
      insert into public.work_story_private (work_id, hidden_steps, layout, meta)
      values (r.id, parts.hidden_steps, parts.layout, parts.meta)
      on conflict (work_id) do update
        set hidden_steps = excluded.hidden_steps,
            layout = excluded.layout,
            meta = excluded.meta,
            updated_at = now();

      update public.works set build_story = parts.public_story where id = r.id;
    end if;
  end loop;
end $$;
