# AGENTS.md

This file is for AI coding agents working in this repository. Read it before making changes.

## Project Overview

Tabletop Battles is a React + TypeScript + Vite app for managing imported tabletop army rosters during a game. It imports NewRecruit/BattleScribe-style JSON, shows unit cards, weapons, abilities, stratagems, phase state, and detachment data.

The app has two runtime parts:

- Frontend: Vite React app in `src/`.
- API: Node HTTP handler in `server/api.mjs`, exposed locally through `server/local.mjs` and on Vercel through the single catch-all function `api/[...path].mjs`.

The app is deployed to Vercel. Postgres persistence is via Neon in production and a local Docker Postgres on port `5436` during local development.

## Commands

Use these before handing off changes:

```sh
npm run lint
npm run build
node --check server/api.mjs
```

Local development usually needs two processes:

```sh
docker compose up -d
npm run dev:api
npm run dev
```

The Vite dev server proxies `/api` to `http://localhost:8787`, which is the default `npm run dev:api` port.

## Environment

Relevant environment variables:

- `DATABASE_URL`: local/default database URL. Example: `postgres://tabletop:tabletop@localhost:5436/tabletop_battles`
- `STORAGE_TABLETOP_DATABASE_URL`: Vercel/Neon storage integration URL. The server prefers this over `DATABASE_URL`.
- `API_PORT`: local API server port, default `8787`.
- `VITE_NEON_AUTH_URL` or `VITE_STORAGE_TABLETOP_NEON_AUTH_BASE_URL`: optional Neon Auth frontend config.

Do not commit `.env.local` or secrets.

## Persistence Model

The database is now the source of truth for app data when logged in.

Database-backed data:

- Local accounts and sessions: `accounts`, `account_sessions`.
- App users: `app_users`.
- Army lists and imported roster JSON: `army_lists`.
- Imported units for each army list: `army_list_units`.
- Per army/unit ability and weapon keyword overrides: `army_list_unit_overrides`.
- Detachments and detachment stratagems: `detachments`, `detachment_stratagems`.
- Selected active army: `user_preferences.selected_army_list_id`.
- Selected detachment and selected army rule choice are stored on `army_lists`.

Still intentionally not migrated:

- Auth token/provider browser storage. This is still used by the frontend login/session flow.
- Battle phase/turn state. This is session-only in React state.
- Legacy browser-stored armies/detachments are only fallback/import bridge data. The app clears those keys after successful DB-backed loads.

If adding new persisted gameplay state, prefer a new concept such as `battle_sessions` rather than mixing transient game state into army lists. Roster data and current-game state should stay separate.

## Database Migrations

Migrations live in `db/migrations/` and use Flyway-style names:

```text
V1__create_local_auth_tables.sql
V2__create_app_data_foundations.sql
V3__use_text_ids_for_detachments.sql
```

Rules:

- Never edit a migration that may already have run in Neon or local databases.
- Add a new migration with the next version number.
- The migration runner stores checksums in `schema_history`; changing an applied migration will break startup.
- Migrations run automatically when `server/api.mjs` initializes.
- `vercel.json` includes `db/migrations/**` for serverless function deployment. Keep that include if adding migration files.

## API Structure

Core API logic is centralized in `server/api.mjs`.

Vercel Hobby has a serverless function count limit. This app intentionally uses one catch-all function:

- `api/[...path].mjs` -> all `/api/*` routes

Do not add one file per API route under `api/`; that can exceed Vercel Hobby deployment limits. Add routing branches inside `server/api.mjs` instead.

When adding a new API path:

1. Add the routing/handler branch in `server/api.mjs`.
2. Confirm the catch-all `api/[...path].mjs` still forwards to `handleApiRequest`.
3. Check local proxy behavior through Vite.
4. Run `node --check server/api.mjs`, `node --check server/local.mjs`, `npm run lint`, and `npm run build`.

If a deployed API route returns a Vercel `NOT_FOUND`, first check that `api/[...path].mjs` exists and that Vercel is routing `/api/*` to it. That means Vercel never reached `server/api.mjs`.

## Authentication

There are two auth paths:

- Local account auth in Postgres, including default seeded `admin` / `admin`.
- Optional Neon Auth on the frontend when Neon Auth env vars are configured.

Local account creation is intentionally only allowed for local requests. Admin-only database/account management is available through the admin screen and admin API routes.

The local session token is stored in browser storage. This is acceptable for current app state, but if hardening auth later, move sessions to secure HTTP-only cookies.

## Frontend Structure

Important files:

- `src/App.tsx`: top-level app state, modals, persistence calls, menu routing.
- `src/App.css`: global layout and component-level CSS for the app shell and modal-heavy UI.
- `src/utils/armyImported.ts`: importer from roster JSON into app army/unit shapes.
- `src/utils/weapon.ts`: active weapon aggregation and keyword extraction/override merging.
- `src/utils/stratagems.ts`: built-in/core stratagem definitions.
- `src/components/ArmyUnitList.tsx`: unit list, model/weapon/keyword modals.
- `src/components/unitCard/UnitCard.tsx`: unit card, abilities, add/remove ability controls.
- `src/components/weaponStatus/WeaponStatus.tsx`: weapon display and keyword chips.
- `src/components/phaseIndicator/PhaseIndicator.tsx`: always-visible phase controls.

The app uses React state heavily and persists only at explicit points. Avoid introducing network calls on every keystroke unless there is a deliberate debounce or Save button.

## Army Data Concepts

`SavedArmy` in `src/App.tsx` represents an imported army list. It includes:

- `armyRules`
- `units`
- `selectedDetachmentId`
- `selectedArmyRuleChoiceId`

`ArmyUnit` in `src/utils/armyImported.ts` includes imported profiles/models/weapons and optional override fields.

Important distinction:

- Imported roster/unit data belongs to the army list.
- User-added ability/keyword changes are per army list/unit overrides.
- Current game state should not be added to roster import data unless explicitly intended.

Ability display names are editable through the ability modal and saved as unit override data. Leader abilities should remain sorted last; preserve `compareSavedAbilities` behavior.

Weapon keyword overrides are merged in `getActiveWeapons`/`getWeaponKeywords`. Custom keyword chips should visually match imported keyword chips.

## Detachments and Stratagems

Detachments can be built-in or user-created.

- Built-ins are defined in frontend code through `BUILT_IN_DETACHMENTS`.
- User-created detachments are persisted to Postgres.
- Detachment stratagems are stored with the detachment.
- The selected army detachment is stored on the army list.

The detachment editor uses draft state and explicit Save/Cancel. Do not reintroduce persistence on every typed character.

If built-in/global presets become admin-managed later, add database-backed preset support rather than growing hardcoded frontend lists.

## UI Conventions

This app is an operational game tool, not a marketing site.

- Keep UI compact, readable, and optimized for repeated use.
- Avoid large decorative sections.
- Modals are used for editing and detailed chip/weapon/unit views.
- Chips use `.weapon-keywords` styling for abilities, keywords, and selected detachment display.
- Button text should be short and direct.
- Preserve mobile width constraints; chips must wrap and not overflow.

## LocalStorage Rules

Do not add new app-data localStorage keys unless explicitly requested.

Existing localStorage keys:

- `tabletop-battles.auth-token`
- `tabletop-battles.auth-provider`
- `tabletop-battles.saved-armies` only as legacy fallback/import bridge.
- `tabletop-battles.detachments` only as legacy fallback/import bridge.

When logged into the DB-backed app, army and detachment data should come from Postgres.

## Git and Deployment Notes

The user commonly verifies each deployed phase before continuing. When asked to implement a phase:

1. Make the change.
2. Run checks.
3. Commit with a focused message.
4. Push `main` if the user asked for deployment flow or continuation of a verified phase.
5. Report the commit hash and what to verify.

Do not rewrite or modify unrelated user changes.

## Common Pitfalls

- Adding one Vercel function file per API route. Keep the single catch-all function.
- Editing an applied migration instead of adding a new one.
- Reintroducing per-keystroke DB writes in modals.
- Storing current battle/game state directly on imported roster data.
- Assuming browser storage is still the source of truth for armies/detachments.
- Breaking leader ability sorting.
- Deleting and recreating `army_list_units`, which can cascade-delete unit overrides. Use stable upserts.
