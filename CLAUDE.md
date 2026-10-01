@AGENTS.md

# sg-match

A study-group matching app: students post study requests, create study groups, and join groups. Early stage — the UI is still the create-next-app starter; the database layer is the most developed part.

## Stack

- Next.js 16.3.8 (App Router, `src/app`), React 19, TypeScript (strict), Tailwind CSS v4
- PostgreSQL 17 + Drizzle ORM (`postgres-js` driver) + drizzle-kit
- Firebase (auth; `users.firebaseUid` links a user to a Firebase account). No Firebase code exists yet, only env vars.
- Package manager: **bun** (`bun.lock`). Use `bun add` / `bun run`, not npm/yarn.
- Path alias: `@/*` → `src/*`

## Commands

```bash
bun run dev          # next dev
bun run build        # next build
bun run lint         # eslint
docker compose up -d # local Postgres (user/pass postgres/postgres, db sg_match, port 5432)
bun run db:generate  # drizzle-kit generate (create migration from schema)
bun run db:migrate   # apply migrations
bun run db:push      # push schema directly (dev only)
bun run db:studio    # drizzle studio
```

No test runner is configured.

## Environment

`.env` is gitignored (only `.env.example` may be committed). Required variables, validated in [src/config/env.ts](src/config/env.ts):

`DATABASE_URL`, `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_WEB_API_KEY`

Always read env through `import { env } from "@/config/env"`, never `process.env` directly. The module throws at import time if a required variable is missing, and it loads `.env` itself via `@next/env` so it also works from scripts and drizzle-kit.

## Layout

```
src/
├── app/                      # Next.js routes (layout.tsx, page.tsx, globals.css)
├── config/env.ts             # env loading + validation
└── db/
    ├── index.ts              # `db` client (server-only, globalThis-cached), `DB` type
    ├── helper/
    │   ├── id-generator.ts   # generateId(prefix) → "<prefix>_<uuid>"
    │   └── timestamps-helper.ts  # `timestamps` spread: createdAt / updatedAt
    ├── migrations/           # generated SQL + meta (commit these)
    └── schema/
        ├── index.ts          # re-exports enums and every table
        ├── enums/index.ts    # all pgEnums
        └── tables/           # one file per table/domain
drizzle.config.ts
compose.yaml
```

## Data model

| Table | ID prefix | Notes |
|---|---|---|
| `users` | `usr` | `firebaseUid` and `email` unique; `role` is `student` or `admin` |
| `study_requests` | `req` | A user's request to find a group; `userId` is `set null` on user delete |
| `study_groups` | `grp` | `ownerId` is `set null` on user delete; `maxMembers` defaults to 6 |
| `group_memberships` | `mem` | unique `(userId, studyGroupId)`; `status` pending/accepted/rejected/withdrawn; `role` owner/member; cascade on delete |
| `skills` | `skl` | unique `name`, optional `category` |
| `study_request_skills`, `study_group_skills` | none | join tables with composite PK and an index on `skillId` |

Enums (`src/db/schema/enums/index.ts`): `experience_level`, `study_mode`, `membership_status`, `user_role`, `group_role`.

## Conventions

- **IDs** are `text` primary keys of the form `<prefix>_<uuid>`, generated with `$defaultFn(() => generateId("xxx"))`. Don't use serial/uuid column types.
- **Timestamps**: spread `...timestamps` into every table (timestamptz, precision 3, `updatedAt` auto-updates via `$onUpdateFn`).
- **New table**: add `src/db/schema/tables/<kebab-name>.ts`, export it from `src/db/schema/index.ts`, export `typeof table.$inferSelect` (and `$inferInsert` if useful), then run `bun run db:generate`.
- **New enum**: add to `enums/index.ts`; tables import it from `../enums`.
- Only import `db` from server code (`src/db/index.ts` imports `server-only`; importing it into a client component fails the build).
- Array columns (`availability`, `interests`) are `text[]` with `notNull().default([])`.
- Code style in `src/db`: double quotes, semicolons, 2-space indentation in schema/helper files (`src/db/index.ts` uses tabs; keep whatever the file already uses).

## Auth

Email/password auth via Firebase, handled entirely server-side. The browser never talks to Firebase; it calls our `/api/auth/*` routes.

- `POST /api/auth/sign-up | sign-in | sign-out`, `GET /api/auth/me` (`src/app/api/auth/*/route.ts`)
- Flow: Identity Toolkit REST (`src/lib/firebase/identity-toolkit.ts`, uses `FIREBASE_WEB_API_KEY`) → Firebase session cookie (`session`, httpOnly) via `firebase-admin` → SQL `users` row created on first login (`src/lib/auth/session.ts`).
- Server: use `requireUser()` in route handlers (throws 401) and `getSessionUser()` in server components. Wrap handlers in `handleRoute()` from `src/lib/api/errors.ts` and throw `ApiError` for expected failures.
- Client: `src/api/` (`axiosClient` in `axios-client.ts` with an interceptor that turns failures into `ApiClientError`; `authApi`; `queryKeys`; base URL `NEXT_PUBLIC_API_URL`, default `/api`, so API paths are written without the `/api` prefix) → `src/hooks/auth/` (`use-auth.ts` holds `useSignIn`/`useSignUp` plus `useSignInForm`/`useSignUpForm`, which wrap React Hook Form + `zodResolver`) → `src/components/auth/` (just `sign-in.tsx` and `sign-up.tsx`, picked by `?mode=` on `/auth`; shared `FormField`/`SubmitButton` are in `src/components/common/`). Add new features the same way: api function, hook, component.
- **Errors:** API failures are toasted automatically by the `MutationCache`/`QueryCache` handlers in `src/utils/queryClient.ts` (mounted by `RootWrapper` in `src/components/layout/root-wrapper.tsx`) (opt out with `meta: { silent: true }`; 401 on queries is ignored). Don't add per-hook toasts or inline alert banners. Form validation errors are shown inline under each field via `FormField`; server `fieldErrors` are also set on the field in the form hooks. Password fields get the show/hide eye automatically (`type="password"` in `FormField`, or `PasswordInput` directly).
- Firebase env vars are optional in `src/config/env.ts`; call `requireEnv("FIREBASE_...")` where one is needed so a missing value fails with a clear message at use time.
- **Constants:** all app-wide constants (routes, API base URL/endpoints/timeouts, error messages, query defaults, session cookie settings, Firebase error map, form field lists) live in `src/config/constants.ts`. Add new ones there instead of declaring them in the file that uses them; no secrets (those go through `env.ts`).
- Zod schemas live in `src/schemas/` and are shared by the forms and the route handlers.
- `getAdminAuth()` is lazy on purpose so the build doesn't need valid Firebase credentials.

## UI and design system

shadcn/ui (style `radix-nova`, Radix primitives, lucide icons) on Tailwind v4. Components live in `src/components/ui/` and are added with `bunx --bun shadcn@latest add <name>`.

- **Theme:** light, blue-indigo with a solid deep-indigo sidebar (`--sidebar*` tokens; sidebar text must use `text-sidebar-*`, not `text-muted-foreground`). All colors are oklch CSS variables in `src/app/globals.css` (`:root`, plus a tuned `.dark`). Neutrals are tinted blue (hue ~269); primary is `oklch(0.5 0.21 272)`. Never hardcode colors; use tokens (`bg-primary`, `text-muted-foreground`, `border-border`, ...).
- **Type:** Bricolage Grotesque for headings (`font-heading`, applied to `h1`-`h3` globally), Geist for body.
- **Shape and size:** `--radius` is 0.875rem. Controls are `h-10` (buttons `lg` is `h-11`), cards use 6-unit padding with a soft border and shadow. We edited the generated `button`, `input` and `card` for this; keep those edits when re-adding components.
- **Compose, don't restyle:** build screens from `ui/` components (`Card`, `Button`, `Input`, `Label`, `Alert`, `Tabs`, `Badge`, `Avatar`, `DropdownMenu`, `Skeleton`, `Sonner`). Toasts via `toast` from `sonner`; the `<Toaster />` is in the root layout.
- **Brand:** `src/components/common/brand.tsx` (two overlapping circles).
- **App shell:** signed-in pages live in the `src/app/(app)/` route group. Its `layout.tsx` checks the session on the server (redirects to `/auth`) and renders the shadcn sidebar (`components/layout/app-sidebar.tsx`, inset + collapsible to icons), top bar and `user-menu.tsx` (account card in the sidebar footer with sign out). Nav items come from `APP_NAV` in `src/config/constants.ts` (`href: null` = not built yet, shown disabled with a "Soon" badge); add the icon in `NAV_ICONS` in `app-sidebar.tsx`. New signed-in pages go inside `(app)`; the layout owns the page gutters (`p-4 sm:p-6 lg:p-8`, content fills the width), so pages must not add their own `max-w-*`, `mx-auto` or outer padding. `getSessionUser()` is memoized per request, so layout and page can both call it.
- `cn()` is in `src/lib/utils.ts` (clsx + tailwind-merge). The shadcn CLI once generated `import { cn } from "cn"` (a third-party npm package); if that reappears in a newly added component, change it to `@/lib/utils` and `bun remove cn`. `shadcn add` also asks to overwrite files we customized (`button`, `input`, `card`); don't overwrite them.

## Known issues

- [README.md](README.md) describes the older layout (`drizzle/`, `src/db/schema.ts`) and references `.env.example`, which doesn't exist yet.
- Google sign-in is not implemented (would need the Firebase client SDK).
