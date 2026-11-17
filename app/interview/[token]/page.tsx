import type { Metadata } from "next";
import WorkspaceApp from "@/components/workspace/WorkspaceApp";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Written interview · adjacent", robots: { index: false } };

// A candidate's private page for the written interview. The link is sent by the employer.
export default async function InterviewPage({ params }: { params: Promise<{ token: string }> }) {
  return <WorkspaceApp mode="interview" token={(await params).token} />;
}
