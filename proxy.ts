import { clerkMiddleware } from "@clerk/nextjs/server";

const managedProxyEnabled = Boolean(process.env.CLERK_PROXY_URL);

export default clerkMiddleware({
  frontendApiProxy: {
    enabled: managedProxyEnabled,
    path: "/api/__clerk"
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/api/__clerk/(.*)"
  ]
};
