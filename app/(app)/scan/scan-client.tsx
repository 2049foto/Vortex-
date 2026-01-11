'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle,
  Filter,
  ChevronDown,
  X,
  Loader2,
  Sparkles,
  Shield,
  RefreshCw,
  AlertCircle,
  Info,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useToast } from '../../providers';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface Token {
  id: string;
  symbol: string;
  name: string;
  address: string;
  chainId: number;
  chainName: string;
  balance: string;
  balanceUsd: number;
  logo?: string;
  tier: 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';
  riskScore: number;
  reasons?: string[];
}

// Track custom amounts per token
interface TokenAmounts {
  [tokenId: string]: string; // percentage as string (e.g., "100", "50")
}

interface ScanResult {
  wallet: string;
  totalValue: number;
  dustValue: number;
  tokens: Token[];
  chainsScanned: number;
  scanTime: number;
  summary: {
    byTier: {
      LEGIT: number;
      DUST: number;
      MICRODUST: number;
      RISK: number;
    };
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CHAINS: Record<number, { name: string; color: string; icon: string; enabled: boolean }> = {
  8453: { name: 'Base', color: '#0052FF', icon: '🔵', enabled: true },
  1: { name: 'Ethereum', color: '#627EEA', icon: '⟠', enabled: true },
  42161: { name: 'Arbitrum', color: '#28A0F0', icon: '🔷', enabled: true },
  10: { name: 'Optimism', color: '#FF0420', icon: '🔴', enabled: true },
  137: { name: 'Polygon', color: '#8247E5', icon: '💜', enabled: true },
  56: { name: 'BNB', color: '#F0B90B', icon: '🟡', enabled: true },
  43114: { name: 'Avalanche', color: '#E84142', icon: '🔺', enabled: true },
  324: { name: 'zkSync', color: '#8C8DFC', icon: '⬡', enabled: true },
};

// Solana handled separately
const SOLANA_CHAIN = { chainId: 0, name: 'Solana', color: '#9945FF', icon: '◎' };

// Chain presets for quick selection
const CHAIN_PRESETS = {
  base: { label: 'Base Only', chains: [8453], description: 'Fastest, no bridging' },
  l2: { label: 'L2s Only', chains: [8453, 42161, 10, 324], description: 'Fast & cheap' },
  all: { label: 'All Chains', chains: Object.keys(CHAINS).map(Number), description: '10 EVM chains' },
};

const TIERS = {
  LEGIT: { label: 'Valuable', color: 'success', description: 'Safe to hold' },
  DUST: { label: 'Dust', color: 'primary', description: 'Small value, consolidate' },
  MICRODUST: { label: 'Micro', color: 'warning', description: 'Very small value' },
  RISK: { label: 'Risk', color: 'danger', description: 'Potential security risk' },
};

// Import smart selection system
import { 
  smartSelectAll, 
  selectDustOnly, 
  selectBaseOnly, 
  selectHighValueDust,
  getSelectionPresets,
  validateSelection,
  analyzeToken,
  SELECTION_CONFIG,
  type SelectionResult,
  type TokenRecommendation,
} from '@/lib/smartSelection';

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN LOGO FALLBACKS
// ═══════════════════════════════════════════════════════════════════════════════

// Known token logos (hardcoded for reliability)
const KNOWN_LOGOS: Record<string, string> = {
  // Native tokens
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'POL': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  // Stablecoins
  'USDC': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  'DAI': 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
  // Popular tokens
  'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  'AAVE': 'https://assets.coingecko.com/coins/images/12645/small/AAVE.png',
  'CRV': 'https://assets.coingecko.com/coins/images/12124/small/Curve.png',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  'OP': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
  // Meme tokens
  'PEPE': 'https://assets.coingecko.com/coins/images/29850/small/pepe-token.jpeg',
  'SHIB': 'https://assets.coingecko.com/coins/images/11939/small/shiba.png',
  'DOGE': 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  'FLOKI': 'https://assets.coingecko.com/coins/images/16746/small/PNG_image.png',
  // DeFi
  'COMP': 'https://assets.coingecko.com/coins/images/10775/small/COMP.png',
  'MKR': 'https://assets.coingecko.com/coins/images/1364/small/Mark_Maker.png',
  'SNX': 'https://assets.coingecko.com/coins/images/3406/small/SNX.png',
  'SUSHI': 'https://assets.coingecko.com/coins/images/12271/small/512x512_Logo_no_chop.png',
  '1INCH': 'https://assets.coingecko.com/coins/images/13469/small/1inch-token.png',
  'BAL': 'https://assets.coingecko.com/coins/images/11683/small/Balancer.png',
  // Gaming/NFT
  'APE': 'https://assets.coingecko.com/coins/images/24383/small/apecoin.jpg',
  'SAND': 'https://assets.coingecko.com/coins/images/12129/small/sandbox_logo.jpg',
  'MANA': 'https://assets.coingecko.com/coins/images/878/small/decentraland-mana.png',
  'AXS': 'https://assets.coingecko.com/coins/images/13029/small/axie_infinity_logo.png',
  'IMX': 'https://assets.coingecko.com/coins/images/17233/small/immutableX-symbol-BLK-RGB.png',
  // L2
  'ZK': 'https://assets.coingecko.com/coins/images/38669/small/zk.jpg',
  'STRK': 'https://assets.coingecko.com/coins/images/26433/small/starknet.png',
};

// Get token logo from various sources
function getTokenLogo(address: string, chainId: number, symbol: string): string | undefined {
  // Check known logos first
  const upperSymbol = symbol?.toUpperCase();
  if (KNOWN_LOGOS[upperSymbol]) {
    return KNOWN_LOGOS[upperSymbol];
  }
  
  // Try Trust Wallet assets
  const chainMap: Record<number, string> = {
    1: 'ethereum',
    8453: 'base',
    42161: 'arbitrum',
    10: 'optimism',
    137: 'polygon',
    56: 'smartchain',
    43114: 'avalanchec',
    324: 'zksync',
  };
  
  const chain = chainMap[chainId];
  if (chain && address && address !== '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee') {
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/${chain}/assets/${address}/logo.png`;
  }
  
  return undefined;
}

// Check if token is an output token on Base
function isBaseOutputToken(token: Token, outputToken: 'ETH' | 'USDC' = 'ETH'): boolean {
  if (token.chainId !== 8453) return false;
  const address = token.address.toLowerCase();
  const outputAddresses = SELECTION_CONFIG.BASE_OUTPUT_TOKENS[outputToken];
  return outputAddresses.some(addr => addr.toLowerCase() === address);
}

// ═══════════════════════════════════════════════════════════════════════════════
// API INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

const SCAN_TIMEOUT = 25000; // 25 seconds max

async function scanWalletAPI(
  walletAddress: string, 
  chainIds: number[] = [8453],
  includeSolana: boolean = false
): Promise<ScanResult> {
  // Create abort controller with timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SCAN_TIMEOUT);

  try {
    const response = await fetch('/api/v1/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        walletAddress,
        chainIds,
        includeSolana,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Server error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || data.message || 'Scan failed');
    }

    // Transform API response
    const apiTokens = data.data?.tokens || [];
    const tokens: Token[] = apiTokens.map((t: any) => ({
      id: `${t.chainId}-${t.address}`,
      symbol: t.symbol || 'UNKNOWN',
      name: t.name || 'Unknown Token',
      address: t.address,
      chainId: t.chainId,
      chainName: CHAINS[t.chainId]?.name || 'Unknown',
      balance: t.balanceFormatted || t.balance || '0',
      balanceUsd: t.valueUsd || 0,
      // Try multiple logo sources
      logo: t.logoUrl || t.logo || t.thumbnail || t.image || getTokenLogo(t.address, t.chainId, t.symbol),
      tier: t.tier || 'DUST',
      riskScore: t.riskScore || 0,
      reasons: t.reasons || [],
    }));

    // Sort by value descending
    tokens.sort((a, b) => b.balanceUsd - a.balanceUsd);

    const dustTokens = tokens.filter(t => t.tier === 'DUST' || t.tier === 'MICRODUST');
    const summary = data.data?.summary || { byTier: { LEGIT: 0, DUST: 0, MICRODUST: 0, RISK: 0 } };

    return {
      wallet: walletAddress,
      totalValue: tokens.reduce((sum, t) => sum + t.balanceUsd, 0),
      dustValue: dustTokens.reduce((sum, t) => sum + t.balanceUsd, 0),
      tokens,
      chainsScanned: chainIds.length,
      scanTime: 0,
      summary,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Scan timed out. Please try again with fewer chains.');
    }
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function ScanProgressIndicator({ progress, currentChain }: { progress: number; currentChain?: string }) {
  return (
    <div className="text-center">
      {/* Animated Scanner */}
      <div className="relative w-24 h-24 mx-auto mb-6">
        {/* Outer ring */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ 
            border: '3px solid hsl(var(--border))',
            borderTopColor: 'hsl(var(--accent))',
            borderRightColor: 'hsl(var(--accent-2, var(--accent)))',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
        
        {/* Inner glow */}
        <motion.div
          className="absolute inset-3 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, hsl(var(--accent) / 0.2) 0%, transparent 70%)'
          }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold">{progress}%</span>
        </div>
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <h2 className="text-xl font-semibold mb-2">Scanning Wallet</h2>
        <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
          Analyzing {Object.keys(CHAINS).length} chains in parallel
        </p>
        
        {currentChain && (
          <motion.p 
            key={currentChain}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs mt-2"
            style={{ color: 'hsl(var(--accent))' }}
          >
            Checking {currentChain}...
          </motion.p>
        )}
      </motion.div>
      
      {/* Progress bar */}
      <div className="progress-bar mt-6 max-w-xs mx-auto">
        <motion.div 
          className="progress-bar-fill"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      
      {/* Security badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-center gap-2 mt-6 text-xs"
        style={{ color: 'hsl(var(--text-tertiary))' }}
      >
        <Shield className="w-3 h-3" style={{ color: 'hsl(var(--success))' }} />
        20-layer security analysis active
      </motion.div>
    </div>
  );
}

function TokenCard({ 
  token, 
  selected, 
  onToggle,
  index,
  amount,
  onAmountChange,
  showEditor,
  onToggleEditor,
  outputToken = 'ETH',
}: { 
  token: Token; 
  selected: boolean; 
  onToggle: () => void;
  index: number;
  amount: string;
  onAmountChange: (amount: string) => void;
  showEditor: boolean;
  onToggleEditor: () => void;
  outputToken?: 'ETH' | 'USDC';
}) {
  const tierConfig = TIERS[token.tier];
  const chainConfig = CHAINS[token.chainId];
  const isOutput = isBaseOutputToken(token, outputToken);
  const amountPct = parseInt(amount || '100');
  const actualValue = token.balanceUsd * (amountPct / 100);
  const actualBalance = parseFloat(token.balance) * (amountPct / 100);
  
  // Get smart recommendation for this token
  const recommendation = useMemo(() => analyzeToken(token as any, outputToken), [token, outputToken]);
  const isBlocked = recommendation.action === 'skip' && recommendation.priority === 0;
  const hasWarning = recommendation.action === 'warning';
  const isRecommended = recommendation.action === 'select' && recommendation.priority >= 7;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`token-card ${selected ? 'selected' : ''} ${isBlocked ? 'opacity-50' : ''}`}
      style={isRecommended && !selected ? { 
        borderColor: 'hsl(var(--success) / 0.3)',
        background: 'hsl(var(--success) / 0.03)',
      } : hasWarning ? {
        borderColor: 'hsl(var(--warning) / 0.3)',
      } : undefined}
    >
      <div 
        className="flex items-center gap-3 flex-1"
        onClick={() => {
          if (isBlocked) return;
          onToggle();
        }}
        style={isBlocked ? { cursor: 'not-allowed' } : { cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          className="checkbox"
          checked={selected}
          disabled={isBlocked}
          onChange={() => {}}
        />
        
        {/* Token Icon with recommendation indicator */}
        <div className="relative">
          {token.logo ? (
            <img 
              src={token.logo}
              alt={token.symbol}
              className="token-icon"
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                // Fallback to text if image fails
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <div 
            className={`token-icon ${token.logo ? 'hidden' : ''}`}
            style={{ 
              background: `hsl(${(token.symbol.charCodeAt(0) * 137) % 360} 50% 50% / 0.15)`,
              color: `hsl(${(token.symbol.charCodeAt(0) * 137) % 360} 50% 40%)`,
            }}
          >
            {token.symbol.slice(0, 2).toUpperCase()}
          </div>
          {isRecommended && (
            <div 
              className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center"
              style={{ background: 'hsl(var(--success))' }}
              title="Recommended"
            >
              <CheckCircle className="w-2 h-2 text-white" />
            </div>
          )}
        </div>
        
        {/* Token Info */}
        <div className="token-info">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="token-name">{token.symbol}</span>
            <span 
              className={`badge badge-${tierConfig.color}`} 
              style={{ height: 20, fontSize: 10 }}
            >
              {tierConfig.label}
            </span>
            {isOutput && (
              <span 
                className="badge" 
                style={{ height: 20, fontSize: 10, background: 'hsl(var(--bg-tertiary))' }}
              >
                Output
              </span>
            )}
            {isRecommended && !selected && (
              <span 
                className="badge badge-success" 
                style={{ height: 20, fontSize: 10 }}
              >
                ★ Recommended
              </span>
            )}
            {hasWarning && (
              <span 
                className="badge badge-warning" 
                style={{ height: 20, fontSize: 10 }}
              >
                ⚠ Caution
              </span>
            )}
          </div>
          <div className="token-value flex items-center gap-1.5">
            <span 
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: chainConfig?.color || '#666' }}
            />
            <span>{chainConfig?.name || 'Unknown'}</span>
            {token.riskScore > 50 && (
              <AlertTriangle 
                className="w-3 h-3" 
                style={{ color: 'hsl(var(--warning))' }} 
              />
            )}
            {recommendation.estimatedNetGain > 0 && (
              <span className="text-xs" style={{ color: 'hsl(var(--success))' }}>
                +${recommendation.estimatedNetGain.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Amount & Edit */}
      <div className="flex items-center gap-2">
        <div className="token-amount text-right">
          <div className="token-usd">
            ${actualValue < 0.01 ? '<0.01' : actualValue.toFixed(2)}
            {amountPct < 100 && (
              <span className="text-xs ml-1" style={{ color: 'hsl(var(--accent))' }}>
                ({amountPct}%)
              </span>
            )}
          </div>
          <div className="token-balance">
            {actualBalance.toFixed(4)}
          </div>
        </div>
        
        {/* Amount Editor Button */}
        {selected && !isBlocked && (
          <button
            className="btn btn-ghost btn-sm btn-icon"
            onClick={(e) => {
              e.stopPropagation();
              onToggleEditor();
            }}
            title="Adjust amount"
            style={{ 
              minWidth: 28, 
              height: 28,
              background: showEditor ? 'hsl(var(--accent-light))' : undefined
            }}
          >
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${showEditor ? 'rotate-180' : ''}`}
              style={{ color: 'hsl(var(--accent))' }}
            />
          </button>
        )}
      </div>

      {/* Amount Editor Dropdown */}
      <AnimatePresence>
        {showEditor && selected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full mt-3 pt-3"
            style={{ borderTop: '1px solid hsl(var(--border))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Recommendation reason */}
            {recommendation.reason && (
              <p className="text-xs mb-2" style={{ color: 'hsl(var(--text-tertiary))' }}>
                💡 {recommendation.reason}
              </p>
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                Amount:
              </span>
              <div className="flex gap-1 flex-1">
                {[25, 50, 75, 100].map(pct => (
                  <button
                    key={pct}
                    className={`flex-1 py-1 px-2 rounded-lg text-xs font-medium transition-all ${
                      amountPct === pct 
                        ? 'bg-[hsl(var(--accent))] text-white' 
                        : 'bg-[hsl(var(--bg-tertiary))]'
                    }`}
                    onClick={() => onAmountChange(pct.toString())}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="range"
                min="1"
                max="100"
                value={amountPct}
                onChange={(e) => onAmountChange(e.target.value)}
                className="flex-1"
                style={{ accentColor: 'hsl(var(--accent))' }}
              />
              <span className="text-xs font-medium w-10 text-right">
                {amountPct}%
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResultsSummary({ result }: { result: ScanResult }) {
  const { summary } = result;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-3 mb-6"
    >
      <div className="card stat-card">
        <div className="stat-value">${result.totalValue.toFixed(2)}</div>
        <div className="stat-label">Total Value</div>
      </div>
      <div className="card stat-card">
        <div className="stat-value" style={{ color: 'hsl(var(--accent))' }}>
          ${result.dustValue.toFixed(2)}
        </div>
        <div className="stat-label">Recoverable</div>
      </div>
      
      {/* Tier breakdown */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="col-span-2 card"
        style={{ padding: '12px 16px' }}
      >
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--success))' }} />
            <span>{summary.byTier?.LEGIT || 0} Legit</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--accent))' }} />
            <span>{summary.byTier?.DUST || 0} Dust</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--warning))' }} />
            <span>{summary.byTier?.MICRODUST || 0} Micro</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: 'hsl(var(--danger))' }} />
            <span>{summary.byTier?.RISK || 0} Risk</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function EmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <Search />
      </div>
      <h3 className="empty-state-title">No tokens found</h3>
      <p className="empty-state-description">
        We couldn't find any tokens in this wallet. Make sure the address is correct.
      </p>
      <button 
        className="btn btn-secondary mt-4"
        onClick={onRetry}
      >
        <RefreshCw className="w-4 h-4" />
        Try Again
      </button>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="empty-state">
      <div 
        className="empty-state-icon"
        style={{ color: 'hsl(var(--danger))' }}
      >
        <AlertCircle />
      </div>
      <h3 className="empty-state-title">Scan Failed</h3>
      <p className="empty-state-description">
        {error}
      </p>
      <button 
        className="btn btn-primary mt-4"
        onClick={onRetry}
      >
        <RefreshCw className="w-4 h-4" />
        Retry Scan
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const { error: toastError, success: toastSuccess } = useToast();
  
  const addressParam = searchParams.get('address');
  
  // State
  const [walletAddress, setWalletAddress] = useState(addressParam || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [currentChain, setCurrentChain] = useState<string>();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [tokenAmounts, setTokenAmounts] = useState<TokenAmounts>({}); // Custom amounts per token
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [filterChain, setFilterChain] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showAmountEditor, setShowAmountEditor] = useState<string | null>(null);
  const [outputToken, setOutputToken] = useState<'ETH' | 'USDC'>('ETH');
  const [selectionMode, setSelectionMode] = useState<'smart' | 'dustOnly' | 'baseOnly' | 'highValue' | 'manual'>('smart');
  const [selectionResult, setSelectionResult] = useState<SelectionResult | null>(null);
  
  // Chain selection state
  const [selectedChains, setSelectedChains] = useState<Set<number>>(new Set([8453])); // Default: Base only
  const [chainPreset, setChainPreset] = useState<'base' | 'l2' | 'all'>('base');
  const [showChainSelector, setShowChainSelector] = useState(false);
  const [includeSolana, setIncludeSolana] = useState(false);
  
  // Auto-fill connected wallet
  useEffect(() => {
    if (isConnected && connectedAddress && !walletAddress && !addressParam) {
      setWalletAddress(connectedAddress);
    }
  }, [isConnected, connectedAddress, walletAddress, addressParam]);
  
  // Auto-scan if address in URL
  useEffect(() => {
    if (addressParam && !scanResult && !isScanning && !scanError) {
      handleScan(addressParam);
    }
  }, [addressParam]);

  // Scan handler
  const handleScan = useCallback(async (address?: string) => {
    const addr = address || walletAddress;
    if (!addr) {
      toastError('Enter a wallet address', 'Please enter a valid wallet or ENS name');
      return;
    }
    
    // Validate address format
    const isValidEth = /^0x[a-fA-F0-9]{40}$/.test(addr);
    const isValidENS = /^[a-zA-Z0-9-]+\.(eth|base\.eth)$/.test(addr);
    
    if (!isValidEth && !isValidENS) {
      toastError('Invalid address', 'Please enter a valid wallet address or ENS name');
      return;
    }
    
    setIsScanning(true);
    setScanProgress(0);
    setScanError(null);
    setSelectedTokens(new Set());
    setScanResult(null);
    
    const startTime = Date.now();
    const chainsToScan = Array.from(selectedChains);
    const chainNames = chainsToScan.map(id => CHAINS[id]?.name || 'Unknown');
    if (includeSolana) chainNames.push('Solana');
    let progressIntervalId: NodeJS.Timeout | null = null;
    
    // Create a promise that we can resolve/reject
    const scanPromise = async () => {
      // Progress animation - smoother with max 95%
      let progress = 0;
      let chainIndex = 0;
      progressIntervalId = setInterval(() => {
        // Slower progress that never reaches 100%
        const increment = progress < 50 ? 8 : progress < 80 ? 4 : 1;
        progress = Math.min(progress + Math.random() * increment, 95);
        setScanProgress(Math.floor(progress));
        
        // Show chains being scanned in order
        setCurrentChain(chainNames[chainIndex % chainNames.length]);
        chainIndex++;
      }, 400);

      try {
        const result = await scanWalletAPI(addr, chainsToScan, includeSolana);
        
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          progressIntervalId = null;
        }
        
        // Animate to 100%
        setScanProgress(100);
        setCurrentChain(undefined);
        
        result.scanTime = Date.now() - startTime;
        setScanResult(result);
        
        // Smart auto-selection using intelligent algorithm
        const smartResult = smartSelectAll(result.tokens as any, outputToken);
        setSelectionResult(smartResult);
        setSelectedTokens(smartResult.selectedIds);
        
        // Show recommendations summary
        const selectedCount = smartResult.selectedIds.size;
        const skippedCount = result.tokens.length - selectedCount;
        console.log('[SMART SELECT]', {
          selected: selectedCount,
          skipped: skippedCount,
          summary: smartResult.summary,
          warnings: smartResult.warnings,
        });
        
        if (result.tokens.length > 0) {
          toastSuccess(
            'Scan Complete',
            `Found ${result.tokens.length} tokens across ${result.chainsScanned} chains`
          );
        }
        
      } catch (error) {
        if (progressIntervalId) {
          clearInterval(progressIntervalId);
          progressIntervalId = null;
        }
        setScanProgress(0);
        setCurrentChain(undefined);
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        setScanError(errorMessage);
        toastError('Scan Failed', errorMessage);
      }
    };

    try {
      await scanPromise();
    } finally {
      if (progressIntervalId) {
        clearInterval(progressIntervalId);
      }
      setIsScanning(false);
    }
  }, [walletAddress, toastError, toastSuccess]);

  // Filter and sort tokens by value (highest first)
  const filteredTokens = useMemo(() => {
    if (!scanResult) return [];
    return scanResult.tokens
      .filter(token => {
        if (filterTier && token.tier !== filterTier) return false;
        if (filterChain && token.chainId !== filterChain) return false;
        return true;
      })
      // Sort by USD value descending (highest value first)
      .sort((a, b) => b.balanceUsd - a.balanceUsd);
  }, [scanResult, filterTier, filterChain]);

  // Selection handlers
  const toggleToken = (id: string) => {
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Smart selection handlers
  const applySmartSelect = useCallback(() => {
    if (!scanResult) return;
    const result = smartSelectAll(scanResult.tokens as any, outputToken);
    setSelectionResult(result);
    setSelectedTokens(result.selectedIds);
    setSelectionMode('smart');
    
    if (result.warnings.length > 0) {
      toastError('Selection Warnings', result.warnings[0]);
    }
  }, [scanResult, outputToken, toastError]);

  const applyDustOnly = useCallback(() => {
    if (!scanResult) return;
    const ids = selectDustOnly(scanResult.tokens as any, outputToken);
    setSelectedTokens(ids);
    setSelectionMode('dustOnly');
  }, [scanResult, outputToken]);

  const applyBaseOnly = useCallback(() => {
    if (!scanResult) return;
    const ids = selectBaseOnly(scanResult.tokens as any, outputToken);
    setSelectedTokens(ids);
    setSelectionMode('baseOnly');
  }, [scanResult, outputToken]);

  const applyHighValue = useCallback(() => {
    if (!scanResult) return;
    const ids = selectHighValueDust(scanResult.tokens as any, 1, outputToken);
    setSelectedTokens(ids);
    setSelectionMode('highValue');
  }, [scanResult, outputToken]);

  const clearSelection = () => setSelectedTokens(new Set());

  const selectedValue = useMemo(() => {
    if (!scanResult) return 0;
    return scanResult.tokens
      .filter(t => selectedTokens.has(t.id))
      .reduce((sum, t) => {
        const pct = parseInt(tokenAmounts[t.id] || '100') / 100;
        return sum + (t.balanceUsd * pct);
      }, 0);
  }, [scanResult, selectedTokens, tokenAmounts]);

  // Proceed to consolidate
  const handleConsolidate = () => {
    if (selectedTokens.size === 0) return;
    
    const tokensToConsolidate = scanResult?.tokens
      .filter(t => selectedTokens.has(t.id))
      .map(t => ({
        ...t,
        // Include custom amount percentage
        amountPct: parseInt(tokenAmounts[t.id] || '100'),
        // Calculate actual balance to swap based on percentage
        swapBalance: (parseFloat(t.balance) * (parseInt(tokenAmounts[t.id] || '100') / 100)).toString(),
        swapBalanceUsd: t.balanceUsd * (parseInt(tokenAmounts[t.id] || '100') / 100),
      })) || [];
    
    sessionStorage.setItem('vortex_consolidation', JSON.stringify({
      wallet: scanResult?.wallet,
      tokens: tokensToConsolidate,
      totalValue: selectedValue,
    }));
    
    router.push('/consolidate');
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Initial scan form
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (!scanResult && !isScanning && !scanError) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '48px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{ background: 'hsl(var(--accent-light))' }}
            >
              <Search className="w-8 h-8" style={{ color: 'hsl(var(--accent))' }} />
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-2">Scan Wallet</h1>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              Detect tokens across 10 EVM chains
            </p>
          </motion.div>

          {/* Wallet Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card p-4 mb-4"
          >
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" 
                  style={{ color: 'hsl(var(--text-tertiary))' }}
                />
                <input
                  type="text"
                  className="input w-full pl-10"
                  placeholder="0x... or name.eth"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                />
              </div>
            </div>
          </motion.div>

          {/* Chain Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card p-4 mb-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium">Chains to scan</span>
              <span className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {selectedChains.size} selected
              </span>
            </div>
            
            {/* Quick Presets */}
            <div className="flex gap-2 mb-3">
              {Object.entries(CHAIN_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                    chainPreset === key 
                      ? 'bg-[hsl(var(--accent))] text-white shadow-md' 
                      : 'bg-[hsl(var(--bg-tertiary))]'
                  }`}
                  onClick={() => {
                    setChainPreset(key as 'base' | 'l2' | 'all');
                    setSelectedChains(new Set(preset.chains));
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Chain Pills (Collapsed by default) */}
            <button
              className="w-full flex items-center justify-between text-xs py-2"
              style={{ color: 'hsl(var(--text-secondary))' }}
              onClick={() => setShowChainSelector(!showChainSelector)}
            >
              <span>Customize chains</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showChainSelector ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showChainSelector && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-3"
                  style={{ borderTop: '1px solid hsl(var(--border))' }}
                >
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(CHAINS).map(([chainId, chain]) => {
                      const id = parseInt(chainId);
                      const isSelected = selectedChains.has(id);
                      return (
                        <button
                          key={chainId}
                          className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
                            isSelected 
                              ? 'shadow-sm' 
                              : 'opacity-50'
                          }`}
                          style={{ 
                            background: isSelected ? `${chain.color}20` : 'hsl(var(--bg-tertiary))',
                            border: isSelected ? `1px solid ${chain.color}` : '1px solid transparent',
                            color: isSelected ? chain.color : 'hsl(var(--text-secondary))'
                          }}
                          onClick={() => {
                            const next = new Set(selectedChains);
                            if (next.has(id)) {
                              next.delete(id);
                              // At least one chain required
                              if (next.size === 0) next.add(8453);
                            } else {
                              next.add(id);
                            }
                            setSelectedChains(next);
                            setChainPreset('base'); // Reset preset on manual change
                          }}
                        >
                          <span>{chain.icon}</span>
                          <span>{chain.name}</span>
                          {isSelected && <CheckCircle className="w-3 h-3" />}
                        </button>
                      );
                    })}
                    
                    {/* Solana Toggle */}
                    <button
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-medium transition-all ${
                        includeSolana ? 'shadow-sm' : 'opacity-50'
                      }`}
                      style={{ 
                        background: includeSolana ? `${SOLANA_CHAIN.color}20` : 'hsl(var(--bg-tertiary))',
                        border: includeSolana ? `1px solid ${SOLANA_CHAIN.color}` : '1px solid transparent',
                        color: includeSolana ? SOLANA_CHAIN.color : 'hsl(var(--text-secondary))'
                      }}
                      onClick={() => setIncludeSolana(!includeSolana)}
                    >
                      <span>{SOLANA_CHAIN.icon}</span>
                      <span>{SOLANA_CHAIN.name}</span>
                      {includeSolana && <CheckCircle className="w-3 h-3" />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Scan Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="btn btn-primary btn-lg w-full"
            onClick={() => handleScan()}
            disabled={!walletAddress || selectedChains.size === 0}
          >
            <Search className="w-5 h-5" />
            Scan {selectedChains.size} Chain{selectedChains.size > 1 ? 's' : ''}
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          
          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-2 mt-6"
          >
            {[
              { icon: <Zap className="w-4 h-4" />, label: 'Fast', desc: '<10s' },
              { icon: <Shield className="w-4 h-4" />, label: 'Secure', desc: '20-layer' },
              { icon: <TrendingUp className="w-4 h-4" />, label: 'Smart', desc: 'AI select' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="text-center py-3 px-2 rounded-xl"
                style={{ background: 'hsl(var(--bg-secondary))' }}
              >
                <div 
                  className="w-8 h-8 mx-auto mb-1.5 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' }}
                >
                  {feature.icon}
                </div>
                <div className="text-xs font-semibold">{feature.label}</div>
                <div className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
                  {feature.desc}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Scanning state
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (isScanning) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '80px' }}>
          <ScanProgressIndicator 
            progress={scanProgress} 
            currentChain={currentChain}
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Error state
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (scanError) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '80px' }}>
          <ErrorState 
            error={scanError} 
            onRetry={() => {
              setScanError(null);
              handleScan(walletAddress);
            }} 
          />
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Results
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (scanResult?.tokens.length === 0) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '80px' }}>
          <EmptyState onRetry={() => handleScan(scanResult.wallet)} />
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div>
            <h2 className="text-lg font-semibold">Scan Results</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {scanResult?.tokens.length} tokens • {scanResult?.chainsScanned} chains • {((scanResult?.scanTime || 0) / 1000).toFixed(1)}s
            </p>
          </div>
          <button 
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => handleScan(scanResult?.wallet)}
            aria-label="Refresh scan results"
            title="Rescan wallet"
          >
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '16px' }}>
        {/* Summary */}
        {scanResult && <ResultsSummary result={scanResult} />}

        {/* Smart Selection Presets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          {/* Selection Mode Buttons */}
          <div 
            className="flex gap-2 mb-2 overflow-x-auto pb-2" 
            style={{ scrollbarWidth: 'none' }}
            role="group"
            aria-label="Token selection presets"
          >
            <button 
              className={`btn btn-sm whitespace-nowrap ${selectionMode === 'smart' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={applySmartSelect}
              aria-pressed={selectionMode === 'smart'}
              title="AI-optimized selection for best returns"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              Smart
            </button>
            <button 
              className={`btn btn-sm whitespace-nowrap ${selectionMode === 'dustOnly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={applyDustOnly}
              aria-pressed={selectionMode === 'dustOnly'}
              title="Select only dust and micro-dust tokens"
            >
              Dust Only
            </button>
            <button 
              className={`btn btn-sm whitespace-nowrap ${selectionMode === 'baseOnly' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={applyBaseOnly}
              aria-pressed={selectionMode === 'baseOnly'}
              title="Select only tokens on Base chain (no bridging)"
            >
              Base Only
            </button>
            <button 
              className={`btn btn-sm whitespace-nowrap ${selectionMode === 'highValue' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={applyHighValue}
              aria-pressed={selectionMode === 'highValue'}
              title="Select dust tokens worth $1 or more"
            >
              High Value
            </button>
            {selectedTokens.size > 0 && (
              <button 
                className="btn btn-ghost btn-sm"
                onClick={clearSelection}
              >
                Clear
              </button>
            )}
            <button 
              className="btn btn-ghost btn-sm btn-icon ml-auto"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>

          {/* Selection Info */}
          {selectionResult && selectedTokens.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="text-xs p-2 rounded-lg"
              style={{ background: 'hsl(var(--bg-tertiary))' }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: 'hsl(var(--text-tertiary))' }}>
                  Est. output: <strong style={{ color: 'hsl(var(--success))' }}>
                    ${selectionResult.summary.estimatedOutput.toFixed(2)}
                  </strong>
                </span>
                <span style={{ color: 'hsl(var(--text-tertiary))' }}>
                  Fees: ~${selectionResult.summary.estimatedFees.toFixed(2)}
                </span>
                <span 
                  className={`badge badge-sm ${
                    selectionResult.summary.riskLevel === 'low' ? 'badge-success' :
                    selectionResult.summary.riskLevel === 'medium' ? 'badge-warning' : 'badge-danger'
                  }`}
                >
                  {selectionResult.summary.riskLevel} risk
                </span>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 overflow-hidden"
            >
              <div className="card" style={{ padding: '12px' }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    Tier:
                  </span>
                  {Object.entries(TIERS).map(([tier, config]) => (
                    <button
                      key={tier}
                      className={`chain-chip ${filterTier === tier ? 'active' : ''}`}
                      onClick={() => setFilterTier(filterTier === tier ? null : tier)}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    Chain:
                  </span>
                  {Object.entries(CHAINS).slice(0, 8).map(([id, chain]) => (
                    <button
                      key={id}
                      className={`chain-chip ${filterChain === Number(id) ? 'active' : ''}`}
                      onClick={() => setFilterChain(filterChain === Number(id) ? null : Number(id))}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: chain.color }} />
                      {chain.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token List */}
        <div className="space-y-2 mb-32">
          {filteredTokens.map((token, i) => (
            <TokenCard
              key={token.id}
              token={token}
              selected={selectedTokens.has(token.id)}
              onToggle={() => toggleToken(token.id)}
              index={i}
              amount={tokenAmounts[token.id] || '100'}
              onAmountChange={(amt) => setTokenAmounts(prev => ({ ...prev, [token.id]: amt }))}
              showEditor={showAmountEditor === token.id}
              onToggleEditor={() => setShowAmountEditor(showAmountEditor === token.id ? null : token.id)}
              outputToken={outputToken}
            />
          ))}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <AnimatePresence>
        {selectedTokens.size > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-0 right-0 p-4 z-30"
            style={{ paddingBottom: 'max(16px, var(--safe-bottom))' }}
          >
            <div className="container">
              <div 
                className="card flex items-center gap-4"
                style={{ 
                  padding: '14px 18px',
                  background: 'hsl(var(--bg-elevated))',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {selectedTokens.size} token{selectedTokens.size > 1 ? 's' : ''} selected
                  </div>
                  <div className="text-xs" style={{ color: 'hsl(var(--accent))' }}>
                    ≈ ${selectedValue.toFixed(2)} to consolidate
                  </div>
                </div>
                <button 
                  className="btn btn-primary"
                  onClick={handleConsolidate}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
