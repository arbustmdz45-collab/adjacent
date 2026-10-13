"use client";

import { useState } from "react";

export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <button
      type="button"
      className="text-button"
      onClick={() =>
        navigator.clipboard
          ?.writeText(text)
          .then(() => setState("copied"))
          .catch(() => setState("failed"))
          .finally(() => setTimeout(() => setState("idle"), 1600))
      }
    >
      {state === "copied" ? "Copied" : state === "failed" ? "Select and copy it by hand" : label}
    </button>
  );
}
