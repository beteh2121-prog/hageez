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

## Phase status

- [x] **Phase 1 — Foundation & deployable skeleton.** Config files, Supabase/
      Sanity/Amazon lib clients, all Zod validation schemas, types, cart
      store, Navbar/Footer, root + storefront layouts, homepage, embedded
      Studio shell. **This builds and deploys on Vercel as-is.**
- [ ] **Phase 2 — Content engine.** Sanity schemas (post, author, 7 custom
      blocks), TanStack Query hooks, all API routes, storefront pages
      (shop, downloads, blog, books, cart, login), AffiliateButton,
      PortableTextComponents, TableOfContents, ReadingProgress.
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
