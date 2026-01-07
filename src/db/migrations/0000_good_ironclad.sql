CREATE TABLE "consolidation_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" varchar(10) NOT NULL,
	"total_consolidations" integer DEFAULT 0 NOT NULL,
	"total_dust_cleaned_usd" numeric(30, 2) DEFAULT '0' NOT NULL,
	"total_output_value_usd" numeric(30, 2) DEFAULT '0' NOT NULL,
	"total_gas_saved_usd" numeric(30, 2) DEFAULT '0' NOT NULL,
	"unique_users" integer DEFAULT 0 NOT NULL,
	"new_users" integer DEFAULT 0 NOT NULL,
	"returning_users" integer DEFAULT 0 NOT NULL,
	"total_base_tvl_added_usd" numeric(30, 2) DEFAULT '0' NOT NULL,
	"base_consolidations" integer DEFAULT 0 NOT NULL,
	"total_fees_collected_usd" numeric(30, 2) DEFAULT '0' NOT NULL,
	"other_chain_consolidations" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consolidation_analytics_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "consolidation_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"input_tokens" jsonb NOT NULL,
	"output_token" varchar(10) NOT NULL,
	"output_chain_id" integer NOT NULL,
	"estimated_output" numeric(30, 8),
	"actual_output" numeric(30, 8),
	"platform_fee_usd" numeric(20, 2),
	"platform_fee_percent" numeric(5, 2) DEFAULT '0.8' NOT NULL,
	"gas_sponsored_usd" numeric(20, 2),
	"slippage_actual" numeric(5, 2),
	"user_op_hash" varchar(66),
	"user_op_bundle_hash" varchar(66),
	"tx_hash" varchar(66),
	"block_number" integer,
	"confirmation_count" integer DEFAULT 0 NOT NULL,
	"paymaster_used" varchar(50),
	"paymaster_address" varchar(66),
	"status" varchar(20) NOT NULL,
	"error_message" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"simulation_started_at" timestamp,
	"submitted_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "notification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"client_id" varchar(128) NOT NULL,
	"callback_url" text NOT NULL,
	"token" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "token_classifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_address" varchar(66) NOT NULL,
	"chain_id" integer NOT NULL,
	"symbol" varchar(32),
	"name" varchar(255),
	"decimals" integer,
	"logo_url" text,
	"value_usd" numeric(20, 2),
	"liquidity_usd" numeric(20, 2),
	"tier" varchar(20) NOT NULL,
	"risk_score" integer NOT NULL,
	"confidence" numeric(3, 2) NOT NULL,
	"layer1_audit" integer DEFAULT 0,
	"layer2_concentration" integer DEFAULT 0,
	"layer3_honeypot" integer DEFAULT 0,
	"layer4_rugpull" integer DEFAULT 0,
	"layer5_dev_wallet" integer DEFAULT 0,
	"layer6_sentiment" integer DEFAULT 0,
	"layer7_volume_trend" integer DEFAULT 0,
	"layer8_cex_listings" integer DEFAULT 0,
	"layer9_liquidity" integer DEFAULT 0,
	"layer10_volatility" integer DEFAULT 0,
	"layer11_age" integer DEFAULT 0,
	"layer12_social" integer DEFAULT 0,
	"layer13_flash_loan" integer DEFAULT 0,
	"layer14_bridge_risk" integer DEFAULT 0,
	"layer15_insider_trading" integer DEFAULT 0,
	"layer16_regulatory" integer DEFAULT 0,
	"layer17_validator_centralization" integer DEFAULT 0,
	"layer18_composability" integer DEFAULT 0,
	"layer19_exploit_history" integer DEFAULT 0,
	"layer20_ml_anomaly" integer DEFAULT 0,
	"data_sources" jsonb,
	"last_updated" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp DEFAULT NOW() + INTERVAL '24 hours' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wallet_address" varchar(66) NOT NULL,
	"ens_name" varchar(255),
	"avatar_url" text,
	"total_consolidations" integer DEFAULT 0 NOT NULL,
	"total_dust_cleaned_usd" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_gas_saved_usd" numeric(20, 2) DEFAULT '0' NOT NULL,
	"total_volume_usd" numeric(20, 2) DEFAULT '0' NOT NULL,
	"auto_hide_microdust" boolean DEFAULT true NOT NULL,
	"default_output_token" varchar(10) DEFAULT 'ETH' NOT NULL,
	"slippage_tolerance" numeric(5, 2) DEFAULT '0.5' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_wallet_address_unique" UNIQUE("wallet_address")
);
--> statement-breakpoint
ALTER TABLE "consolidation_requests" ADD CONSTRAINT "consolidation_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_tokens" ADD CONSTRAINT "notification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "consolidation_analytics_date_idx" ON "consolidation_analytics" USING btree ("date");--> statement-breakpoint
CREATE INDEX "consolidation_requests_user_id_idx" ON "consolidation_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "consolidation_requests_status_idx" ON "consolidation_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "consolidation_requests_created_at_idx" ON "consolidation_requests" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "consolidation_requests_tx_hash_idx" ON "consolidation_requests" USING btree ("tx_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "notification_tokens_user_client_idx" ON "notification_tokens" USING btree ("user_id","client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "token_classifications_token_chain_idx" ON "token_classifications" USING btree ("token_address","chain_id");--> statement-breakpoint
CREATE INDEX "token_classifications_tier_idx" ON "token_classifications" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "token_classifications_expires_at_idx" ON "token_classifications" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "users_wallet_address_idx" ON "users" USING btree ("wallet_address");