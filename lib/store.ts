// Everything adjacent remembers: the candidate pool, employers' roles, and what happened between them.
import "server-only";
import { newId, newToken, q } from "./db";
import type { CandidateCheck, Capability } from "./types";
import type { RoleBreakdown } from "./hiring-prompt";

export const STAGES = [
  { key: "suggested", label: "Suggested" },
  { key: "shortlisted", label: "Shortlisted for employer" },
  { key: "introduced", label: "Introduced" },
  { key: "interviewed", label: "Interviewed" },
  { key: "hired", label: "Hired" },
  { key: "retained_90", label: "Still there after 90 days" },
  { key: "left", label: "Left within 90 days" },
  { key: "not_a_fit", label: "Not a fit" },
] as const;
export type Stage = (typeof STAGES)[number]["key"];
export const stageLabel = (k: string) => STAGES.find((s) => s.key === k)?.label ?? k;
export const isStage = (k: string): k is Stage => STAGES.some((s) => s.key === k);

const json = (v: unknown) => (typeof v === "string" ? JSON.parse(v) : v);

// ---------- Candidates ----------

export type Candidate = {
  id: string;
  name: string;
  email: string;
  city: string;
  description: string;
  industry: string;
  capabilities: Capability[];
  interests: string[];
  status: string;
  manage_token: string;
  created_at: string;
};

function toCandidate(r: Record<string, unknown>): Candidate {
  return {
    ...(r as unknown as Candidate),
    capabilities: json(r.capabilities) as Capability[],
    interests: json(r.interests) as string[],
    created_at: String(r.created_at),
  };
}

export async function createCandidate(c: Omit<Candidate, "id" | "status" | "manage_token" | "created_at">) {
  const id = newId("cand");
  const token = newToken();
  await q(
    `insert into candidates (id, name, email, city, description, industry, capabilities, interests, manage_token)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, c.name, c.email, c.city, c.description, c.industry, JSON.stringify(c.capabilities), JSON.stringify(c.interests), token],
  );
  return { id, token };
}

export async function listCandidates(onlyActive = true) {
  const rows = await q(`select * from candidates ${onlyActive ? "where status = 'active'" : ""} order by created_at desc`);
  return rows.map(toCandidate);
}

export async function getCandidateByToken(token: string) {
  const rows = await q(`select * from candidates where manage_token = $1`, [token]);
  return rows[0] ? toCandidate(rows[0]) : null;
}

export async function deleteCandidateByToken(token: string) {
  await q(`delete from candidates where manage_token = $1`, [token]);
}

// Text the candidate check reads: their own words, plus the activities they confirmed.
export function candidateText(c: Candidate) {
  return `${c.description}\n\nActivities they confirmed:\n${c.capabilities.map((x) => `- ${x.activity}`).join("\n")}`;
}

// ---------- Roles ----------

export type Role = RoleBreakdown & {
  id: string;
  token: string;
  company: string;
  contact_email: string;
  description: string;
  status: string;
  created_at: string;
};

function toRole(r: Record<string, unknown>): Role {
  return {
    ...(r as unknown as Role),
    capabilities: json(r.capabilities) as Role["capabilities"],
    sources: json(r.sources) as Role["sources"],
    ad: json(r.ad) as Role["ad"],
    questions: json(r.questions) as Role["questions"],
    created_at: String(r.created_at),
  };
}

export async function createRole(company: string, contactEmail: string, description: string, b: RoleBreakdown) {
  const id = newId("role");
  await q(
    `insert into roles (id, token, company, contact_email, title, description, industry, field_label, capabilities, sources, ad, questions)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      id, newToken(), company, contactEmail, b.title, description, b.industry, b.field_label,
      JSON.stringify(b.capabilities), JSON.stringify(b.sources), JSON.stringify(b.ad), JSON.stringify(b.questions),
    ],
  );
  return id;
}

export async function listRoles() {
  const rows = await q(
    `select r.*,
       (select count(*) from matches m where m.role_id = r.id and m.stage <> 'suggested' and m.stage <> 'not_a_fit')::int as active_count,
       (select count(*) from matches m where m.role_id = r.id and m.stage in ('hired','retained_90','left'))::int as hired_count
     from roles r order by created_at desc`,
  );
  return rows.map((r) => ({ ...toRole(r), active_count: Number(r.active_count), hired_count: Number(r.hired_count) }));
}

export async function getRole(id: string) {
  const rows = await q(`select * from roles where id = $1`, [id]);
  return rows[0] ? toRole(rows[0]) : null;
}

export async function getRoleByToken(token: string) {
  const rows = await q(`select * from roles where token = $1`, [token]);
  return rows[0] ? toRole(rows[0]) : null;
}

export async function updateRoleBasics(id: string, fieldLabel: string, status: string) {
  await q(`update roles set field_label = $2, status = $3 where id = $1`, [id, fieldLabel, status]);
}

// ---------- Matches ----------

export type Match = {
  id: string;
  role_id: string;
  candidate_id: string;
  verdict: string;
  check: Omit<CandidateCheck, "id">;
  stage: Stage;
  employer_interest: boolean;
  note: string;
  hired_at: string | null;
  updated_at: string;
  candidate: Candidate;
};

export async function upsertMatch(roleId: string, candidateId: string, check: Omit<CandidateCheck, "id">) {
  await q(
    `insert into matches (id, role_id, candidate_id, verdict, check_json)
     values ($1,$2,$3,$4,$5)
     on conflict (role_id, candidate_id) do update set verdict = excluded.verdict, check_json = excluded.check_json, updated_at = now()`,
    [newId("match"), roleId, candidateId, check.verdict, JSON.stringify(check)],
  );
}

export async function listMatches(roleId: string, onlyShared = false) {
  const rows = await q(
    `select m.*, row_to_json(c.*) as cand from matches m join candidates c on c.id = m.candidate_id
     where m.role_id = $1 ${onlyShared ? "and m.stage not in ('suggested','not_a_fit') and c.status = 'active'" : ""}
     order by case m.verdict when 'interview' then 0 when 'conversation' then 1 else 2 end, m.updated_at desc`,
    [roleId],
  );
  return rows.map(
    (r) =>
      ({
        ...(r as unknown as Match),
        check: json(r.check_json) as Match["check"],
        hired_at: r.hired_at ? String(r.hired_at) : null,
        updated_at: String(r.updated_at),
        candidate: toCandidate(json(r.cand) as Record<string, unknown>),
      }) as Match,
  );
}

export async function matchedCandidateIds(roleId: string) {
  const rows = await q<{ candidate_id: string }>(`select candidate_id from matches where role_id = $1`, [roleId]);
  return new Set(rows.map((r) => r.candidate_id));
}

export async function setStage(matchId: string, stage: Stage, note: string) {
  await q(
    `update matches set stage = $2, note = $3, updated_at = now(),
       hired_at = case when $2 in ('hired','retained_90','left') then coalesce(hired_at, now()) else null end
     where id = $1`,
    [matchId, stage, note],
  );
}

export async function markEmployerInterest(roleToken: string, matchId: string) {
  const rows = await q<{ id: string }>(
    `update matches m set employer_interest = true, updated_at = now()
     from roles r where m.role_id = r.id and r.token = $1 and m.id = $2 and m.stage not in ('suggested','not_a_fit')
     returning m.id`,
    [roleToken, matchId],
  );
  return rows.length > 0;
}

// ---------- Proven moves: the part no model can make up ----------

export type ProvenMove = { key: string; from: string; to: string; hired: number; retained: number; left: number };

export async function provenMoves(): Promise<ProvenMove[]> {
  const rows = await q(
    `select c.industry as from_industry, r.field_label as to_field,
       count(*) filter (where m.stage in ('hired','retained_90','left'))::int as hired,
       count(*) filter (where m.stage = 'retained_90')::int as retained,
       count(*) filter (where m.stage = 'left')::int as left_count
     from matches m join candidates c on c.id = m.candidate_id join roles r on r.id = m.role_id
     where m.stage in ('hired','retained_90','left') and c.industry <> '' and r.field_label <> ''
     group by c.industry, r.field_label
     order by hired desc, retained desc
     limit 40`,
  );
  return rows.map((r, i) => ({
    key: `m${i + 1}`,
    from: String(r.from_industry),
    to: String(r.to_field),
    hired: Number(r.hired),
    retained: Number(r.retained),
    left: Number(r.left_count),
  }));
}

export function describeMoves(moves: ProvenMove[]) {
  return moves
    .map((m) => `${m.key}: from ${m.from} into ${m.to}. ${m.hired} hired, ${m.retained} still there after 90 days, ${m.left} left within 90 days.`)
    .join("\n");
}
