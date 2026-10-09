import { z } from "zod";
import { AgeBand, Position } from "./enums";

export const AthleteProfile = z.object({
  userId: z.string().uuid(),
  displayName: z.string().min(1).max(40),
  graduationYear: z.number().int().min(2026).max(2040),
  primaryPosition: Position,
  secondaryPosition: Position.optional(),
  dominantHand: z.enum(["left", "right"]).optional(),
  cuisinePrefs: z.array(z.string()).default([]),
  dietaryPattern: z.enum(["none", "vegetarian", "vegan", "kosher", "halal", "gluten_free"]).default("none"),
  level: z.number().int().min(1).max(5).default(1),
  goals: z.array(z.string()).default([]),
});
export type AthleteProfile = z.infer<typeof AthleteProfile>;

/** Pre-session readiness check. Stored in the health vault; only derived values leave it. */
export const ReadinessCheck = z.object({
  sleepQuality: z.number().int().min(1).max(5),
  fatigue: z.number().int().min(1).max(5),
  energy: z.number().int().min(1).max(5),
  painFlag: z.boolean(),
  sore: z.array(z.string()).default([]),
});
export type ReadinessCheck = z.infer<typeof ReadinessCheck>;

export function ageBandFromDob(dob: Date, now = new Date()): AgeBand {
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  if (age >= 18) return "adult";
  if (age >= 16) return "16-18";
  if (age >= 13) return "13-15";
  if (age >= 11) return "11-12";
  return "8-10";
}

export const isMinor = (band: AgeBand) => band !== "adult";
