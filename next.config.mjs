/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV !== "production";

// Strict by default. 'unsafe-inline' is needed for Next.js's inline bootstrap scripts and inline styles;
// everything else (fonts, scripts, API calls) must come from this site.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const security = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  // Private links (/r/…, /me/…) carry secrets in the URL: never leak them to other sites.
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const privatePage = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
];

const nextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["@electric-sql/pglite", "postgres"],
  async headers() {
    return [
      { source: "/:path*", headers: security },
      { source: "/admin/:path*", headers: privatePage },
      { source: "/r/:path*", headers: privatePage },
      { source: "/me/:path*", headers: privatePage },
      { source: "/api/:path*", headers: privatePage },
    ];
  },
};

export default nextConfig;
