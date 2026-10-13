// Best-effort limit per IP. On serverless each instance has its own memory,
// so this stops casual abuse, not a determined attacker. Swap for a shared
// store (e.g. Upstash) before opening it widely.
const WINDOW_MS = 10 * 60 * 1000;
const buckets = new Map<string, Map<string, number[]>>();

export function limited(bucket: string, req: Request, max: number) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const hits = buckets.get(bucket) ?? new Map<string, number[]>();
  buckets.set(bucket, hits);
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > max;
}
