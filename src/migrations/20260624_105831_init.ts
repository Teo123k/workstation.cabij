import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_clients_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_brand_briefs_status" AS ENUM('draft', 'complete');
  CREATE TYPE "public"."enum_brand_strategies_status" AS ENUM('active', 'superseded');
  CREATE TYPE "public"."enum_brand_kits_status" AS ENUM('draft', 'approved', 'superseded');
  CREATE TYPE "public"."enum_brand_assets_role" AS ENUM('logo_ref', 'moodboard', 'color_board', 'image_ref', 'face_ref', 'background_ref', 'style_ref', 'competitor_ref', 'pdf_ref');
  CREATE TYPE "public"."enum_brand_assets_status" AS ENUM('active', 'inactive');
  CREATE TYPE "public"."enum_brand_exports_export_type" AS ENUM('brand_board', 'brand_guidelines_pdf', 'social_template_instagram_post', 'social_template_instagram_story', 'ad_template_meta', 'business_card_mockup', 'letterhead_mockup', 'email_signature_mockup', 'pitch_slide');
  CREATE TYPE "public"."enum_brand_social_strategies_platform" AS ENUM('all', 'instagram', 'tiktok', 'linkedin');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  CREATE TABLE "clients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"client_id" varchar NOT NULL,
  	"client_name" varchar NOT NULL,
  	"origin_lead_id" varchar,
  	"owner" varchar,
  	"status" "enum_clients_status" DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_briefs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brief_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"raw_brief" varchar NOT NULL,
  	"extracted_brief_json" jsonb,
  	"brand_audit_json" jsonb,
  	"competitor_analysis_json" jsonb,
  	"status" "enum_brand_briefs_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_strategies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"strategy_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brief_id" varchar,
  	"positioning" varchar,
  	"audience_profile" varchar,
  	"brand_personality" varchar,
  	"tone_of_voice" varchar,
  	"visual_keywords" jsonb,
  	"competitor_gap" varchar,
  	"social_media_direction" varchar,
  	"strategy_json" jsonb,
  	"version" numeric DEFAULT 1,
  	"parent_strategy_id" varchar,
  	"revision_note" varchar,
  	"status" "enum_brand_strategies_status" DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_kits" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_kit_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"strategy_id" varchar,
  	"status" "enum_brand_kits_status" DEFAULT 'draft',
  	"direction_name" varchar NOT NULL,
  	"colors_json" jsonb,
  	"typography_json" jsonb,
  	"logo_direction" varchar,
  	"photography_style" varchar,
  	"social_media_vibe" varchar,
  	"instagram_grid_style" varchar,
  	"ad_content_style" varchar,
  	"content_rules_json" jsonb,
  	"full_brand_kit_json" jsonb,
  	"version" numeric DEFAULT 1,
  	"parent_kit_id" varchar,
  	"revision_note" varchar,
  	"client_feedback" varchar,
  	"approved_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_assets" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"brand_asset_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brand_kit_id" varchar,
  	"asset_type" varchar NOT NULL,
  	"role" "enum_brand_assets_role",
  	"file_url" varchar,
  	"public_url" varchar,
  	"frameio_asset_id" varchar,
  	"metadata_json" jsonb,
  	"status" "enum_brand_assets_status" DEFAULT 'active',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_exports" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"export_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brand_kit_id" varchar NOT NULL,
  	"export_type" "enum_brand_exports_export_type",
  	"export_url" varchar,
  	"export_json" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "brand_social_strategies" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"social_strategy_id" varchar NOT NULL,
  	"client_id" varchar NOT NULL,
  	"brand_kit_id" varchar,
  	"platform" "enum_brand_social_strategies_platform" DEFAULT 'all',
  	"strategy_json" jsonb,
  	"version" numeric DEFAULT 1,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"clients_id" integer,
  	"brand_briefs_id" integer,
  	"brand_strategies_id" integer,
  	"brand_kits_id" integer,
  	"brand_assets_id" integer,
  	"brand_exports_id" integer,
  	"brand_social_strategies_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clients_fk" FOREIGN KEY ("clients_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_briefs_fk" FOREIGN KEY ("brand_briefs_id") REFERENCES "public"."brand_briefs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_strategies_fk" FOREIGN KEY ("brand_strategies_id") REFERENCES "public"."brand_strategies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_kits_fk" FOREIGN KEY ("brand_kits_id") REFERENCES "public"."brand_kits"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_assets_fk" FOREIGN KEY ("brand_assets_id") REFERENCES "public"."brand_assets"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_exports_fk" FOREIGN KEY ("brand_exports_id") REFERENCES "public"."brand_exports"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_brand_social_strategies_fk" FOREIGN KEY ("brand_social_strategies_id") REFERENCES "public"."brand_social_strategies"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE UNIQUE INDEX "clients_client_id_idx" ON "clients" USING btree ("client_id");
  CREATE INDEX "clients_updated_at_idx" ON "clients" USING btree ("updated_at");
  CREATE INDEX "clients_created_at_idx" ON "clients" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_briefs_brief_id_idx" ON "brand_briefs" USING btree ("brief_id");
  CREATE INDEX "brand_briefs_updated_at_idx" ON "brand_briefs" USING btree ("updated_at");
  CREATE INDEX "brand_briefs_created_at_idx" ON "brand_briefs" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_strategies_strategy_id_idx" ON "brand_strategies" USING btree ("strategy_id");
  CREATE INDEX "brand_strategies_updated_at_idx" ON "brand_strategies" USING btree ("updated_at");
  CREATE INDEX "brand_strategies_created_at_idx" ON "brand_strategies" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_kits_brand_kit_id_idx" ON "brand_kits" USING btree ("brand_kit_id");
  CREATE INDEX "brand_kits_updated_at_idx" ON "brand_kits" USING btree ("updated_at");
  CREATE INDEX "brand_kits_created_at_idx" ON "brand_kits" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_assets_brand_asset_id_idx" ON "brand_assets" USING btree ("brand_asset_id");
  CREATE INDEX "brand_assets_updated_at_idx" ON "brand_assets" USING btree ("updated_at");
  CREATE INDEX "brand_assets_created_at_idx" ON "brand_assets" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_exports_export_id_idx" ON "brand_exports" USING btree ("export_id");
  CREATE INDEX "brand_exports_updated_at_idx" ON "brand_exports" USING btree ("updated_at");
  CREATE INDEX "brand_exports_created_at_idx" ON "brand_exports" USING btree ("created_at");
  CREATE UNIQUE INDEX "brand_social_strategies_social_strategy_id_idx" ON "brand_social_strategies" USING btree ("social_strategy_id");
  CREATE INDEX "brand_social_strategies_updated_at_idx" ON "brand_social_strategies" USING btree ("updated_at");
  CREATE INDEX "brand_social_strategies_created_at_idx" ON "brand_social_strategies" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_clients_id_idx" ON "payload_locked_documents_rels" USING btree ("clients_id");
  CREATE INDEX "payload_locked_documents_rels_brand_briefs_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_briefs_id");
  CREATE INDEX "payload_locked_documents_rels_brand_strategies_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_strategies_id");
  CREATE INDEX "payload_locked_documents_rels_brand_kits_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_kits_id");
  CREATE INDEX "payload_locked_documents_rels_brand_assets_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_assets_id");
  CREATE INDEX "payload_locked_documents_rels_brand_exports_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_exports_id");
  CREATE INDEX "payload_locked_documents_rels_brand_social_strategies_id_idx" ON "payload_locked_documents_rels" USING btree ("brand_social_strategies_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "clients" CASCADE;
  DROP TABLE "brand_briefs" CASCADE;
  DROP TABLE "brand_strategies" CASCADE;
  DROP TABLE "brand_kits" CASCADE;
  DROP TABLE "brand_assets" CASCADE;
  DROP TABLE "brand_exports" CASCADE;
  DROP TABLE "brand_social_strategies" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TYPE "public"."enum_clients_status";
  DROP TYPE "public"."enum_brand_briefs_status";
  DROP TYPE "public"."enum_brand_strategies_status";
  DROP TYPE "public"."enum_brand_kits_status";
  DROP TYPE "public"."enum_brand_assets_role";
  DROP TYPE "public"."enum_brand_assets_status";
  DROP TYPE "public"."enum_brand_exports_export_type";
  DROP TYPE "public"."enum_brand_social_strategies_platform";`)
}
