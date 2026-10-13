"use client";

import { useActionState } from "react";
import { newRole } from "@/app/admin/actions";

export default function NewRoleForm() {
  const [error, action, pending] = useActionState(newRole, null);
  return (
    <form action={action} className="field">
      <div className="stack gap-8">
        <p className="eyebrow">New role from an employer</p>
        <h2 className="h3">Break a hard-to-fill role down</h2>
        <p className="cap-detail">
          You get the activities it really requires, three fields where people already do them, a job ad they&apos;ll
          recognise themselves in, and interview questions. Then match it against the pool.
        </p>
      </div>
      <label className="stack gap-8">
        <span className="small-label">Company</span>
        <input className="input" name="company" required placeholder="Company name" />
      </label>
      <label className="stack gap-8">
        <span className="small-label">Employer contact email (optional)</span>
        <input className="input" name="contact" type="email" placeholder="name@company.com" />
      </label>
      <label className="stack gap-8">
        <span className="small-label">What the person in this role actually does</span>
        <textarea
          className="textarea"
          name="description"
          rows={6}
          required
          placeholder="Night-shift warehouse lead. Runs a team of 8 pickers, re-plans the pick order when trucks arrive late, deals with drivers, keeps the stock count right…"
        />
      </label>
      {error && (
        <div className="notice error">
          <p>{error}</p>
        </div>
      )}
      <div className="actions">
        <button className="button" type="submit" disabled={pending}>
          {pending ? "Breaking it down…" : "Break it down →"}
        </button>
        {pending && <span className="small-label">About half a minute</span>}
      </div>
    </form>
  );
}
