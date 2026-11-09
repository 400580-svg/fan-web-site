---
name: Next.js development origins in Replit
description: Why this project's Next.js dev server allows both proxied and local preview hosts.
---

For Next.js development in Replit, allow `**.replit.dev` and `127.0.0.1` in `allowedDevOrigins`. The proxied preview uses a changing Replit subdomain, while local preview capture requests HMR from `127.0.0.1`.

**Why:** Without both entries, the page renders but Next blocks HMR requests from one of the preview hosts.

**How to apply:** Preserve both development origins when changing Next.js configuration; do not add these origins to production behavior.
