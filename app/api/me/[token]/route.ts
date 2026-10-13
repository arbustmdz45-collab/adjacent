import { NextResponse } from "next/server";
import { exportCandidate } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Right of access and portability: the person's own data as a JSON file.
export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const data = await exportCandidate(token);
  if (!data) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="adjacent-my-data.json"',
      "Cache-Control": "no-store",
    },
  });
}
