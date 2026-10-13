// The shape of everything the model returns and the screen renders.
// Change it here and both the prompt schemas and the UI follow.

export type Capability = {
  id: string; // "c1", "c2", … stable across edits
  activity: string; // what the person actually does, one sentence
  detail: string; // what it looks like in practice, or what makes it hard
};

export type Coverage = "full" | "partial";
export type Strength = "strong" | "partial" | "weak";

export type Mapping = {
  capability_id: string;
  coverage: Coverage;
  activity: string; // the specific activity in the new field that uses this capability
};

export type Field = {
  id: string;
  field: string;
  strength: Strength;
  maps: Mapping[];
  work_there: string; // what a normal week looks like there, and where their activity shows up
  still_to_learn: string;
  titles: string[]; // job titles to search for, as they appear in ads
  say_it: string[]; // CV lines: their real experience in the new field's vocabulary
  why_weak: string | null; // required when strength is "weak"
  proven_move_id?: string | null; // set by the model when a proven move fits
  proven?: { from: string; to: string; hired: number; retained: number } | null; // real counts, attached by the server
};

export type Gap = { capability_id: string; note: string } | null;

export type Rejection = { field: string; reason: string };

// Request bodies for the single API route, one per step.
export type CapabilitiesRequest = { step: "capabilities"; role: string };

export type FieldsRequest = {
  step: "fields";
  role: string;
  industry: string;
  capabilities: Capability[];
  rejected: Rejection[];
};

export type ReplaceRequest = {
  step: "replace";
  role: string;
  industry: string;
  capabilities: Capability[];
  keep: Field[];
  rejected: Rejection[];
};

// ---- Candidate check: one person's background against this role's capabilities ----

export type Evidence = "shown" | "partly" | "not_shown";
export type Verdict = "interview" | "conversation" | "not_enough";

export type CandidateCheck = {
  id: string;
  label: string; // short, non-identifying: "Courier ops lead, about 4 years"
  verdict: Verdict;
  verdict_reason: string;
  coverage: {
    capability_id: string;
    evidence: Evidence;
    quote: string | null; // the candidate's own words that show it
    note: string; // why that counts, or what's missing
  }[];
  questions: { capability_id: string; question: string; listen_for: string }[];
  ramp: { capability_id: string; what: string; how: string; estimate: string }[];
};

export type CandidateRequest = {
  step: "candidate";
  role: string;
  industry: string;
  capabilities: Capability[];
  candidate: string;
};

export type CandidateResponse = { check: Omit<CandidateCheck, "id"> };

export type AnalyseRequest = CapabilitiesRequest | FieldsRequest | ReplaceRequest | CandidateRequest;

export type CapabilitiesResponse = { industry: string; capabilities: Capability[] };
export type FieldsResponse = { fields: Field[]; gap: Gap };
export type ReplaceResponse = { field: Field };
