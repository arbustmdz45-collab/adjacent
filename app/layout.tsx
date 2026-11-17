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
  title: "adjacent — hire the person who already does this job, in another field",
  description:
    "Paste an opening that is not getting filled. adjacent takes it apart into real activities, shows which other fields already have people doing them, and gives you a way to check before you hire.",
  openGraph: {
    title: "adjacent — hire the person who already does this job, in another field",
    description: "For employers with office openings that stay open: the job as activities, the fields to look in, and evidence instead of a CV.",
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
