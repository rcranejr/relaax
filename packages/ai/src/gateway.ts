import Anthropic from "@anthropic-ai/sdk";
import { z, type ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export type Task = "planner" | "nutrition" | "coach" | "classify";

/** Per-task model routing. Change here, nowhere else. */
export const MODEL_FOR: Record<Task, string> = {
  planner: process.env.RELAAX_MODEL_PLANNER ?? "claude-sonnet-4-5",
  nutrition: process.env.RELAAX_MODEL_NUTRITION ?? "claude-sonnet-4-5",
  coach: process.env.RELAAX_MODEL_COACH ?? "claude-sonnet-4-5",
  classify: process.env.RELAAX_MODEL_CLASSIFY ?? "claude-haiku-4-5",
};

export interface CallLog { task: Task; model: string; promptVersion: string; inputTokens: number; outputTokens: number; ms: number }
export type Logger = (l: CallLog) => void;

export class LlmGateway {
  private client: Anthropic;
  constructor(private log: Logger = () => {}, apiKey = process.env.ANTHROPIC_API_KEY) {
    this.client = new Anthropic({ apiKey });
  }

  /**
   * Structured call: the schema becomes a tool, tool_choice is forced, the result is parsed
   * with the same Zod schema. The caller never receives free text.
   */
  async structured<T extends ZodTypeAny>(opts: {
    task: Task; promptVersion: string; system: string; user: string; schema: T; toolName: string; maxTokens?: number;
  }): Promise<z.infer<T>> {
    const t0 = Date.now();
    const model = MODEL_FOR[opts.task];
    const res = await this.client.messages.create({
      model,
      max_tokens: opts.maxTokens ?? 2048,
      system: opts.system,
      messages: [{ role: "user", content: opts.user }],
      tools: [{ name: opts.toolName, description: "Return the result.", input_schema: zodToJsonSchema(opts.schema) as never }],
      tool_choice: { type: "tool", name: opts.toolName },
    });
    this.log({ task: opts.task, model, promptVersion: opts.promptVersion, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, ms: Date.now() - t0 });
    const block = res.content.find((c) => c.type === "tool_use");
    if (!block || block.type !== "tool_use") throw new Error("model returned no tool_use block");
    return opts.schema.parse(block.input);
  }

  async chat(opts: { task: Task; promptVersion: string; system: string; messages: { role: "user" | "assistant"; content: string }[]; maxTokens?: number }): Promise<string> {
    const t0 = Date.now();
    const model = MODEL_FOR[opts.task];
    const res = await this.client.messages.create({ model, max_tokens: opts.maxTokens ?? 600, system: opts.system, messages: opts.messages });
    this.log({ task: opts.task, model, promptVersion: opts.promptVersion, inputTokens: res.usage.input_tokens, outputTokens: res.usage.output_tokens, ms: Date.now() - t0 });
    return res.content.filter((c) => c.type === "text").map((c) => (c as { text: string }).text).join("");
  }
}
