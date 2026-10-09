import { describe, it, expect } from "vitest";
import { computeLoadCeiling, drillAllowed, validatePlan, checkEscalation, type DrillMeta } from "./index";
import type { DailyPlan, ReadinessCheck } from "@relaax/schema";

const fresh: ReadinessCheck = { sleepQuality: 4, fatigue: 1, energy: 5, painFlag: false, sore: [] };
const base = { readiness: fresh, ageBand: "13-15" as const, sessionsLast7d: 3, todayIsGame: false, tomorrowIsGame: false };

describe("computeLoadCeiling", () => {
  it("allows high load when fresh", () => {
    expect(computeLoadCeiling(base).ceiling).toBe("high");
  });
  it("pain flag forces recovery", () => {
    const r = computeLoadCeiling({ ...base, readiness: { ...fresh, painFlag: true } });
    expect(r.ceiling).toBe("recovery");
    expect(r.reasons[0]).toMatch(/pain/);
  });
  it("fatigue 4 forces recovery, fatigue 3 caps moderate", () => {
    expect(computeLoadCeiling({ ...base, readiness: { ...fresh, fatigue: 4 } }).ceiling).toBe("recovery");
    expect(computeLoadCeiling({ ...base, readiness: { ...fresh, fatigue: 3 } }).ceiling).toBe("moderate");
  });
  it("poor sleep or low energy caps light", () => {
    expect(computeLoadCeiling({ ...base, readiness: { ...fresh, sleepQuality: 2 } }).ceiling).toBe("light");
    expect(computeLoadCeiling({ ...base, readiness: { ...fresh, energy: 1 } }).ceiling).toBe("light");
  });
  it("game today caps light, game tomorrow caps moderate", () => {
    expect(computeLoadCeiling({ ...base, todayIsGame: true }).ceiling).toBe("light");
    expect(computeLoadCeiling({ ...base, tomorrowIsGame: true }).ceiling).toBe("moderate");
  });
  it("weekly cap by age band", () => {
    expect(computeLoadCeiling({ ...base, ageBand: "8-10", sessionsLast7d: 4 }).ceiling).toBe("recovery");
    expect(computeLoadCeiling({ ...base, ageBand: "16-18", sessionsLast7d: 4 }).ceiling).toBe("high");
  });
  it("takes the strictest of several rules", () => {
    const r = computeLoadCeiling({ ...base, tomorrowIsGame: true, readiness: { ...fresh, sleepQuality: 1 } });
    expect(r.ceiling).toBe("light");
    expect(r.reasons).toHaveLength(2);
  });
});

const sprint: DrillMeta = { id: "cond-sprint", category: "conditioning", load: "high", bodyRegions: ["hamstrings", "calves"], levelMin: 1, levelMax: 5 };
const squat: DrillMeta = { id: "str-goblet", category: "strength", load: "high", bodyRegions: ["quads", "knees"], levelMin: 2, levelMax: 5, loaded: true };
const wall: DrillMeta = { id: "wb-1", category: "wall_ball", load: "light", bodyRegions: ["wrists"], levelMin: 1, levelMax: 5 };

describe("drillAllowed", () => {
  const ctx = { ageBand: "13-15" as const, ceiling: "high" as const, sore: [] as string[], level: 3 };
  it("blocks drills above ceiling", () => {
    expect(drillAllowed(sprint, { ...ctx, ceiling: "light" }).ok).toBe(false);
    expect(drillAllowed(wall, { ...ctx, ceiling: "light" }).ok).toBe(true);
  });
  it("blocks drills on sore regions", () => {
    expect(drillAllowed(sprint, { ...ctx, sore: ["calves"] }).reason).toMatch(/sore/);
  });
  it("blocks loaded strength under 13", () => {
    expect(drillAllowed(squat, { ...ctx, ageBand: "11-12" }).reason).toMatch(/under 13/);
    expect(drillAllowed(squat, { ...ctx, ageBand: "13-15" }).ok).toBe(true);
  });
  it("blocks any strength session for 8-10", () => {
    const bw: DrillMeta = { ...squat, loaded: false };
    expect(drillAllowed(bw, { ...ctx, ageBand: "8-10", level: 2 }).ok).toBe(false);
  });
  it("respects level band", () => {
    expect(drillAllowed(squat, { ...ctx, level: 1 }).reason).toMatch(/level/);
  });
});

describe("validatePlan", () => {
  const drills = new Map([[sprint.id, sprint], [squat.id, squat], [wall.id, wall]]);
  const plan: DailyPlan = {
    theme: "t",
    sessions: [
      { slot: "am", type: "conditioning", durationMin: 30, drills: [{ drillId: "cond-sprint", sets: 4, reps: 6 }] },
      { slot: "pm", type: "skills", durationMin: 80, drills: [{ drillId: "wb-1", sets: 3, reps: 50 }, { drillId: "ghost", sets: 1, reps: 1 }] },
      { slot: "evening", type: "team_practice", durationMin: 90, drills: [] },
    ],
    fuelProfile: { preSession: "carb_forward", postSession: "protein_recovery", hydration: "normal", timingNotes: "" },
    microLesson: { title: "t", body: "b", trigger: "morning" },
    flags: [],
  };
  it("drops sessions over the ceiling, unknown drills, and caps duration by age", () => {
    const { plan: safe, dropped } = validatePlan(plan, { ageBand: "13-15", ceiling: "light", sore: [], level: 3, drills });
    expect(safe.sessions.map((s) => s.type)).toEqual(["skills", "team_practice"]);
    expect(safe.sessions[0]!.durationMin).toBe(60);
    expect(safe.sessions[0]!.drills.map((d) => d.drillId)).toEqual(["wb-1"]);
    expect(dropped.map((d) => d.reason)).toEqual(expect.arrayContaining([expect.stringMatching(/exceeds/), expect.stringMatching(/unknown/), expect.stringMatching(/capped/)]));
  });
  it("never returns an empty day", () => {
    const { plan: safe } = validatePlan({ ...plan, sessions: [plan.sessions[0]!] }, { ageBand: "8-10", ceiling: "rest", sore: [], level: 1, drills });
    expect(safe.sessions).toHaveLength(1);
    expect(safe.sessions[0]!.type).toBe("recovery");
  });
});

describe("checkEscalation", () => {
  it("escalates the four categories", () => {
    expect(checkEscalation("i don't want to be here anymore").kind).toBe("self_harm");
    expect(checkEscalation("I've been skipping meals to make weight").kind).toBe("disordered_eating");
    expect(checkEscalation("coach hit me and said don't tell my mom").kind).toBe("abuse");
    expect(checkEscalation("heard a popping sound in my knee").kind).toBe("injury");
  });
  it("passes ordinary coaching questions", () => {
    expect(checkEscalation("my legs are tired after practice, should I still do wall ball?").escalate).toBe(false);
    expect(checkEscalation("what should I eat before a 6pm game").escalate).toBe(false);
  });
});
