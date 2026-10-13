import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import Tool from "@/components/Tool";

export const metadata: Metadata = {
  title: "Read my day — adjacent",
  description: "Describe what you do all day at work. See what it shows you can do, and three fields outside your industry that need it.",
};

export default function TryPage() {
  return (
    <>
      <SiteHeader current="tool" />
      <Tool />
    </>
  );
}
