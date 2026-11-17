import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { crossSite } from "@/lib/rate-limit";
import { deleteOpening, patchCandidate, patchOpening } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

// Pipeline changes: a candidate's status, test, interview and 90-day result; an opening's hardest activity or open state.
export async function POST(req: Request) {
  if (crossSite(req)) return bad("Not allowed.", 403);
  if (!(await isAdmin())) return bad("Sign in first.", 401);
  let body: { kind?: string; id?: string; patch?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return bad("Invalid request.");
  }
  const id = typeof body.id === "string" ? body.id.slice(0, 40) : "";
  if (!id) return bad("Invalid request.");
  try {
    if (body.kind === "delete-opening") {
      await deleteOpening(id);
      return NextResponse.json({ ok: true });
    }
    const patch = body.patch && typeof body.patch === "object" ? body.patch : {};
    const doc = body.kind === "opening" ? await patchOpening(id, patch) : body.kind === "candidate" ? await patchCandidate(id, patch) : null;
    if (!doc) return bad("Not found.", 404);
    return NextResponse.json({ doc });
  } catch (err) {
    console.error(err);
    return bad("That change could not be saved. Try again.", 502);
  }
}
