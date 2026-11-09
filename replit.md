# Gridiron Central

Gridiron Central is a Next.js App Router and TypeScript fan-site prototype for NFL player exploration, head-to-head analysis, a custom playbook, lineup boards, and a simulated six-perspective film room.

## Run locally

- Install dependencies with `npm install`.
- Start the development server with `npm run dev`.
- Check TypeScript with `npm run lint`.
- Create a production build with `npm run build`.

The Replit web preview runs the development server on port 5000.

## Current data boundaries

The player directory and analysis are sample/demo content, not a live NFL data feed. Playbooks and lineups are stored in the current browser's local storage. There is no account system, shared database, or live expert service connected yet. Do not present sample stats or simulated analysis as official or current.

The original product spec names Supabase for authentication and PostgreSQL persistence. Connect the intended service and configure its application credentials before implementing user accounts or replacing browser-only storage. Do not silently substitute a different provider.
