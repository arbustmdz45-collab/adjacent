"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function AdminLogin() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <main className="page centered" id="main">
      <form action={action} className="column narrow" style={{ gap: 20 }}>
        <p className="eyebrow">adjacent · operator</p>
        <label htmlFor="password" className="label">
          Sign in
        </label>
        <input id="password" name="password" type="password" className="input" autoComplete="current-password" required />
        {error && (
          <div className="notice error">
            <p>{error}</p>
          </div>
        )}
        <div>
          <button className="button" type="submit" disabled={pending}>
            {pending ? "Checking…" : "Sign in"}
          </button>
        </div>
      </form>
    </main>
  );
}
