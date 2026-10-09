import type { AgeBand, DailyPlan, LoadCeiling } from "@relaax/schema";
import { drillAllowed, type DrillMeta } from "./drills";
import { loadRank } from "./load";

const SESSION_LOAD: Record<DailyPlan["sessions"][number]["type"], LoadCeiling> = {
  rest: "rest", recovery: "recovery", skills: "light", team_practice: "moderate",
  conditioning: "high", strength: "high", game: "high",
};

const MAX_MIN_BY_BAND: Record<AgeBand, number> = { "8-10": 30, "11-12": 45, "13-15": 60, "16-18": 90, adult: 120 };

/**
 * Re-checks every drill and session the model produced. Anything that fails is dropped
 * and reported; the plan is never rejected wholesale, so the athlete always has a day.
 */
export function validatePlan(
  plan: DailyPlan,
  ctx: { ageBand: AgeBand; ceiling: LoadCeiling; sore: string[]; level: number; drills: Map<string, DrillMeta> },
): { plan: DailyPlan; dropped: { drillId?: string; session?: string; reason: string }[] } {
  const dropped: { drillId?: string; session?: string; reason: string }[] = [];
  const sessions = plan.sessions
    .map((s) => {
      // Team practice and games are scheduled by the coach, not us: they pass through
      // but any drills attached to them still get checked.
      const external = s.type === "team_practice" || s.type === "game";
      if (!external && loadRank(SESSION_LOAD[s.type]) > loadRank(ctx.ceiling)) {
        dropped.push({ session: s.slot, reason: `${s.type} exceeds ceiling ${ctx.ceiling}` });
        return null;
      }
      let durationMin = s.durationMin;
      if (!external && durationMin > MAX_MIN_BY_BAND[ctx.ageBand]) {
        dropped.push({ session: s.slot, reason: `duration capped to ${MAX_MIN_BY_BAND[ctx.ageBand]} min` });
        durationMin = MAX_MIN_BY_BAND[ctx.ageBand];
      }
      const drills = s.drills.filter((d) => {
        const meta = ctx.drills.get(d.drillId);
        if (!meta) { dropped.push({ drillId: d.drillId, reason: "unknown drill id" }); return false; }
        const r = drillAllowed(meta, ctx);
        if (!r.ok) dropped.push({ drillId: d.drillId, reason: r.reason! });
        return r.ok;
      });
      return { ...s, durationMin, drills };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);

  const safe: DailyPlan = {
    ...plan,
    sessions: sessions.length ? sessions : [{ slot: "pm", type: "recovery", durationMin: 10, drills: [] }],
    flags: [...plan.flags, ...dropped.map((d) => d.reason)],
  };
  return { plan: safe, dropped };
}
