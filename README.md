# MonetizeOS

Turn your AI-built website into a revenue-generating product. A user gives
their site's URL; MonetizeOS crawls it, runs an AI + rules-based
monetization audit, scores the opportunity, and helps install tracking and
monetization integrations.

This is not a guarantee of revenue — the product sells analysis,
recommendations, integration infrastructure, tracking, and optimization.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Anthropic API (AI audit)
- Stripe (billing)
- Zod (validation)
- Recharts (analytics)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase / Anthropic / Stripe keys
npm run dev
```

### Database

Apply `supabase/migrations/0001_init.sql` to your Supabase project (via the
SQL editor or the Supabase CLI). It creates the `users`, `websites`,
`audits`, `recommendations`, `integrations`, and `events` tables, all with
Row Level Security so a user can only ever read/write their own data, plus a
trigger that provisions a `public.users` row on signup.

## Project layout

```
app/                  routes (App Router)
  (auth)/              login, signup, reset/update password
  dashboard/           protected app shell
  auth/callback/       Supabase email link handler
components/           UI components
lib/
  supabase/            browser/server/admin clients + session middleware
  auth/                server actions for signup/login/logout/reset
  ai/                  Claude-based audit (Phase 4)
  crawler/             SSRF-safe website crawler (Phase 3)
  monetization/        deterministic monetization rules engine (Phase 5)
  analytics/           analytics aggregation (Phase 7)
  providers/           AdProvider / AffiliateProvider abstractions (Phase 6)
  security/            rate limiting, validation helpers
types/                 shared TypeScript types (incl. Database schema)
```

## Status

Built in phases (architecture → landing/onboarding → crawler → AI audit →
monetization engine → tracking SDK → analytics → billing → security/GDPR →
testing). See the project task list for current phase.
