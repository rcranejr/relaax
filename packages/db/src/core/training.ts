import { pgTable, uuid, text, timestamp, date, integer, jsonb, pgEnum, real, boolean } from "drizzle-orm/pg-core";
import { users } from "./identity";
import type { DailyPlan } from "@relaax/schema";

export const drillCategoryEnum = pgEnum("drill_category", ["wall_ball", "stick", "footwork", "vision", "conditioning", "strength", "recovery"]);

export const drills = pgTable("drills", {
  id: text("id").primaryKey(), // slug, e.g. wb-quick-stick-3
  name: text("name").notNull(),
  category: drillCategoryEnum("category").notNull(),
  positions: jsonb("positions").$type<string[]>().notNull().default([]),
  load: text("load").notNull(),                       // LoadCeiling needed
  bodyRegions: jsonb("body_regions").$type<string[]>().notNull().default([]),
  levelMin: integer("level_min").notNull().default(1),
  levelMax: integer("level_max").notNull().default(5),
  loaded: boolean("loaded").notNull().default(false),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  videoAssetId: text("video_asset_id"),
  instructions: text("instructions").notNull(),
  defaultSets: integer("default_sets").notNull().default(3),
  defaultReps: integer("default_reps").notNull().default(10),
});

export const trainingPlans = pgTable("training_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  planDate: date("plan_date", { mode: "date" }).notNull(),
  plan: jsonb("plan").$type<DailyPlan>().notNull(),
  loadCeiling: text("load_ceiling").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fitnessLogs = pgTable("fitness_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  planId: uuid("plan_id").references(() => trainingPlans.id),
  drillId: text("drill_id").references(() => drills.id),
  sessionType: text("session_type").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  durationS: integer("duration_s"),
  reps: integer("reps"),
  rpe: real("rpe"),
  rating: integer("rating"), // 1..5 thumbs-style
  notes: text("notes"),
});

export const scheduleEvents = pgTable("schedule_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  kind: text("kind").notNull(), // practice_am | practice_pm | game | tournament
  eventDate: date("event_date", { mode: "date" }).notNull(),
});
