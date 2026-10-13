// Best-effort limit per IP. On serverless each instance has its own memory,
// so this stops casual abuse, not a determined attacker. Swap for a shared
// store (e.g. Upstash) before opening it widely. IPs are kept in memory only, never stored.
const WINDOW_MS = 10 * 60 * 1000;
const buckets = new Map<string, Map<string, number[]>>();

export function ipFrom(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "local";
}

export function limitedKey(bucket: string, ip: string, max: number) {
  const hits = buckets.get(bucket) ?? new Map<string, number[]>();
  buckets.set(bucket, hits);
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}

export function limited(bucket: string, req: Request, max: number) {
  return limitedKey(bucket, ipFrom(req.headers), max);
}

// Reject cross-site POSTs to our JSON APIs (a browser always sends Origin on them).
export function crossSite(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host !== (req.headers.get("x-forwarded-host") || req.headers.get("host"));
  } catch {
    return true;
  }
}
