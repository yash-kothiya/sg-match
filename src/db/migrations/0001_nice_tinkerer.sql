ALTER TABLE "users" ADD COLUMN "experience_level" "experience_level";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "study_mode" "study_mode";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "availability" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "interests" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarded_at" timestamp (3) with time zone;