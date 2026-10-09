import type { AgeBand, Position } from "@relaax/schema";
import { LlmGateway } from "./gateway";
import { COACH_SYSTEM } from "./prompts/coach";
import { PROMPT_VERSIONS } from "./prompts/versions";
import { scrubPii } from "./scrub";

export interface CoachTurnInput {
  ageBand: AgeBand;
  position: Position;
  memoryNotes: string[];                 // retrieved ai_memory rows, already PII-free
  recentReadiness: string[];             // "Tue: fatigue 3, sore calves"
  history: { role: "user" | "assistant"; content: string }[]; // last 12 turns
  message: string;
  knownNames?: string[];
}

export async function coachReply(gw: LlmGateway, i: CoachTurnInput): Promise<string> {
  const system = `${COACH_SYSTEM}\n\nAthlete: age band ${i.ageBand}, position ${i.position}.\nMemory notes:\n${i.memoryNotes.map((m) => `- ${m}`).join("\n") || "- none yet"}\nRecent readiness:\n${i.recentReadiness.map((m) => `- ${m}`).join("\n") || "- none yet"}`;
  const messages = [...i.history, { role: "user" as const, content: i.message }].map((m) => ({ ...m, content: scrubPii(m.content, i.knownNames) }));
  return gw.chat({ task: "coach", promptVersion: PROMPT_VERSIONS.coach, system, messages: messages.slice(-13) });
}
