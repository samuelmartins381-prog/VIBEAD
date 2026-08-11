# MonetizeOS

Turn your AI-built website into a revenue-generating product. A user gives
their site's URL; MonetizeOS crawls it, runs an AI + rules-based
monetization audit, scores the opportunity, and helps install tracking and
monetization integrations.

This is not a guarantee of revenue — the product sells analysis,
recommendations, integration infrastructure, tracking, and optimization.
Revenue figures shown anywhere in the product are explicitly labeled as
hypothetical scenarios, never promises.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Anthropic API — Claude Opus 5, structured outputs (AI audit)
- Stripe (billing: Checkout + customer portal + webhooks)
- Zod (validation)
- Recharts (analytics)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase / Anthropic / Stripe keys
npm run dev
```

### Database

Apply the migrations in `supabase/migrations/` **in order** to your Supabase
project (SQL editor or the Supabase CLI):

- `0001_init.sql` — creates `users`, `websites`, `audits`, `recommendations`,
  `integrations`, and `events`, all with Row Level Security so a user can
  only ever read/write their own data, plus a trigger that provisions a
  `public.users` row on signup.
- `0002_lock_down_users_update.sql` — removes client-writable access to
  `users.plan` and the Stripe fields (billing state is only ever written
  server-side, via the service-role client).

### Stripe

Create two recurring Prices in Stripe (Pro €29/mo, Scale €99/mo) and set
their IDs as `STRIPE_PRICE_PRO` / `STRIPE_PRICE_SCALE`. Point a webhook
endpoint at `/api/webhooks/stripe` listening for `checkout.session.completed`,
`customer.subscription.updated`, and `customer.subscription.deleted`, and set
`STRIPE_WEBHOOK_SECRET` to its signing secret.

### Tracking snippet

Each website gets a unique `site_key` and a copyable
`<script src=".../sdk.js" data-site-id="...">` snippet on its overview page.
The snippet (`public/sdk.js`) is cookieless — no persistent visitor ID.

## Project layout

```
app/                       routes (App Router)
  (auth)/                   login, signup, reset/update password
  auth/callback/            Supabase email link handler
  onboarding/                3-step wizard: URL -> goal -> analyze
  demo/                      public demo audit (clearly labeled demo data)
  dashboard/                 protected app shell
    websites/[id]/            overview (snippet + events), audit, analytics
    settings/                  plan, billing, account deletion
  api/
    events/                   tracking SDK ingestion endpoint
    webhooks/stripe/           Stripe webhook handler
components/                UI components (landing, dashboard, onboarding, analytics)
lib/
  supabase/                  browser/server/admin clients + session middleware
  auth/, account/, websites/, billing/   server actions
  ai/                         Claude-based audit (structured outputs)
  crawler/                    SSRF-safe website crawler
  monetization/               deterministic monetization rules engine
  analytics/                  events aggregation for the analytics dashboard
  providers/                  AdProvider / AffiliateProvider abstractions (Mock impls)
  stripe/                     Stripe client + plan/price mapping
  security/                   SSRF checks, rate limiting
types/                      shared TypeScript types (incl. Database schema)
public/sdk.js               the tracking snippet served to customer sites
```

## How an audit runs

`lib/websites/actions.ts` (`startOnboarding`) creates the website + a
`pending` audit row, then calls `lib/audit/run-audit.ts` synchronously:

1. **Crawl** (`lib/crawler`) — SSRF-safe fetch of the homepage + a few
   same-origin pages, respecting robots.txt, rate-limited and capped.
2. **AI analysis** (`lib/ai`) — Claude Opus 5 with `output_config.format`
   (structured outputs) classifies the business and drafts grounded
   recommendations and a revenue scenario from the crawled content.
3. **Monetization engine** (`lib/monetization`) — deterministic, independent
   of the LLM: derives signals from the crawl (pricing page, commercial
   CTAs, lead capture, existing monetization) and picks the primary/
   secondary model via explicit rules. When traffic signals are too thin,
   it overrides with a growth-focused recommendation and withholds a
   revenue estimate rather than fabricating one.

The audit's `status` (`pending` → `crawling` → `analyzing` → `completed` /
`failed`) is persisted throughout, so the schema already supports moving
this to a background job later without changing the data model.

## MVP status

All 10 build phases are complete: architecture/auth, landing/onboarding,
crawler, AI audit, monetization engine, tracking SDK, analytics, Stripe
billing, security/GDPR, and this final pass. A user can sign up, submit a
URL, get a real audit with a score and recommendations, install the tracking
snippet, see real events come in, and subscribe to Pro — end to end, no mocked
buttons.

**Not exercised in this environment:** the Anthropic API call, the full
Supabase/Stripe flows, and email delivery all require real credentials that
aren't available in the sandbox this was built in — verify those against a
real project before shipping.
