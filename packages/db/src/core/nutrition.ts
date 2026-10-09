import { pgTable, uuid, text, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { users } from "./identity";
import type { MealOption } from "@relaax/schema";

export const mealSuggestions = pgTable("meal_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  moment: text("moment").notNull(),
  context: jsonb("context").notNull(),
  options: jsonb("options").$type<MealOption[]>().notNull(),
  chosenIndex: integer("chosen_index"),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const mealHistory = pgTable("meal_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  loggedAt: timestamp("logged_at").notNull().defaultNow(),
  source: text("source").notNull(), // suggested | dine_out | manual
  suggestionId: uuid("suggestion_id").references(() => mealSuggestions.id),
  restaurantPlaceId: text("restaurant_place_id"),
  items: jsonb("items").$type<{ name: string; portion: string; tags: string[] }[]>().notNull(),
  benefitTags: jsonb("benefit_tags").$type<string[]>().notNull().default([]),
  rating: integer("rating"),
  accepted: boolean("accepted").notNull().default(true),
});

export const restaurantMenuCache = pgTable("restaurant_menu_cache", {
  placeId: text("place_id").primaryKey(),
  name: text("name").notNull(),
  items: jsonb("items").$type<{ name: string; description?: string; tags: string[] }[]>().notNull(),
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
});
