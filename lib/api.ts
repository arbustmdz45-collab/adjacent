import type {
  AnalyseRequest,
  CandidateRequest,
  CandidateResponse,
  CapabilitiesResponse,
  FieldsRequest,
  FieldsResponse,
  ReplaceRequest,
  ReplaceResponse,
} from "./types";

async function post<T>(body: AnalyseRequest): Promise<T> {
  const res = await fetch("/api/analyse", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong.");
  return data as T;
}

export const getCapabilities = (role: string) =>
  post<CapabilitiesResponse>({ step: "capabilities", role });

export const getFields = (body: Omit<FieldsRequest, "step">) =>
  post<FieldsResponse>({ step: "fields", ...body });

export const checkCandidate = (body: Omit<CandidateRequest, "step">) =>
  post<CandidateResponse>({ step: "candidate", ...body });

export const replaceField = (body: Omit<ReplaceRequest, "step">) =>
  post<ReplaceResponse>({ step: "replace", ...body });
