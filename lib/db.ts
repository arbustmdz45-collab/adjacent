// One small Postgres database for roles, the candidate pool and outcomes.
// Production: set DATABASE_URL (Neon, Supabase or Vercel Postgres all work).
// Local development without DATABASE_URL: an embedded Postgres (PGlite) in .data/.
import "server-only";
import { createHash } from "node:crypto";

type Row = Record<string, unknown>;
type Runner = (text: string, params?: unknown[]) => Promise<Row[]>;

const SCHEMA = `
create table if not exists candidates (
  id text primary key,
  name text not null,
  email text not null,
  city text not null default '',
  description text not null,
  industry text not null default '',
  capabilities jsonb not null default '[]',
  interests jsonb not null default '[]',
  status text not null default 'active',
  manage_hash text not null unique,
  consent_version text not null,
  consent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create table if not exists roles (
  id text primary key,
  token text not null unique,
  company text not null,
  contact_email text not null default '',
  title text not null,
  description text not null,
  industry text not null default '',
  field_label text not null default '',
  capabilities jsonb not null default '[]',
  sources jsonb not null default '[]',
  ad jsonb not null default '{}',
  questions jsonb not null default '[]',
  status text not null default 'open',
  closed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists outcomes (
  id text primary key,
  from_industry text not null,
  to_field text not null,
  result text not null,
  month text not null
);
create table if not exists matches (
  id text primary key,
  role_id text not null references roles(id) on delete cascade,
  candidate_id text not null references candidates(id) on delete cascade,
  verdict text not null default 'conversation',
  check_json jsonb not null default '{}',
  stage text not null default 'suggested',
  employer_interest boolean not null default false,
  note text not null default '',
  hired_at timestamptz,
  outcome_id text,
  updated_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);
create table if not exists ws_openings (
  id text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists ws_candidates (
  id text primary key,
  opening_id text not null references ws_openings(id) on delete cascade,
  data jsonb not null,
  created_at timestamptz not null default now()
);
create table if not exists ws_meta (
  key text primary key,
  value text not null
);
`;

let runner: Promise<Runner> | null = null;

// Vercel's database integrations often add a prefix (Neon gives ADJ_CV_STORE_DATABASE_URL and
// friends), so take the first pooled connection string we recognise.
export function databaseUrl() {
  const direct = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (direct) return direct;
  const skip = /UNPOOLED|NON_POOLING|NO_SSL|PRISMA/;
  const key = Object.keys(process.env)
    .filter((k) => /(_DATABASE_URL|_POSTGRES_URL)$/.test(k) && !skip.test(k))
    .sort((a, b) => a.length - b.length)[0];
  return key ? process.env[key] : undefined;
}

async function connect(): Promise<Runner> {
  const url = databaseUrl();
  if (url) {
    const postgres = (await import("postgres")).default;
    const local = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
    const sql = postgres(url, { max: 3, idle_timeout: 20, prepare: false, ssl: local ? false : "require" });
    const run: Runner = async (text, params = []) => (await sql.unsafe(text, params as never[])) as unknown as Row[];
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) await run(stmt);
    return run;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const pg = new PGlite(process.env.PGLITE_DIR || ".data/pglite");
  await pg.exec(SCHEMA);
  return async (text, params = []) => (await pg.query<Row>(text, params as unknown[])).rows;
}

export async function q<T = Row>(text: string, params: unknown[] = []): Promise<T[]> {
  if (!runner) runner = connect().catch((e) => { runner = null; throw e; });
  const run = await runner;
  return (await run(text, params)) as T[];
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

// Private links are bearer secrets: we store only their SHA-256, never the link itself.
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
