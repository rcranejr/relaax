import { describe, it, expect } from "vitest";
import { minorSafe } from "./serializer";

describe("minorSafe", () => {
  it("replaces sensitive numerics with trend tokens and strips calories", () => {
    const out = minorSafe({ name: "x", weightKg: 52.3, meals: [{ name: "oats", calories: 400, macros: { proteinG: 10 } }] }, { weightTrend: "up" });
    expect(out).toEqual({ name: "x", weightTrend: "up", meals: [{ name: "oats" }] });
  });
  it("leaves dates and plain values alone", () => {
    const d = new Date();
    expect(minorSafe({ at: d, rpe: 6 })).toEqual({ at: d, rpe: 6 });
  });
});
