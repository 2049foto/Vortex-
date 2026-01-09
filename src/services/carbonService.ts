/**
 * Vortex Protocol - Carbon Credit Service
 * Calculate and offset carbon from micro-dust burning
 * 
 * Carbon calculation based on:
 * - Ethereum transaction avg carbon footprint: 0.0177 kg CO₂ per tx (post-merge)
 * - Gas saved from consolidation = carbon saved
 * - Micro-dust value can be converted to carbon credits
 */

import { env } from '../config/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('carbon');

// Carbon offset providers
const CARBON_PROVIDERS = {
  toucan: 'https://toucan.earth',
  klima: 'https://klimadao.finance',
  moss: 'https://moss.earth',
};

// Carbon calculation constants
const CARBON_CONSTANTS = {
  // Average CO₂ per Ethereum transaction (post-merge, in kg)
  CO2_PER_TX_KG: 0.0177,
  
  // Average CO₂ per gas unit (in kg)
  CO2_PER_GAS_UNIT: 0.0000000001,
  
  // USD per kg CO₂ offset (average market rate)
  USD_PER_KG_CO2: 15,
  
  // Minimum dust value to convert to carbon credit
  MIN_DUST_FOR_CARBON_USD: 0.01,
};

export interface CarbonOffset {
  kgCO2Offset: number;
  transactionsSaved: number;
  gasSaved: number;
  equivalentTrees: number;
  equivalentMiles: number;
  usdValue: number;
}

export interface CarbonCertificate {
  id: string;
  walletAddress: string;
  kgCO2: number;
  timestamp: number;
  txHash?: string;
  provider: string;
  verified: boolean;
}

/**
 * Calculate carbon offset from consolidation
 */
export function calculateCarbonOffset(
  gasSaved: number,
  transactionsSaved: number,
  microDustBurnedUsd: number
): CarbonOffset {
  // CO₂ saved from avoided transactions
  const co2FromTxs = transactionsSaved * CARBON_CONSTANTS.CO2_PER_TX_KG;
  
  // CO₂ saved from gas
  const co2FromGas = gasSaved * CARBON_CONSTANTS.CO2_PER_GAS_UNIT;
  
  // Additional offset from micro-dust conversion
  const co2FromDust = microDustBurnedUsd / CARBON_CONSTANTS.USD_PER_KG_CO2;
  
  const totalKgCO2 = co2FromTxs + co2FromGas + co2FromDust;
  
  return {
    kgCO2Offset: totalKgCO2,
    transactionsSaved,
    gasSaved,
    // 1 tree absorbs ~21 kg CO₂ per year
    equivalentTrees: totalKgCO2 / 21,
    // Average car emits 0.21 kg CO₂ per km
    equivalentMiles: totalKgCO2 / 0.21,
    usdValue: totalKgCO2 * CARBON_CONSTANTS.USD_PER_KG_CO2,
  };
}

/**
 * Get carbon credit balance for wallet
 */
export async function getCarbonBalance(walletAddress: string): Promise<number> {
  // In Phase 2, this will query on-chain carbon credit tokens
  // For now, calculate based on historical consolidations
  
  try {
    // Mock implementation - would query DB in production
    const mockBalance = 0.0;
    return mockBalance;
  } catch (error) {
    logger.error({ error, walletAddress }, 'Failed to get carbon balance');
    return 0;
  }
}

/**
 * Purchase carbon credits (Phase 2 feature)
 */
export async function purchaseCarbonCredits(
  walletAddress: string,
  kgCO2: number,
  paymentMethod: 'microdust' | 'direct'
): Promise<CarbonCertificate | null> {
  logger.info({ walletAddress, kgCO2, paymentMethod }, 'Carbon credit purchase requested');
  
  // Phase 2: Integrate with Toucan or Klima DAO
  // For now, return mock certificate
  
  const certificate: CarbonCertificate = {
    id: `vortex-carbon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    walletAddress,
    kgCO2,
    timestamp: Date.now(),
    provider: 'vortex',
    verified: false, // Will be verified on-chain in Phase 2
  };
  
  return certificate;
}

/**
 * Generate carbon impact summary for gamification
 */
export function generateCarbonImpactSummary(offset: CarbonOffset): string {
  const { kgCO2Offset, equivalentTrees, equivalentMiles } = offset;
  
  if (kgCO2Offset < 0.001) {
    return 'Every bit counts! Your consolidation helped reduce blockchain emissions.';
  }
  
  if (kgCO2Offset < 0.01) {
    return `You offset ${(kgCO2Offset * 1000).toFixed(2)}g of CO₂ - equivalent to ${Math.ceil(equivalentMiles)}m of driving!`;
  }
  
  if (kgCO2Offset < 0.1) {
    return `${kgCO2Offset.toFixed(3)} kg CO₂ offset! That's like planting ${equivalentTrees.toFixed(2)} trees for a day.`;
  }
  
  return `🌱 ${kgCO2Offset.toFixed(2)} kg CO₂ offset! Equivalent to ${Math.ceil(equivalentMiles)} km not driven.`;
}

/**
 * Get carbon offset tier badge
 */
export function getCarbonTier(totalKgCO2: number): {
  tier: 'seedling' | 'sapling' | 'tree' | 'forest' | 'ecosystem';
  name: string;
  emoji: string;
  nextTierAt: number;
} {
  if (totalKgCO2 < 0.1) {
    return { tier: 'seedling', name: 'Carbon Seedling', emoji: '🌱', nextTierAt: 0.1 };
  }
  if (totalKgCO2 < 1) {
    return { tier: 'sapling', name: 'Carbon Sapling', emoji: '🌿', nextTierAt: 1 };
  }
  if (totalKgCO2 < 10) {
    return { tier: 'tree', name: 'Carbon Tree', emoji: '🌳', nextTierAt: 10 };
  }
  if (totalKgCO2 < 100) {
    return { tier: 'forest', name: 'Carbon Forest', emoji: '🌲', nextTierAt: 100 };
  }
  return { tier: 'ecosystem', name: 'Carbon Ecosystem', emoji: '🏔️', nextTierAt: Infinity };
}

/**
 * Calculate environmental impact metrics
 */
export function calculateEnvironmentalImpact(kgCO2: number) {
  return {
    // Trees needed to absorb this CO₂ in a year
    treesEquivalent: kgCO2 / 21,
    
    // Liters of gasoline equivalent
    gasolineLiters: kgCO2 / 2.31,
    
    // kWh of coal power equivalent
    coalKwh: kgCO2 / 0.9,
    
    // Smartphone charges equivalent (0.008 kg CO₂ per charge)
    smartphoneCharges: kgCO2 / 0.008,
    
    // Plastic bags equivalent (0.006 kg CO₂ per bag)
    plasticBags: kgCO2 / 0.006,
  };
}

export default {
  calculateCarbonOffset,
  getCarbonBalance,
  purchaseCarbonCredits,
  generateCarbonImpactSummary,
  getCarbonTier,
  calculateEnvironmentalImpact,
};
