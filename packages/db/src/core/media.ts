import { pgTable, uuid, text, timestamp, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const clipVisibilityEnum = pgEnum("clip_visibility", ["private", "parent", "coach", "recruiter"]);

export const recruitingClips = pgTable("recruiting_clips", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  muxAssetId: text("mux_asset_id"),
  muxPlaybackId: text("mux_playback_id"),
  s3Key: text("s3_key").notNull(),
  clipType: text("clip_type").notNull(), // game_highlight | agility_test | stick_skills
  recordedAt: timestamp("recorded_at").notNull(),
  durationS: integer("duration_s"),
  visibility: clipVisibilityEnum("visibility").notNull().default("private"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const highlightReels = pgTable("highlight_reels", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  clipIds: jsonb("clip_ids").$type<string[]>().notNull(),
  shareToken: text("share_token").unique(),
  publishedAt: timestamp("published_at"),
});
