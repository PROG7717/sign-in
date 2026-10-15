# ✦ NOVA Studio — Bilingual 3D Portfolio Platform

A state-of-the-art portfolio website with an interactive 3D hero, full English/Arabic (LTR/RTL) support, a client review & rating system, and a secure admin dashboard that can re-theme the entire site live — no redeploy needed.

---

## 1 · Tech stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router, RSC, Turbopack) | SEO, streaming SSR, server components |
| Language | **TypeScript** (strict) | Safety across the whole stack |
| Styling | **Tailwind CSS v4** + CSS variables | The admin color picker rewrites `--primary/--secondary/--accent` at runtime |
| 3D | **Three.js + React Three Fiber + drei** | Interactive hero scene (morphing orb, orbital rings, star field, cursor parallax) |
| Animation | **Framer Motion** | Page/scroll reveals, magnetic buttons, 3D tilt cards, layout-animated filters, lightbox |
| i18n | **next-intl** | Locale routing (`/en`, `/ar`), full RTL mirroring, ICU plurals (incl. Arabic plural rules) |
| Backend | **Supabase** | Postgres + Auth + Storage + Realtime, secured with Row Level Security |

## 2 · Architecture

```
Browser ──► Next.js (proxy: next-intl routing + Supabase session refresh)
              │
              ├─ Server Components ──► Supabase (RLS-scoped reads: projects, reviews, settings)
              ├─ Client Components ──► Supabase (review submit, admin CRUD, storage uploads)
              └─ ThemeSync (client) ◄── Supabase Realtime: settings UPDATE → CSS vars repaint live
```

- **Theme pipeline**: the locale layout injects the saved colors as a `<style>:root{…}</style>` server-side (zero flash) → Tailwind tokens reference those variables → `ThemeSync` subscribes to `portfolio_settings` changes and repaints every open tab instantly. The 3D scene listens to the same event and recolors its materials in real time.
- **Security model**: the admin UI guard is server-side, but the *real* boundary is Postgres RLS — anonymous users can only read published projects/approved reviews and insert `pending` reviews; every write path requires membership in `portfolio_admins` (verified: forged `status=approved` inserts are rejected with 401).

### Folder structure

```
.  (repo root — Vercel/Netlify auto-detect the Next.js app here)
├── supabase/migrations/        # Schema + RLS + storage policies (already applied)
├── public/covers/              # Generative SVG artwork for the seeded projects
└── src/
    ├── proxy.ts                # next-intl routing + Supabase session refresh
    ├── i18n/                   # routing, navigation, request config
    ├── messages/{en,ar}.json   # Full UI translation catalogs
    ├── lib/
    │   ├── supabase/           # config, browser client, server (cookie) client
    │   ├── data.ts             # Server-side data access layer
    │   ├── theme.ts            # applyTheme / readTheme + theme event bus
    │   └── types.ts            # Domain types, localization + color-sanitizing helpers
    ├── components/
    │   ├── three/HeroScene.tsx # R3F scene (theme-reactive)
    │   ├── motion/             # Reveal, Magnetic, TiltCard, CountUp
    │   ├── layout/             # Navbar, Footer, LocaleSwitcher
    │   ├── home/               # Hero, Marquee, Services, FeaturedWork, ReviewsStrip, CTA
    │   ├── projects/           # ProjectCard, WorkGrid (filters), Gallery (lightbox)
    │   ├── reviews/            # StarRating, ReviewCard, ReviewForm
    │   ├── theme/ThemeSync.tsx # Realtime theme subscriber
    │   └── admin/              # AdminShell, ProjectsManager, ProjectForm,
    │                           # ImageUploader, ReviewsModeration, SettingsForm
    └── app/[locale]/
        ├── layout.tsx          # <html lang dir> + fonts + theme injection
        ├── (site)/             # Public site: home, /work, /work/[slug], /reviews
        └── admin/              # /admin/login + guarded dashboard:
                                # overview, projects CRUD, review moderation, theme settings
```

### Database (all tables namespaced `portfolio_*`)

- `portfolio_projects` — bilingual title/tagline/description, category, tags, cover, gallery, featured/published flags
- `portfolio_reviews` — 1–5 stars, comment, optional project link, `pending → approved/hidden` moderation flow
- `portfolio_settings` — singleton: brand colors + bilingual site name (broadcast over Realtime)
- `portfolio_admins` — allow-list backing the `is_portfolio_admin()` RLS helper
- Storage bucket `portfolio` — public URLs, admin-only writes

## 3 · Running it

```bash
npm install
npm run dev     # http://localhost:3000 → redirects to /en (or /ar)
```

No env setup required — the public Supabase URL/anon key ship as fallbacks in
`src/lib/supabase/config.ts` (they are safe to expose; RLS enforces access).
Override via `.env.local` (see `.env.example`) to point at another project.

**Admin dashboard**: `/en/admin` — sign in with the Supabase account
`ibr5ab2i@gmail.com` (already granted admin rights in `portfolio_admins`).

### Deploying to Vercel

The Next.js app sits at the **repository root**, so no special configuration
is needed:

1. Import the GitHub repo in Vercel and leave **Root Directory empty**
   (if you previously set it to `portfolio`, clear that setting — the app
   was moved to the root).
2. Make sure Vercel builds a branch that actually contains this app —
   either merge this branch into your default branch, or set
   *Settings → Environments → Production → Branch* to the working branch.
3. Framework preset: **Next.js** (auto-detected). No env vars required.

The root URL `/` is redirected to `/en` (or `/ar` based on the visitor's
`Accept-Language`) by `src/proxy.ts` — Next.js middleware that Vercel runs
at the edge automatically.

## 4 · Content & i18n notes

- Every project and the site name store `*_en` and `*_ar` columns; the UI falls back to English when an Arabic value is empty.
- `/ar` flips the document to RTL: layout, nav pill animation, arrows and the marquee all mirror automatically (`rtl:` variants + logical properties).
- Review submissions are public but always land as **pending**; publish them from *Admin → Reviews*.
