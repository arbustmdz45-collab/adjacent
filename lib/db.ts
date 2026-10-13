// One small Postgres database for roles, the candidate pool and outcomes.
// Production: set DATABASE_URL (Neon, Supabase or Vercel Postgres all work).
// Local development without DATABASE_URL: an embedded Postgres (PGlite) in .data/.
import "server-only";

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
  manage_token text not null unique,
  consent_at timestamptz not null default now(),
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
  created_at timestamptz not null default now()
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
  updated_at timestamptz not null default now(),
  unique (role_id, candidate_id)
);
`;

let runner: Promise<Runner> | null = null;

async function connect(): Promise<Runner> {
  const url = process.env.DATABASE_URL;
  if (url) {
    const postgres = (await import("postgres")).default;
    const sql = postgres(url, { max: 3, idle_timeout: 20, prepare: false });
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

export function newToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes).toString("base64url");
}
