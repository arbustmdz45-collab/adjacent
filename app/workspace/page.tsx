import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WorkspaceApp from "@/components/workspace/WorkspaceApp";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "adjacent workspace", robots: { index: false } };

// The employer workspace. For now one operator signs in with ADMIN_PASSWORD; per-employer accounts come next.
export default async function WorkspacePage() {
  if (!(await isAdmin())) redirect("/admin/login");
  return <WorkspaceApp mode="workspace" />;
}
