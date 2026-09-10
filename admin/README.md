# Akaiunsan Admin

Back-office dashboard for the Akaiunsan platform — manage services, job requests,
customers, banners, supporters, and business customers.

Built with React 19, Vite, TanStack Router, TanStack Query, and Tailwind v4
(component primitives from shadcn/ui; see attribution below).

## Quick start

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

Copy `.env.example` to `.env.local` for local overrides:

- `VITE_API_BASE_URL` — backend API origin (default: `http://localhost:5000` in dev)

## Auth

Sign-in posts to the backend (`POST /auth/admin/signin`). Only accounts with
the `admin` role may sign in; every `/_authenticated` route is guarded and
redirects to `/sign-in` when the session is missing or expired. See
[`/DESIGN.md`](../DESIGN.md) for the design system and
[`/docs/api-reference.md`](../docs/api-reference.md) for the API contract.

## Scripts

```bash
pnpm build     # tsc -b && vite build
pnpm lint
pnpm test      # vitest (browser mode, playwright)
```

## Attribution

UI component primitives are adapted from the open-source
[shadcn-admin](https://github.com/satnaing/shadcn-admin) template
(MIT-licensed) by [Satnaing](https://github.com/satnaing), restyled to the
Akaiunsan "Living Standard" design system.
