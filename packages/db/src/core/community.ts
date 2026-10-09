import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum, geometry } from "drizzle-orm/pg-core";
import { users } from "./identity";

// Phase 3 tables, stubbed in Phase 1 so ids are stable.
export const moderationStatusEnum = pgEnum("moderation_status", ["pending", "approved", "rejected"]);

export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  coachUserId: uuid("coach_user_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  teamId: uuid("team_id").notNull().references(() => teams.id),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  teamId: uuid("team_id").references(() => teams.id),
  authorUserId: uuid("author_user_id").notNull().references(() => users.id),
  body: text("body").notNull(),
  clipId: uuid("clip_id"),
  moderationStatus: moderationStatusEnum("moderation_status").notNull().default("pending"),
  reviewedBy: uuid("reviewed_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const camps = pgTable("camps", {
  id: uuid("id").primaryKey().defaultRandom(),
  operatorUserId: uuid("operator_user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  capacity: integer("capacity").notNull(),
  priceCents: integer("price_cents").notNull(),
  stripeProductId: text("stripe_product_id"),
});

export const campRegistrations = pgTable("camp_registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  campId: uuid("camp_id").notNull().references(() => camps.id),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  approvedByParentId: uuid("approved_by_parent_id").references(() => users.id),
  stripePaymentIntent: text("stripe_payment_intent"),
  status: text("status").notNull().default("requested"),
});

export const achievements = pgTable("achievements", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  rule: jsonb("rule").$type<{ metric: string; threshold: number }>().notNull(),
  treat: text("treat"), // "Treat yourself to a local frozen yogurt"
});

export const athleteAchievements = pgTable("athlete_achievements", {
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  achievementId: text("achievement_id").notNull().references(() => achievements.id),
  awardedAt: timestamp("awarded_at").notNull().defaultNow(),
});

export const streaks = pgTable("streaks", {
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  metric: text("metric").notNull(), // daily_session | meal_logged | readiness_check
  current: integer("current").notNull().default(0),
  best: integer("best").notNull().default(0),
  lastDate: text("last_date"),
});
