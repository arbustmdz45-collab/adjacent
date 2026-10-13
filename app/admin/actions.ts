"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ask } from "@/lib/ai";
import { clearAdminCookie, passwordMatches, requireAdmin, setAdminCookie } from "@/lib/auth";
import { checkAgainst } from "@/lib/check";
import { CANDIDATE_TOOL, HIRING_SYSTEM, ROLE_TOOL, candidatePrompt, rolePrompt, type RoleBreakdown } from "@/lib/hiring-prompt";
import type { CandidateResponse } from "@/lib/types";
import {
  candidateText,
  createRole,
  describeMoves,
  getRole,
  isStage,
  listCandidates,
  matchedCandidateIds,
  provenMoves,
  setStage,
  updateRoleBasics,
  upsertMatch,
} from "@/lib/store";

const str = (f: FormData, k: string, max = 4000) => String(f.get(k) ?? "").trim().slice(0, max);

export async function login(_prev: string | null, form: FormData) {
  if (!process.env.ADMIN_PASSWORD) return "Set ADMIN_PASSWORD in your environment first.";
  if (!passwordMatches(str(form, "password", 200))) return "That password isn't right.";
  await setAdminCookie();
  redirect("/admin");
}

export async function logout() {
  await clearAdminCookie();
  redirect("/admin/login");
}

export async function newRole(_prev: string | null, form: FormData) {
  await requireAdmin();
  const company = str(form, "company", 200);
  const contact = str(form, "contact", 200);
  const description = str(form, "description", 6000);
  if (!company) return "Add the company's name.";
  if (description.length < 40) return "Describe the role in a few sentences: what the person actually does.";
  let id: string;
  try {
    const moves = await provenMoves();
    const b = await ask<RoleBreakdown>(ROLE_TOOL, rolePrompt(company, description, describeMoves(moves)), HIRING_SYSTEM);
    b.capabilities = b.capabilities.map((c, i) => ({ ...c, id: c.id || `c${i + 1}` }));
    id = await createRole(company, contact, description, b);
  } catch (err) {
    console.error(err);
    return "The breakdown failed. Try again in a moment.";
  }
  redirect(`/admin/roles/${id}`);
}

export async function updateRole(roleId: string, form: FormData) {
  await requireAdmin();
  const status = str(form, "status", 20) === "closed" ? "closed" : "open";
  await updateRoleBasics(roleId, str(form, "field_label", 80), status);
  revalidatePath(`/admin/roles/${roleId}`);
}

// Compare everyone in the pool who hasn't been checked for this role yet.
export async function findMatches(roleId: string, _prev: string | null) {
  await requireAdmin();
  const role = await getRole(roleId);
  if (!role) return "Role not found.";
  const done = await matchedCandidateIds(roleId);
  const todo = (await listCandidates(true)).filter((c) => !done.has(c.id)).slice(0, 20);
  if (!todo.length) return done.size ? "Everyone in the pool has already been checked for this role." : "The pool is empty so far.";
  let ok = 0;
  for (const c of todo) {
    try {
      const text = candidateText(c);
      const out = await ask<CandidateResponse>(
        CANDIDATE_TOOL,
        candidatePrompt(role.description, role.industry, role.capabilities, text),
        HIRING_SYSTEM,
      );
      await upsertMatch(roleId, c.id, checkAgainst(out.check, role.capabilities, text));
      ok++;
    } catch (err) {
      console.error("Match failed for", c.id, err);
    }
  }
  revalidatePath(`/admin/roles/${roleId}`);
  return `Checked ${ok} ${ok === 1 ? "person" : "people"} from the pool${ok < todo.length ? `; ${todo.length - ok} failed, run it again` : ""}.`;
}

export async function moveStage(roleId: string, matchId: string, form: FormData) {
  await requireAdmin();
  const stage = str(form, "stage", 30);
  if (!isStage(stage)) return;
  await setStage(matchId, stage, str(form, "note", 1000));
  revalidatePath(`/admin/roles/${roleId}`);
  revalidatePath("/admin/moves");
}
