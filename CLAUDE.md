# ROAM — v1 Web App

## What this is
ROAM is indoor navigation for shopping malls. v1 is a **mobile-first web app** (no install)
that shoppers open by scanning a QR code at a mall entrance or directory kiosk.
Goal of v1: prove shoppers use it, and prove a tenant will pay for a sponsored placement.
This is a pilot for ONE mall. Keep it simple.

## What v1 does
1. Shopper scans a QR code. The URL encodes where they are: `/m/{mallId}?from={nodeId}`
2. They search for a store, restaurant, restroom, parking level, etc.
3. They get a route drawn on the floor map, with step-by-step directions across floors
   ("Take escalator to Level 2 → turn left → Nike on your right").
4. Some search results are marked "Sponsored" (a tenant paid to appear first).
5. Every search and every route request is logged anonymously for pilot metrics.

## What v1 does NOT do (do not build these)
- No live "blue dot" / indoor positioning (no beacons, no GPS). Position = the QR scanned.
- No user accounts, no login, no personal data. No cookies beyond an anonymous session id.
- No native app.
- No admin dashboard yet (mall data is edited as JSON files by hand).

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind
- Deployed on Vercel
- Mall data lives in `/data/malls/{mallId}.json` (see data model)
- Maps are SVG floor plans in `/public/malls/{mallId}/level-{n}.svg`
- Anonymous event logging: Supabase (one `events` table) — add in phase 4, not before
- Must support English, Spanish and Hebrew (Hebrew = right-to-left layout)

## Data model (mall JSON)
- `mall`: id, name, languages, levels[]
- `places[]`: id, name, category, level, nodeId (where its entrance is on the graph),
  keywords[] (e.g. Foot Locker → "sneakers", "running shoes"), sponsored (bool), promo (optional text)
- `nodes[]`: id, level, x, y (coordinates on that level's SVG), type
  (corridor | entrance | escalator | elevator | stairs | store_door)
- `edges[]`: from, to, distanceMeters. Escalator/elevator edges connect nodes on different levels.
- `entrances[]`: id, name, nodeId — each one gets a QR code

## Routing
The mall is a graph: nodes are points on walkways, edges are walkable segments.
Use Dijkstra (A* optional) over the graph. Multi-floor works automatically because
escalator/elevator edges link levels. Turn directions are derived from the angle
between consecutive edges. Show distances in meters AND minutes (walk ~1.2 m/s).

## Build phases (do one at a time, confirm each works before moving on)
1. Skeleton: Next.js app, load a sample mall JSON, list and search places.
2. Map: render SVG floor plan per level, level switcher, pins for places.
3. Routing: Dijkstra over the graph, draw route on map, step-by-step list, cross-floor.
4. QR + metrics: `?from=` entry point, QR code generator page, anonymous event logging.
5. Sponsored: sponsored results ranked first with a clear "Sponsored" label, promo text.
6. i18n: EN / ES / HE with RTL support.

## Working rules
- Start with a FAKE sample mall (2 levels, ~20 places) so we can build before real data exists.
- Mobile first: test at 390px wide. Big tap targets. Works one-handed.
- Keep dependencies minimal. Explain any new library before adding it.
- After each phase, tell me in plain language what was built and how to test it.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
