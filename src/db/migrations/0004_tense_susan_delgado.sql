-- pgvector is needed by kb_chunks and ai_query_cache. Supabase ships it; enabling is idempotent.
CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "ai_query_cache" (
	"query_hash" text PRIMARY KEY NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"key" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_key_pk" PRIMARY KEY("key")
);
--> statement-breakpoint
CREATE TABLE "kb_chunks" (
	"id" text PRIMARY KEY NOT NULL,
	"document_id" text NOT NULL,
	"heading" text NOT NULL,
	"content" text NOT NULL,
	"position" integer NOT NULL,
	"token_count" integer NOT NULL,
	"content_hash" text NOT NULL,
	"embedding_model" text NOT NULL,
	"embedding" vector(768) NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_chunks_document_hash_uq" UNIQUE("document_id","content_hash")
);
--> statement-breakpoint
CREATE TABLE "kb_documents" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"created_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "kb_documents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "kb_chunks" ADD CONSTRAINT "kb_chunks_document_id_kb_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."kb_documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "kb_chunks_embedding_idx" ON "kb_chunks" USING hnsw ("embedding" vector_cosine_ops);--> statement-breakpoint

-- Row Level Security on every table with NO policies = deny by default for Supabase's public REST API.
-- The app connects directly as the database owner (Drizzle), which is not affected.
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "user_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_requests" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_request_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_groups" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "study_group_skills" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "group_memberships" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "request_matches" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kb_documents" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "kb_chunks" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_query_cache" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "ai_usage" ENABLE ROW LEVEL SECURITY;
