CREATE TABLE "request_matches" (
	"study_request_id" text NOT NULL,
	"study_group_id" text NOT NULL,
	"score" real NOT NULL,
	"confidence" text NOT NULL,
	"reasons" text[] DEFAULT '{}' NOT NULL,
	"caveats" text[] DEFAULT '{}' NOT NULL,
	"signals" jsonb NOT NULL,
	"computed_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_matches_study_request_id_study_group_id_pk" PRIMARY KEY("study_request_id","study_group_id")
);
--> statement-breakpoint
ALTER TABLE "request_matches" ADD CONSTRAINT "request_matches_study_request_id_study_requests_id_fk" FOREIGN KEY ("study_request_id") REFERENCES "public"."study_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_matches" ADD CONSTRAINT "request_matches_study_group_id_study_groups_id_fk" FOREIGN KEY ("study_group_id") REFERENCES "public"."study_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "request_matches_group_idx" ON "request_matches" USING btree ("study_group_id");--> statement-breakpoint
CREATE INDEX "request_matches_request_score_idx" ON "request_matches" USING btree ("study_request_id","score");