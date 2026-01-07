/**
 * Vortex Protocol - Database Schema
 * Drizzle ORM Schema Definition
 * Supports: PostgreSQL (Neon)
 */

import { pgTable, uuid, varchar, decimal, integer, boolean, timestamp, jsonb, text, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ============================================
// USERS TABLE
// ============================================
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletAddress: varchar('wallet_address', { length: 66 }).notNull().unique(),
  ensName: varchar('ens_name', { length: 255 }),
  avatarUrl: text('avatar_url'),

  // Stats
  totalConsolidations: integer('total_consolidations').default(0).notNull(),
  totalDustCleanedUsd: decimal('total_dust_cleaned_usd', { precision: 20, scale: 2 }).default('0').notNull(),
  totalGasSavedUsd: decimal('total_gas_saved_usd', { precision: 20, scale: 2 }).default('0').notNull(),
  totalVolumeUsd: decimal('total_volume_usd', { precision: 20, scale: 2 }).default('0').notNull(),

  // Preferences
  autoHideMicrodust: boolean('auto_hide_microdust').default(true).notNull(),
  defaultOutputToken: varchar('default_output_token', { length: 10 }).default('ETH').notNull(),
  slippageTolerance: decimal('slippage_tolerance', { precision: 5, scale: 2 }).default('0.5').notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  walletAddressIdx: index('users_wallet_address_idx').on(table.walletAddress),
}));

// ============================================
// TOKEN CLASSIFICATIONS TABLE
// ============================================
export const tokenClassifications = pgTable('token_classifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  tokenAddress: varchar('token_address', { length: 66 }).notNull(),
  chainId: integer('chain_id').notNull(),

  // Token Info
  symbol: varchar('symbol', { length: 32 }),
  name: varchar('name', { length: 255 }),
  decimals: integer('decimals'),
  logoUrl: text('logo_url'),

  // Value
  valueUsd: decimal('value_usd', { precision: 20, scale: 2 }),
  liquidityUsd: decimal('liquidity_usd', { precision: 20, scale: 2 }),

  // Classification
  tier: varchar('tier', { length: 20 }).notNull(), // LEGIT, DUST, MICRODUST, RISK_SCAM
  riskScore: integer('risk_score').notNull(), // 0-100
  confidence: decimal('confidence', { precision: 3, scale: 2 }).notNull(), // 0.00-1.00

  // 20 Risk Layers (0-10 each)
  layer1Audit: integer('layer1_audit').default(0),
  layer2Concentration: integer('layer2_concentration').default(0),
  layer3Honeypot: integer('layer3_honeypot').default(0),
  layer4Rugpull: integer('layer4_rugpull').default(0),
  layer5DevWallet: integer('layer5_dev_wallet').default(0),
  layer6Sentiment: integer('layer6_sentiment').default(0),
  layer7VolumeTrend: integer('layer7_volume_trend').default(0),
  layer8CexListings: integer('layer8_cex_listings').default(0),
  layer9Liquidity: integer('layer9_liquidity').default(0),
  layer10Volatility: integer('layer10_volatility').default(0),
  layer11Age: integer('layer11_age').default(0),
  layer12Social: integer('layer12_social').default(0),
  layer13FlashLoan: integer('layer13_flash_loan').default(0),
  layer14BridgeRisk: integer('layer14_bridge_risk').default(0),
  layer15InsiderTrading: integer('layer15_insider_trading').default(0),
  layer16Regulatory: integer('layer16_regulatory').default(0),
  layer17ValidatorCentralization: integer('layer17_validator_centralization').default(0),
  layer18Composability: integer('layer18_composability').default(0),
  layer19ExploitHistory: integer('layer19_exploit_history').default(0),
  layer20MlAnomaly: integer('layer20_ml_anomaly').default(0),

  // Meta
  dataSources: jsonb('data_sources'), // { goplus: {...}, dexscreener: {...}, ... }
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').default(sql`NOW() + INTERVAL '24 hours'`).notNull(),
}, (table) => ({
  tokenChainIdx: uniqueIndex('token_classifications_token_chain_idx').on(table.tokenAddress, table.chainId),
  tierIdx: index('token_classifications_tier_idx').on(table.tier),
  expiresAtIdx: index('token_classifications_expires_at_idx').on(table.expiresAt),
}));

// ============================================
// CONSOLIDATION REQUESTS TABLE
// ============================================
export const consolidationRequests = pgTable('consolidation_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  // Input/Output
  inputTokens: jsonb('input_tokens').notNull(), // Array of { address, chainId, amountRaw, valueUsd }
  outputToken: varchar('output_token', { length: 10 }).notNull(), // ETH or USDC
  outputChainId: integer('output_chain_id').notNull(), // 8453 (Base)

  // Amounts
  estimatedOutput: decimal('estimated_output', { precision: 30, scale: 8 }),
  actualOutput: decimal('actual_output', { precision: 30, scale: 8 }),

  // Fees
  platformFeeUsd: decimal('platform_fee_usd', { precision: 20, scale: 2 }),
  platformFeePercent: decimal('platform_fee_percent', { precision: 5, scale: 2 }).default('0.8').notNull(),
  gasSponsoredUsd: decimal('gas_sponsored_usd', { precision: 20, scale: 2 }),
  slippageActual: decimal('slippage_actual', { precision: 5, scale: 2 }),

  // Transaction Info
  userOpHash: varchar('user_op_hash', { length: 66 }),
  userOpBundleHash: varchar('user_op_bundle_hash', { length: 66 }),
  txHash: varchar('tx_hash', { length: 66 }),
  blockNumber: integer('block_number'),
  confirmationCount: integer('confirmation_count').default(0).notNull(),

  // Paymaster
  paymasterUsed: varchar('paymaster_used', { length: 50 }), // pimlico or coinbase
  paymasterAddress: varchar('paymaster_address', { length: 66 }),

  // Status
  status: varchar('status', { length: 20 }).notNull(), // PENDING, SIMULATING, BUNDLING, CONFIRMED, FAILED
  errorMessage: text('error_message'),

  // Metadata
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  simulationStartedAt: timestamp('simulation_started_at'),
  submittedAt: timestamp('submitted_at'),
  completedAt: timestamp('completed_at'),
}, (table) => ({
  userIdIdx: index('consolidation_requests_user_id_idx').on(table.userId),
  statusIdx: index('consolidation_requests_status_idx').on(table.status),
  createdAtIdx: index('consolidation_requests_created_at_idx').on(table.createdAt),
  txHashIdx: index('consolidation_requests_tx_hash_idx').on(table.txHash),
}));

// ============================================
// CONSOLIDATION ANALYTICS TABLE
// ============================================
export const consolidationAnalytics = pgTable('consolidation_analytics', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: varchar('date', { length: 10 }).notNull().unique(), // YYYY-MM-DD

  // Daily Metrics
  totalConsolidations: integer('total_consolidations').default(0).notNull(),
  totalDustCleanedUsd: decimal('total_dust_cleaned_usd', { precision: 30, scale: 2 }).default('0').notNull(),
  totalOutputValueUsd: decimal('total_output_value_usd', { precision: 30, scale: 2 }).default('0').notNull(),
  totalGasSavedUsd: decimal('total_gas_saved_usd', { precision: 30, scale: 2 }).default('0').notNull(),

  // User Stats
  uniqueUsers: integer('unique_users').default(0).notNull(),
  newUsers: integer('new_users').default(0).notNull(),
  returningUsers: integer('returning_users').default(0).notNull(),

  // Base-Specific (for grant metrics)
  totalBaseTvlAddedUsd: decimal('total_base_tvl_added_usd', { precision: 30, scale: 2 }).default('0').notNull(),
  baseConsolidations: integer('base_consolidations').default(0).notNull(),

  // Revenue
  totalFeesCollectedUsd: decimal('total_fees_collected_usd', { precision: 30, scale: 2 }).default('0').notNull(),
  otherChainConsolidations: integer('other_chain_consolidations').default(0).notNull(),

  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  dateIdx: uniqueIndex('consolidation_analytics_date_idx').on(table.date),
}));

// ============================================
// NOTIFICATION TOKENS TABLE (Farcaster)
// ============================================
export const notificationTokens = pgTable('notification_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  clientId: varchar('client_id', { length: 128 }).notNull(),
  callbackUrl: text('callback_url').notNull(),
  token: text('token').notNull(), // Secret token from Farcaster client
  enabled: boolean('enabled').default(true).notNull(),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userClientIdx: uniqueIndex('notification_tokens_user_client_idx').on(table.userId, table.clientId),
}));

// ============================================
// TYPE EXPORTS
// ============================================
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type TokenClassification = typeof tokenClassifications.$inferSelect;
export type NewTokenClassification = typeof tokenClassifications.$inferInsert;

export type ConsolidationRequest = typeof consolidationRequests.$inferSelect;
export type NewConsolidationRequest = typeof consolidationRequests.$inferInsert;

export type ConsolidationAnalytics = typeof consolidationAnalytics.$inferSelect;
export type NewConsolidationAnalytics = typeof consolidationAnalytics.$inferInsert;

export type NotificationToken = typeof notificationTokens.$inferSelect;
export type NewNotificationToken = typeof notificationTokens.$inferInsert;

