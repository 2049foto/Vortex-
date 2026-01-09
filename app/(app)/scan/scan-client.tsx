'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Scan Page 2026
 * Smart UX with real-time feedback, progress tracking, and intuitive token selection
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ArrowRight,
  ArrowLeft,
  Check,
  X,
  AlertTriangle,
  Shield,
  Zap,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Info,
  Layers,
  DollarSign,
  BarChart3,
  Wallet
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

type TokenTier = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK';

interface Token {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  priceUsd: number;
  valueUsd: number;
  logoUrl?: string;
  tier: TokenTier;
  riskScore: number;
  reasons?: string[];
}

interface ScanResult {
  wallet: string;
  tokens: Token[];
  summary: {
    totalTokens: number;
    totalValue: number;
    byTier: Record<TokenTier, number>;
    consolidationOpportunity: {
      tokenCount: number;
      totalValue: number;
    };
  };
}

type ScanPhase = 'input' | 'scanning' | 'results' | 'selection' | 'error';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const CHAINS: Record<number, { name: string; icon: string; color: string }> = {
  1: { name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  8453: { name: 'Base', icon: '🔵', color: '#0052FF' },
  42161: { name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
  10: { name: 'Optimism', icon: '🔴', color: '#FF0420' },
  137: { name: 'Polygon', icon: '💜', color: '#8247E5' },
  56: { name: 'BNB', icon: '🟡', color: '#F0B90B' },
  43114: { name: 'Avalanche', icon: '🔺', color: '#E84142' },
  324: { name: 'zkSync', icon: '⚡', color: '#8C8DFC' },
  0: { name: 'Solana', icon: '🟣', color: '#9945FF' },
  838592: { name: 'Monad', icon: '🌀', color: '#00D9FF' },
};

const TIER_CONFIG: Record<TokenTier, { label: string; color: string; bgClass: string; description: string }> = {
  LEGIT: { 
    label: 'Legit', 
    color: 'var(--tier-legit)', 
    bgClass: 'badge-legit',
    description: 'Verified, safe tokens with good liquidity'
  },
  DUST: { 
    label: 'Dust', 
    color: 'var(--tier-dust)', 
    bgClass: 'badge-dust',
    description: 'Small value tokens worth consolidating'
  },
  MICRODUST: { 
    label: 'Micro', 
    color: 'var(--tier-microdust)', 
    bgClass: 'badge-microdust',
    description: 'Very small value, may not be worth gas'
  },
  RISK: { 
    label: 'Risk', 
    color: 'var(--tier-risk)', 
    bgClass: 'badge-risk',
    description: 'Potential honeypot or scam token'
  },
};

const SCAN_STEPS = [
  { id: 'fetch', label: 'Fetching tokens', duration: 2000 },
  { id: 'analyze', label: 'Analyzing risk', duration: 2500 },
  { id: 'classify', label: 'Classifying tiers', duration: 1500 },
  { id: 'complete', label: 'Complete', duration: 500 },
];

// ═══════════════════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════════════════

function useClipboard(timeout = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), timeout);
  }, [timeout]);

  return { copied, copy };
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function WalletInputSection({
  address,
  setAddress,
  onScan,
  isValid
}: {
  address: string;
  setAddress: (v: string) => void;
  onScan: () => void;
  isValid: boolean;
}) {
  return (
    <div className="card card-glow p-8 max-w-xl mx-auto">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-primary-muted flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Scan Your Wallet</h1>
        <p className="text-foreground-secondary">
          Enter any wallet address to discover dust tokens across 11 chains
        </p>
      </div>

      <div className="space-y-4">
        <div className="input-group">
          <Wallet className="input-icon w-5 h-5" />
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && isValid && onScan()}
            placeholder="0x... or name.eth"
            className="input input-lg input-with-icon input-wallet"
            autoFocus
          />
        </div>

        <button
          onClick={onScan}
          disabled={!isValid}
          className="btn btn-primary btn-lg w-full btn-shimmer"
        >
          <Search className="w-5 h-5" />
          Start Scan
          <ArrowRight className="w-5 h-5" />
        </button>

        <p className="text-xs text-center text-foreground-muted">
          Your wallet won't be connected. We only read public blockchain data.
        </p>
      </div>
    </div>
  );
}

function ScanningProgress({ currentStep }: { currentStep: number }) {
  return (
    <div className="card p-8 max-w-md mx-auto text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="vortex-spinner w-24 h-24" />
        <div className="absolute inset-0 flex items-center justify-center">
          <Layers className="w-8 h-8 text-primary animate-pulse" />
        </div>
      </div>

      <h2 className="text-xl font-bold mb-2">Scanning Wallet</h2>
      <p className="text-foreground-secondary mb-8">
        Analyzing tokens across 11 chains...
      </p>

      <div className="space-y-3">
        {SCAN_STEPS.map((step, i) => {
          const isActive = i === currentStep;
          const isComplete = i < currentStep;
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                isActive ? 'bg-primary-muted' : isComplete ? 'bg-success-bg' : 'bg-card'
              }`}
            >
              {isComplete ? (
                <CheckCircle2 className="w-5 h-5 text-success" />
              ) : isActive ? (
                <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              ) : (
                <div className="w-5 h-5 rounded-full border-2 border-border" />
              )}
              <span className={`text-sm ${isActive ? 'text-primary font-medium' : isComplete ? 'text-success' : 'text-foreground-muted'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TokenCard({
  token,
  isSelected,
  onToggle,
  onViewDetails
}: {
  token: Token;
  isSelected: boolean;
  onToggle: () => void;
  onViewDetails: () => void;
}) {
  const chain = CHAINS[token.chainId] || { name: 'Unknown', icon: '?', color: '#888' };
  const tierConfig = TIER_CONFIG[token.tier];
  const { copied, copy } = useClipboard();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`token-card cursor-pointer ${isSelected ? 'selected' : ''}`}
      style={{ '--token-chain-color': chain.color } as React.CSSProperties}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="checkbox"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Token Icon */}
      <div className="relative flex-shrink-0">
        {token.logoUrl ? (
          <img 
            src={token.logoUrl} 
            alt={token.symbol}
            className="w-10 h-10 rounded-full bg-card"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-card-hover flex items-center justify-center text-sm font-bold">
            {token.symbol.slice(0, 2)}
          </div>
        )}
        {/* Chain badge */}
        <div 
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs border-2 border-card"
          style={{ backgroundColor: chain.color }}
        >
          {chain.icon}
        </div>
      </div>

      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold truncate">{token.symbol}</span>
          <span className={`badge ${tierConfig.bgClass}`}>{tierConfig.label}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground-muted">
          <span className="truncate">{parseFloat(token.balanceFormatted).toFixed(4)}</span>
          <span>·</span>
          <span>{chain.name}</span>
        </div>
      </div>

      {/* Value & Risk */}
      <div className="text-right">
        <div className="font-semibold">
          ${token.valueUsd.toFixed(2)}
        </div>
        <div className="flex items-center gap-1 text-sm">
          {token.riskScore > 70 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-danger" />
          ) : token.riskScore > 40 ? (
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-success" />
          )}
          <span className={
            token.riskScore > 70 ? 'text-danger' : 
            token.riskScore > 40 ? 'text-warning' : 'text-success'
          }>
            {token.riskScore}
          </span>
        </div>
      </div>

      {/* Details button */}
      <button
        className="btn btn-ghost btn-icon ml-2"
        onClick={(e) => {
          e.stopPropagation();
          onViewDetails();
        }}
        style={{ minHeight: 36, width: 36 }}
      >
        <Info className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

function SummaryCard({ summary, selectedCount, selectedValue }: { 
  summary: ScanResult['summary']; 
  selectedCount: number;
  selectedValue: number;
}) {
  return (
    <div className="card p-6 space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        Scan Summary
      </h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-card-hover">
          <div className="text-2xl font-bold">{summary.totalTokens}</div>
          <div className="text-xs text-foreground-muted">Total Tokens</div>
        </div>
        <div className="p-3 rounded-lg bg-card-hover">
          <div className="text-2xl font-bold">${summary.totalValue.toFixed(2)}</div>
          <div className="text-xs text-foreground-muted">Total Value</div>
        </div>
      </div>

      {/* Tier breakdown */}
      <div className="space-y-2">
        {Object.entries(summary.byTier).map(([tier, count]) => {
          const config = TIER_CONFIG[tier as TokenTier];
          const percent = summary.totalTokens > 0 ? (count / summary.totalTokens) * 100 : 0;
          
          return (
            <div key={tier} className="flex items-center gap-3">
              <span className={`badge ${config.bgClass} w-16 justify-center`}>{config.label}</span>
              <div className="flex-1 h-2 bg-card-hover rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${percent}%`,
                    backgroundColor: `hsl(${config.color})`
                  }}
                />
              </div>
              <span className="text-sm text-foreground-muted w-8 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Consolidation opportunity */}
      {summary.consolidationOpportunity.tokenCount > 0 && (
        <div className="p-4 rounded-xl bg-primary-muted border border-primary/30">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-semibold">Consolidation Opportunity</span>
          </div>
          <p className="text-sm text-foreground-secondary">
            <strong className="text-foreground">{summary.consolidationOpportunity.tokenCount}</strong> dust tokens worth{' '}
            <strong className="text-foreground">${summary.consolidationOpportunity.totalValue.toFixed(2)}</strong> can be consolidated
          </p>
        </div>
      )}

      {/* Selection summary */}
      {selectedCount > 0 && (
        <div className="p-4 rounded-xl bg-accent-muted border border-accent/30">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-semibold text-accent">{selectedCount} tokens selected</div>
              <div className="text-sm text-foreground-secondary">${selectedValue.toFixed(2)} value</div>
            </div>
            <CheckCircle2 className="w-6 h-6 text-accent" />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterTabs({
  activeFilter,
  setActiveFilter,
  counts
}: {
  activeFilter: TokenTier | 'ALL';
  setActiveFilter: (f: TokenTier | 'ALL') => void;
  counts: Record<TokenTier | 'ALL', number>;
}) {
  const filters: (TokenTier | 'ALL')[] = ['ALL', 'DUST', 'MICRODUST', 'LEGIT', 'RISK'];

  return (
    <div className="tabs">
      {filters.map((filter) => (
        <button
          key={filter}
          onClick={() => setActiveFilter(filter)}
          className={`tab ${activeFilter === filter ? 'active' : ''}`}
        >
          {filter === 'ALL' ? 'All' : TIER_CONFIG[filter].label}
          <span className="ml-1 text-xs opacity-60">({counts[filter] || 0})</span>
        </button>
      ))}
    </div>
  );
}

function TokenDetailModal({
  token,
  onClose
}: {
  token: Token | null;
  onClose: () => void;
}) {
  if (!token) return null;
  
  const chain = CHAINS[token.chainId] || { name: 'Unknown', icon: '?', color: '#888' };
  const tierConfig = TIER_CONFIG[token.tier];
  const { copied, copy } = useClipboard();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            {token.logoUrl ? (
              <img src={token.logoUrl} alt={token.symbol} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-card-hover flex items-center justify-center font-bold">
                {token.symbol.slice(0, 2)}
              </div>
            )}
            <div>
              <h3 className="font-semibold">{token.symbol}</h3>
              <p className="text-sm text-foreground-muted">{token.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-icon">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-card-hover">
              <div className="text-sm text-foreground-muted mb-1">Value</div>
              <div className="font-semibold">${token.valueUsd.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-lg bg-card-hover">
              <div className="text-sm text-foreground-muted mb-1">Balance</div>
              <div className="font-semibold">{parseFloat(token.balanceFormatted).toFixed(6)}</div>
            </div>
            <div className="p-3 rounded-lg bg-card-hover">
              <div className="text-sm text-foreground-muted mb-1">Chain</div>
              <div className="font-semibold flex items-center gap-2">
                <span>{chain.icon}</span>
                {chain.name}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-card-hover">
              <div className="text-sm text-foreground-muted mb-1">Tier</div>
              <div><span className={`badge ${tierConfig.bgClass}`}>{tierConfig.label}</span></div>
            </div>
          </div>

          {/* Risk Score */}
          <div className="p-4 rounded-xl bg-card-hover">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">Risk Score</span>
              <span className={`font-bold ${
                token.riskScore > 70 ? 'text-danger' : 
                token.riskScore > 40 ? 'text-warning' : 'text-success'
              }`}>
                {token.riskScore}/100
              </span>
            </div>
            <div className="risk-meter">
              <div 
                className={`risk-meter-fill ${
                  token.riskScore > 70 ? 'high' : 
                  token.riskScore > 40 ? 'medium' : 'low'
                }`}
                style={{ width: `${token.riskScore}%` }}
              />
            </div>
          </div>

          {/* Risk Reasons */}
          {token.reasons && token.reasons.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Risk Factors</h4>
              {token.reasons.map((reason, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                  <span className="text-foreground-secondary">{reason}</span>
                </div>
              ))}
            </div>
          )}

          {/* Contract Address */}
          <div className="p-3 rounded-lg bg-card-hover">
            <div className="text-sm text-foreground-muted mb-1">Contract Address</div>
            <div className="flex items-center gap-2">
              <code className="text-xs flex-1 truncate">{token.address}</code>
              <button 
                onClick={() => copy(token.address)}
                className="btn btn-ghost btn-icon"
                style={{ minHeight: 32, width: 32 }}
              >
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={`https://basescan.org/token/${token.address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-icon"
                style={{ minHeight: 32, width: 32 }}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function ActionBar({
  selectedCount,
  selectedValue,
  onConsolidate,
  onClear,
  disabled
}: {
  selectedCount: number;
  selectedValue: number;
  onConsolidate: () => void;
  onClear: () => void;
  disabled: boolean;
}) {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="sticky bottom-20 left-0 right-0 p-4"
    >
      <div className="card card-glass p-4 max-w-xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-semibold">{selectedCount} tokens selected</div>
            <div className="text-sm text-foreground-secondary">${selectedValue.toFixed(2)} total</div>
          </div>
          <div className="flex gap-2">
            <button onClick={onClear} className="btn btn-ghost">
              Clear
            </button>
            <button 
              onClick={onConsolidate} 
              disabled={disabled}
              className="btn btn-accent btn-shimmer"
            >
              <Zap className="w-4 h-4" />
              Consolidate
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [phase, setPhase] = useState<ScanPhase>('input');
  const [address, setAddress] = useState(searchParams.get('address') || '');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [currentScanStep, setCurrentScanStep] = useState(0);
  const [activeFilter, setActiveFilter] = useState<TokenTier | 'ALL'>('ALL');
  const [detailToken, setDetailToken] = useState<Token | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isValidAddress = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(address) || address.endsWith('.eth') || address.endsWith('.base.eth');
  }, [address]);

  const filteredTokens = useMemo(() => {
    if (!scanResult) return [];
    if (activeFilter === 'ALL') return scanResult.tokens;
    return scanResult.tokens.filter(t => t.tier === activeFilter);
  }, [scanResult, activeFilter]);

  const tierCounts = useMemo(() => {
    if (!scanResult) return { ALL: 0, LEGIT: 0, DUST: 0, MICRODUST: 0, RISK: 0 };
    return {
      ALL: scanResult.tokens.length,
      LEGIT: scanResult.summary.byTier.LEGIT || 0,
      DUST: scanResult.summary.byTier.DUST || 0,
      MICRODUST: scanResult.summary.byTier.MICRODUST || 0,
      RISK: scanResult.summary.byTier.RISK || 0,
    };
  }, [scanResult]);

  const selectedValue = useMemo(() => {
    if (!scanResult) return 0;
    return scanResult.tokens
      .filter(t => selectedTokens.has(`${t.chainId}:${t.address}`))
      .reduce((sum, t) => sum + t.valueUsd, 0);
  }, [scanResult, selectedTokens]);

  // Auto-scan if address in URL
  useEffect(() => {
    const urlAddress = searchParams.get('address');
    if (urlAddress && isValidAddress) {
      handleScan();
    }
  }, []);

  // Scan function
  const handleScan = useCallback(async () => {
    if (!isValidAddress) return;
    
    setPhase('scanning');
    setCurrentScanStep(0);
    setError(null);

    // Simulate progress steps
    const stepIntervals = SCAN_STEPS.map((step, i) => {
      return setTimeout(() => setCurrentScanStep(i), 
        SCAN_STEPS.slice(0, i).reduce((sum, s) => sum + s.duration, 0)
      );
    });

    try {
      const response = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();

      // Clear step intervals
      stepIntervals.forEach(clearTimeout);

      if (data.success) {
        setScanResult(data.data);
        
        // Auto-select dust tokens
        const dustTokens = data.data.tokens
          .filter((t: Token) => t.tier === 'DUST' || t.tier === 'MICRODUST')
          .map((t: Token) => `${t.chainId}:${t.address}`);
        setSelectedTokens(new Set(dustTokens));
        
        setPhase('results');
      } else {
        setError(data.error || 'Failed to scan wallet');
        setPhase('error');
      }
    } catch (err) {
      stepIntervals.forEach(clearTimeout);
      setError('Network error. Please try again.');
      setPhase('error');
    }
  }, [address, isValidAddress]);

  // Token selection
  const toggleToken = useCallback((token: Token) => {
    const key = `${token.chainId}:${token.address}`;
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((tier?: TokenTier) => {
    if (!scanResult) return;
    const tokens = tier 
      ? scanResult.tokens.filter(t => t.tier === tier)
      : scanResult.tokens.filter(t => t.tier !== 'RISK');
    const keys = tokens.map(t => `${t.chainId}:${t.address}`);
    setSelectedTokens(new Set(keys));
  }, [scanResult]);

  const clearSelection = useCallback(() => {
    setSelectedTokens(new Set());
  }, []);

  // Navigate to consolidate
  const handleConsolidate = useCallback(() => {
    if (!scanResult || selectedTokens.size === 0) return;
    
    const selected = scanResult.tokens.filter(t => 
      selectedTokens.has(`${t.chainId}:${t.address}`)
    );
    
    // Store in session/localStorage and navigate
    sessionStorage.setItem('consolidateTokens', JSON.stringify(selected));
    sessionStorage.setItem('walletAddress', address);
    router.push('/consolidate');
  }, [scanResult, selectedTokens, address, router]);

  // Render based on phase
  return (
    <div className="page safe-top">
      <div className="container py-8">
        {/* Back button */}
        {phase !== 'input' && (
          <button
            onClick={() => {
              setPhase('input');
              setScanResult(null);
              setSelectedTokens(new Set());
            }}
            className="btn btn-ghost mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            New Scan
          </button>
        )}

        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <WalletInputSection
        address={address}
                setAddress={setAddress}
        onScan={handleScan}
                isValid={isValidAddress}
              />
            </motion.div>
          )}

          {phase === 'scanning' && (
            <motion.div
              key="scanning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ScanningProgress currentStep={currentScanStep} />
            </motion.div>
          )}

          {phase === 'results' && scanResult && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1">Scan Results</h1>
                  <p className="text-foreground-secondary">
                    {address.slice(0, 8)}...{address.slice(-6)}
                  </p>
                </div>
                <button onClick={handleScan} className="btn btn-secondary">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>

              {/* Layout: Summary + Tokens */}
              <div className="grid lg:grid-cols-[1fr,320px] gap-6">
                {/* Token List */}
                <div className="space-y-4">
                  <FilterTabs
                    activeFilter={activeFilter}
                    setActiveFilter={setActiveFilter}
                    counts={tierCounts}
                  />

                  {/* Quick actions */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => selectAll()} 
                      className="btn btn-ghost btn-sm"
                    >
                      <Check className="w-4 h-4" />
                      Select Safe
                    </button>
                    <button 
                      onClick={() => selectAll('DUST')} 
                      className="btn btn-ghost btn-sm"
                    >
                      Select Dust
                    </button>
                  </div>

                  {/* Token list */}
                  <div className="space-y-2">
                    <AnimatePresence>
                      {filteredTokens.map((token) => (
                        <TokenCard
                          key={`${token.chainId}:${token.address}`}
                          token={token}
                          isSelected={selectedTokens.has(`${token.chainId}:${token.address}`)}
                          onToggle={() => toggleToken(token)}
                          onViewDetails={() => setDetailToken(token)}
                        />
                      ))}
                    </AnimatePresence>

                    {filteredTokens.length === 0 && (
                      <div className="empty-state py-12">
                        <Search className="empty-state-icon w-12 h-12" />
                        <div className="empty-state-title">No tokens found</div>
                        <div className="empty-state-description">
                          No tokens match the selected filter
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:sticky lg:top-4 space-y-4 h-fit">
                  <SummaryCard 
                    summary={scanResult.summary}
                    selectedCount={selectedTokens.size}
                    selectedValue={selectedValue}
                  />
                </div>
              </div>

              {/* Action Bar */}
              <ActionBar
                selectedCount={selectedTokens.size}
                selectedValue={selectedValue}
                onConsolidate={handleConsolidate}
                onClear={clearSelection}
                disabled={selectedTokens.size === 0}
              />
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="card p-8 max-w-md mx-auto text-center"
            >
              <XCircle className="w-16 h-16 text-danger mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Scan Failed</h2>
              <p className="text-foreground-secondary mb-6">{error}</p>
              <button onClick={() => setPhase('input')} className="btn btn-primary">
                Try Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Token Detail Modal */}
      <AnimatePresence>
        {detailToken && (
          <TokenDetailModal
            token={detailToken}
            onClose={() => setDetailToken(null)}
          />
        )}
      </AnimatePresence>
        </div>
  );
}
