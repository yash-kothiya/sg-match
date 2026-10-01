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

## Known issues

- [drizzle.config.ts](drizzle.config.ts) is stale: it points at `schema: "./src/db/schema.ts"` and `out: "./drizzle"`, but the schema is a folder (`./src/db/schema`) and the existing migrations live in `src/db/migrations`. Fix the config (`schema: "./src/db/schema"`, `out: "./src/db/migrations"`) before running any `db:*` command, or drizzle-kit will not see the tables or the existing migration history.
- [README.md](README.md) describes the older layout (`drizzle/`, `src/db/schema.ts`) and references `.env.example`, which doesn't exist yet.
- [src/app/layout.tsx](src/app/layout.tsx) still has the default "Create Next App" metadata and [src/app/page.tsx](src/app/page.tsx) is the starter page.
