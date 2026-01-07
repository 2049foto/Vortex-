-- Vortex Protocol - Initial Migration
-- Generated: 2026-01-07

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(66) UNIQUE NOT NULL,
  ens_name VARCHAR(255),
  avatar_url TEXT,
  
  total_consolidations INTEGER DEFAULT 0 NOT NULL,
  total_dust_cleaned_usd DECIMAL(20,2) DEFAULT 0 NOT NULL,
  total_gas_saved_usd DECIMAL(20,2) DEFAULT 0 NOT NULL,
  total_volume_usd DECIMAL(20,2) DEFAULT 0 NOT NULL,
  
  auto_hide_microdust BOOLEAN DEFAULT true NOT NULL,
  default_output_token VARCHAR(10) DEFAULT 'ETH' NOT NULL,
  slippage_tolerance DECIMAL(5,2) DEFAULT 0.5 NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX users_wallet_address_idx ON users(wallet_address);

-- ============================================
-- TOKEN CLASSIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS token_classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_address VARCHAR(66) NOT NULL,
  chain_id INTEGER NOT NULL,
  
  symbol VARCHAR(32),
  name VARCHAR(255),
  decimals INTEGER,
  logo_url TEXT,
  
  value_usd DECIMAL(20,2),
  liquidity_usd DECIMAL(20,2),
  
  tier VARCHAR(20) NOT NULL,
  risk_score INTEGER NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  
  -- 20 Risk Layers
  layer1_audit INTEGER DEFAULT 0,
  layer2_concentration INTEGER DEFAULT 0,
  layer3_honeypot INTEGER DEFAULT 0,
  layer4_rugpull INTEGER DEFAULT 0,
  layer5_dev_wallet INTEGER DEFAULT 0,
  layer6_sentiment INTEGER DEFAULT 0,
  layer7_volume_trend INTEGER DEFAULT 0,
  layer8_cex_listings INTEGER DEFAULT 0,
  layer9_liquidity INTEGER DEFAULT 0,
  layer10_volatility INTEGER DEFAULT 0,
  layer11_age INTEGER DEFAULT 0,
  layer12_social INTEGER DEFAULT 0,
  layer13_flash_loan INTEGER DEFAULT 0,
  layer14_bridge_risk INTEGER DEFAULT 0,
  layer15_insider_trading INTEGER DEFAULT 0,
  layer16_regulatory INTEGER DEFAULT 0,
  layer17_validator_centralization INTEGER DEFAULT 0,
  layer18_composability INTEGER DEFAULT 0,
  layer19_exploit_history INTEGER DEFAULT 0,
  layer20_ml_anomaly INTEGER DEFAULT 0,
  
  data_sources JSONB,
  last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '24 hours') NOT NULL,
  
  UNIQUE(token_address, chain_id)
);

CREATE INDEX token_classifications_tier_idx ON token_classifications(tier);
CREATE INDEX token_classifications_expires_at_idx ON token_classifications(expires_at);
CREATE UNIQUE INDEX token_classifications_token_chain_idx ON token_classifications(token_address, chain_id);

-- ============================================
-- CONSOLIDATION REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consolidation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  
  input_tokens JSONB NOT NULL,
  output_token VARCHAR(10) NOT NULL,
  output_chain_id INTEGER NOT NULL,
  
  estimated_output DECIMAL(30,8),
  actual_output DECIMAL(30,8),
  
  platform_fee_usd DECIMAL(20,2),
  platform_fee_percent DECIMAL(5,2) DEFAULT 0.8 NOT NULL,
  gas_sponsored_usd DECIMAL(20,2),
  slippage_actual DECIMAL(5,2),
  
  user_op_hash VARCHAR(66),
  user_op_bundle_hash VARCHAR(66),
  tx_hash VARCHAR(66),
  block_number INTEGER,
  confirmation_count INTEGER DEFAULT 0 NOT NULL,
  
  paymaster_used VARCHAR(50),
  paymaster_address VARCHAR(66),
  
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  simulation_started_at TIMESTAMP,
  submitted_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX consolidation_requests_user_id_idx ON consolidation_requests(user_id);
CREATE INDEX consolidation_requests_status_idx ON consolidation_requests(status);
CREATE INDEX consolidation_requests_created_at_idx ON consolidation_requests(created_at);
CREATE INDEX consolidation_requests_tx_hash_idx ON consolidation_requests(tx_hash);

-- ============================================
-- CONSOLIDATION ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS consolidation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date VARCHAR(10) UNIQUE NOT NULL,
  
  total_consolidations INTEGER DEFAULT 0 NOT NULL,
  total_dust_cleaned_usd DECIMAL(30,2) DEFAULT 0 NOT NULL,
  total_output_value_usd DECIMAL(30,2) DEFAULT 0 NOT NULL,
  total_gas_saved_usd DECIMAL(30,2) DEFAULT 0 NOT NULL,
  
  unique_users INTEGER DEFAULT 0 NOT NULL,
  new_users INTEGER DEFAULT 0 NOT NULL,
  returning_users INTEGER DEFAULT 0 NOT NULL,
  
  total_base_tvl_added_usd DECIMAL(30,2) DEFAULT 0 NOT NULL,
  base_consolidations INTEGER DEFAULT 0 NOT NULL,
  
  total_fees_collected_usd DECIMAL(30,2) DEFAULT 0 NOT NULL,
  other_chain_consolidations INTEGER DEFAULT 0 NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE UNIQUE INDEX consolidation_analytics_date_idx ON consolidation_analytics(date);

-- ============================================
-- NOTIFICATION TOKENS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  client_id VARCHAR(128) NOT NULL,
  callback_url TEXT NOT NULL,
  token TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true NOT NULL,
  
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  
  UNIQUE(user_id, client_id)
);

CREATE UNIQUE INDEX notification_tokens_user_client_idx ON notification_tokens(user_id, client_id);

-- ============================================
-- SEED DATA (Optional)
-- ============================================

-- Insert initial analytics record for today
INSERT INTO consolidation_analytics (date) 
VALUES (TO_CHAR(NOW(), 'YYYY-MM-DD'))
ON CONFLICT (date) DO NOTHING;

