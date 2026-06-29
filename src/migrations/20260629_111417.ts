import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_brand_moodboards_status" AS ENUM('draft', 'approved', 'superseded');
  CREATE TYPE "public"."enum_agency_knowledge_bases_knowledge_type" AS ENUM('skill', 'framework', 'rubric', 'sop', 'template', 'example');
  CREATE TYPE "public"."enum_agency_knowledge_bases_task_key" AS ENUM('global', 'brand_strategy', 'brand_kit', 'social_strategy', 'marketing_strategy', 'client_brief', 'deliverables_export', 'quality_review');
  CREATE TYPE "public"."enum_agency_knowledge_bases_role_in_prompt" AS ENUM('system', 'framework', 'rubric', 'sop', 'template', 'supporting');
  CREATE TYPE "public"."enum_agency_knowledge_bases_token_weight" AS ENUM('core', 'supporting', 'example', 'archive');
  CREATE TYPE "public"."enum_agency_knowledge_bases_status" AS ENUM('active', 'draft', 'archived');
  CREATE TABLE "brand_moodboards" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"moodboard_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brand_kit_id" varchar NOT NULL,
  	"board_type" varchar NOT NULL,
  	"prompt_used" varchar,
  	"reference_asset_ids" jsonb,
  	"image_url" varchar,
  	"public_url" varchar,
  	"generation_model" varchar DEFAULT 'gpt-image-2',
  	"metadata_json" jsonb,
  	"status" "enum_brand_moodboards_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "project_memories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"memory_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"memory_key" varchar NOT NULL,
  	"memory_value_json" jsonb,
  	"source_type" varchar DEFAULT 'manual',
  	"source_ref" varchar,
  	"confidence" numeric DEFAULT 80,
  	"status" varchar DEFAULT 'active',
  	"created_by" varchar DEFAULT 'system',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "research_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"source_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"title" varchar,
  	"url" varchar,
  	"source_type" varchar DEFAULT 'website',
  	"snippet" varchar,
  	"source_json" jsonb,
  	"status" varchar DEFAULT 'active',
  	"created_by" varchar DEFAULT 'system',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "evidence_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"evidence_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brief_id" varchar,
  	"strategy_id" varchar,
  	"source_id" varchar,
  	"evidence_type" varchar DEFAULT 'research_fact',
  	"claim_text" varchar NOT NULL,
  	"evidence_json" jsonb,
  	"confidence" numeric DEFAULT 80,
  	"status" varchar DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_decisions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"decision_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brief_id" varchar,
  	"strategy_id" varchar,
  	"brand_kit_id" varchar,
  	"decision_type" varchar DEFAULT 'positioning',
  	"decision_summary" varchar NOT NULL,
  	"rationale" varchar,
  	"supporting_evidence_ids" jsonb,
  	"status" varchar DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "quality_reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"quality_review_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brief_id" varchar,
  	"strategy_id" varchar,
  	"brand_kit_id" varchar,
  	"export_id" varchar,
  	"review_type" varchar DEFAULT 'deliverable',
  	"review_summary" varchar,
  	"score_json" jsonb,
  	"warnings_json" jsonb,
  	"errors_json" jsonb,
  	"evidence_item_ids" jsonb,
  	"brand_decision_ids" jsonb,
  	"passed" boolean DEFAULT false,
  	"reviewed_by" varchar DEFAULT 'system',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "agent_runs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"agent_run_id" varchar NOT NULL,
  	"client_id" varchar,
  	"brief_id" varchar,
  	"strategy_id" varchar,
  	"brand_kit_id" varchar,
  	"export_id" varchar,
  	"run_type" varchar DEFAULT 'workflow',
  	"action_name" varchar NOT NULL,
  	"model_name" varchar,
  	"tool_name" varchar,
  	"input_json" jsonb,
  	"output_json" jsonb,
  	"status" varchar DEFAULT 'completed',
  	"error_text" varchar,
  	"started_at" timestamp(3) with time zone,
  	"completed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "client_feedback_items" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"feedback_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brand_kit_id" varchar,
  	"strategy_id" varchar,
  	"export_id" varchar,
  	"source_type" varchar DEFAULT 'client',
  	"feedback_text" varchar NOT NULL,
  	"feedback_json" jsonb,
  	"status" varchar DEFAULT 'new',
  	"created_by" varchar DEFAULT 'client',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "agency_knowledge_bases" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"knowledge_id" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"knowledge_type" "enum_agency_knowledge_bases_knowledge_type" NOT NULL,
  	"task_key" "enum_agency_knowledge_bases_task_key" NOT NULL,
  	"role_in_prompt" "enum_agency_knowledge_bases_role_in_prompt" DEFAULT 'supporting' NOT NULL,
  	"content_markdown" varchar NOT NULL,
  	"summary" varchar,
  	"token_weight" "enum_agency_knowledge_bases_token_weight" DEFAULT 'supporting' NOT NULL,
  	"status" "enum_agency_knowledge_bases_status" DEFAULT 'active' NOT NULL,
  	"version" numeric DEFAULT 1 NOT NULL,
  	"source_path" varchar,
  	"source_hash" varchar,
  	"tags_json" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "brand_assets" ALTER COLUMN "brand_asset_id" DROP NOT NULL;
  ALTER TABLE "brand_assets" ALTER COLUMN "asset_type" SET DEFAULT 'image/jpeg';
  ALTER TABLE "brand_assets" ALTER COLUMN "asset_type" DROP NOT NULL;
  ALTER TABLE "clients" ADD COLUMN "drive_folder_ids_json" jsonb;
  ALTER TABLE "brand_strategies" ADD COLUMN "company_summary" varchar;
  ALTER TABLE "brand_strategies" ADD COLUMN "mission" varchar;
  ALTER TABLE "brand_strategies" ADD COLUMN "vision" varchar;
  ALTER TABLE "brand_strategies" ADD COLUMN "core_values" jsonb;
  ALTER TABLE "brand_strategies" ADD COLUMN "unique_selling_prop" varchar;
  ALTER TABLE "brand_strategies" ADD COLUMN "customer_personas" jsonb;
  ALTER TABLE "brand_strategies" ADD COLUMN "emotional_positioning" varchar;
  ALTER TABLE "brand_strategies" ADD COLUMN "brand_keywords" jsonb;
  ALTER TABLE "brand_strategies" ADD COLUMN "marketing_strategy_json" jsonb;
  ALTER TABLE "brand_assets" ADD COLUMN "reference_notes" varchar;
  ALTER TABLE "brand_assets" ADD COLUMN "reference_tags_json" jsonb;
  ALTER TABLE "brand_assets" ADD COLUMN "url" varchar;
  ALTER TABLE "brand_assets" ADD COLUMN "thumbnail_u_r_l" varchar;
  ALTER TABLE "brand_assets" ADD COLUMN "filename" varchar;
  ALTER TABLE "brand_assets" ADD COLUMN "mime_type" varchar;
  ALTER TABLE "brand_assets" ADD COLUMN "filesize" numeric;
  ALTER TABLE "brand_assets" ADD COLUMN "width" numeric;
  ALTER TABLE "brand_assets" ADD COLUMN "height" numeric;
  ALTER TABLE "brand_assets" ADD COLUMN "focal_x" numeric;
  ALTER TABLE "brand_assets" ADD COLUMN "focal_y" numeric;
  ALTER TABLE "brand_exports" ADD COLUMN "brief_id" varchar;
  ALTER TABLE "brand_exports" ADD COLUMN "strategy_id" varchar;
  ALTER TABLE "brand_exports" ADD COLUMN "quality_review_id" varchar;
  ALTER TABLE "brand_exports" ADD COLUMN "evidence_item_ids" jsonb;
  ALTER TABLE "brand_exports" ADD COLUMN "brand_decision_ids" jsonb;
  ALTER TABLE "brand_exports" ADD COLUMN "deliverable_label" varchar;
  ALTER TABLE "brand_exports" ADD COLUMN "version_label" varchar;
  ALTER TABLE "brand_exports" ADD COLUMN "is_client_facing" boolean DEFAULT true;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brand_moodboards_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "project_memories_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "research_sources_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "evidence_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "brand_decisions_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "quality_reviews_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agent_runs_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "client_feedback_items_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "agency_knowledge_bases_id" integer;
  CREATE UNIQUE INDEX "brand_moodboards_moodboard_id_idx" ON "brand_moodboards" USING btree ("moodboard_id");
  CREATE INDEX "brand_moodboards_updated_at_idx" ON "brand_moodboards" USING btree ("updated_at");
  CREATE INDEX "brand_moodboards_created_at_idx" ON "brand_moodboards" USING btree ("created_at");
  CREATE UNIQUE INDEX "project_memories_memory_id_idx" ON "project_memories" USING btree ("memory_id");
  CREATE INDEX "project_memories_updated_at_idx" ON "project_memories" USING btree ("updated_at");
  CREATE INDEX "project_memories_created_at_idx" ON "project_memories" USING btree ("created_at");
  CREATE UNIQUE INDEX "research_sources_source_id_idx" ON "research_sources" USING btree ("source_id");
  CREATE INDEX "research_sources_updated_at_idx" ON "research_sources" USING btree ("updated_at");
  CREATE INDEX "research_sources_created_at_idx" ON "research_sources" USING btree ("created_at");
  CREATE UNIQUE INDEX "evidence_items_evidence_id_idx" ON "evidence_items" USING btree ("evidence_id");
  CREATE INDEX "evidence_items_updated_at_idx" ON "evidence_items" USING btree ("updated_at");
  CREATE INDEX "evidence_items_created_at_idx" ON "evidence_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_decisions_decision_id_idx" ON "brand_decisions" USING btree ("decision_id");
  CREATE INDEX "brand_decisions_updated_at_idx" ON "brand_decisions" USING btree ("updated_at");
  CREATE INDEX "brand_decisions_created_at_idx" ON "brand_decisions" USING btree ("created_at");
  CREATE UNIQUE INDEX "quality_reviews_quality_review_id_idx" ON "quality_reviews" USING btree ("quality_review_id");
  CREATE INDEX "quality_reviews_updated_at_idx" ON "quality_reviews" USING btree ("updated_at");
  CREATE INDEX "quality_reviews_created_at_idx" ON "quality_reviews" USING btree ("created_at");
  CREATE UNIQUE INDEX "agent_runs_agent_run_id_idx" ON "agent_runs" USING btree ("agent_run_id");
  CREATE INDEX "agent_runs_updated_at_idx" ON "agent_runs" USING btree ("updated_at");
  CREATE INDEX "agent_runs_created_at_idx" ON "agent_runs" USING btree ("created_at");
  CREATE UNIQUE INDEX "client_feedback_items_feedback_id_idx" ON "client_feedback_items" USING btree ("feedback_id");
  CREATE INDEX "client_feedback_items_updated_at_idx" ON "client_feedback_items" USING btree ("updated_at");
  CREATE INDEX "client_feedback_items_created_at_idx" ON "client_feedback_items" USING btree ("created_at");
  CREATE UNIQUE INDEX "agency_knowledge_bases_knowledge_id_idx" ON "agency_knowledge_bases" USING btree ("knowledge_id");
  CREATE UNIQUE INDEX "agency_knowledge_bases_slug_idx" ON "agency_knowledge_bases" USING btree ("slug");
  CREATE INDEX "agency_knowledge_bases_updated_at_idx" ON "agency_knowledge_bases" USING btree ("updated_at");
  CREATE INDEX "agency_knowledge_bases_created_at_idx" ON "agency_knowledge_bases" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_moodboards_fk" FOREIGN KEY ("brand_moodboards_id") REFERENCES "public"."brand_moodboards"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_project_memories_fk" FOREIGN KEY ("project_memories_id") REFERENCES "public"."project_memories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_research_sources_fk" FOREIGN KEY ("research_sources_id") REFERENCES "public"."research_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_evidence_items_fk" FOREIGN KEY ("evidence_items_id") REFERENCES "public"."evidence_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_decisions_fk" FOREIGN KEY ("brand_decisions_id") REFERENCES "public"."brand_decisions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_quality_reviews_fk" FOREIGN KEY ("quality_reviews_id") REFERENCES "public"."quality_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agent_runs_fk" FOREIGN KEY ("agent_runs_id") REFERENCES "public"."agent_runs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_client_feedback_items_fk" FOREIGN KEY ("client_feedback_items_id") REFERENCES "public"."client_feedback_items"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_agency_knowledge_bases_fk" FOREIGN KEY ("agency_knowledge_bases_id") REFERENCES "public"."agency_knowledge_bases"("id") ON DELETE cascade ON UPDATE no action;
  CREATE UNIQUE INDEX "brand_assets_filename_idx" ON "brand_assets" USING btree ("filename");
  CREATE INDEX "payload_locked_documents_rels_brand_moodboards_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_moodboards_id");
  CREATE INDEX "payload_locked_documents_rels_project_memories_id_idx" ON "payload_locked_documents_rels" USING btree ("project_memories_id");
  CREATE INDEX "payload_locked_documents_rels_research_sources_id_idx" ON "payload_locked_documents_rels" USING btree ("research_sources_id");
  CREATE INDEX "payload_locked_documents_rels_evidence_items_id_idx" ON "payload_locked_documents_rels" USING btree ("evidence_items_id");
  CREATE INDEX "payload_locked_documents_rels_brand_decisions_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_decisions_id");
  CREATE INDEX "payload_locked_documents_rels_quality_reviews_id_idx" ON "payload_locked_documents_rels" USING btree ("quality_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_agent_runs_id_idx" ON "payload_locked_documents_rels" USING btree ("agent_runs_id");
  CREATE INDEX "payload_locked_documents_rels_client_feedback_items_id_idx" ON "payload_locked_documents_rels" USING btree ("client_feedback_items_id");
  CREATE INDEX "payload_locked_documents_rels_agency_knowledge_bases_id_idx" ON "payload_locked_documents_rels" USING btree ("agency_knowledge_bases_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "brand_moodboards" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "project_memories" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "research_sources" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "evidence_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "brand_decisions" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "quality_reviews" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agent_runs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "client_feedback_items" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "agency_knowledge_bases" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "brand_moodboards" CASCADE;
  DROP TABLE "project_memories" CASCADE;
  DROP TABLE "research_sources" CASCADE;
  DROP TABLE "evidence_items" CASCADE;
  DROP TABLE "brand_decisions" CASCADE;
  DROP TABLE "quality_reviews" CASCADE;
  DROP TABLE "agent_runs" CASCADE;
  DROP TABLE "client_feedback_items" CASCADE;
  DROP TABLE "agency_knowledge_bases" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brand_moodboards_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_project_memories_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_research_sources_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_evidence_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_brand_decisions_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_quality_reviews_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agent_runs_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_client_feedback_items_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_agency_knowledge_bases_fk";
  
  DROP INDEX "brand_assets_filename_idx";
  DROP INDEX "payload_locked_documents_rels_brand_moodboards_id_idx";
  DROP INDEX "payload_locked_documents_rels_project_memories_id_idx";
  DROP INDEX "payload_locked_documents_rels_research_sources_id_idx";
  DROP INDEX "payload_locked_documents_rels_evidence_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_brand_decisions_id_idx";
  DROP INDEX "payload_locked_documents_rels_quality_reviews_id_idx";
  DROP INDEX "payload_locked_documents_rels_agent_runs_id_idx";
  DROP INDEX "payload_locked_documents_rels_client_feedback_items_id_idx";
  DROP INDEX "payload_locked_documents_rels_agency_knowledge_bases_id_idx";
  ALTER TABLE "brand_assets" ALTER COLUMN "brand_asset_id" SET NOT NULL;
  ALTER TABLE "brand_assets" ALTER COLUMN "asset_type" DROP DEFAULT;
  ALTER TABLE "brand_assets" ALTER COLUMN "asset_type" SET NOT NULL;
  ALTER TABLE "clients" DROP COLUMN "drive_folder_ids_json";
  ALTER TABLE "brand_strategies" DROP COLUMN "company_summary";
  ALTER TABLE "brand_strategies" DROP COLUMN "mission";
  ALTER TABLE "brand_strategies" DROP COLUMN "vision";
  ALTER TABLE "brand_strategies" DROP COLUMN "core_values";
  ALTER TABLE "brand_strategies" DROP COLUMN "unique_selling_prop";
  ALTER TABLE "brand_strategies" DROP COLUMN "customer_personas";
  ALTER TABLE "brand_strategies" DROP COLUMN "emotional_positioning";
  ALTER TABLE "brand_strategies" DROP COLUMN "brand_keywords";
  ALTER TABLE "brand_strategies" DROP COLUMN "marketing_strategy_json";
  ALTER TABLE "brand_assets" DROP COLUMN "reference_notes";
  ALTER TABLE "brand_assets" DROP COLUMN "reference_tags_json";
  ALTER TABLE "brand_assets" DROP COLUMN "url";
  ALTER TABLE "brand_assets" DROP COLUMN "thumbnail_u_r_l";
  ALTER TABLE "brand_assets" DROP COLUMN "filename";
  ALTER TABLE "brand_assets" DROP COLUMN "mime_type";
  ALTER TABLE "brand_assets" DROP COLUMN "filesize";
  ALTER TABLE "brand_assets" DROP COLUMN "width";
  ALTER TABLE "brand_assets" DROP COLUMN "height";
  ALTER TABLE "brand_assets" DROP COLUMN "focal_x";
  ALTER TABLE "brand_assets" DROP COLUMN "focal_y";
  ALTER TABLE "brand_exports" DROP COLUMN "brief_id";
  ALTER TABLE "brand_exports" DROP COLUMN "strategy_id";
  ALTER TABLE "brand_exports" DROP COLUMN "quality_review_id";
  ALTER TABLE "brand_exports" DROP COLUMN "evidence_item_ids";
  ALTER TABLE "brand_exports" DROP COLUMN "brand_decision_ids";
  ALTER TABLE "brand_exports" DROP COLUMN "deliverable_label";
  ALTER TABLE "brand_exports" DROP COLUMN "version_label";
  ALTER TABLE "brand_exports" DROP COLUMN "is_client_facing";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brand_moodboards_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "project_memories_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "research_sources_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "evidence_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "brand_decisions_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "quality_reviews_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agent_runs_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "client_feedback_items_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "agency_knowledge_bases_id";
  DROP TYPE "public"."enum_brand_moodboards_status";
  DROP TYPE "public"."enum_agency_knowledge_bases_knowledge_type";
  DROP TYPE "public"."enum_agency_knowledge_bases_task_key";
  DROP TYPE "public"."enum_agency_knowledge_bases_role_in_prompt";
  DROP TYPE "public"."enum_agency_knowledge_bases_token_weight";
  DROP TYPE "public"."enum_agency_knowledge_bases_status";`)
}
