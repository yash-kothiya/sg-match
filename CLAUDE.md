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
bun run test         # bun test
docker compose up -d # local Postgres (user/pass postgres/postgres, db sg_match, port 5432)
bun run db:generate  # drizzle-kit generate (create migration from schema)
bun run db:migrate   # apply migrations
bun run db:push      # push schema directly (dev only)
bun run db:studio    # drizzle studio
bun run db:seed <name>  # run src/db/seeder/<name>.ts: skills | users | groups | requests | all | unseed
```

Tests: `bun run test` (bun's built-in runner; files named `*.test.ts`, currently `src/lib/matching/score.test.ts`).

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
| `users` | `usr` | `firebaseUid` and `email` unique; `role` is `student` or `admin`; study profile (`university`, `bio`, `experienceLevel`, `studyMode`, `location`, `availability[]`, `interests[]`) filled by onboarding; `onboardedAt` is null until onboarding is finished |
| `study_requests` | `req` | A user's request to find a group; `userId` is `set null` on user delete |
| `study_groups` | `grp` | `ownerId` is `set null` on user delete; `maxMembers` defaults to 6 |
| `group_memberships` | `mem` | unique `(userId, studyGroupId)`; `status` pending/accepted/rejected/withdrawn; `role` owner/member; cascade on delete |
| `skills` | `skl` | unique `name`, optional `category` |
| `request_matches` | none | stored score of each request against each group (see Stored match scores) |
| `user_skills`, `study_request_skills`, `study_group_skills` | none | join tables with composite PK and an index on `skillId` |

Enums (`src/db/schema/enums/index.ts`): `experience_level`, `study_mode`, `membership_status`, `user_role`, `group_role`.

## Conventions

- **IDs** are `text` primary keys of the form `<prefix>_<uuid>`, generated with `$defaultFn(() => generateId("xxx"))`. Don't use serial/uuid column types.
- **Timestamps**: spread `...timestamps` into every table (timestamptz, precision 3, `updatedAt` auto-updates via `$onUpdateFn`).
- **New table**: add `src/db/schema/tables/<kebab-name>.ts`, export it from `src/db/schema/index.ts`, export `typeof table.$inferSelect` (and `$inferInsert` if useful), then run `bun run db:generate`.
- **New enum**: add to `enums/index.ts`; tables import it from `../enums`.
- Only import `db` from server code (`src/db/index.ts` imports `server-only`; importing it into a client component fails the build).
- Array columns (`availability`, `interests`) are `text[]` with `notNull().default([])`.
- Code style in `src/db`: double quotes, semicolons, 2-space indentation in schema/helper files (`src/db/index.ts` uses tabs; keep whatever the file already uses).

## Matching

Pure engine in `src/lib/matching/` (no DB or framework imports): `weights.ts` is the whole model (skills 35, topics 20, availability 15, level 10, mode 10, location 10; weights sum to 100 and a test asserts it), `score.ts` has `scoreGroup`, `isEligible` (drops full groups, the requester's own groups and groups they already belong to) and `rankGroups` (deterministic tie-breaks: score, skills, topics, name, id). Each result carries a score, a confidence band, 2-3 `reasons` and honest `caveats` (e.g. "Meets in person, but you prefer online"). `services/matches.service.ts` loads requests/groups from Postgres and calls the engine; `GET /api/requests` lists the user's own requests, then the shared sample requests (owners with ids starting `usr_seed_`, see `SAMPLE_USER_ID_PREFIX`), `GET /api/matches?requestId=&limit=` returns the ranked groups and the method explainer. Types for responses are in `src/schemas/matching.ts`. The tests run the engine on the real seed data, including the golden case. To change scoring, edit `weights.ts` and the tests, nothing else.

## Dashboard

`/` (`(protected)/(app)/page.tsx`) is a server-rendered, read-only overview built by `services/dashboard.service.ts` (`getDashboard`) and rendered by `components/dashboard/dashboard.tsx`: a welcome header with Find matches / New group, four stat cards (my groups, my requests, waiting for a reply, to review), "Top matches" for the student's newest request (top 3 via `getMatches`, falls back to empty if scoring fails so the page still loads), "My groups", a "Needs your attention" list (people waiting on groups you own, groups you're waiting on, profile completion, no request yet), and profile strength. Profile strength logic is shared with the profile page in `lib/profile-strength.ts`. Add new dashboard data in the service, not in the component.

## Stored match scores

Scores are persisted in `request_matches` (one row per request × group: `score`, `confidence`, `reasons`, `caveats`, per-signal `signals` jsonb, `computedAt`; PK `(studyRequestId, studyGroupId)`, both FKs cascade). Writers (all in `services/matches.service.ts`): `refreshRequestScores(requestId)` scores a request against **every** group and replaces its rows (called by `createRequest`); `refreshGroupScores(groupId)` scores one group against every request (called by `createGroup` and `updateGroup`). Reading (`getMatches` for stored requests) loads the rows, then applies eligibility live (full groups, the requester's own groups, groups they're already in are filtered at read time because spots change without the score changing), and **heals**: a group with no row, or edited after `computedAt` (`study_groups.updatedAt`), is rescored on the spot and saved. This also scores the seeded sample requests on first view and any of the user's old requests (`listRequests` scores unscored own requests). `listRequests` attaches `topScore` (best eligible stored score) to each request, shown as a badge in the left panel; the results header shows when the scores were saved (`MatchesResponse.scoredAt`). Deleting a request or group removes its rows by cascade. Scoring stays in the pure engine (`lib/matching`), so changing weights means rescoring: delete the rows (`delete from request_matches`) and they are rebuilt on read.

## Matches page (student's view)

`/matches` (`(protected)/(app)/matches/page.tsx`, client UI in `src/components/matches/`) is written for the signed-in student, not for browsing other people's data. It opens on the student's own first request (else the first sample). Students create **their own requests** (`NewRequestDialog`, a centred dialog, prefilled from their profile, using the shared field groups from `profile-fields.tsx`; `POST /api/requests`, max `MAX_REQUESTS_PER_USER`; `DELETE /api/requests/[id]` only for your own, behind a `ConfirmDialog` from `components/common/confirm-dialog.tsx`; use it for any destructive action instead of `window.confirm`) and each gets its own ranked groups. The 12 seeded requests are demo data under a collapsed **"Try a sample"** section (`RequestSummary.kind` is `mine | sample`). On each match card a student can **Request to join** (`POST /api/groups/[id]/join` creates a `pending` `group_memberships` row; idempotent; full groups and own groups are rejected with 409) or **Cancel** (`DELETE` sets `withdrawn`); results carry `group.joinStatus`. Server logic: `services/requests.service.ts`, `services/groups.service.ts`, `services/matches.service.ts`. Hooks: `hooks/matches/use-matches.ts` (`useCreateRequest`, `useDeleteRequest`, `useJoinGroup`). `handleRoute<Ctx>()` passes Next's route context so dynamic-param routes work.

Layout: request on the left, matches on the right, both cards. Left: `request-list.tsx` (header with a New request button, "My requests" with an always-visible delete icon per item, collapsed samples); under `lg` it collapses into the `RequestSelect` dropdown. On desktop the whole page is one screen tall (`lg:-m-5 lg:h-[calc(100svh-2.5rem)]`: the page cancels most of the shell's 2rem gutter, leaving 0.75rem, so 2.5rem = the inset margin plus that gutter top and bottom; this is the one page that deliberately breaks the "no outer padding of your own" rule) with no page scroll; the left panel and the right card scroll independently, and under `lg` it stacks and the page scrolls normally. Right: one full-height card (header with the title, counts, "How scoring works" and the format filter from `mode-filter.tsx`; a scrolling body) holding one lean card per match (`match-card.tsx`: score ring, rank and confidence, name, subject/level/format/location, the top two reasons plus one caveat, spots left, the join action in the card's top-right; the rest lives behind "Full breakdown") which opens `match-sheet.tsx`, a side panel on desktop / bottom sheet on phones. "How scoring works" opens a side sheet built from the engine's weights. It fetches the top `MAX_MATCH_LIMIT` (10) via `useMatches`; filtering is client-side and each card keeps its true rank. Confidence colours (`CONFIDENCE_STYLES`) are in `src/config/constants.ts`. Loading, empty, filtered-empty and error states are inline (hooks are `meta: { silent: true }`). `?request=<id>` selects a request.

## Study groups (`/groups`, `/groups/[id]`)

`(protected)/(app)/groups/` (UI in `src/components/groups/`). The list page (`groups-page.tsx`) loads every group once (`GET /api/groups`, `useGroups`) with the user's `myStatus` on each (`owner | member | pending | rejected | none`), and does tabs (**My groups**, **Requests**, **Explore**), search, format/level filters and "open spots only" client-side. A banner shows how many people are waiting on groups the user owns. `GroupCard` has one action from `status-action.tsx` (join / request sent + cancel / leave / manage / declined / full). **New group** opens `group-form-dialog.tsx` (also used to edit; prefilled from the profile when creating; shared field groups from `profile-fields.tsx` plus name, subject, description, `maxMembers`). The detail page (`group-detail.tsx`, server-loaded via `getGroup`, 404 → `notFound()`) shows the header, about/skills/topics/times, members with a capacity bar, and for the owner: **Requests to join** (Accept/Decline with bio and skills), Edit, Delete and Remove member (all behind `ConfirmDialog`). Server rules in `services/groups.service.ts`: only the owner can edit, delete, decide or remove (403); accepting re-checks capacity inside a transaction with the group row locked (409 when full); a declined user can't re-ask; owners can't leave (delete instead); lowering `maxMembers` below the current count is rejected; max `MAX_OWNED_GROUPS` (5) per user; creating a group also inserts the owner's `accepted` membership. Routes: `GET/POST /api/groups`, `GET/PATCH/DELETE /api/groups/[id]`, `POST /api/groups/[id]/leave`, `POST/DELETE /api/groups/[id]/join`, `PATCH/DELETE /api/groups/[id]/members/[userId]` (the list route also accepts `scope`, `q`, `mode`, `level`, `open` filters). Mutations invalidate `queryKeys.groups` and the matches queries. Group seed owners are fictional users, so requests to seeded groups stay pending; only groups a real student creates can be approved.

## Seed data

`src/db/seeder/` holds idempotent seeders (each exports `seed()`; `index.ts` is the runner). Data lives in `skills.ts` (37 skills) and `_data/{users,groups,requests}.ts`: 12 fictional users (they can't sign in), 28 study groups (Dataset B, 3 of them full) and 12 study requests (Dataset A). Seeded rows have deterministic ids (`usr_seed_01`, `grp_seed_01`, `req_seed_01`, `mem_seed_<grp>_<usr>`), so re-running updates in place and `bun run db:seed unseed` removes them. `bun run db:seed all` runs skills, users, groups, requests in order. **Golden case:** request R1 (Priya Nair, intermediate, online, evenings + weekend mornings, Algorithms / Data structures / Python) must rank group 01 "Algorithms Sprint" first; group 03 (in person) and group 02 (advanced, weekend-only, Java) are the decoys. When changing seed data, keep skill names identical to `skills.ts`.

## Services

Server-side business logic lives in `src/services/` as `<domain>.service.ts` (server-only; they use the DB or call external APIs): `auth.service.ts` (session cookie, `getSessionUser` / `requireSessionUser` / `requireUser`, `ensureUserProfile`), `profile.service.ts` (`getProfile`, `saveProfile`), `skills.service.ts` (`listSkills`), `requests.service.ts` (`createRequest`, `deleteRequest`), `groups.service.ts` (`requestToJoin`, `cancelJoinRequest`), `matches.service.ts`, `identity-toolkit.service.ts` (Firebase REST sign-in/up). Route handlers and server components stay thin and call services; put new queries and rules in a service, not in a route. `src/lib/` keeps framework helpers only (`api/errors.ts`, `firebase/admin.ts`, `utils.ts`).

## Auth

Email/password auth via Firebase, handled entirely server-side. The browser never talks to Firebase; it calls our `/api/auth/*` routes.

- `POST /api/auth/sign-up | sign-in | sign-out`, `GET /api/auth/me` (`src/app/api/auth/*/route.ts`)
- Flow: Identity Toolkit REST (`src/services/identity-toolkit.service.ts`, uses `FIREBASE_WEB_API_KEY`) → Firebase session cookie (`session`, httpOnly) via `firebase-admin` → SQL `users` row created on first login (`src/services/auth.service.ts`).
- Server: use `requireUser()` in route handlers (throws 401) and `getSessionUser()` in server components. Wrap handlers in `handleRoute()` from `src/lib/api/errors.ts` and throw `ApiError` for expected failures.
- Client: `src/api/` (`axiosClient` in `axios-client.ts` with an interceptor that turns failures into `ApiClientError`; `authApi`; `queryKeys`; base URL `NEXT_PUBLIC_API_URL`, default `/api`, so API paths are written without the `/api` prefix) → `src/hooks/auth/` (`use-auth.ts` holds `useSignIn`/`useSignUp` plus `useSignInForm`/`useSignUpForm`, which wrap React Hook Form + `zodResolver`) → `src/components/auth/` (just `sign-in.tsx` and `sign-up.tsx`, picked by `?mode=` on `/auth`; shared `FormField`/`SubmitButton` are in `src/components/common/`). Add new features the same way: api function, hook, component.
- **Errors:** API failures are toasted automatically by the `MutationCache`/`QueryCache` handlers in `src/utils/queryClient.ts` (mounted by `RootWrapper` in `src/components/layout/root-wrapper.tsx`) (opt out with `meta: { silent: true }`; 401 on queries is ignored). Don't add per-hook toasts or inline alert banners. Form validation errors are shown inline under each field via `FormField`; server `fieldErrors` are also set on the field in the form hooks. Password fields get the show/hide eye automatically (`type="password"` in `FormField`, or `PasswordInput` directly).
- Firebase env vars are optional in `src/config/env.ts`; call `requireEnv("FIREBASE_...")` where one is needed so a missing value fails with a clear message at use time.
- **Constants:** all app-wide constants (routes, API base URL/endpoints/timeouts, error messages, query defaults, session cookie settings, Firebase error map, form field lists) live in `src/config/constants.ts`. Add new ones there instead of declaring them in the file that uses them; no secrets (those go through `env.ts`).
- Zod schemas live in `src/schemas/` and are shared by the forms and the route handlers.
- `getAdminAuth()` is lazy on purpose so the build doesn't need valid Firebase credentials.

## Onboarding

Route layout: `/auth` is public. Every other page lives in `src/app/(protected)/`, whose layout calls `requireSessionUser()` (redirects to `/auth`); inside it, `(app)/` is the sidebar shell and `onboarding/` is the standalone wizard. API routes stay in `src/app/api/` and use `requireUser()`. New signed-in pages go in `(protected)`, normally in `(app)`; in server components use `requireSessionUser()` rather than repeating redirects. Route groups don't change URLs.

New users must finish a 4-step wizard (about you, how you study, skills, time and topics) before reaching the app: `(protected)/(app)/layout.tsx` redirects users with `onboarded === false` to `/onboarding`, and `/onboarding` redirects finished users home. Flow: `components/onboarding/onboarding-wizard.tsx` (split screen: indigo stepper rail on the left, one step at a time on the right with a pinned Back/Continue bar; completed steps in the rail are clickable; the rail collapses to a progress bar under `lg`) → `hooks/profile/use-onboarding.ts` (step state + one RHF form; each step validates only its fields via `ONBOARDING_STEP_FIELDS`) → `POST /api/profile/onboarding` → in one transaction sets the profile columns, replaces the user's `user_skills` rows and sets `onboardedAt`. The skill step loads the catalog from `GET /api/skills` (`useSkills`, `components/common/skill-picker.tsx`); skills are optional so an empty catalog never blocks onboarding. Schema: `src/schemas/profile.ts`. Option lists (levels, modes, availability slots, suggestions) are in `src/config/constants.ts`; the level and mode values must match the pg enums. Reusable inputs: `components/common/{choice-cards,chip-select,tag-input,form-field}.tsx`. `AuthUser.onboarded` comes from `toAuthUser()` in `services/auth.service.ts`.

## Profile page

`/profile` (`(protected)/(app)/profile/page.tsx`) is always editable; there is no edit mode. It is reached from the account menu (it is intentionally not in the sidebar). The server page loads the profile with `getProfile()` (`src/services/profile.service.ts`) and passes it to `components/profile/profile-page.tsx` as `initialData` for `useProfile` (TanStack Query, key `queryKeys.profile`). The page is one RHF form (`useProfileForm` in `hooks/profile/use-profile.ts`, resolver `profileSchema` = onboarding fields plus `name`); a floating save bar is always visible at the bottom ("All changes saved" when clean; "You have unsaved changes" with Discard/Save while `isDirty`), the form resets to the saved values after a successful `PATCH /api/profile`, and leaving with unsaved edits triggers the browser's beforeunload prompt. Layout: banner, sticky side column (profile-strength checklist computed from the saved profile + section anchors), section cards. Email is read-only. `saveProfile()` in `src/services/profile.service.ts` is the single writer for both onboarding and profile edits (validates skill ids, de-dupes interests, updates `users` and replaces `user_skills` in one transaction). The field groups (`AboutFields`, `StudyFields`, `SkillsField`, `AvailabilityFields` in `components/profile/profile-fields.tsx`) are shared with the onboarding wizard and read the form via `useFormContext`, so wrap them in `<FormProvider>`.

## UI and design system

shadcn/ui (style `radix-nova`, Radix primitives, lucide icons) on Tailwind v4. Components live in `src/components/ui/` and are added with `bunx --bun shadcn@latest add <name>`.

- **Theme:** "midnight and cobalt". Light only (the `.dark` block is tuned but nothing switches to it). Cool near-neutral surfaces (hue ~255, tiny chroma), white cards with hairline borders, deep cobalt primary `oklch(0.47 0.19 263)`, a midnight-navy sidebar, and champagne gold (`--sidebar-primary`) as the single warm accent (active nav item, onboarding progress, logo). Semantic `--success` / `--warning` / `--destructive` tokens exist (`text-success`, `bg-warning/10`, ...). Hero surfaces use `bg-linear-to-br from-sidebar via-sidebar to-primary`. Sidebar text must use `text-sidebar-*`, not `text-muted-foreground`. All colors are oklch CSS variables in `src/app/globals.css`. Never hardcode colors; use tokens (`bg-primary`, `text-muted-foreground`, `border-border`, ...).
- **Type:** Bricolage Grotesque for headings (`font-heading`, applied to `h1`-`h3` globally), Geist for body.
- **Shape and size:** `--radius` is 0.75rem. Controls are `h-10` (buttons `lg` is `h-11`), cards use 6-unit padding with a soft border and shadow. We edited the generated `button`, `input`, `card` and `select` (trigger is `h-10`, `bg-card`) for this; keep those edits when re-adding components.
- **Compose, don't restyle:** build screens from `ui/` components (`Card`, `Button`, `Input`, `Label`, `Alert`, `Tabs`, `Badge`, `Avatar`, `DropdownMenu`, `Skeleton`, `Sonner`). Toasts via `toast` from `sonner`; the `<Toaster />` is in the root layout and is painted entirely from theme tokens (`components/ui/sonner.tsx` maps success/info/warning/error to `--success`, `--primary`, `--warning`, `--destructive`), so recolouring the theme recolours the toasts.
- **Toggles:** never use a native checkbox for an on/off setting; use shadcn `Switch` with a `Label` (see "Open spots only" in `groups-page.tsx`).
- **Dropdowns:** never use a native `<select>`. Use shadcn `Select` (`components/ui/select.tsx`; see `FilterSelect` in `groups-page.tsx`, which maps an "any" item to empty because Radix Select can't hold `""`) for choosing a value and `DropdownMenu` for menus/actions.
- **Brand:** `src/components/common/brand.tsx` (two overlapping circles).
- **App shell (no top bar or page header):** the sidebar toggle lives in the sidebar header (it replaces the logo when collapsed); on phones a floating menu button in `(app)/layout.tsx` opens the drawer, and the content gets extra top padding there.
- **App shell:** signed-in pages live in the `src/app/(protected)/(app)/` route group. Its `layout.tsx` redirects users who haven't finished onboarding and renders the shadcn sidebar (`components/layout/app-sidebar.tsx`, inset + collapsible to icons) and `user-menu.tsx` (account card in the sidebar footer with sign out). Nav items come from `APP_NAV` in `src/config/constants.ts` (`href: null` = not built yet, shown disabled with a "Soon" badge); add the icon in `NAV_ICONS` in `app-sidebar.tsx`. New signed-in pages with the sidebar go inside `(protected)/(app)`; the layout owns the page gutters (`p-4 sm:p-6 lg:p-8`, content fills the width), so pages must not add their own `max-w-*`, `mx-auto` or outer padding. `getSessionUser()` is memoized per request, so layout and page can both call it.
- `cn()` is in `src/lib/utils.ts` (clsx + tailwind-merge). The shadcn CLI once generated `import { cn } from "cn"` (a third-party npm package); if that reappears in a newly added component, change it to `@/lib/utils` and `bun remove cn`. `shadcn add` also asks to overwrite files we customized (`button`, `input`, `card`); don't overwrite them.

## Known issues

- [README.md](README.md) describes the older layout (`drizzle/`, `src/db/schema.ts`) and references `.env.example`, which doesn't exist yet.
- Google sign-in is not implemented (would need the Firebase client SDK).
