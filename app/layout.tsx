import type { Metadata, Viewport } from "next";
// Fonts are self-hosted: no request to Google (or anyone else) when a page loads.
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/caveat-brush/400.css";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "adjacent — your work, read as what it is",
  description:
    "Describe what you do all day. See the activities your work shows you can do, and three fields outside your industry that need them.",
  openGraph: {
    title: "adjacent — your work, read as what it is",
    description: "Describe a normal day at work. Find three fields outside your industry that need what you already do.",
    type: "website",
    siteName: "adjacent",
  },
};

export const viewport: Viewport = { themeColor: "#ede7dc" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
