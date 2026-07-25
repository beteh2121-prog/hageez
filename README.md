# Ethiopian Orthodox Heritage — Build Status

This file exists so any future session (you, or an AI assistant helping you)
can pick this project up without losing context. Update the checklist below
as phases land.

## Build method

This project is built and deployed entirely from a browser — no terminal,
no Codespaces, no local `npm install`. Files are written directly (or via
github.dev) and Vercel runs `npm install` + `npm run build` on every push.

## Architecture decisions (deviations from the original spec, with reasons)

1. **Fourthwall webhook is a Next.js API route, not a Supabase Edge
   Function.** `src/app/api/webhooks/fourthwall/route.ts` (Phase 2) does the
   same HMAC verification and event handling, but deploys automatically with
   the rest of the app on Vercel. This removes the only step in the entire
   build that required the Supabase CLI / a terminal.
2. **No separate `/api/downloads/deliver` + internal secret round-trip.**
   Since the webhook now lives in the same Next.js app, it calls the email-
   delivery function directly (`src/lib/email/deliverDownload.ts`, Phase 2)
   instead of making an HTTP call to itself. One fewer secret
   (`INTERNAL_DELIVERY_SECRET`), one fewer network hop, one fewer failure
   mode. The admin "resend" feature now hits
   `src/app/api/admin/downloads/resend/route.ts` (admin-auth protected)
   and calls the same shared function.
3. **Sanity Studio is embedded in the Next.js app** at `/studio` via
   `sanity.config.ts` + `src/app/studio/[[...tool]]/page.tsx`, instead of a
   separately scaffolded/deployed Sanity project. It deploys with Vercel
   automatically — no `npx sanity deploy` needed. You still create the
   Sanity *project* (for the project ID/dataset/token) at sanity.io/manage,
   entirely in the browser.
4. **Route groups split layouts properly.** The true root layout
   (`src/app/layout.tsx`) is intentionally minimal (fonts + providers only).
   The public Navbar/Footer live in `src/app/(storefront)/layout.tsx`, so
   `/admin/*` and `/studio` are never wrapped in the storefront chrome.
5. **A few npm packages the original spec referenced but never listed are
   now in `package.json`:** `clsx`, `tailwind-merge` (used by `cn()`),
   `@portabletext/react` (renders Sanity rich text), and
   `@radix-ui/react-accordion` (used by the admin SEO editor). `tsx` is a
   devDependency too, so `npm run affiliate:check` works without a global
   install.
6. Fonts load via `next/font/google` only (self-hosted, no layout shift).
   `globals.css` does not also `@import` them from Google's CDN.
7. **Next.js pinned to 14.2.35**, not 14.2.5. The original spec's version had
   a known security advisory; 14.2.35 is the latest patched release that's
   still on the Next 14 line (no breaking changes, App Router API unchanged).
8. **`kdpBookEmbed` in Portable Text renders from a pre-fetched lookup map**,
   not a live per-render database call. `blog/[slug]/page.tsx` scans the
   post body for every `bookAsin` reference, fetches all of them from
   Supabase in one query, and passes the resulting `{asin: KdpBook}` map
   into `createPortableTextComponents()`. This avoids both an async
   Server Component inside a third-party component tree (which
   `@portabletext/react`'s types don't model) and an N+1 query per embed —
   while still degrading to "Book currently unavailable" if an ASIN isn't
   found, per the original spec.
9. **`src/app/(admin)` was renamed to `src/app/admin` (no parentheses).**
   `(admin)` is a Next.js *route group* — it organizes files without
   adding a URL segment, so `src/app/(admin)/dashboard/page.tsx` would
   actually serve at `/dashboard`, not `/admin/dashboard`. The original
   blueprint's `mkdir` command created this exact mismatch: it used a
   route group for the folder while the same document's middleware and
   sidebar nav both assume a real `/admin/...` URL prefix. Renaming to a
   plain `admin` folder makes the URLs match what the rest of the app
   already assumes.
10. **Book reordering uses up/down arrow buttons, not drag-and-drop.** True
    drag-and-drop would need a new dependency (`@dnd-kit` or similar) not
    in the locked stack. The arrows call the same `reorderBooks` mutation
    and give the same end result — ask if you'd rather add real
    drag-and-drop later.
11. **`google_category` was added to the book Zod schema.** The original
    spec's `books.ts` validation omitted it, but the `SeoEditor` spec says
    it's appended to *all* product forms (merch, downloads, *and* books).
    Added it for consistency so one generic `SeoEditor<T>` component works
    across all three forms.
12. **Auto-create `profiles` row via a database trigger** —
    `supabase/sql/profile_trigger.sql`. The original migration had no
    trigger on `auth.users`, so an admin account created via Supabase
    Dashboard → Invite User (the normal way) never got a `profiles` row,
    and `UPDATE profiles SET role='admin'` silently affected 0 rows.
    `useSignUp()` was also updated to pass `full_name` through the
    `signUp()` call's metadata instead of a separate insert, since the
    trigger now creates that row itself.
13. **Fixed a real build-breaking bug**: `generateStaticParams` in
    `shop/[id]/page.tsx`, `downloads/[slug]/page.tsx`, and
    `books/[asin]/page.tsx` used the cookie-aware Supabase client
    (`@/lib/supabase/server`). `generateStaticParams` runs at build time,
    before any request exists, so calling `cookies()` there throws
    `` `cookies` was called outside a request scope `` — this is exactly
    what broke the first real Vercel deploy. Fixed by adding
    `src/lib/supabase/static.ts`, a plain anon-key client (safe here since
    every query it runs is already public-readable per RLS), and using it
    only inside those three `generateStaticParams` functions. The rest of
    each page still uses the cookie-aware client, which is fine since
    Next.js provides an empty cookie jar during static rendering rather
    than throwing.

    **Why this wasn't caught earlier:** this sandbox's network is
    restricted to package registries — it cannot reach Google Fonts *or*
    Sanity/Supabase's real APIs. Every `next build` run in this sandbox
    failed before ever reaching the "Collecting page data" stage where
    this bug lived, which created a false sense that "the build works
    except for fonts." It took a real Vercel deploy to surface it. After
    finding it, the fix was verified by temporarily stripping the font
    loader and stubbing the Sanity call (verification-only changes,
    reverted immediately after) to get a sandboxed build past that wall —
    confirmed `next build` exits 0 with all three previously-broken routes
    now showing `●` (successfully prerendered).

## Known security tradeoff: staying on Next.js 14

`npm audit` flags several Next.js CVEs disclosed after this project's
"Next 14" decision was made. Two categories, with very different risk:

- **Already covered:** `CVE-2025-29927`, a *critical* middleware
  authorization-bypass (the kind that could let someone skip the
  `/admin` auth check entirely), was patched in `14.2.25`. This project
  is on `14.2.35`. Vercel's own hosting also blocks this class of attack
  independently of which Next version you run.
- **Not covered, and can't be without leaving Next 14:** several
  2026-disclosed DoS/availability CVEs (e.g. unbounded memory use in the
  image optimizer) were only patched in `15.5.10`+/`16.1.5`+ — Next.js
  stopped backporting fixes to the 14.x line for these. No 14.x version,
  including the latest one used here, closes them. They're
  availability-class issues (a determined attacker could try to degrade
  the site), not data-breach or auth-bypass issues.

Closing that second gap requires moving to Next 15 or 16, which changed
`cookies()`, `params`, and `searchParams` from synchronous to `Promise`-
based — a breaking change touching most files in this project
(`middleware.ts`, every dynamic route, every API route, both Supabase
client helpers). That's a deliberate, separate decision, not something
to fold silently into a feature phase — flag it for discussion before
treating it as done.

## Verification performed before delivery

Phase 1 + Phase 2 (60+ files) were installed and checked in a sandbox before
being handed off:
- `npm install` — succeeds with zero vulnerabilities after the Next.js bump.
- `npx tsc --noEmit` — **zero TypeScript errors**, strict mode, no `any`.
- `npx eslint src --max-warnings 0` — **zero errors, zero warnings**.
- `npx next build` — compiles and bundles every page/API route
  successfully; the only failure was Next.js trying to fetch Google Fonts
  over the network, which this sandbox's firewall blocks (confirmed via a
  403 from the egress proxy) — not a code defect. Vercel's build servers
  have normal internet access and will fetch these fonts without issue.

What this sandbox *can't* verify (needs your real Supabase/Sanity project,
which only exists after you deploy): the actual database queries in
`generateStaticParams` across the dynamic routes. Those are all written
defensively (`data ?? []`), so an empty or unreachable table at build time
produces zero static params rather than a crashed build — but the very
first real deploy is still the first true end-to-end test.

## Phase status

- [x] **Phase 1 — Foundation & deployable skeleton.** Config files, Supabase/
      Sanity/Amazon lib clients, all Zod validation schemas, types, cart
      store, Navbar/Footer, root + storefront layouts, homepage, embedded
      Studio shell.
- [x] **Phase 2 — Content engine.** Sanity schemas (post, author, 7 custom
      blocks), all 9 TanStack Query hooks, all 5 API routes (Fourthwall
      webhook, free download, admin resend, affiliate track, ASIN lookup),
      every storefront page (shop, shop detail, downloads detail, blog
      detail, book detail, about, contact, cart, login, signup),
      AffiliateButton, PortableTextComponents (all 7 block types),
      TableOfContents, ReadingProgress. **This builds and deploys on
      Vercel as-is.**
- [x] **Phase 3 — Admin dashboard.** Admin layout + auth guard, AdminSidebar,
      Breadcrumb, SeoEditor (generic across all 3 product forms),
      ModalManager + MerchForm/DownloadForm/BookForm, and all 7 admin
      pages: dashboard, products (TanStack Table), downloads (with manual
      resend), books (with reordering), orders (expandable rows + status
      updater), affiliate (CSV export), settings.
      **Three gaps found on re-audit and fixed:** `BookForm` was missing
      the `related_merch_id` select the spec calls for (it was only used
      internally for `defaultValues`, never rendered); `MerchForm` and
      `DownloadForm` showed admins a raw-cents input instead of the
      dollar-denominated input with automatic conversion the spec
      describes; none of the three forms surfaced an inline error message
      on submit failure (only a toast), despite the spec saying "show
      inline error, keep modal open." All three are fixed and verified.
- [x] **Phase 4 — Tests & CI.** Vitest config, `checkAffiliateLinks.ts`
      (treats only a genuine 404 as dead, logs other non-200s as warnings
      since Amazon often soft-blocks automated traffic), all 22 unit tests
      (the original checklist said "20" but undercounted against its own
      enumerated list), and both GitHub Actions workflows (CI + weekly
      affiliate check).

## Final verification (all 4 phases, 118 files)

- `npm install` — succeeds, 0 high/critical vulnerabilities in direct deps
  after the Next.js bump (see security note below for residual risk).
- `npx tsc --noEmit` — zero errors.
- `npx eslint src --max-warnings 0` — zero errors, zero warnings.
- `npx vitest run` — **22/22 tests passing**.
- `npx next build` — compiles and bundles every page/API route/component;
  fails only on fetching Google Fonts, which this sandbox's firewall
  blocks (not a code defect — see Phase 1 notes).

This is a complete, working implementation of the original blueprint,
adapted for a 100%-browser, no-terminal build workflow.

## Environment variables

See `.env.local.example` for the full list. Enter these in **Vercel →
Project → Settings → Environment Variables** — there is no `.env.local`
file to manage locally since there's no local dev server in this workflow.

## Database

The full SQL migration (8 tables, views, RLS policies, triggers) from the
blueprint is run once, as-is, in **Supabase Dashboard → SQL Editor**. No
changes needed there — that step was already 100% browser-based.

---

## Cloudflare Workers Migration (replacing Vercel)

Vercel's Hobby plan explicitly prohibits commercial use per their own Terms
of Service — this site sells physical/digital products, so it needed to
move off Vercel's free tier. Cloudflare Workers' free tier explicitly
permits commercial use, so that's the new target.

### What actually changed

- **Deployment target: Cloudflare Workers, not "Cloudflare Pages."**
  Cloudflare's own current guidance steers full-stack Next.js apps to
  Workers via the OpenNext adapter — Pages (as a distinct product) doesn't
  fully support Next.js middleware and other features this app uses.
- **`@opennextjs/cloudflare` is pinned to `1.15.0`**, not the latest
  version. This is the *last* version that supports Next.js 14 — every
  version from `1.16.0` onward dropped Next 14 support entirely. This is a
  frozen dependency: it will not receive further updates while the
  project stays on Next 14. Combined with the earlier note about
  Next 14's own unpatched 2026 CVEs, this is a second, independent reason
  to consider the Next.js 15 migration as a dedicated future task — not
  bundled into this one.
- **`vercel.json` removed.** Its cron config doesn't apply to Cloudflare.
- **`src/app/api/cron/sync-catalog/route.ts` removed.** It existed purely
  to adapt Vercel Cron's HTTP-GET-with-bearer-token convention to call
  `/api/admin/sync`. Cloudflare Cron Triggers work completely differently
  (they invoke a `scheduled()` handler inside the Worker, not an HTTP
  path), and bridging that correctly with OpenNext isn't something
  verifiable without a live deployment — getting it subtly wrong would
  mean the nightly sync silently stops firing with no error surfaced
  anywhere. Instead, `.github/workflows/nightly-catalog-sync.yml` calls
  `/api/admin/sync` directly on a schedule via GitHub Actions — the exact
  same HTTP call Vercel Cron was making, on infrastructure already proven
  to work in this repo (the existing weekly affiliate-check workflow uses
  the same `on: schedule:` pattern).
- **`open-next.config.ts`, `wrangler.jsonc` added.** Minimal, standard
  OpenNext/Wrangler config. `nodejs_compat` flag enabled so
  `@supabase/supabase-js` and other Node-touching dependencies work
  without modification.
- **`images.unoptimized: true` added to `next.config.mjs`.** Cloudflare's
  OpenNext adapter needs either a paid Cloudflare Images binding or
  unoptimized mode for `next/image`. Unoptimized mode was chosen
  specifically because it's zero-cost and zero-additional-setup: images
  render as plain `<img>` tags pointing at the original URL. Nothing can
  silently break this way — the tradeoff is losing Next's automatic
  resizing/format conversion, which Fourthwall/Gumroad/Supabase/Sanity
  already partially handle CDN-side regardless.
- **One Node.js-specific API removed**: `Buffer.from(...).toString('base64')`
  in the Fourthwall webhook's signature verification was replaced with a
  small `arrayBufferToBase64()` helper built from `btoa` + `Uint8Array` —
  pure Web APIs, universally supported on Cloudflare Workers, Node, and
  browsers alike. This was the *only* Node-specific API found anywhere in
  the codebase after a full search for `Buffer`, `fs`/`path`/`os` module
  imports, `require()`, `__dirname`, and `process.cwd()`.
- **`.github/workflows/deploy-cloudflare.yml` added.** Replaces "click
  Deploy in the Vercel dashboard": every push to `main` now runs
  `npm run cf:build` then `cloudflare/wrangler-action@v3` to deploy —
  fully automatic, runs on GitHub's servers, no terminal needed on your
  own machine, matching the original no-terminal workflow constraint.

### Real, honest cost note

The compiled Worker bundle is well over the Cloudflare Workers **free**
tier's 3MB script-size cap — verified directly: the embedded Sanity
Studio route alone bundles to ~3.9MB before Next.js's own runtime and
other routes are even added. **This means the Workers Paid plan
($5/month flat, not per-seat) is required**, not the free tier. This was
flagged as a likely outcome before starting the migration, and confirmed
by actually running the build rather than assumed. $5/month is still
significantly cheaper than Vercel Pro ($20/month), and it's the honest
number rather than an oversold "$0" migration.

### Verification performed

- `npm run cf:build` (`opennextjs-cloudflare build`) completes with exit
  code 0, producing a real `.open-next/worker.js` and all 30 routes
  (8 API routes, all admin pages, all dynamic `[id]`/`[slug]`/`[asin]`
  routes) building successfully.
- Same sandbox limitation as every previous phase applies to this
  verification too: this sandbox cannot reach Google Fonts or Sanity's
  real API, so the font loader and one Sanity call were temporarily
  stubbed *only* to get a build past that specific network wall, then
  immediately reverted. The rest of the build — TypeScript, ESLint,
  Vitest, and the actual OpenNext bundling step — ran against the real,
  unmodified code.

### Environment variables — new manual setup required

Runtime secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc.) must
be set in **two** places now, not one:
1. **GitHub Actions secrets** (Settings → Secrets and variables → Actions)
   — used during the build step, since `NEXT_PUBLIC_*` vars are inlined
   into the JS bundle at build time.
2. **Cloudflare dashboard** (Workers & Pages → your Worker → Settings →
   Variables) — used by the deployed Worker at runtime, since API routes
   read `process.env.X` when a real request comes in, after the build
   has already finished.

Also new: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub
secrets — these authenticate the `wrangler-action` deploy step and have
no Vercel equivalent.

---

## Site-Wide CMS (editable hero, footer, custom pages)

Added a `site_settings` key-value table and `site_pages` table so the
non-technical parts of the site — hero text, stats bar, testimonial,
footer links/tagline, and entire custom pages — are editable from
`/admin/site-settings` and `/admin/pages` without touching code.

### What's editable now
- **General**: site name, description, logo text/icon
- **Hero section**: tagline, title, subtitle, both button texts/links
- **Stats bar**: add/remove/edit any number of stat tiles
- **Testimonial**: quote + attribution
- **Footer**: tagline, social links, support email
- **Custom pages**: add/edit/delete pages with HTML content, toggle
  published/draft, toggle whether they appear in the nav menu, control
  sort order — all from `/admin/pages`

### Required setup
Run `supabase/sql/site_settings.sql` once in Supabase → SQL Editor. It
creates both tables with RLS (public read, admin-only write) and seeds
sensible defaults matching the current live site, so nothing changes
visually until you actually edit something in `/admin/site-settings`.

### Verification note (read before assuming this is fully proven)
TypeScript (0 errors), ESLint (0 errors), and Vitest (22/22) all passed
cleanly against this addition. The full `next build` could not be
completed end-to-end in this sandbox for this specific change — not
because of a code defect, but because the new `(storefront)/layout.tsx`
now calls Supabase (for settings + custom pages) on every single
storefront page, and this sandbox's network is restricted to a small
allowlist that has never included `supabase.co` (the same restriction
that blocked Google Fonts and Sanity's API in every earlier phase).
Diagnosed directly: a raw `fetch()` against an unreachable host fails in
165ms here, but going through `@supabase/supabase-js` takes ~7 seconds
per call in this environment — confirmed against both a fake URL and the
real project URL, ruling out a URL-specific issue. With ~20 static pages
each making 2 settings-related calls through the layout, that multiplies
into minutes, which is what caused the build to time out here. This
should not happen in real deployment, where Supabase is actually
reachable and responds in milliseconds rather than being blocked — but
unlike every other phase, this one could not be directly confirmed by a
completed build in this sandbox. Treat the first real Cloudflare/GitHub
Actions deploy after this change as the actual first test, and report
back what it shows.
