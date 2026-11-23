import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM } from "./prompt";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export type ToolDef = { name: string; description: string; input_schema: unknown };

// A 400 that names one of the knobs below means this model does not take it; the same call
// goes out again without it. Anything else is a real error and is thrown.
const refused = (err: unknown, knob: RegExp) => {
  const e = err as { status?: number; error?: { error?: { message?: string } } };
  return e?.status === 400 && knob.test(e?.error?.error?.message || "");
};

// One structured call: the model answers through `tool`, so the output always fits its schema.
// Two things vary by model: whether the tool can be forced, and whether the model reasons before
// answering. Reasoning eats the output budget, which is why it is turned off where that is allowed.
export async function ask<T>(tool: ToolDef, prompt: string, system: string = SYSTEM): Promise<T> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const open = `${prompt}\n\nAnswer only by calling the tool ${tool.name}. Do not write anything outside it.`;
  const build = (forced: boolean, think: boolean) => ({
    model: MODEL,
    max_tokens: 8000,
    system,
    tools: [tool as unknown as Anthropic.Tool],
    messages: [{ role: "user" as const, content: forced ? prompt : open }],
    ...(forced ? { tool_choice: { type: "tool" as const, name: tool.name } } : { tool_choice: { type: "auto" as const } }),
    ...(think ? {} : { thinking: { type: "disabled" as const } }),
  });

  let res;
  try {
    res = await client.messages.create(build(true, false));
  } catch (err) {
    if (refused(err, /tool_choice/i)) {
      try {
        res = await client.messages.create(build(false, false));
      } catch (err2) {
        if (!refused(err2, /thinking/i)) throw err2;
        res = await client.messages.create(build(false, true));
      }
    } else if (refused(err, /thinking/i)) {
      res = await client.messages.create(build(true, true));
    } else {
      throw err;
    }
  }

  if (res.stop_reason === "max_tokens") throw new Error("The model's answer was cut off before it was complete.");
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("The model returned no structured answer.");
  return block.input as T;
}
