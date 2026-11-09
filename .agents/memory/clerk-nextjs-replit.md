---
name: Replit-managed Clerk in Next.js
description: Environment-name compatibility and dynamic-key constraints when using Replit-managed Clerk with Next.js.
---

Replit-managed Clerk provides `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY`. Next.js's Clerk SDK also reads `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` internally, so map the managed public key to that name for Next.js. The server secret can be read from `CLERK_SECRET_KEY` without passing it as a middleware option.

**Why:** Passing `secretKey` dynamically to `clerkMiddleware` requires `CLERK_ENCRYPTION_KEY`; the Replit-managed setup used here did not provide one.

**How to apply:** For Next.js apps using managed Clerk keys, map the public key to Next's expected environment name and let Clerk read the secret from its standard server environment. Only pass dynamic middleware keys when the required encryption key is configured.
