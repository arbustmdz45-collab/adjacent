import { NextResponse } from "next/server";
import { purgeExpired } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Daily retention job (vercel.json schedules it). Vercel sends "Authorization: Bearer <CRON_SECRET>".
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Not allowed." }, { status: 401 });
  }
  const removed = await purgeExpired();
  return NextResponse.json({ ok: true, removed });
}
