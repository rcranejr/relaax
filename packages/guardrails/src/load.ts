import type { AgeBand, LoadCeiling, ReadinessCheck } from "@relaax/schema";

const ORDER: LoadCeiling[] = ["rest", "recovery", "light", "moderate", "high"];
export const loadRank = (l: LoadCeiling) => ORDER.indexOf(l);
export const minLoad = (a: LoadCeiling, b: LoadCeiling): LoadCeiling =>
  loadRank(a) <= loadRank(b) ? a : b;

export interface LoadInput {
  readiness: ReadinessCheck;
  ageBand: AgeBand;
  sessionsLast7d: number;
  todayIsGame: boolean;
  tomorrowIsGame: boolean;
}

/**
 * The one function that decides how hard today may be.
 * Deterministic, no model involvement, every rule has a test.
 */
export function computeLoadCeiling(i: LoadInput): { ceiling: LoadCeiling; reasons: string[] } {
  const reasons: string[] = [];
  let ceiling: LoadCeiling = "high";

  if (i.readiness.painFlag) {
    ceiling = minLoad(ceiling, "recovery");
    reasons.push("pain reported: recovery only, tell a parent or athletic trainer");
  }
  if (i.readiness.fatigue >= 4) {
    ceiling = minLoad(ceiling, "recovery");
    reasons.push("fatigue 4+: recovery day");
  } else if (i.readiness.fatigue === 3) {
    ceiling = minLoad(ceiling, "moderate");
    reasons.push("fatigue 3: moderate cap");
  }
  if (i.readiness.sleepQuality <= 2) {
    ceiling = minLoad(ceiling, "light");
    reasons.push("poor sleep: light cap");
  }
  if (i.readiness.energy <= 2) {
    ceiling = minLoad(ceiling, "light");
    reasons.push("low energy: light cap");
  }
  if (i.todayIsGame) {
    ceiling = minLoad(ceiling, "light");
    reasons.push("game day: light skills only outside the game");
  }
  if (i.tomorrowIsGame) {
    ceiling = minLoad(ceiling, "moderate");
    reasons.push("game tomorrow: no high load");
  }
  // Weekly volume cap by age band (sessions, not hours; team practice counts).
  const weeklyCap: Record<AgeBand, number> = { "8-10": 4, "11-12": 5, "13-15": 6, "16-18": 7, adult: 7 };
  if (i.sessionsLast7d >= weeklyCap[i.ageBand]) {
    ceiling = minLoad(ceiling, "recovery");
    reasons.push(`weekly session cap reached for ${i.ageBand}`);
  }
  return { ceiling, reasons };
}
