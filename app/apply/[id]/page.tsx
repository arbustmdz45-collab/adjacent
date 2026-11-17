import type { Metadata } from "next";
import WorkspaceApp from "@/components/workspace/WorkspaceApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Answer this opening · adjacent", robots: { index: false } };

// The public candidate page for one opening. No account, no CV.
export default async function ApplyPage({ params }: { params: Promise<{ id: string }> }) {
  return <WorkspaceApp mode="apply" openingId={(await params).id} />;
}
