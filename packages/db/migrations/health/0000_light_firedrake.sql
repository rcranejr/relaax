CREATE SCHEMA "health";
--> statement-breakpoint
CREATE TYPE "health"."condition" AS ENUM('asthma', 'concussion_history', 'cardiac_screen_on_file', 'allergy_epipen', 'other');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."access_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_user_id" uuid NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"table_name" text NOT NULL,
	"row_id" uuid,
	"purpose" text NOT NULL,
	"accessed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."body_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"measured_at" timestamp DEFAULT now() NOT NULL,
	"height_cm" real,
	"weight_kg" real,
	"entered_by" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."capability_profile" (
	"athlete_user_id" uuid PRIMARY KEY NOT NULL,
	"cleared_for_contact" boolean DEFAULT false NOT NULL,
	"conditions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"movement_limits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."coach_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"role" text NOT NULL,
	"content_enc" text NOT NULL,
	"model" text,
	"flagged_for_review" boolean DEFAULT false NOT NULL,
	"escalation_kind" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."coach_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."mood_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	"mood" text NOT NULL,
	"triggers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"free_text_enc" text,
	"coach_session_id" uuid
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "health"."readiness_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"athlete_user_id" uuid NOT NULL,
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"sleep_quality" integer NOT NULL,
	"fatigue" integer NOT NULL,
	"energy" integer NOT NULL,
	"pain_flag" boolean NOT NULL,
	"soreness_map" jsonb DEFAULT '{}'::jsonb NOT NULL
);
