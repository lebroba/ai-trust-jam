# Card Assignment (drag-and-drop) + Local Timer — Design

Date: 2026-06-04
Project: AI Trust Jam (`skill_jam`) — Next.js 16 + Supabase 3-12-3 brainstorming app

## Problem

Two gaps in the concept-development workflow:

1. **No way for teams to choose their aspects.** When the facilitator clicks
   *Generate teams*, the app auto-assigns ~3 random aspect cards per team
   (`generateTeams` in `lib/supabase/queries.ts`) and they are read-only. Teams
   cannot add aspects they want or drop ones they don't.
2. **The timer is fake.** `Timer` in `components/jam-session.tsx` renders the
   phase's nominal length as static text (e.g. `03:00`). It does not count down
   and has no start/pause/reset controls — even though 3-12-3 is fundamentally a
   timed method.

## Decisions (confirmed with user)

- **Drag tech:** `@dnd-kit` (touch + mouse). Audience is phones *and* laptops;
  native HTML5 drag does not work on touch.
- **Auto-assign:** Keep seeding ~3 cards on *Generate teams*; teams adjust from
  there (add more / remove).
- **Timer:** **Local** to each device. No DB columns, no sync. Each device runs
  its own start/pause/reset.

## Feature 1 — Drag aspect cards into a team's concept box

### Interaction
- Wrap the **Dashboard** subtree (the only place the card wall and team box are
  shown side-by-side, during non-`aspects` phases) in a `<DndContext>`.
- Sensors: `PointerSensor` (mouse, small activation distance) + `TouchSensor`
  with a ~200ms press delay and small tolerance, so finger-scrolling on a phone
  still works and only a deliberate press-drag picks up a card. Include
  `KeyboardSensor` for accessibility.
- **Draggable:** each card in the Aspect cards wall (`CardWall`).
- **Droppable:** the team's assigned-cards area in `TeamBoard` (highlights while
  a card is dragged over it). A `DragOverlay` renders the card being dragged.
- **Add:** drop a card on the team box → `addTeamCard(teamId, cardId)`.
- **Remove:** each assigned card shows a small **×** button → primary remove path
  (`removeTeamCard`). `×` is primary because drag-to-remove is unreliable on
  touch. Dragging a card back out to the wall also removes it (bonus, not relied
  on).

### Data layer (`lib/supabase/queries.ts`)
- `addTeamCard(teamId, cardId)` — upsert into `team_cards` with
  `onConflict: "team_id,card_id"` (idempotent; no duplicates within a team).
- `removeTeamCard(teamId, cardId)` — delete the matching `team_cards` row.
- Both call `reload()` afterward. Realtime (`subscribeBundle`) already propagates
  the change to every other device.

### Rules / scope
- A card may belong to **multiple teams** (consistent with current auto-assign,
  which can hand the same card to several teams). The `team_cards` primary key
  `(team_id, card_id)` prevents duplicates *within* a team.
- Whoever views a team's board curates that team. No new routes/screens.
- `generateTeams` is unchanged. Voting board and concept gallery untouched.
- No schema migration required — `team_cards` already exists.

## Feature 2 — Local countdown timer

Rewrite `Timer` (`components/jam-session.tsx`) from static text into a real
client-side countdown.

- State: `secondsLeft` + `running`, driven by a `setInterval` (1s tick) that is
  cleared on pause/unmount.
- Initial/Reset value: `phaseMinutes(phase) * 60`.
- Controls on the timer card: **Start ▶ / Pause ⏸** (toggle) and **Reset ↺**.
- When the `phase` prop changes, reset to the new phase's length, stopped.
- At `0`: stop, hold at `00:00`, switch the card to a "time's up" visual state
  (red). 
- Phases with 0 minutes (`voting`, `finished`) show `--:--` and disable controls.
- Local only — no DB, no realtime. Each device is independent (accepted
  trade-off).

## Dependency + known risk

- Adds `@dnd-kit/core` and `@dnd-kit/utilities` (small, well-maintained,
  touch-capable).
- **Risk:** the user's `npm install` currently fails with
  `UNABLE_TO_VERIFY_LEAF_SIGNATURE` (a TLS/cert chain problem — typically a
  corporate proxy or a root CA missing from npm's config). Installing `@dnd-kit`
  will likely hit the same wall. **First step before building Feature 1 is to fix
  npm's certificate configuration** (e.g. point `NODE_EXTRA_CA_CERTS` at the
  corporate root CA, or correct the registry/proxy settings — not by globally
  disabling `strict-ssl`). Feature 2 needs no new dependency and can proceed
  regardless.

## Out of scope
- Synchronized/server-driven timer.
- Auto-advancing phases when the timer hits zero.
- Reordering cards within a team (no sortable behavior needed).

## Verification
- Local build (`npm run build`) passes.
- Two-window test: drag a card into a team on window A → appears on window B via
  realtime; `×` removes it on both. Timer start/pause/reset behaves per device;
  phase switch resets it; touch drag works on a phone / mobile emulation.
