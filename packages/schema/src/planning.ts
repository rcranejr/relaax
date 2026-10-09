import { z } from "zod";
import { AgeBand, LoadCeiling, Position, SessionType, FuelProfileKind } from "./enums";
import { ReadinessCheck } from "./athlete";

/** What the model sees. No names, no DOB, no free text from the health vault. */
export const PlanningContext = z.object({
  athlete: z.object({
    ageBand: AgeBand,
    position: Position,
    level: z.number().int().min(1).max(5),
    goals: z.array(z.string()).max(5),
  }),
  calendar: z.object({
    today: z.enum(["none", "practice_am", "practice_pm", "game", "tournament"]),
    tomorrow: z.enum(["none", "practice_am", "practice_pm", "game", "tournament"]),
    daysToNextGame: z.number().int().min(0).max(30),
  }),
  readiness: ReadinessCheck,
  loadCeiling: LoadCeiling,
  recent: z.object({
    sessionsLast7d: z.number().int().min(0),
    avgRpe: z.number().min(0).max(10),
    streakDays: z.number().int().min(0),
    lastDrillIds: z.array(z.string()).max(10),
  }),
  preferences: z.object({
    likedDrillTags: z.array(z.string()).max(10),
    dislikedDrillTags: z.array(z.string()).max(10),
  }),
  excludedDrillIds: z.array(z.string()),
  availableDrillIds: z.array(z.string()),
});
export type PlanningContext = z.infer<typeof PlanningContext>;

export const PlannedDrill = z.object({
  drillId: z.string(),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(200),
  coachNote: z.string().max(140).optional(),
});

export const PlannedSession = z.object({
  slot: z.enum(["am", "midday", "pm", "evening"]),
  type: SessionType,
  durationMin: z.number().int().min(0).max(120),
  drills: z.array(PlannedDrill).max(8),
});

export const FuelProfile = z.object({
  preSession: FuelProfileKind,
  postSession: FuelProfileKind,
  hydration: z.enum(["normal", "elevated", "high"]),
  timingNotes: z.string().max(160),
});
export type FuelProfile = z.infer<typeof FuelProfile>;

export const DailyPlan = z.object({
  theme: z.string().max(80),
  sessions: z.array(PlannedSession).min(1).max(4),
  fuelProfile: FuelProfile,
  microLesson: z.object({
    title: z.string().max(60),
    body: z.string().max(400),
    trigger: z.enum(["after_meal", "after_workout", "morning"]),
  }),
  flags: z.array(z.string()).default([]),
});
export type DailyPlan = z.infer<typeof DailyPlan>;
