# Morrow

Morrow — Build a Better Tomorrow. Capture quickly, organize naturally, and find everything easily.

Five modules (Today, Inbox, Tasks, Projects, Knowledge) plus a month/week Calendar, global search, Quick Capture, and an assistant. Tasks follow a Jira-lite issue model: immutable issue keys, issue types, labels, one level of subtasks under a project, and optional time boxes (`startTime`/`endTime`). Tasks and projects use a shared WYSIWYG editor (TipTap) for their descriptions; notes use the same editor with the full toolbar.

The app runs in two modes behind one repository contract:

- **Mock mode** (no `VITE_API_URL`): everything lives in `localStorage`; useful for UI work with no backend.
- **Server mode** (`VITE_API_URL` set): a Go API backed by PostgreSQL owns the data, the browser keeps only a read-only snapshot cache, and email/password login gates the shell.

## Stack

React 19 · Vite 8 · TypeScript · Tailwind CSS 4 · HeroUI v3 (incl. DatePicker/Calendar) · TanStack Query 5 · Zustand 5 · React Router 7 · React Hook Form + Zod · TipTap 3 · vite-plugin-pwa

Backend: Go 1.26 · Chi · Gorm · Goose · PostgreSQL 16 (see `../morrow-api/README.md`).

## Scripts

```bash
pnpm dev        # development server (mock mode)
pnpm build      # typecheck + production build (PWA)
pnpm preview    # serve the production build
pnpm test       # Vitest (data layer, contracts, filters, derivations)
pnpm typecheck  # tsc -b
pnpm icons      # regenerate PWA icons from public/icons/icon.svg

# server mode (backend project is a sibling directory)
docker compose -f ../morrow-api/docker-compose.yml up -d db
(cd ../morrow-api && make run)
VITE_API_URL=http://127.0.0.1:8080/api/v1 pnpm dev
```

## Architecture

```
src/
  app/          route tree, AppShell (brand top bar · spaces sidebar / rail · bottom nav)
  components/   layout + shared UI primitives
  features/     today, calendar, inbox, tasks, projects, knowledge, search, assistant, auth
  services/     repository contracts, mock + HTTP repositories, search, demo import
  mocks/data/   seed dataset (only src/services may import this)
  stores/       Zustand UI state (sidebar, overlays, offline flag, assistant transcript)
  lib/          dates, text, ids, class names, toasts
  contracts/    shared JSON wire fixtures (also read by the API contract tests)
../morrow-api/   Go API (model / repository / service / handler / router per
                       feature), Goose migrations, API + contract tests
```

**Boundary rule:** only `src/services/**` imports `@/mocks`. Feature code depends on the `Repositories` contract, so the HTTP layer in `src/services/http/` replaces the mock layer without touching UI code.

### Domain insights

- Each domain page carries a compact insight strip instead of a separate technical dashboard.
- **Projects**: on track, needs attention, quiet for 14+ days. **Project detail**: open, overdue, done, last activity. **Tasks**: open, overdue, due this week, done this week. **Habits**: active, on track, this week’s fixed-schedule consistency, best streak. **Calendar**: events, time overlaps, busy days. **Knowledge**: notes, new this week, linked to projects, tags. **Dashboard**: this week’s execution, consistency, and carryover across tasks and fixed habits.
- Metrics use plain labels and hide ratios when there is no eligible data (`—`), rather than showing a misleading 0%.

### Radius scale

One scale keeps cards, controls, and nested rows aligned:

| Tier | Class | Example |
|---|---|---|
| Surface / control | `rounded-xl` (12px) | `surface-card`, buttons, inputs/selects |
| Nested row / cell | `rounded-lg` (8px) | settings tiles, calendar cells, task-detail children |
| Tag / tiny chip | `rounded-md` (6px) | `AppTag`, sidebar icon squares |
| Pill / circle | `rounded-full` | avatars, status dots, filter chips, floating actions |

HeroUI ships pill buttons; `src/index.css` overrides `.button` to the field radius. Explicit `rounded-full` utilities still win for intentionally pill-shaped actions.

### Backend API

- `VITE_API_URL` selects server mode at build time (`src/services/index.ts`). API details, env vars and the endpoint table live in [`../morrow-api/README.md`](../morrow-api/README.md).
- Auth: `/register` creates the account through `POST /auth/register`, which also returns an opaque bearer token (hashed at rest) plus the profile; `/login` does the same through `POST /auth/login`. `RequireAuth` guards the shell, and `client.ts` clears the token, clears the query cache, and returns to `/login` on any `401`.
- `SnapshotSync` seeds every read cache from `GET /snapshot`, writes it to `second-brain:snapshot:v1`, and refreshes on `online`. Offline, the cached snapshot is all the UI shows; mutations fail fast with `You are offline. Changes are disabled.` and the shell shows an offline banner.
- Keys (`Task.key`, `Project.key`) are immutable and allocated server-side with the same algorithms the mock layer uses.
- The DeepSeek key is stored per account on the server (`PATCH /ai` write-only `apiKey`); responses expose only `keyConfigured`, and the browser never receives the key back.
- `contracts/fixtures/*.json` are round-tripped by `../morrow-api/test/contracts_test.go` and `src/services/contracts.test.ts`, so a field rename breaks both suites.

### Colour and module identity

- `src/index.css` owns the palette. HeroUI semantic variables (`--background`, `--surface`, `--muted`, `--accent`, `--success`, `--warning`, `--danger`) drive components; the raw module hues are only for navigation and entity icons.
- Light and dark palettes are both defined. Module identities use Google-inspired hues: Today/Tasks blue, Inbox red, Habits green, Knowledge amber, Calendar orange, Dashboard teal, Projects purple, Areas pink.
- Active navigation rows use a 10% tint of the module hue and the accessible module text colour; `EntityIcon` carries the same module colours so rows stay recognisable.
- All module text colours clear 4.5:1 on their tinted backgrounds in both themes. Decorative-only colours are never used as small text.

### Motion and icons

- **Motion explains state changes, nothing else.** Four CSS-only behaviours (no motion library): page entrance (160ms fade/4px), card hover lift + colour transition, sidebar width transition on collapse, and the focus-mode overlay fade. Dense lists (task rows, search results) deliberately do not animate.
- `prefers-reduced-motion: reduce` collapses every animation and transition to 1ms, including HeroUI's built-in ones.
- **Icons identify a kind, not decorate.** `EntityIcon` is the single map for Task/Story/Bug/Project/Note/Event/Inbox and is reused in rows, cards, the command palette, calendar agenda and type tags; `TaskTypeIcon` delegates to it. Stat cards and empty states carry one icon each.

### Note editor

- Full toolbar (bold/italic/underline/strike, H1–H2, lists, quote, code block, undo/redo) on a shared TipTap editor; content saved on demand (`⌘S`), with a dirty indicator and `beforeunload` guard.
- The editor renders as a **compose window**: header bar (back link, save state, export, expand, save, delete), body, footer bar (shortcuts + word count). Docked it is a centered card up to 896px.
- **Tables are first-class in the editor.** The full toolbar has a **Table** menu: insert a 3×3 table with a header row, add rows/columns before or after, delete rows/columns, toggle the header row, and delete the table. Tables render in read-only notes and export as GFM Markdown.
- **Markdown files are supported both ways.** `Import .md` on Knowledge reads `.md`/`.markdown` files (multi-select): optional YAML frontmatter supplies `title` and `tags`; otherwise a leading `# Heading`, then the filename, provides the title. Markdown is converted to sanitized editor HTML (raw HTML/scripts dropped, tables preserved as editor tables, images reduced to alt text, unsafe link protocols stripped). The editor exports the current note as `.md` with `title`/`tags` frontmatter and a Markdown body, including GFM tables.
- **Full screen** (the expand icon or `⌘⇧F`) turns that same compose window into a viewport overlay: card up to 1152px inside a 16px gutter, header and footer fixed at the card edges, the body scrolls, and the editor grows to fill it. `Esc` collapses; unsaved text survives toggling in both directions because it is one tree, not a remount.
- Motion caveats worth knowing, both learned the hard way from this overlay:
  - the page transition animates **opacity only** — animating `transform` (even one settling on the identity matrix) makes the wrapper a containing block, so `position: fixed` is measured against the page instead of the viewport;
  - it also runs with **no `animation-fill-mode`**. A *filled* animation (even on opacity) keeps a stacking context, which traps the `z-50` overlay underneath the `z-30` topbar. Both bugs looked identical on screen; `document.elementsFromPoint` told them apart.

### Assistant chat

- The panel (384px aside on desktop, 90dvh drawer on mobile) is a chat surface: identity header with a `Derived`/`AI` tag from the server's AI setting, a context strip (`16 open tasks · 3 overdue · 1/3 habits on track · 5 inbox`), grouped bubbles (assistant secondary, user accent) with `HH:mm` timestamps, avatar only on the first message of a run, and per-reply copy.
- Typing state is three animated dots (reduced-motion disables them); the transcript auto-scrolls only while you are near the bottom, otherwise a **Latest** button appears.
- The composer is an auto-growing textarea: Enter sends, Shift+Enter adds a line, empty/thinking disables send. Suggestion cards show before the first question; quick-prompt chips afterwards. **Clear conversation** resets to the greeting.
- Transcript is session-only by design. Replies come from `POST /assistant`: the server returns a grounded DeepSeek answer when a key is configured, otherwise a deterministic reply derived from the same data shown in the context strip.

### Settings (server-owned integrations & AI)

- `/settings` (sidebar footer, account menu, `⌘K`) holds: Account (profile summary + edit dialog), Appearance (Light/Dark/System), **Integrations**, **AI assistant**, **Notifications**, **Agent access**, and Data (import/reset, API base URL, sign out).
- **Agent access** (server mode only) issues personal access tokens for MCP clients and scripts: create a named `sb_…` token, copy it from the one-time reveal dialog, see `Created`/`Last used` per row, and revoke it with a confirmation. The list never re-shows a token value; the mock layer refuses to fake tokens (`Agent tokens require server mode`) and the section is hidden without `VITE_API_URL`. The token also backs the `second-brain-mcp` server — see [`../second-brain-mcp/README.md`](../second-brain-mcp/README.md).
- Integrations are split: **Google Calendar** is real (OAuth, two-way sync, calendar picker, last-write-wins) and **SoftwareSeni Pepy** remains simulated server state. The state machine is enforced by the API — disabling tears the connection down and blocks Connect/Sync, connect/sync stamp `lastSyncAt`, disconnect keeps the last sync instant. In mock mode the same machine runs against `second-brain:settings:v1`.
- Each integration has an **Enabled** switch (`Enable <name>` is the accessible name). Unknown ids are `404`, connecting while disabled or syncing while disconnected is a `400` with the same message the UI shows.
- AI settings are server-owned and DeepSeek-only: model (`deepseek-chat` / `deepseek-reasoner`), `enabled`, last test status, and whether this account stored a key. The **Personal DeepSeek API key** field saves a write-only key (`Save key` / `Remove key`); it is never prefilled or returned. `Test connection` calls DeepSeek's `/models` with the stored key and shows the returned message (`DeepSeek API key is not configured`, `Connection failed (HTTP 401)`, …).
- Google Calendar: Connect opens the OAuth consent in a new tab through `POST /google-calendar/oauth/start`. The settings card shows the account email, last sync, and provider errors; a calendar picker switches the synced calendar. Imported events carry a **Google** tag in the calendar agenda and are editable; edits push to Google. The calendar polls every 60 seconds while open.
- **SoftwareSeni Pepy** (server mode + feature flag): Connect logs into the shared Pepy account, Sync runs task reconciliation, Disconnect clears the bearer token. Tasks opt in individually with **Send to Pepy**, available only when a due date and start/end time are set; linked tasks show a **Pepy** tag and push create/update/delete automatically.
- **Attachments** (server mode + S3-compatible storage) appear on project detail, task detail, and saved notes. The browser uploads PDFs, images, and Office documents directly to Cloudflare R2 through a presigned URL, then lists, previews images/PDFs, downloads, or deletes them. Office files download rather than render inline. Limits: 25 MB documents, 10 MB images.
- **Notifications** (server mode only) enables Web Push on this device and stores the subscription through `POST /push/subscriptions`; the API sends reminders with its VAPID keys. The card explains the state when the browser cannot push, permission is denied, or the server has no VAPID keys — in the last case the in-app bell and Today list still work. The same card sets the task reminder time (`HH:mm`) and the event lead (`0`–`60` minutes). A topbar bell shows today's undelivered count with a popover list, and Today renders the same rows in a **Reminders** section; dismissing a row hides it everywhere. `public/push-sw.js` is imported by the generated Workbox worker (`importScripts`) and handles `push` / `notificationclick` (focus an existing tab or open the target path).
- "Import browser data" posts the browser’s local envelope to `POST /import` in server mode, clears the assistant transcript, and refetches caches including the snapshot cache. Demo-data reset has been removed.

### Profile (mock user)

- One profile per user. Server mode creates it from registration (`name` + `email`) and stores it in the `profile` table keyed to the logged-in user (the wire id stays `me`); the mock profile is **Raka Pratama · raka@example.com**, role "Product engineer", timezone "Asia/Jakarta", in the storage envelope v6. Changing the email also updates the login email; a duplicate is a `409 Email already in use`.
- Surfaced in three places: topbar avatar initials (`initials()` helper), the account menu (Profile + email, opens a dialog with name/email/role/timezone and joined/updated timestamps), and Today's greeting (`Good evening, Raka.`).
- Edits persist through the repository and invalidate the `profile` query. The form uses `noValidate` so zod — not the browser's `type=email` constraint — produces the error message.

### Navigation

- Desktop sidebar is grouped into **Workspace** (Today, Inbox, Tasks, Habits, Knowledge) and **Plan** (Dashboard, Calendar, Projects, Areas); the group labels and divider hide in the 64px rail.
- Mobile keeps four primary tabs plus the centre capture button and a **More** sheet: Today · Inbox · (+) · Tasks · More, where More lists Dashboard, Calendar, Habits, Projects, Areas, Knowledge.
- Detail pages use breadcrumbs (`Projects / Data Warehouse Platform`, `Areas / Health`) with the trailing item marked `aria-current="page"`.

### Dashboard

- `/dashboard` aggregates every module from existing data only — no extra storage. `src/features/dashboard/derive.ts` is a pure function over areas, tasks, projects, notes, events, habits, check-ins and inbox, with tests for week windows, leaf-only completion, risk ordering and habit quotas.
- Headline tiles: open tasks (+overdue), due this week, done in the last 7 days (by `updatedAt`), completion over leaf tasks, habits on track, inbox with oldest item.
- Sections: **Workload** (stacked CSS bars for open tasks due + events over the next 7 days, no chart library), **Projects at risk** (active projects with overdue work, worst first, links to detail), **Areas** (per-area counts, habits on track, tone progress), **Habits** (quota %, streak), **Knowledge** (recent notes + top tags), **Inbox** (+ events next 7 days).
- The week boundary matches habits (`periodRange('weekly')`, Monday–Sunday); `/` still opens Today, the dashboard is a sidebar entry and `⌘K` action.

### Habits

- **Habit** is its own entity, not a recurring task: `{ title, areaId?, projectId?, cadence, target, schedule, startDate, endDate? }` with `HabitCheckIn { habitId, date }`. Success is measured per period (`4×/week`), so there is no instance spam and no second source of truth.
- Cadence is `daily | weekly | monthly`; `target` is completions per period. `schedule` is either `flexible` (any day counts) or `fixed` with weekdays.
- `startDate` and an optional inclusive `endDate` bound the habit. Progress, streaks, dots, due lists, calendar occurrences, and reminders ignore dates outside that range; after `endDate` the habit moves to the **Ended** tab with its final stats and check-in disabled, and editing the date or clearing it reopens the habit.
- `startTime` / `endTime` (local `HH:mm`, optional) make a fixed habit a **timed occurrence**: the calendar renders it as a chip in the month grid (`06:30 – 07:15 Run 4× a week`) and as an entry in the day panel, where it can be checked in. Flexible habits keep the time as a suggestion but have no calendar day to sit on, so they only appear in Today/Habits.
- The habit form's **Remind me** switch and reminder lead are server-backed: off sends `reminderEnabled: false`, while on clears it to inherit the global setting; the lead fires 5–60 minutes before `startTime` and shows any custom stored value. Both require a start time.
- Weeks are **Monday–Sunday** (`WEEK_START_DAY` in `src/lib/habits.ts`); the calendar grid stays Sunday-first for display only.
- One check-in per habit per day (`checkIn` is idempotent, `date` is local `YYYY-MM-DD`). Check-ins can be backfilled up to today from the calendar.
- Derived, never stored: `habitProgress`, `habitStreak` (an unfinished current period does not break the streak), `isHabitDueOn`, `habitDots`, `habitScheduleDates`.
- Habit context follows the same inheritance rule as tasks/notes (`projectId` wins, otherwise `areaId`), but habits **do not** contribute to the project progress bar — project and area pages show them in their own section.
- Surfaces: `/habits` (grouped by area, dots + streak + one-tap check-in, active/ended/archived tabs), a Today block with what is still due, sections on project and area detail, calendar markers with per-day toggles, and a `Habits` group in search.
- Interval habits ("every 3 days") are intentionally deferred; the cadence model above covers quota habits.

### Areas

- `Area` groups everything by part of life (Works, Family, Health, Personal) and carries a `tone` (semantic colour) plus an `icon`; there is no separate theme per area.
- Assignment is **inheritance-first**: a project owns its area, and its tasks and notes inherit it. A task or note with no project can carry its own area. When an item is attached to a project, the project's area wins — the stored value stays but is ignored, so unlinking restores the earlier choice.
- Surfaces: `/areas` (cards with counts and leaf-task progress), `/areas/:id` (projects, tasks, notes), area pickers in the project/task/note forms, area filters on Tasks and Knowledge, area badges on project cards and unfiled task rows, and area results in the command palette.
- Deleting an area clears its references on projects, tasks, notes and habits instead of deleting the work.

### Calendar events

- `Event` is a first-class entity: title, local `date`, optional `startTime` / `endTime` (`HH:mm`, all-day when omitted), optional notes, optional project.
- Create, edit, and delete from the Calendar page (`EventFormDialog`): the selected day's panel lists its agenda, and the header offers **New event**. The header switches between **Month** and **Week**; the week board shows seven day columns with events, habits, and due tasks, and the same selected-day panel. Clicking a day in either grid selects it and opens an **Add to this day** popup with **New task** and **New event**, both prefilled with that date. Date and times use HeroUI's `DatePicker` / `TimeField`; end time must be after start time.
- Today's "This week" block reads the next seven days of stored events instead of a hardcoded array, with an empty state pointing at the calendar.

### Issue model (Jira-lite)

- `Project` is the epic container. It carries an immutable **project key** (`DWP`) derived from its name at creation: uppercase initials of up to four words, numeric suffix on collision, never changed by a rename.
- `Task` carries an immutable **issue key** (`DWP-12`), a **type** (`task` / `story` / `bug`), **labels**, and an optional **`parentId`** for a subtask.
- Key numbers come from `counters` in the storage envelope (`projectId → next number`; project-less tasks use the `SB` prefix and the `none` bucket).
- Hierarchy is **one level**: a subtask inherits its parent's project, and a task that has subtasks cannot become a subtask. Deleting a parent detaches its children instead of deleting them.
- Project progress counts **leaf tasks only**, so a parent and its subtasks never inflate the same bar. Today stats count every open task; list rows indent subtasks and the detail panel shows the parent link plus subtask rollup.

### Data layer

- Server mode is authoritative: reads and writes go through `src/services/http/`, TanStack Query holds snapshots, and `SnapshotSync` keeps `second-brain:snapshot:v1` for cold/offline starts. Mutations set `networkMode: 'always'` so the client can reject them with a clear offline error instead of silently pausing.
- Mock mode keeps `src/services/mock/storage.ts`: a single versioned envelope under `second-brain:data:v1` (the key name predates the payload version), validated with zod (`schema.ts`), and upgraded through `migrate.ts` (v1 → v2 issue model → v3 events) instead of reseeding; corrupt or unknown versions still reseed. If `localStorage` refuses writes, the app keeps running from an in-memory seed for the session.
- `src/services/repositories/contracts.ts` defines the UI-facing API: `get` returns `null`, mutations throw on unknown ids, and `null` on an update clears optional fields (`dueDate`, `projectId`).
- Dates are local `YYYY-MM-DD` strings; comparisons are lexical, never UTC instants.
- Due dates are picked with HeroUI's `DatePicker` (React Aria segments + calendar popover) and converted at the form boundary to `YYYY-MM-DD` strings by `src/lib/calendar-date.ts`; there is no native `input[type=date]` anywhere.
- Rich text is stored as HTML from the app's own editor. Read-only views render it through `RichTextContent`; search, excerpts and card summaries strip the tags first. Plain-text values (the seed descriptions) are treated as a single paragraph, and trailing empty paragraphs are trimmed on save.

### Public pages

- `/privacy.html` is a static, unauthenticated page in `public/`, served without the SPA shell or JavaScript. Google OAuth verification crawlers must see the policy directly, so keep it in sync whenever data practices or integrations change.
- The sign-in screen links to it, and `index.html` carries a `<noscript>` fallback with the app name, purpose, and the same link for crawlers that do not execute JavaScript.
- The policy is written against the current implementation: account and workspace data, Google Calendar (scopes, sync, token encryption, Limited Use), DeepSeek assistant context, Pepy sync, Web Push, Cloudflare/R2, local storage, log retention, and deletion requests.

### Testing

Vitest covers the data layer (storage recovery, repository semantics), the HTTP client (bearer token, error mapping, offline mutations, 401 handling), snapshot hydration, mock settings transitions, contract fixtures, task filtering/sorting, project progress, tag parsing, the Today derivation, calendar month grids/due-date grouping, and rich-text helpers.

The API has its own suite: `make test` in `../morrow-api` runs route-level tests against throwaway PostgreSQL databases plus fixture round-trips. UI verification is a browser smoke pass over the acceptance flows.
