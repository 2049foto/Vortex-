/**
 * TEST SUITE #2: Multi-Router System
 * Tests 1inch, Uniswap v4, Curve, Balancer, Jupiter routing
 * Coverage: Route selection, quote comparison, gas optimization
 */

import { describe, test, expect, beforeAll } from 'bun:test';

// Mock router responses
const MOCK_QUOTES = {
  '1inch': {
    router: '1inch',
    inputAmount: '1000000000000000000', // 1 ETH in wei
    outputAmount: '2500000000', // 2500 USDC (6 decimals)
    gasEstimate: 150000,
    priceImpact: 0.15,
    route: ['WETH', 'USDC'],
  },
  'uniswap': {
    router: 'uniswap',
    inputAmount: '1000000000000000000',
    outputAmount: '2480000000',
    gasEstimate: 180000,
    priceImpact: 0.25,
    route: ['WETH', 'USDC'],
  },
  'curve': {
    router: 'curve',
    inputAmount: '1000000000000000000',
    outputAmount: '2510000000',
    gasEstimate: 200000,
    priceImpact: 0.10,
    route: ['WETH', 'USDC'],
  },
  'balancer': {
    router: 'balancer',
    inputAmount: '1000000000000000000',
    outputAmount: '2495000000',
    gasEstimate: 170000,
    priceImpact: 0.18,
    route: ['WETH', 'USDC'],
  },
  'jupiter': {
    router: 'jupiter',
    inputAmount: '1000000000',
    outputAmount: '2505000000',
    gasEstimate: 50000,
    priceImpact: 0.12,
    route: ['SOL', 'USDC'],
  },
};

// Supported chains per router
const ROUTER_CHAINS: Record<string, number[]> = {
  '1inch': [1, 8453, 42161, 10, 137, 56, 43114, 324],
  'uniswap': [1, 8453, 42161, 10, 137, 56, 43114],
  'curve': [1, 8453, 42161, 10, 137],
  'balancer': [1, 8453, 42161, 10, 137],
  'jupiter': [0], // Solana
};

// ═══════════════════════════════════════════════════════════════════════════════
// Router Functions
// ═══════════════════════════════════════════════════════════════════════════════

interface Quote {
  router: string;
  inputAmount: string;
  outputAmount: string;
  gasEstimate: number;
  priceImpact: number;
  route: string[];
}

function selectBestQuote(quotes: Quote[]): Quote {
  // Sort by output amount (descending), then by gas (ascending)
  return quotes.sort((a, b) => {
    const outputDiff = BigInt(b.outputAmount) - BigInt(a.outputAmount);
    if (outputDiff !== 0n) return outputDiff > 0n ? 1 : -1;
    return a.gasEstimate - b.gasEstimate;
  })[0];
}

function calculateNetOutput(quote: Quote, gasPrice: number): bigint {
  const output = BigInt(quote.outputAmount);
  const gasCost = BigInt(quote.gasEstimate) * BigInt(gasPrice);
  return output - gasCost;
}

function getRoutersForChain(chainId: number): string[] {
  return Object.entries(ROUTER_CHAINS)
    .filter(([_, chains]) => chains.includes(chainId))
    .map(([router]) => router);
}

function validateQuote(quote: Quote): boolean {
  return (
    BigInt(quote.outputAmount) > 0n &&
    quote.gasEstimate > 0 &&
    quote.priceImpact >= 0 &&
    quote.priceImpact < 50 && // Max 50% price impact
    quote.route.length >= 2
  );
}

function calculatePriceImpactScore(impact: number): number {
  if (impact < 0.1) return 100;
  if (impact < 0.5) return 80;
  if (impact < 1.0) return 60;
  if (impact < 2.0) return 40;
  if (impact < 5.0) return 20;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Multi-Router System', () => {
  
  describe('Router Chain Support', () => {
    test('1inch should support 8 chains', () => {
      expect(ROUTER_CHAINS['1inch'].length).toBe(8);
    });
    
    test('Base chain (8453) should have 4 routers', () => {
      const routers = getRoutersForChain(8453);
      expect(routers.length).toBe(4);
      expect(routers).toContain('1inch');
      expect(routers).toContain('uniswap');
      expect(routers).toContain('curve');
      expect(routers).toContain('balancer');
    });
    
    test('Solana (0) should only have Jupiter', () => {
      const routers = getRoutersForChain(0);
      expect(routers.length).toBe(1);
      expect(routers[0]).toBe('jupiter');
    });
    
    test('Ethereum (1) should support all EVM routers', () => {
      const routers = getRoutersForChain(1);
      expect(routers.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Quote Selection - Best Output', () => {
    test('should select Curve for best output', () => {
      const evmQuotes = Object.values(MOCK_QUOTES).filter(q => q.router !== 'jupiter');
      const best = selectBestQuote(evmQuotes);
      expect(best.router).toBe('curve');
    });
    
    test('should handle single quote', () => {
      const single = [MOCK_QUOTES['1inch']];
      const best = selectBestQuote(single);
      expect(best.router).toBe('1inch');
    });
    
    test('should handle tie by selecting lower gas', () => {
      const tiedQuotes = [
        { ...MOCK_QUOTES['1inch'], outputAmount: '2500000000', gasEstimate: 200000 },
        { ...MOCK_QUOTES['uniswap'], outputAmount: '2500000000', gasEstimate: 150000 },
      ];
      const best = selectBestQuote(tiedQuotes);
      expect(best.gasEstimate).toBe(150000);
    });
  });

  describe('Quote Validation', () => {
    test('should validate correct quotes', () => {
      Object.values(MOCK_QUOTES).forEach(quote => {
        expect(validateQuote(quote)).toBe(true);
      });
    });
    
    test('should reject zero output', () => {
      const invalidQuote = { ...MOCK_QUOTES['1inch'], outputAmount: '0' };
      expect(validateQuote(invalidQuote)).toBe(false);
    });
    
    test('should reject high price impact (>50%)', () => {
      const highImpact = { ...MOCK_QUOTES['1inch'], priceImpact: 55 };
      expect(validateQuote(highImpact)).toBe(false);
    });
    
    test('should reject invalid route', () => {
      const badRoute = { ...MOCK_QUOTES['1inch'], route: ['WETH'] };
      expect(validateQuote(badRoute)).toBe(false);
    });
  });

  describe('Gas Optimization', () => {
    const gasPrice = 30; // gwei
    
    test('should calculate net output correctly', () => {
      const quote = MOCK_QUOTES['1inch'];
      const netOutput = calculateNetOutput(quote, gasPrice);
      const expectedGasCost = BigInt(quote.gasEstimate) * BigInt(gasPrice);
      expect(netOutput).toBe(BigInt(quote.outputAmount) - expectedGasCost);
    });
    
    test('Jupiter should have lowest gas on Solana', () => {
      const jupiterGas = MOCK_QUOTES['jupiter'].gasEstimate;
      const evmGases = Object.values(MOCK_QUOTES)
        .filter(q => q.router !== 'jupiter')
        .map(q => q.gasEstimate);
      
      expect(jupiterGas).toBeLessThan(Math.min(...evmGases));
    });
  });

  describe('Price Impact Analysis', () => {
    test('should score excellent impact (<0.1%)', () => {
      expect(calculatePriceImpactScore(0.05)).toBe(100);
    });
    
    test('should score good impact (0.1-0.5%)', () => {
      expect(calculatePriceImpactScore(0.25)).toBe(80);
    });
    
    test('should score acceptable impact (0.5-1%)', () => {
      expect(calculatePriceImpactScore(0.75)).toBe(60);
    });
    
    test('should score warning impact (1-2%)', () => {
      expect(calculatePriceImpactScore(1.5)).toBe(40);
    });
    
    test('should score poor impact (2-5%)', () => {
      expect(calculatePriceImpactScore(3)).toBe(20);
    });
    
    test('should score danger impact (>5%)', () => {
      expect(calculatePriceImpactScore(10)).toBe(0);
    });
  });

  describe('Router-Specific Tests', () => {
    test('1inch quote should have correct structure', () => {
      const quote = MOCK_QUOTES['1inch'];
      expect(quote).toHaveProperty('router');
      expect(quote).toHaveProperty('inputAmount');
      expect(quote).toHaveProperty('outputAmount');
      expect(quote).toHaveProperty('gasEstimate');
      expect(quote).toHaveProperty('priceImpact');
      expect(quote).toHaveProperty('route');
    });
    
    test('Curve should have best price impact', () => {
      const curveImpact = MOCK_QUOTES['curve'].priceImpact;
      const otherImpacts = Object.values(MOCK_QUOTES)
        .filter(q => q.router !== 'curve' && q.router !== 'jupiter')
        .map(q => q.priceImpact);
      
      expect(curveImpact).toBeLessThanOrEqual(Math.min(...otherImpacts));
    });
  });

  describe('Multi-Hop Routing', () => {
    test('should support 2-hop routes', () => {
      const quote = MOCK_QUOTES['1inch'];
      expect(quote.route.length).toBe(2);
    });
    
    test('should handle multi-hop routes', () => {
      const multiHop = {
        ...MOCK_QUOTES['1inch'],
        route: ['WETH', 'USDT', 'USDC'],
      };
      expect(validateQuote(multiHop)).toBe(true);
      expect(multiHop.route.length).toBe(3);
    });
  });
});

describe('Router Aggregation', () => {
  test('should aggregate quotes from all available routers', () => {
    const chainId = 8453; // Base
    const routers = getRoutersForChain(chainId);
    const quotes = routers
      .filter(r => MOCK_QUOTES[r as keyof typeof MOCK_QUOTES])
      .map(r => MOCK_QUOTES[r as keyof typeof MOCK_QUOTES]);
    
    expect(quotes.length).toBeGreaterThanOrEqual(4);
  });
  
  test('should find optimal route across all routers', () => {
    const allQuotes = Object.values(MOCK_QUOTES).filter(q => q.router !== 'jupiter');
    const best = selectBestQuote(allQuotes);
    
    // Best should be either highest output or lowest gas at equal output
    const maxOutput = Math.max(...allQuotes.map(q => Number(q.outputAmount)));
    expect(Number(best.outputAmount)).toBe(maxOutput);
  });
});
