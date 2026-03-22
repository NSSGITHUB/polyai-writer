# CLAUDE.md — SEO AI Writer

## Project Overview

Multi-user SaaS platform for AI-driven SEO content generation and WordPress publishing. Supports 4 AI providers: OpenAI (GPT), Google Gemini, Anthropic Claude, and Xai Grok.

## Tech Stack

- **Frontend**: React 18 + TypeScript, Vite 5, Tailwind CSS 3, shadcn/ui (Radix)
- **Backend**: PHP API (raw PDO/MySQL)
- **Database**: MySQL (users, articles, images) + Supabase PostgreSQL (WordPress sites/posts)
- **Auth**: Email/password with Supabase session management
- **State**: React Query (TanStack) for async data, React Hook Form + Zod for forms

## Project Structure

```
├── src/
│   ├── components/
│   │   ├── ui/              # 51 shadcn/ui primitives (do not edit directly)
│   │   └── *.tsx            # App-level components
│   ├── pages/               # Route page components (13 files)
│   │   ├── Generator.tsx    # Core: AI article generation (largest page)
│   │   ├── Dashboard.tsx    # Stats and overview
│   │   ├── Articles.tsx     # Article list management
│   │   ├── ArticleView.tsx  # Single article view/export
│   │   ├── Auth.tsx         # Login/register
│   │   ├── SeoAnalyzer.tsx  # SEO scoring tool
│   │   ├── ImageGenerator.tsx / ImageGallery.tsx
│   │   ├── KeyManagement.tsx
│   │   ├── WordPressSites.tsx / ScheduledPosts.tsx
│   │   └── Index.tsx / NotFound.tsx
│   ├── lib/
│   │   ├── api.ts           # API base URL config
│   │   ├── seo-analyzer.ts  # SEO scoring engine
│   │   └── utils.ts         # cn() helper (clsx + tailwind-merge)
│   ├── hooks/               # use-toast, use-mobile
│   ├── integrations/supabase/  # Supabase client + auto-generated types
│   ├── App.tsx              # Router definition
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + Tailwind layers
├── api/                     # PHP backend (14 files)
│   ├── db-config.php        # DB connection + API key config
│   ├── generate-article.php # AI article generation endpoint
│   ├── save-article.php / get-article(s).php / delete-article.php
│   ├── login.php / register.php
│   ├── get-api-keys.php / update-api-keys.php
│   ├── save-image.php / get-images.php
│   ├── get-stats.php / diag.php
│   └── setup-database.sql / setup-images-table.sql
├── supabase/                # Supabase config and migrations
├── public/                  # Static assets
├── deploy.sh                # Build + deploy script
└── index.html               # HTML entry point
```

## Commands

```bash
npm run dev          # Start dev server (port 8080)
npm run build        # Production build (copies api/ to dist/api/)
npm run build:dev    # Dev mode build
npm run lint         # ESLint
npm run preview      # Preview production build
```

## Code Conventions

- **Imports**: Use `@/` path alias for `src/` (e.g., `@/components/ui/button`)
- **Components**: Functional React components with hooks, PascalCase filenames
- **Variables/functions**: camelCase
- **Styling**: Tailwind utility classes; dark mode via `class` strategy
- **UI primitives**: shadcn/ui components in `src/components/ui/` — these are generated, avoid manual edits
- **Module system**: ES modules throughout (`"type": "module"`)
- **TypeScript**: Lenient config — `noImplicitAny: false`, `strictNullChecks: false`
- **Error handling**: Try-catch in PHP endpoints; toast notifications (Sonner) on frontend
- **API calls**: Fetch-based via `apiBaseUrl` from `lib/api.ts`; React Query for caching/invalidation

## Architecture Notes

- Frontend and PHP API are co-deployed: Vite builds to `dist/`, API files copied to `dist/api/`
- Dual-database: MySQL for core app data (users, articles, images), Supabase for WordPress integrations
- User auth state stored in localStorage + Supabase session
- AI model selection is per-request; users manage their own API keys via KeyManagement page
- WordPress publishing supports multiple sites, scheduled posts, and auto-publish

## Environment Variables

Defined in `.env` (Vite prefix `VITE_` for frontend access):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

PHP backend config (API keys, DB credentials) lives in `api/db-config.php`.

## Key Features

1. **Multi-AI generation**: OpenAI, Gemini, Claude, Grok — switchable per article
2. **Batch generation**: Multiple articles in one operation
3. **SEO analyzer**: Real-time scoring (title, keywords, readability, structure)
4. **WordPress multi-site publishing**: Direct and scheduled posting
5. **Image generation + gallery**
6. **Multi-language support** (Chinese Traditional/Simplified, others)
7. **Dark mode** via next-themes

## Things to Watch Out For

- `api/db-config.php` contains database credentials and API keys — never commit secrets
- `.env` contains Supabase keys — already in `.gitignore`
- The `src/components/ui/` directory is shadcn/ui generated code; modify via shadcn CLI, not by hand
- `Generator.tsx` is the largest and most complex page (~954 lines) — changes here need careful testing
- No test framework is currently configured — manual testing required
