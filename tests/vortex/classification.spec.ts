/**
 * TEST SUITE #3: Token Classification System
 * Tests LEGIT/DUST/MICRODUST/RISK tier classification
 * Coverage: Value thresholds, risk integration, batch classification
 */

import { describe, test, expect } from 'bun:test';

// Classification thresholds
const THRESHOLDS = {
  LEGIT_MIN_USD: 10,
  DUST_MIN_USD: 1,
  MICRODUST_MIN_USD: 0,
  RISK_SCORE_THRESHOLD: 70,
};

// Tier colors for UI
const TIER_COLORS = {
  LEGIT: '#22c55e', // green
  DUST: '#3b82f6', // blue  
  MICRODUST: '#f59e0b', // amber
  RISK: '#ef4444', // red
};

interface Token {
  symbol: string;
  address: string;
  chainId: number;
  balanceUsd: number;
  riskScore: number;
}

type Tier = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';

// ═══════════════════════════════════════════════════════════════════════════════
// Classification Functions
// ═══════════════════════════════════════════════════════════════════════════════

function classifyToken(token: Token): Tier {
  // Risk always takes priority
  if (token.riskScore >= THRESHOLDS.RISK_SCORE_THRESHOLD) {
    return 'RISK';
  }
  
  // Then classify by value
  if (token.balanceUsd >= THRESHOLDS.LEGIT_MIN_USD) {
    return 'LEGIT';
  }
  
  if (token.balanceUsd >= THRESHOLDS.DUST_MIN_USD) {
    return 'DUST';
  }
  
  return 'MICRODUST';
}

function classifyBatch(tokens: Token[]): Map<Tier, Token[]> {
  const classified = new Map<Tier, Token[]>([
    ['LEGIT', []],
    ['DUST', []],
    ['MICRODUST', []],
    ['RISK', []],
  ]);
  
  tokens.forEach(token => {
    const tier = classifyToken(token);
    classified.get(tier)!.push(token);
  });
  
  return classified;
}

function calculateTierStats(tokens: Token[]): Record<Tier, { count: number; totalUsd: number }> {
  const stats: Record<Tier, { count: number; totalUsd: number }> = {
    LEGIT: { count: 0, totalUsd: 0 },
    DUST: { count: 0, totalUsd: 0 },
    MICRODUST: { count: 0, totalUsd: 0 },
    RISK: { count: 0, totalUsd: 0 },
  };
  
  tokens.forEach(token => {
    const tier = classifyToken(token);
    stats[tier].count++;
    stats[tier].totalUsd += token.balanceUsd;
  });
  
  return stats;
}

function getConsolidatableTokens(tokens: Token[]): Token[] {
  return tokens.filter(token => {
    const tier = classifyToken(token);
    return tier === 'DUST' || tier === 'MICRODUST';
  });
}

function getTierColor(tier: Tier): string {
  return TIER_COLORS[tier];
}

function getTierPriority(tier: Tier): number {
  const priorities: Record<Tier, number> = {
    RISK: 0, // Highest priority (warn user)
    MICRODUST: 1,
    DUST: 2,
    LEGIT: 3,
  };
  return priorities[tier];
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════════════════════

const TEST_TOKENS: Token[] = [
  { symbol: 'ETH', address: '0x0', chainId: 1, balanceUsd: 500, riskScore: 5 },
  { symbol: 'USDC', address: '0x1', chainId: 8453, balanceUsd: 100, riskScore: 0 },
  { symbol: 'DUST1', address: '0x2', chainId: 42161, balanceUsd: 5, riskScore: 20 },
  { symbol: 'DUST2', address: '0x3', chainId: 10, balanceUsd: 2.5, riskScore: 15 },
  { symbol: 'MICRO1', address: '0x4', chainId: 137, balanceUsd: 0.5, riskScore: 10 },
  { symbol: 'MICRO2', address: '0x5', chainId: 56, balanceUsd: 0.1, riskScore: 25 },
  { symbol: 'SCAM', address: '0x6', chainId: 1, balanceUsd: 1000, riskScore: 85 },
  { symbol: 'HONEY', address: '0x7', chainId: 8453, balanceUsd: 50, riskScore: 90 },
  { symbol: 'EDGE', address: '0x8', chainId: 1, balanceUsd: 10, riskScore: 69 },
  { symbol: 'EDGE2', address: '0x9', chainId: 1, balanceUsd: 9.99, riskScore: 30 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Token Classification System', () => {
  
  describe('Single Token Classification', () => {
    test('should classify high value, low risk as LEGIT', () => {
      const token: Token = {
        symbol: 'ETH',
        address: '0x0',
        chainId: 1,
        balanceUsd: 100,
        riskScore: 10,
      };
      expect(classifyToken(token)).toBe('LEGIT');
    });
    
    test('should classify medium value, low risk as DUST', () => {
      const token: Token = {
        symbol: 'SHIB',
        address: '0x1',
        chainId: 1,
        balanceUsd: 5,
        riskScore: 20,
      };
      expect(classifyToken(token)).toBe('DUST');
    });
    
    test('should classify low value, low risk as MICRODUST', () => {
      const token: Token = {
        symbol: 'TINY',
        address: '0x2',
        chainId: 1,
        balanceUsd: 0.5,
        riskScore: 15,
      };
      expect(classifyToken(token)).toBe('MICRODUST');
    });
    
    test('should classify high risk as RISK regardless of value', () => {
      const highValueScam: Token = {
        symbol: 'SCAM',
        address: '0x3',
        chainId: 1,
        balanceUsd: 10000,
        riskScore: 80,
      };
      expect(classifyToken(highValueScam)).toBe('RISK');
    });
  });

  describe('Threshold Edge Cases', () => {
    test('exactly $10 should be LEGIT', () => {
      const token: Token = {
        symbol: 'EDGE',
        address: '0x0',
        chainId: 1,
        balanceUsd: 10,
        riskScore: 30,
      };
      expect(classifyToken(token)).toBe('LEGIT');
    });
    
    test('$9.99 should be DUST', () => {
      const token: Token = {
        symbol: 'EDGE',
        address: '0x0',
        chainId: 1,
        balanceUsd: 9.99,
        riskScore: 30,
      };
      expect(classifyToken(token)).toBe('DUST');
    });
    
    test('exactly $1 should be DUST', () => {
      const token: Token = {
        symbol: 'EDGE',
        address: '0x0',
        chainId: 1,
        balanceUsd: 1,
        riskScore: 30,
      };
      expect(classifyToken(token)).toBe('DUST');
    });
    
    test('$0.99 should be MICRODUST', () => {
      const token: Token = {
        symbol: 'EDGE',
        address: '0x0',
        chainId: 1,
        balanceUsd: 0.99,
        riskScore: 30,
      };
      expect(classifyToken(token)).toBe('MICRODUST');
    });
    
    test('risk score 70 should be RISK', () => {
      const token: Token = {
        symbol: 'EDGE',
        address: '0x0',
        chainId: 1,
        balanceUsd: 100,
        riskScore: 70,
      };
      expect(classifyToken(token)).toBe('RISK');
    });
    
    test('risk score 69 with $100 should be LEGIT', () => {
      const token: Token = {
        symbol: 'EDGE',
        address: '0x0',
        chainId: 1,
        balanceUsd: 100,
        riskScore: 69,
      };
      expect(classifyToken(token)).toBe('LEGIT');
    });
  });

  describe('Batch Classification', () => {
    test('should classify all test tokens correctly', () => {
      const classified = classifyBatch(TEST_TOKENS);
      
      expect(classified.get('LEGIT')!.length).toBe(3); // ETH, USDC, EDGE
      expect(classified.get('DUST')!.length).toBe(3); // DUST1, DUST2, EDGE2
      expect(classified.get('MICRODUST')!.length).toBe(2); // MICRO1, MICRO2
      expect(classified.get('RISK')!.length).toBe(2); // SCAM, HONEY
    });
    
    test('should handle empty array', () => {
      const classified = classifyBatch([]);
      expect(classified.get('LEGIT')!.length).toBe(0);
      expect(classified.get('DUST')!.length).toBe(0);
      expect(classified.get('MICRODUST')!.length).toBe(0);
      expect(classified.get('RISK')!.length).toBe(0);
    });
  });

  describe('Tier Statistics', () => {
    test('should calculate correct counts', () => {
      const stats = calculateTierStats(TEST_TOKENS);
      expect(stats.LEGIT.count).toBe(3);
      expect(stats.DUST.count).toBe(3);
      expect(stats.MICRODUST.count).toBe(2);
      expect(stats.RISK.count).toBe(2);
    });
    
    test('should calculate correct totals', () => {
      const stats = calculateTierStats(TEST_TOKENS);
      expect(stats.LEGIT.totalUsd).toBeCloseTo(610, 0); // 500 + 100 + 10
      expect(stats.DUST.totalUsd).toBeCloseTo(17.49, 1); // 5 + 2.5 + 9.99
      expect(stats.MICRODUST.totalUsd).toBeCloseTo(0.6, 1); // 0.5 + 0.1
      expect(stats.RISK.totalUsd).toBeCloseTo(1050, 0); // 1000 + 50
    });
  });

  describe('Consolidatable Tokens', () => {
    test('should only return DUST and MICRODUST', () => {
      const consolidatable = getConsolidatableTokens(TEST_TOKENS);
      
      consolidatable.forEach(token => {
        const tier = classifyToken(token);
        expect(['DUST', 'MICRODUST']).toContain(tier);
      });
    });
    
    test('should not include LEGIT or RISK tokens', () => {
      const consolidatable = getConsolidatableTokens(TEST_TOKENS);
      const tiers = consolidatable.map(t => classifyToken(t));
      
      expect(tiers).not.toContain('LEGIT');
      expect(tiers).not.toContain('RISK');
    });
    
    test('should return correct count', () => {
      const consolidatable = getConsolidatableTokens(TEST_TOKENS);
      expect(consolidatable.length).toBe(5); // DUST1, DUST2, EDGE2, MICRO1, MICRO2
    });
  });

  describe('Tier UI Properties', () => {
    test('should return correct colors', () => {
      expect(getTierColor('LEGIT')).toBe('#22c55e');
      expect(getTierColor('DUST')).toBe('#3b82f6');
      expect(getTierColor('MICRODUST')).toBe('#f59e0b');
      expect(getTierColor('RISK')).toBe('#ef4444');
    });
    
    test('RISK should have highest priority', () => {
      expect(getTierPriority('RISK')).toBe(0);
    });
    
    test('LEGIT should have lowest priority', () => {
      expect(getTierPriority('LEGIT')).toBe(3);
    });
    
    test('priorities should be in correct order', () => {
      expect(getTierPriority('RISK')).toBeLessThan(getTierPriority('MICRODUST'));
      expect(getTierPriority('MICRODUST')).toBeLessThan(getTierPriority('DUST'));
      expect(getTierPriority('DUST')).toBeLessThan(getTierPriority('LEGIT'));
    });
  });

  describe('Zero and Negative Values', () => {
    test('$0 balance should be MICRODUST', () => {
      const token: Token = {
        symbol: 'ZERO',
        address: '0x0',
        chainId: 1,
        balanceUsd: 0,
        riskScore: 10,
      };
      expect(classifyToken(token)).toBe('MICRODUST');
    });
    
    test('negative balance should be treated as MICRODUST', () => {
      const token: Token = {
        symbol: 'NEG',
        address: '0x0',
        chainId: 1,
        balanceUsd: -5,
        riskScore: 10,
      };
      // In real implementation, this should be handled
      expect(classifyToken(token)).toBe('MICRODUST');
    });
  });
});
