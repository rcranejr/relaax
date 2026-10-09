import { pgTable, uuid, text, timestamp, date, pgEnum, jsonb, integer, uniqueIndex } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["athlete", "parent", "coach", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["pending_consent", "active", "suspended", "deleted"]);
export const consentScopeEnum = pgEnum("consent_scope", ["social_visibility", "camp_purchases", "clip_sharing", "health_view", "coach_access"]);
export const parentLinkStatusEnum = pgEnum("parent_link_status", ["pending", "verified", "revoked"]);
export const positionEnum = pgEnum("position", ["attack", "midfield", "defense", "goalie", "fogo", "lsm"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authProviderId: text("auth_provider_id").notNull().unique(),
  email: text("email"),
  role: roleEnum("role").notNull(),
  dateOfBirth: date("date_of_birth", { mode: "date" }),
  status: userStatusEnum("status").notNull().default("pending_consent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const athleteProfiles = pgTable("athlete_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id),
  displayName: text("display_name").notNull(),
  graduationYear: integer("graduation_year").notNull(),
  primaryPosition: positionEnum("primary_position").notNull(),
  secondaryPosition: positionEnum("secondary_position"),
  dominantHand: text("dominant_hand"),
  clubId: uuid("club_id"),
  cuisinePrefs: jsonb("cuisine_prefs").$type<string[]>().notNull().default([]),
  dietaryPattern: text("dietary_pattern").notNull().default("none"),
  level: integer("level").notNull().default(1),
  goals: jsonb("goals").$type<string[]>().notNull().default([]),
  // Readiness is stored in the vault; only the derived ceiling is cached here for today.
  todayLoadCeiling: text("today_load_ceiling"),
  todayCeilingAt: timestamp("today_ceiling_at"),
});

export const parentLinks = pgTable("parent_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  parentUserId: uuid("parent_user_id").notNull().references(() => users.id),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  relationship: text("relationship").notNull(),
  consentStatus: parentLinkStatusEnum("consent_status").notNull().default("pending"),
  consentMethod: text("consent_method"), // email_plus, card_microcharge, id_check
  consentedAt: timestamp("consented_at"),
  revokedAt: timestamp("revoked_at"),
}, (t) => [uniqueIndex("parent_athlete_uq").on(t.parentUserId, t.athleteUserId)]);

export const consentGrants = pgTable("consent_grants", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  scope: consentScopeEnum("scope").notNull(),
  grantedBy: uuid("granted_by").notNull().references(() => users.id),
  grantedAt: timestamp("granted_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  revokedAt: timestamp("revoked_at"),
});
