# Portfolio redesign brief: "Live Stage + Prompt to Product"

The look stays calm and minimal. The creativity is in HOW the work is shown:

1. **Live Stage**: visitors use each project live on the page instead of looking at screenshots.
2. **Prompt to Product**: every project has a "How I built it" story, a timeline from the first
   prompt to the shipped product, so visitors see how I work with AI.

Keep every feature that already works (see "Must keep working").

## Visual style (deliberately quiet)

- Light: background #FAFAF8, text #16161A, borders #E4E3DE, muted text #5C5C66.
  Dark (theme toggle): background #121214, text #EDEDEA, borders #2A2A30, muted #9A9AA4.
- ONE accent colour: #E0562B (signal orange), used only for live indicators, the active
  channel and the current timeline step. No gradients, no glow, no grid-line backgrounds.
- Fonts: "Geist" for everything, "Geist Mono" for small labels. Load from Google Fonts.
- Generous whitespace, 16–22px corner radius, subtle 1px borders. Motion only where it explains
  something (switching channels, moving along the timeline), 150–250ms, ease-out.

## Page structure

1. **Header**: "Uali Damir" + links Stage · About · Contact + theme toggle.
2. **Hero** (short): headline "Don't read about my work. Use it." and one line:
   "I build websites, AI agents and AI-generated videos. Each project runs live below."
3. **Live Stage** (the main feature):
   - A large dark frame showing the currently selected work, with a top bar:
     red/orange dot + "LIVE · CH 01 · <title>".
   - What renders inside depends on the work (new `embed_kind` field, see Data):
     - `iframe`: the live project in a sandboxed, lazy-loaded iframe
       (`sandbox="allow-scripts allow-same-origin allow-forms"`, `loading="lazy"`, a title).
       Trackline should use its demo URL (project_url with `?demo=1`, as WorkCard.jsx does now).
       If the site refuses to be framed, fall back to the video/images automatically.
     - `video`: an inline player (e.g. public/trackline-tour.webm style), muted, with controls.
     - `none`: the image carousel from `image_paths`.
   - Under the frame: a one-line "Try it: …" hint (new `try_hint` field) and "Open full screen ↗".
   - Side panel "What you're looking at": title, description, stack/tools as small rows,
     and a **"How I built it"** button (only shown when the work has a build story).
   - **Channel strip** under the stage: one card per published work (CH 01, CH 02 …) from
     Supabase, ordered by display_order, keeping the category filters (All / Code / Achievements /
     Other). Clicking a channel swaps the stage content; arrow keys also switch channels when the
     strip has focus. Update the URL hash (#/work/<id>) so a channel can be linked directly.
   - On phones (< 768px): no iframe. Show the video or image with a "Open live demo" button.
4. **How I built it** (opens as a full-height side drawer on desktop, a full page on mobile,
   route #/work/<id>/story):
   - A horizontal timeline at the top with the steps; the current step highlighted in the accent
     colour; click a step or use arrow keys / swipe to move.
   - Step types: `prompt` (shown as a dark mono "> prompt to Claude Code" card), `first_version`,
     `iteration`, `shipped`. Each step can have: title, text, prompt excerpt, one image, date.
   - Footer of the story: optional stats (prompts / days / commits) and a "What I learned" line.
   - Only steps marked public are shown (privacy, see Data).
5. **About** (short, plain): "I build websites with AI, AI agents that automate routine work, and
   AI-generated videos. I learn tools fast and care about quality." Second column:
   "Petroleum Engineering student at KBTU. Former exchange student at UTP, Malaysia."
   Keep AI work and engineering as separate facts.
6. **Contact**: "Want your project on this stage?" + Email, LinkedIn, GitHub, WhatsApp
   (keep the values in src/components/Contact.jsx).

## Data (Supabase)

Add a new migration file `supabase/migrations/0002_stage_and_story.sql` (do not edit 0001) that
adds nullable columns to `public.works`:

- `embed_kind text check (embed_kind in ('iframe','video','none')) default 'none'`
- `embed_url text` (iframe or video URL; falls back to project_url for iframes)
- `try_hint text`
- `tools text[] not null default '{}'`
- `build_story jsonb` shaped like:
  `{ "steps": [ { "type": "prompt|first_version|iteration|shipped", "title": "", "text": "",
  "prompt": "", "image_path": "", "date": "", "public": true } ], "stats": { "prompts": 0,
  "days": 0, "commits": 0 }, "lesson": "" }`

Existing RLS policies already cover these columns. Tell me to run the migration in the Supabase
SQL editor; do not try to run it yourself.

Admin panel (#/admin): add fields for embed kind, embed URL, try hint, tools, and a build-story
editor: add / remove / reorder steps, pick a type, edit text and prompt, upload a step image to
the existing `work-images` bucket, and a **public** toggle per step (default ON for new steps,
with a "Preview as visitor" button). Keep the existing admin logic intact.

## Privacy (important to me)

I decide what to show. Prompts are curated excerpts, not full chat logs. Any step can be hidden
with the public toggle, and a work with no public steps simply has no "How I built it" button.
Never display hidden steps to visitors (filter them out in the query/render path, not just CSS).

## Must keep working (do not break)

- Supabase loading in src/lib (works, images, realtime), env vars VITE_SUPABASE_URL and
  VITE_SUPABASE_ANON_KEY, the admin panel at #/admin (login, add/edit work, migration panel).
- Existing works with no new fields must still render (fallback to images/video, no story button).
- GitHub Pages deploy (.github/workflows/deploy.yml), vite.config.js base "/", index.html meta tags.

## Quality bar

- Respect prefers-reduced-motion.
- Responsive down to 360px; no horizontal page scroll.
- Keyboard accessible: stage channels, timeline steps and drawer (focus trap, Esc closes).
- Text contrast meets WCAG AA in both themes.
- No heavy new libraries; plain React + CSS is preferred.
- Run `npm run build` and `npm run lint`; fix all errors before finishing.
- Work in this order and show me each part in `npm run dev` before moving on:
  1) styles + layout, 2) Live Stage + channels, 3) migration + admin fields,
  4) How I built it drawer, 5) responsive + accessibility pass.
