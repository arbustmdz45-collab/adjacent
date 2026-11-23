import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM } from "./prompt";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export type ToolDef = { name: string; description: string; input_schema: unknown };

const forcedToolRefused = (err: unknown) => {
  const e = err as { status?: number; error?: { error?: { message?: string } } };
  return e?.status === 400 && /tool_choice/i.test(e?.error?.error?.message || "");
};

// One structured call: the model answers through `tool`, so the output always fits its schema.
// Forcing the tool is the strong form, but not every model allows it; where it is refused, the
// same call goes out with the choice left open and the instruction carried in the prompt instead.
export async function ask<T>(tool: ToolDef, prompt: string, system: string = SYSTEM): Promise<T> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const base = {
    model: MODEL,
    max_tokens: 8000, // four fields with their coverage, the ad, the test and the questions do not fit in 4000
    system,
    tools: [tool as unknown as Anthropic.Tool],
    messages: [{ role: "user" as const, content: prompt }],
  };
  let res;
  try {
    res = await client.messages.create({ ...base, tool_choice: { type: "tool", name: tool.name } });
  } catch (err) {
    if (!forcedToolRefused(err)) throw err;
    res = await client.messages.create({
      ...base,
      tool_choice: { type: "auto" },
      messages: [{ role: "user" as const, content: `${prompt}\n\nAnswer only by calling the tool ${tool.name}. Do not write anything outside it.` }],
    });
  }
  if (res.stop_reason === "max_tokens") throw new Error("The model's answer was cut off before it was complete.");
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("The model returned no structured answer.");
  return block.input as T;
}
