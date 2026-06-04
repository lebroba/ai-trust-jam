# AI Trust Jam — Progress & Resume Notes

Last updated: 2026-06-04

A 3-12-3 brainstorming app (Next.js 16 + Supabase) for ~100-person classroom
workshops on phones + laptops. Phases: aspects → concepts → presentations →
voting → finished.

## Where it lives
- **Live:** https://ai-trust-jam.vercel.app/  (auto-deploys on push to `main`)
- **Repo:** https://github.com/lebroba/ai-trust-jam
- **Supabase project:** `bqjqcflclztkofyhkonn` (migration applied; realtime on)

## Run locally
```bash
npm install
npm run dev        # http://localhost:3000
```
Needs `.env.local` (gitignored — not in the repo):
```
NEXT_PUBLIC_SUPABASE_URL=https://bqjqcflclztkofyhkonn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sb_publishable_… key>
```
Same two vars are set in the Vercel project (required — they're inlined at build time).

## Deploy
`git push` to `main` → Vercel rebuilds automatically. Confirm a new build is live
by checking the timer shows Start/Pause/Reset.

## What works today
- Create / join sessions by code (random 8-char code; topic is per-session).
- Realtime sync across devices (Supabase realtime).
- Aspect cards; randomized teams (`Generate teams` seeds ~3 cards/team).
- **Drag-and-drop card assignment** (@dnd-kit, mouse + touch): drag aspect cards
  into a team's box; remove via × or by dragging out.
- **Local countdown timer** with Start / Pause / Reset (per-device, not synced).
- Concept gallery + 3-star voting + Export JSON.

## Design / specs
- `docs/superpowers/specs/2026-06-04-card-assignment-and-timer-design.md`

## Open / possible next steps
- **Security (optional):** RLS is open allow-all for anon. Session codes are
  unguessable, but anyone with the public anon key could still enumerate data.
  Fine for a low-stakes classroom; to truly close it, move reads behind a
  `security definer` RPC (trades away the current realtime model). See the spec
  + chat history.
- Timer is intentionally local — revisit if a synced classroom timer is wanted
  (needs timer columns on `sessions` + realtime).

## Machine gotcha (this PC)
AVG antivirus does HTTPS scanning, which breaks `npm install` with
`UNABLE_TO_VERIFY_LEAF_SIGNATURE`. Fixed by trusting AVG's root via
`NODE_EXTRA_CA_CERTS=C:\Users\blebr\node-extra-ca.pem` (already set). If a fresh
shell fails, pass it inline before npm. `curl` also needs `--ssl-no-revoke`.
