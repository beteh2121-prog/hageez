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
- [ ] **Phase 3 — Admin dashboard.** Admin layout + auth guard, SeoEditor,
      ModalManager, products/downloads/books/orders/affiliate admin pages.
- [ ] **Phase 4 — Tests & CI.** Vitest config, all 20 unit tests, GitHub
      Actions workflows.

## Environment variables

See `.env.local.example` for the full list. Enter these in **Vercel →
Project → Settings → Environment Variables** — there is no `.env.local`
file to manage locally since there's no local dev server in this workflow.

## Database

The full SQL migration (8 tables, views, RLS policies, triggers) from the
blueprint is run once, as-is, in **Supabase Dashboard → SQL Editor**. No
changes needed there — that step was already 100% browser-based.
