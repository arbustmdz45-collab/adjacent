import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM } from "./prompt";

export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";

export type ToolDef = { name: string; description: string; input_schema: unknown };

// One structured call: the model must answer through `tool`, so the output always fits its schema.
export async function ask<T>(tool: ToolDef, prompt: string, system: string = SYSTEM): Promise<T> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system,
    tools: [tool as unknown as Anthropic.Tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: [{ role: "user", content: prompt }],
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("The model returned no structured answer.");
  return block.input as T;
}
