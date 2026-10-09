/**
 * Rules layer for the AI coach. Deterministic: a match always escalates, no model vote.
 * Patterns are intentionally broad; the cost of a false positive is a supportive message
 * and a parent notification, the cost of a miss is unacceptable.
 */
const PATTERNS: { kind: "self_harm" | "disordered_eating" | "abuse" | "injury"; re: RegExp }[] = [
  { kind: "self_harm", re: /\b(kill myself|end it all|don'?t want to (be here|live)|hurt myself|suicid)/i },
  { kind: "disordered_eating", re: /\b(skip(ping)? meals? to|not eat(ing)? (all day|anything)|throw(ing)? up after|purge|make myself (sick|throw up)|too fat to)/i },
  { kind: "abuse", re: /\b(coach|he|she|they) (hit|touch(ed|es)?|hurt)s? me\b|\bdon'?t tell (my )?(mom|dad|parents)/i },
  { kind: "injury", re: /\b(sharp pain|can'?t (walk|put weight)|popping sound|numb|concuss|hit my head|dizzy)/i },
];

export type EscalationKind = (typeof PATTERNS)[number]["kind"];

export function checkEscalation(text: string): { escalate: boolean; kind?: EscalationKind } {
  for (const p of PATTERNS) if (p.re.test(text)) return { escalate: true, kind: p.kind };
  return { escalate: false };
}

export const FIXED_RESPONSES: Record<EscalationKind, string> = {
  self_harm:
    "Thank you for telling me. What you're feeling matters and you deserve support from a person right now. Please talk to a parent, a trusted adult, or call or text 988. I've let your parent know you might want to talk.",
  disordered_eating:
    "I hear you, and I want you to be safe. Fuel is what makes you fast and strong, and skipping it isn't something I can help plan. Please talk with a parent or your doctor about this; I've let your parent know you might want to talk.",
  abuse:
    "I'm really glad you told me. Nobody is allowed to hurt you, and this isn't something to keep secret. Please tell a parent or another adult you trust right away. I've flagged this so a trusted adult can check in with you.",
  injury:
    "Stop the session now. That sounds like something a parent or athletic trainer needs to look at today, not something to train through. I've paused your plan and let your parent know.",
};
