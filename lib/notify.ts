import "server-only";

// Best effort: tell the operator something happened (new candidate, employer interest).
// Uses the same LEADS_WEBHOOK_URL as the sign-up forms. Never blocks the user's action.
export async function notify(event: Record<string, unknown>) {
  const hook = process.env.LEADS_WEBHOOK_URL;
  if (!hook) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...event, submitted_at: new Date().toISOString() }),
    });
  } catch (err) {
    console.error("Notify webhook failed:", err);
  }
}
