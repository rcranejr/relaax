import { pgTable, uuid, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./identity";

export const tierEnum = pgEnum("subscription_tier", ["basic", "elite_recruit", "camp_pass"]);

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  payerUserId: uuid("payer_user_id").notNull().references(() => users.id), // always the parent for minors
  athleteUserId: uuid("athlete_user_id").notNull().references(() => users.id),
  tier: tierEnum("tier").notNull().default("basic"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  status: text("status").notNull().default("trialing"),
  currentPeriodEnd: timestamp("current_period_end"),
});
