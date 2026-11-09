import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gridiron Central — See the game differently",
  description: "A tactical football workspace for fans, strategists, and fantasy managers."
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() || requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim() || "https";
  const logoImageUrl = host ? new URL("/gridiron-mark.svg", `${protocol}://${host}`).toString() : "/gridiron-mark.svg";

  return (
    <html lang="en">
      <body>
        <ClerkProvider
          publishableKey={process.env.CLERK_PUBLISHABLE_KEY}
          proxyUrl={process.env.CLERK_PROXY_URL}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          appearance={{
            options: { logoImageUrl, logoPlacement: "inside", logoLinkUrl: "/" },
            variables: {
              colorPrimary: "#0080C6",
              colorForeground: "#0F172A",
              colorMutedForeground: "#6E7E8E",
              colorDanger: "#B42318",
              colorBackground: "#FFFFFF",
              colorInput: "#F3F7FA",
              colorInputForeground: "#0F172A",
              colorNeutral: "#0F172A",
              fontFamily: '"DM Sans", sans-serif',
              borderRadius: "8px"
            },
            elements: {
              rootBox: "gc-clerk-root",
              cardBox: "gc-clerk-card-box",
              card: "gc-clerk-card",
              footer: "gc-clerk-footer",
              headerTitle: "gc-clerk-title",
              headerSubtitle: "gc-clerk-subtitle",
              formFieldLabel: "gc-clerk-label",
              formFieldInput: "gc-clerk-input",
              formButtonPrimary: "gc-clerk-button",
              footerActionLink: "gc-clerk-link",
              footerActionText: "gc-clerk-footer-text",
              socialButtonsBlockButton: "gc-clerk-social",
              socialButtonsBlockButtonText: "gc-clerk-social-text",
              dividerLine: "gc-clerk-divider",
              dividerText: "gc-clerk-divider-text"
            }
          }}
          localization={{
            signIn: {
              start: {
                title: "Welcome back",
                subtitle: "Sign in to sync your fan progress."
              }
            },
            signUp: {
              start: {
                title: "Create your fan account",
                subtitle: "Save your playbook, lineups, and favorites."
              }
            }
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
