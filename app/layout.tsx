import type { Metadata, Viewport } from "next";
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
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
