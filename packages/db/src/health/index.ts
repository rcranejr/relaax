import { pgSchema, uuid, text, timestamp, integer, jsonb, boolean, real, pgEnum } from "drizzle-orm/pg-core";

/**
 * The health vault. Separate database, separate KMS key, row-level security, append-only access log.
 * No table here references core.users by foreign key; athlete_user_id is a plain uuid so the two
 * databases can live in different AWS accounts.
 */
export const health = pgSchema("health");

export const conditionEnum = health.enum("condition", ["asthma", "concussion_history", "cardiac_screen_on_file", "allergy_epipen", "other"]);

export const bodyMetrics = health.table("body_metrics", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull(),
  measuredAt: timestamp("measured_at").notNull().defaultNow(),
  heightCm: real("height_cm"),
  weightKg: real("weight_kg"),
  enteredBy: uuid("entered_by").notNull(), // parent or coach, never the minor
});

export const capabilityProfile = health.table("capability_profile", {
  athleteUserId: uuid("athlete_user_id").primaryKey(),
  clearedForContact: boolean("cleared_for_contact").notNull().default(false),
  conditions: jsonb("conditions").$type<string[]>().notNull().default([]),
  movementLimits: jsonb("movement_limits").$type<{ region: string; note: string }[]>().notNull().default([]),
  updatedBy: uuid("updated_by").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const readinessChecks = health.table("readiness_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull(),
  checkedAt: timestamp("checked_at").notNull().defaultNow(),
  sleepQuality: integer("sleep_quality").notNull(),
  fatigue: integer("fatigue").notNull(),
  energy: integer("energy").notNull(),
  painFlag: boolean("pain_flag").notNull(),
  sorenessMap: jsonb("soreness_map").$type<Record<string, number>>().notNull().default({}),
});

export const moodLogs = health.table("mood_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull(),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  mood: text("mood").notNull(), // great | good | ok | low | rough
  triggers: jsonb("triggers").$type<string[]>().notNull().default([]),
  freeTextEnc: text("free_text_enc"), // pgp_sym_encrypt at the service layer
  coachSessionId: uuid("coach_session_id"),
});

export const coachSessions = health.table("coach_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull(),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  endedAt: timestamp("ended_at"),
});

export const coachMessages = health.table("coach_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull(),
  role: text("role").notNull(), // user | assistant | system
  contentEnc: text("content_enc").notNull(),
  model: text("model"),
  flaggedForReview: boolean("flagged_for_review").notNull().default(false),
  escalationKind: text("escalation_kind"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accessLog = health.table("access_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").notNull(),
  athleteUserId: uuid("athlete_user_id").notNull(),
  tableName: text("table_name").notNull(),
  rowId: uuid("row_id"),
  purpose: text("purpose").notNull(),
  accessedAt: timestamp("accessed_at").notNull().defaultNow(),
});
