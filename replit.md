# Gridiron Central

Gridiron Central is a Next.js App Router and TypeScript fan-site prototype for NFL player exploration, head-to-head analysis, a custom playbook, lineup boards, and a simulated six-perspective film room.

## Run locally

- Install dependencies with `npm install`.
- Start the development server with `npm run dev`.
- Check TypeScript with `npm run lint`.
- Create a production build with `npm run build`.

The Replit web preview runs the development server on port 5000.

## Current data boundaries

The player directory includes an NFL.com 2026 regular-season stats snapshot and top-ten QB/RB/WR/TE leaderboards sourced from StatMuse, checked November 9, 2026. Both are embedded snapshots, not live feeds, and must not be described as auto-updating. The leaderboards rank by passing yards for QBs, rushing yards for RBs, and receiving yards for WRs/TEs. Player film cues, matchup prompts, and the six-expert panel are illustrative/simulated, not official commentary.

Sign-in and account creation use the Replit-managed Clerk tenant. Keep the homepage public, protect saved-progress API operations with Clerk sessions, and scope every database query to the authenticated Clerk user ID. Never connect to PostgreSQL from browser code. Guest progress remains in browser storage; signed-in progress is stored in Replit PostgreSQL and synced across devices. The user selected Replit PostgreSQL for this project; do not silently switch providers.
