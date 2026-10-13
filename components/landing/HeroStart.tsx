"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { DRAFT_KEY } from "@/components/Tool";

// The hero's textarea starts the tool: the text is handed to /try, which reads it straight away.
export default function HeroStart() {
  const router = useRouter();
  const [text, setText] = useState("");
  const ready = text.trim().length >= 20;

  return (
    <form
      className="start"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        try {
          sessionStorage.setItem(DRAFT_KEY, text.trim());
        } catch {}
        router.push("/try");
      }}
    >
      <label htmlFor="hero-day">A normal day at your job, in your words</label>
      <textarea
        id="hero-day"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="I run the floor at a busy restaurant on weekends: I seat walk-ins when we're full, calm down angry tables, and decide which orders go first when the kitchen falls behind…"
      />
      <div className="start-row">
        <button className="btn" type="submit" disabled={!ready}>
          Read my day →
        </button>
        <span className="start-note">FREE · NO ACCOUNT · NOTHING SAVED</span>
      </div>
    </form>
  );
}
