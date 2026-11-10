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

Site player ratings are derived separately from users' personal ratings. Compare each player's 2026 primary yardage metric with profiles at the same position; the top fifth receives five stars and the bottom fifth one star. Profiles without verified 2026 stats remain unrated rather than receiving an invented score.

Sign-in and account creation use the Replit-managed Clerk tenant. Keep the homepage public, protect saved-progress API operations with Clerk sessions, and scope every database query to the authenticated Clerk user ID. Never connect to PostgreSQL from browser code. Guest progress remains in browser storage; signed-in progress is stored in Replit PostgreSQL and synced across devices. The user selected Replit PostgreSQL for this project; do not silently switch providers.

Fan favorites, player ratings and tags, team selections, recently viewed players, theme choice, poll votes, playbooks, and lineups use the same validated progress record. Guest changes stay in this browser; signed-in changes sync to that user's PostgreSQL record. Player CSV export includes the current filtered directory and personal scouting fields; playbook and lineup exports are also available. The matchup poll is a personal saved pick, not a shared community vote.

The Game day view offers a local bot game and open, turn-based online matches. Online match rows live in `public.play_call_games`; every action must verify the signed-in participant, validate the selected roster against the shared player directory, and lock the game row while resolving simultaneous offense/defense calls. Bot games run only in the current browser tab.
