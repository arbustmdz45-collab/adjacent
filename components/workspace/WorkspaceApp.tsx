"use client";

import { useEffect, useRef } from "react";
import "@fontsource/newsreader/400.css";
import "@fontsource/newsreader/400-italic.css";
import "@fontsource/newsreader/500.css";
import "@fontsource/hanken-grotesk/400.css";
import "@fontsource/hanken-grotesk/500.css";
import "@fontsource/hanken-grotesk/600.css";
import "./workspace.css";
import { boot } from "./engine";

// The workspace renders itself into one element (see engine.ts); React only mounts and unmounts it.
export default function WorkspaceApp({ mode, openingId, token }: { mode: "workspace" | "apply" | "interview"; openingId?: string; token?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    return boot(ref.current, { mode, openingId, token });
  }, [mode, openingId, token]);
  return <div ref={ref} className="adjw" />;
}
