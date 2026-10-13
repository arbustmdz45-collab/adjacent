"use server";

import { revalidatePath } from "next/cache";
import { notify } from "@/lib/notify";
import { getRoleByToken, markEmployerInterest } from "@/lib/store";

export async function wantToMeet(token: string, matchId: string) {
  const ok = await markEmployerInterest(token, matchId);
  if (ok) {
    const role = await getRoleByToken(token);
    await notify({ type: "employer_interest", company: role?.company, role: role?.title, match_id: matchId });
  }
  revalidatePath(`/r/${token}`);
}
