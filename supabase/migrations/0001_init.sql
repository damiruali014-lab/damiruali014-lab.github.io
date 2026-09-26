-- Portfolio backend: works table, admin allow-list, RLS, storage bucket + policies.
-- Run this once in the Supabase SQL editor (or via the Supabase CLI).

-- ---------------------------------------------------------------------------
-- 1. Admin allow-list
-- ---------------------------------------------------------------------------
-- Being logged in is not enough to mutate data: the user id must also be
-- listed here. This keeps a stray signup from gaining write access.
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "admins can read the allow-list" on public.admin_users;
create policy "admins can read the allow-list"
  on public.admin_users for select
  to authenticated
  using (user_id = auth.uid());

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admin_users where user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. Works table
-- ---------------------------------------------------------------------------
create table if not exists public.works (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null default '',
  project_url text,
  -- Storage object paths inside the work-images bucket, in carousel order.
  -- Paths (not full URLs) are stored so files can be deleted and so the
  -- bucket/CDN host can change without rewriting every row.
  image_paths text[] not null default '{}',
  display_order integer not null default 0,
  published boolean not null default true,
  -- Set by the one-time IndexedDB import; the unique index makes a repeated
  -- import a no-op instead of creating duplicates.
  legacy_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists works_legacy_id_key
  on public.works (legacy_id)
  where legacy_id is not null;

create index if not exists works_display_order_idx
  on public.works (display_order, created_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists works_set_updated_at on public.works;
create trigger works_set_updated_at
  before update on public.works
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.works enable row level security;

drop policy if exists "published works are public" on public.works;
create policy "published works are public"
  on public.works for select
  to anon, authenticated
  using (published = true or public.is_admin());

drop policy if exists "admins insert works" on public.works;
create policy "admins insert works"
  on public.works for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "admins update works" on public.works;
create policy "admins update works"
  on public.works for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admins delete works" on public.works;
create policy "admins delete works"
  on public.works for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- 4. Realtime
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.works;

-- ---------------------------------------------------------------------------
-- 5. Storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'work-images',
  'work-images',
  true,
  5242880, -- 5 MB, mirrored by the client-side check
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "work images are publicly readable" on storage.objects;
create policy "work images are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'work-images');

drop policy if exists "admins upload work images" on storage.objects;
create policy "admins upload work images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'work-images' and public.is_admin());

drop policy if exists "admins update work images" on storage.objects;
create policy "admins update work images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'work-images' and public.is_admin())
  with check (bucket_id = 'work-images' and public.is_admin());

drop policy if exists "admins delete work images" on storage.objects;
create policy "admins delete work images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'work-images' and public.is_admin());
