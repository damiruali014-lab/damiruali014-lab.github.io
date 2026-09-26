# Portfolio

React + Vite portfolio with a Supabase backend. Projects and their images live
in Supabase, so anything added in one browser appears in every browser and for
every visitor.

- **Public site** — anyone can read projects. No login, no admin controls.
- **Admin panel** — `#/admin`. Requires a Supabase account that is on the
  `admin_users` allow-list.

## 1. Create the Supabase project

1. Sign in at [supabase.com](https://supabase.com) and create a project.
2. Wait for provisioning to finish.

## 2. Run the database migration

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the contents of [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
   and run it.

That script creates:

- the `works` table (uuid id, title, category, description, `project_url`,
  `image_paths`, `display_order`, `published`, `legacy_id`, timestamps),
- the `admin_users` allow-list and an `is_admin()` helper,
- Row Level Security policies — public `select` on published rows, and
  `insert`/`update`/`delete` restricted to admins,
- the `work-images` storage bucket with matching policies,
- the realtime publication for `works`.

## 3. Add environment variables

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Fill in both values from **Project Settings → API**:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Use only the **anon / publishable** key. The `service_role` key must never
appear in frontend code or in this file.

`.env` is gitignored. Vite inlines these at **build time**, so restart the dev
server (and rebuild before deploying) after changing them. When you deploy, set
the same two variables in your host's environment settings.

## 4. Create the owner account

1. Dashboard → **Authentication → Users → Add user**.
2. Enter your email and a password, and confirm the account.
3. Copy that user's **UID**.
4. Back in the SQL editor, add it to the allow-list:

```sql
insert into public.admin_users (user_id)
values ('paste-your-user-uid-here');
```

Optional but recommended: **Authentication → Providers → Email** and disable
"Allow new users to sign up", so nobody else can create an account.

Being signed in is not sufficient for write access — the user id must be in
`admin_users`, which is what the RLS policies check.

## 5. Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm run lint
npm run build
```

Visit `http://localhost:5173/#/admin` and sign in with the owner account.

## 6. Import projects from IndexedDB

Earlier versions stored projects in the browser's IndexedDB, so they exist only
in the browser that created them (for example Yandex).

1. Open the site **in that browser**.
2. Go to `#/admin` and sign in.
3. The **Import from this browser** panel reports how many local projects it
   found and how many are not yet in Supabase.
4. Click import. Each base64 image is converted to a file, uploaded to Storage
   in its original carousel order, and the project row is written to Postgres.
5. Verify in another browser.

The import records each project's old IndexedDB id in `legacy_id`, so running it
again skips what is already imported instead of duplicating. **Your local
IndexedDB copy is never deleted** — it stays as a backup until you remove it.

Repeat per browser if projects were created in more than one.

## Architecture

| Path | Role |
| --- | --- |
| `src/lib/supabase.js` | Client, built from env vars |
| `src/lib/auth.js` | Sign in/out, session, admin check |
| `src/lib/works.js` | Works CRUD, row mapping, realtime |
| `src/lib/images.js` | Validation, upload, delete, public URLs |
| `src/lib/migration.js` | One-time IndexedDB import |
| `src/legacyDb.js` | Read-only access to the old IndexedDB store |
| `src/components/` | Presentation only |

Images are stored as files in Supabase Storage. Storage **paths** are kept in
`works.image_paths` (ordered, driving the carousel); public URLs are derived at
read time. No base64 anywhere.
