import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/try", "/privacy"].map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: "monthly" }));
}
