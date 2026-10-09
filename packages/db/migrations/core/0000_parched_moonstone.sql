CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "public"."consent_scope" AS ENUM('social_visibility', 'camp_purchases', 'clip_sharing', 'health_view', 'coach_access');--> statement-breakpoint
CREATE TYPE "public"."parent_link_status" AS ENUM('pending', 'verified', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('attack', 'midfield', 'defense', 'goalie', 'fogo', 'lsm');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('athlete', 'parent', 'coach', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending_consent', 'active', 'suspended', 'deleted');--> statement-breakpoint
CREATE TYPE "public"."drill_category" AS ENUM('wall_ball', 'stick', 'footwork', 'vision', 'conditioning', 'strength', 'recovery');--> statement-breakpoint
CREATE TYPE "public"."clip_visibility" AS ENUM('private', 'parent', 'coach', 'recruiter');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('basic', 'elite_recruit', 'camp_pass');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"graduation_year" integer NOT NULL,
	"primary_position" "position" NOT NULL,
	"secondary_position" "position",
	"dominant_hand" text,
	"club_id" uuid,
	"cuisine_prefs" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"dietary_pattern" text DEFAULT 'none' NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"goals" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"today_load_ceiling" text,
	"today_ceiling_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "consent_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"scope" "consent_scope" NOT NULL,
	"granted_by" uuid NOT NULL,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "parent_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_user_id" uuid NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"relationship" text NOT NULL,
	"consent_status" "parent_link_status" DEFAULT 'pending' NOT NULL,
	"consent_method" text,
	"consented_at" timestamp,
	"revoked_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"auth_provider_id" text NOT NULL,
	"email" text,
	"role" "role" NOT NULL,
	"date_of_birth" date,
	"status" "user_status" DEFAULT 'pending_consent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_auth_provider_id_unique" UNIQUE("auth_provider_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "drills" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"category" "drill_category" NOT NULL,
	"positions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"load" text NOT NULL,
	"body_regions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"level_min" integer DEFAULT 1 NOT NULL,
	"level_max" integer DEFAULT 5 NOT NULL,
	"loaded" boolean DEFAULT false NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"video_asset_id" text,
	"instructions" text NOT NULL,
	"default_sets" integer DEFAULT 3 NOT NULL,
	"default_reps" integer DEFAULT 10 NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "fitness_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"plan_id" uuid,
	"drill_id" text,
	"session_type" text NOT NULL,
	"scheduled_at" timestamp,
	"completed_at" timestamp DEFAULT now() NOT NULL,
	"duration_s" integer,
	"reps" integer,
	"rpe" real,
	"rating" integer,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "schedule_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"event_date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "training_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"plan_date" date NOT NULL,
	"plan" jsonb NOT NULL,
	"load_ceiling" text NOT NULL,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"source" text NOT NULL,
	"suggestion_id" uuid,
	"restaurant_place_id" text,
	"items" jsonb NOT NULL,
	"benefit_tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"rating" integer,
	"accepted" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "meal_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"moment" text NOT NULL,
	"context" jsonb NOT NULL,
	"options" jsonb NOT NULL,
	"chosen_index" integer,
	"model" text NOT NULL,
	"prompt_version" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "restaurant_menu_cache" (
	"place_id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"items" jsonb NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "highlight_reels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"clip_ids" jsonb NOT NULL,
	"share_token" text,
	"published_at" timestamp,
	CONSTRAINT "highlight_reels_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "recruiting_clips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"mux_asset_id" text,
	"mux_playback_id" text,
	"s3_key" text NOT NULL,
	"clip_type" text NOT NULL,
	"recorded_at" timestamp NOT NULL,
	"duration_s" integer,
	"visibility" "clip_visibility" DEFAULT 'private' NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "achievements" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"icon" text NOT NULL,
	"rule" jsonb NOT NULL,
	"treat" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "athlete_achievements" (
	"athlete_user_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"awarded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "camp_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"camp_id" uuid NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"approved_by_parent_id" uuid,
	"stripe_payment_intent" text,
	"status" text DEFAULT 'requested' NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "camps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"lat" double precision,
	"lng" double precision,
	"starts_at" timestamp NOT NULL,
	"ends_at" timestamp NOT NULL,
	"capacity" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"stripe_product_id" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid,
	"author_user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"clip_id" uuid,
	"moderation_status" "moderation_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "streaks" (
	"athlete_user_id" uuid NOT NULL,
	"metric" text NOT NULL,
	"current" integer DEFAULT 0 NOT NULL,
	"best" integer DEFAULT 0 NOT NULL,
	"last_date" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
	"team_id" uuid NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"coach_user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payer_user_id" uuid NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"tier" "subscription_tier" DEFAULT 'basic' NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"status" text DEFAULT 'trialing' NOT NULL,
	"current_period_end" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ai_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"embedding" vector(1536),
	"source_ref" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_profiles" ADD CONSTRAINT "athlete_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "consent_grants" ADD CONSTRAINT "consent_grants_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_parent_user_id_users_id_fk" FOREIGN KEY ("parent_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "parent_links" ADD CONSTRAINT "parent_links_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fitness_logs" ADD CONSTRAINT "fitness_logs_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fitness_logs" ADD CONSTRAINT "fitness_logs_plan_id_training_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."training_plans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fitness_logs" ADD CONSTRAINT "fitness_logs_drill_id_drills_id_fk" FOREIGN KEY ("drill_id") REFERENCES "public"."drills"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "schedule_events" ADD CONSTRAINT "schedule_events_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "training_plans" ADD CONSTRAINT "training_plans_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_history" ADD CONSTRAINT "meal_history_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_history" ADD CONSTRAINT "meal_history_suggestion_id_meal_suggestions_id_fk" FOREIGN KEY ("suggestion_id") REFERENCES "public"."meal_suggestions"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "meal_suggestions" ADD CONSTRAINT "meal_suggestions_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "highlight_reels" ADD CONSTRAINT "highlight_reels_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "recruiting_clips" ADD CONSTRAINT "recruiting_clips_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_achievements" ADD CONSTRAINT "athlete_achievements_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "athlete_achievements" ADD CONSTRAINT "athlete_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "camp_registrations" ADD CONSTRAINT "camp_registrations_camp_id_camps_id_fk" FOREIGN KEY ("camp_id") REFERENCES "public"."camps"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "camp_registrations" ADD CONSTRAINT "camp_registrations_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "camp_registrations" ADD CONSTRAINT "camp_registrations_approved_by_parent_id_users_id_fk" FOREIGN KEY ("approved_by_parent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "camps" ADD CONSTRAINT "camps_operator_user_id_users_id_fk" FOREIGN KEY ("operator_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "posts" ADD CONSTRAINT "posts_author_user_id_users_id_fk" FOREIGN KEY ("author_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "streaks" ADD CONSTRAINT "streaks_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "team_members" ADD CONSTRAINT "team_members_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "teams" ADD CONSTRAINT "teams_coach_user_id_users_id_fk" FOREIGN KEY ("coach_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payer_user_id_users_id_fk" FOREIGN KEY ("payer_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ai_memory" ADD CONSTRAINT "ai_memory_athlete_user_id_users_id_fk" FOREIGN KEY ("athlete_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "parent_athlete_uq" ON "parent_links" USING btree ("parent_user_id","athlete_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ai_memory_embedding_idx" ON "ai_memory" USING hnsw ("embedding" vector_cosine_ops);