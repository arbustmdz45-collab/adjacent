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
  activity: string; // the specific activity in the other field that transfers
};

export type Field = {
  id: string;
  field: string;
  strength: Strength;
  maps: Mapping[];
  where_built: string;
  still_to_learn: string;
  why_weak: string | null; // required when strength is "weak"
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

export type AnalyseRequest = CapabilitiesRequest | FieldsRequest | ReplaceRequest;

export type CapabilitiesResponse = { industry: string; capabilities: Capability[] };
export type FieldsResponse = { fields: Field[]; gap: Gap };
export type ReplaceResponse = { field: Field };
