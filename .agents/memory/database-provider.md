---
name: Gridiron Central database provider
description: The user's approved database choice for this project.
---

Use Replit PostgreSQL for Gridiron Central's persistent application data. Do not switch to Supabase or another database provider unless the user changes this decision. Authentication provider is a separate decision.

**Why:** The user selected Replit PostgreSQL when asked to choose between a shared database and keeping the site in demo mode.

**How to apply:** Use the project's managed PostgreSQL connection for account-scoped records. Do not request or set its runtime-managed database variables manually.
