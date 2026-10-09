import { z } from "zod";

export const Role = z.enum(["athlete", "parent", "coach", "admin"]);
export type Role = z.infer<typeof Role>;

/** Age bands drive every guardrail; never pass a raw age to the model. */
export const AgeBand = z.enum(["8-10", "11-12", "13-15", "16-18", "adult"]);
export type AgeBand = z.infer<typeof AgeBand>;

export const Position = z.enum(["attack", "midfield", "defense", "goalie", "fogo", "lsm"]);
export type Position = z.infer<typeof Position>;

export const DrillCategory = z.enum([
  "wall_ball", "stick", "footwork", "vision", "conditioning", "strength", "recovery",
]);
export type DrillCategory = z.infer<typeof DrillCategory>;

export const LoadCeiling = z.enum(["rest", "recovery", "light", "moderate", "high"]);
export type LoadCeiling = z.infer<typeof LoadCeiling>;

export const SessionType = z.enum(["skills", "conditioning", "strength", "team_practice", "game", "recovery", "rest"]);
export type SessionType = z.infer<typeof SessionType>;

export const BodyRegion = z.enum([
  "neck", "shoulders", "back", "hips", "quads", "hamstrings", "knees", "calves", "ankles", "wrists",
]);
export type BodyRegion = z.infer<typeof BodyRegion>;

export const BenefitTag = z.enum([
  "high_protein", "sustained_energy", "muscle_recovery", "hydration", "quick_fuel", "fiber_rich",
]);
export type BenefitTag = z.infer<typeof BenefitTag>;

export const FuelProfileKind = z.enum(["carb_forward", "balanced", "protein_recovery", "light"]);
export const MealMoment = z.enum(["breakfast", "pre_session", "post_session", "regular", "snack"]);
export type MealMoment = z.infer<typeof MealMoment>;

export const ConsentScope = z.enum([
  "social_visibility", "camp_purchases", "clip_sharing", "health_view", "coach_access",
]);
export type ConsentScope = z.infer<typeof ConsentScope>;

export const SubscriptionTier = z.enum(["basic", "elite_recruit", "camp_pass"]);
