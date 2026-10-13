"use client";

import { useActionState } from "react";
import { findMatches } from "@/app/admin/actions";

export default function FindMatches({ roleId, poolSize }: { roleId: string; poolSize: number }) {
  const [message, action, pending] = useActionState(findMatches.bind(null, roleId), null);
  return (
    <form action={action} className="notice">
      <p>
        Check the {poolSize} {poolSize === 1 ? "person" : "people"} in the pool against this role. Each gets a reading,
        capability by capability, with their own words as evidence. You decide who goes on the shortlist.
      </p>
      <div className="actions">
        <button className="button" type="submit" disabled={pending || poolSize === 0}>
          {pending ? "Reading the pool…" : "Find people in the pool →"}
        </button>
        {pending && <span className="small-label">About 10 seconds per person</span>}
      </div>
      {message && <p aria-live="polite">{message}</p>}
    </form>
  );
}
