import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gridiron Central — See the game differently",
  description: "A tactical football workspace for fans, strategists, and fantasy managers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
