import type { AgeBand, DrillCategory, LoadCeiling } from "@relaax/schema";
import { loadRank } from "./load";

export interface DrillMeta {
  id: string;
  category: DrillCategory;
  load: LoadCeiling;            // the minimum ceiling this drill needs
  bodyRegions: string[];        // regions it stresses; excluded when sore
  levelMin: number;
  levelMax: number;
  loaded?: boolean;             // external load (bars, dumbbells)
}

export function drillAllowed(
  d: DrillMeta,
  ctx: { ageBand: AgeBand; ceiling: LoadCeiling; sore: string[]; level: number },
): { ok: boolean; reason?: string } {
  if (loadRank(d.load) > loadRank(ctx.ceiling)) return { ok: false, reason: "above load ceiling" };
  if (d.bodyRegions.some((r) => ctx.sore.includes(r))) return { ok: false, reason: "stresses a sore region" };
  if (ctx.level < d.levelMin || ctx.level > d.levelMax) return { ok: false, reason: "outside level band" };
  // No external load under 13; bodyweight strength only.
  if (d.loaded && (ctx.ageBand === "8-10" || ctx.ageBand === "11-12")) {
    return { ok: false, reason: "loaded strength not allowed under 13" };
  }
  if (d.category === "strength" && ctx.ageBand === "8-10") {
    return { ok: false, reason: "no dedicated strength sessions for 8-10" };
  }
  return { ok: true };
}
