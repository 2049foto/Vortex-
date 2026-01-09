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

const CHAINS: Record<number, { name: string; color: string; icon: string }> = {
  8453: { name: 'Base', color: '#0052FF', icon: '🔵' },
  1: { name: 'Ethereum', color: '#627EEA', icon: '⟠' },
  42161: { name: 'Arbitrum', color: '#28A0F0', icon: '🔷' },
  10: { name: 'Optimism', color: '#FF0420', icon: '🔴' },
  137: { name: 'Polygon', color: '#8247E5', icon: '💜' },
  56: { name: 'BNB', color: '#F0B90B', icon: '🟡' },
  43114: { name: 'Avalanche', color: '#E84142', icon: '🔺' },
  324: { name: 'zkSync', color: '#8C8DFC', icon: '⬡' },
  0: { name: 'Solana', color: '#9945FF', icon: '◎' },
  838592: { name: 'Monad', color: '#00D4AA', icon: '🟢' },
};

const TIERS = {
  LEGIT: { label: 'Valuable', color: 'success', description: 'Safe to hold' },
  DUST: { label: 'Dust', color: 'primary', description: 'Small value, consolidate' },
  MICRODUST: { label: 'Micro', color: 'warning', description: 'Very small value' },
  RISK: { label: 'Risk', color: 'danger', description: 'Potential security risk' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// API INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

async function scanWalletAPI(walletAddress: string): Promise<ScanResult> {
  const response = await fetch('/api/v1/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      chainIds: [8453, 1, 42161, 10, 137, 56, 43114, 324, 838592],
      includeSolana: false,
    }),
  });

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
    logo: t.logoUrl,
    tier: t.tier || 'DUST',
    riskScore: t.riskScore || 0,
    reasons: t.reasons || [],
  }));

  const dustTokens = tokens.filter(t => t.tier === 'DUST' || t.tier === 'MICRODUST');
  const summary = data.data?.summary || { byTier: { LEGIT: 0, DUST: 0, MICRODUST: 0, RISK: 0 } };

  return {
    wallet: walletAddress,
    totalValue: tokens.reduce((sum, t) => sum + t.balanceUsd, 0),
    dustValue: dustTokens.reduce((sum, t) => sum + t.balanceUsd, 0),
    tokens,
    chainsScanned: Object.keys(CHAINS).length,
    scanTime: 0,
    summary,
  };
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
  index 
}: { 
  token: Token; 
  selected: boolean; 
  onToggle: () => void;
  index: number;
}) {
  const tierConfig = TIERS[token.tier];
  const chainConfig = CHAINS[token.chainId];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
      className={`token-card ${selected ? 'selected' : ''}`}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        className="checkbox"
        checked={selected}
        onChange={() => {}}
      />
      
      {/* Token Icon */}
      <div 
        className="token-icon"
        style={token.logo ? { 
          backgroundImage: `url(${token.logo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {!token.logo && token.symbol.slice(0, 2)}
      </div>
      
      {/* Token Info */}
      <div className="token-info">
        <div className="flex items-center gap-2">
          <span className="token-name">{token.symbol}</span>
          <span 
            className={`badge badge-${tierConfig.color}`} 
            style={{ height: 20, fontSize: 10 }}
          >
            {tierConfig.label}
          </span>
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
        </div>
      </div>
      
      {/* Amount */}
      <div className="token-amount">
        <div className="token-usd">
          ${token.balanceUsd < 0.01 ? '<0.01' : token.balanceUsd.toFixed(2)}
        </div>
        <div className="token-balance">
          {parseFloat(token.balance).toFixed(4)}
        </div>
      </div>
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
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [filterChain, setFilterChain] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
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
    const chainNames = Object.values(CHAINS).map(c => c.name);
    
    // Progress animation
    let progress = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 12, 92);
      setScanProgress(Math.floor(progress));
      
      // Show random chain being scanned
      const randomChain = chainNames[Math.floor(Math.random() * chainNames.length)];
      setCurrentChain(randomChain);
    }, 300);

    try {
      const result = await scanWalletAPI(addr);
      
      clearInterval(progressInterval);
      setScanProgress(100);
      setCurrentChain(undefined);
      
      result.scanTime = Date.now() - startTime;
      setScanResult(result);
      
      // Auto-select consolidatable tokens (DUST + MICRODUST, not RISK)
      const consolidatable = result.tokens.filter(
        t => (t.tier === 'DUST' || t.tier === 'MICRODUST') && t.riskScore < 70
      );
      setSelectedTokens(new Set(consolidatable.map(t => t.id)));
      
      if (result.tokens.length > 0) {
        toastSuccess(
          'Scan Complete',
          `Found ${result.tokens.length} tokens across ${result.chainsScanned} chains`
        );
      }
      
    } catch (error) {
      clearInterval(progressInterval);
      setScanProgress(0);
      setCurrentChain(undefined);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setScanError(errorMessage);
      toastError('Scan Failed', errorMessage);
      
    } finally {
      setIsScanning(false);
    }
  }, [walletAddress, toastError, toastSuccess]);

  // Filter tokens
  const filteredTokens = useMemo(() => {
    if (!scanResult) return [];
    return scanResult.tokens.filter(token => {
      if (filterTier && token.tier !== filterTier) return false;
      if (filterChain && token.chainId !== filterChain) return false;
      return true;
    });
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

  const selectAllDust = () => {
    if (!scanResult) return;
    const dustIds = scanResult.tokens
      .filter(t => (t.tier === 'DUST' || t.tier === 'MICRODUST') && t.riskScore < 70)
      .map(t => t.id);
    setSelectedTokens(new Set(dustIds));
  };

  const clearSelection = () => setSelectedTokens(new Set());

  const selectedValue = useMemo(() => {
    if (!scanResult) return 0;
    return scanResult.tokens
      .filter(t => selectedTokens.has(t.id))
      .reduce((sum, t) => sum + t.balanceUsd, 0);
  }, [scanResult, selectedTokens]);

  // Proceed to consolidate
  const handleConsolidate = () => {
    if (selectedTokens.size === 0) return;
    
    const tokensToConsolidate = scanResult?.tokens.filter(t => selectedTokens.has(t.id)) || [];
    
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="wallet-input-hero"
          >
            <div className="input-group">
              <Search className="input-icon w-5 h-5" />
              <input
                type="text"
                className="input input-with-icon input-wallet"
                placeholder="0x... or name.eth"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
              <button
                className="btn btn-primary"
                onClick={() => handleScan()}
                disabled={!walletAddress}
              >
                Scan
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
          
          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3 mt-8"
          >
            {[
              { icon: <Zap className="w-4 h-4" />, label: 'Fast Scan', desc: '< 10 seconds' },
              { icon: <Shield className="w-4 h-4" />, label: '20 Layers', desc: 'Risk analysis' },
              { icon: <TrendingUp className="w-4 h-4" />, label: '10 Chains', desc: 'Parallel scan' },
            ].map((feature, i) => (
              <div 
                key={i}
                className="card text-center"
                style={{ padding: '16px 12px' }}
              >
                <div 
                  className="w-8 h-8 mx-auto mb-2 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' }}
                >
                  {feature.icon}
                </div>
                <div className="text-xs font-medium">{feature.label}</div>
                <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
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
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '16px' }}>
        {/* Summary */}
        {scanResult && <ResultsSummary result={scanResult} />}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-4"
        >
          <button 
            className="btn btn-secondary btn-sm flex-1"
            onClick={selectAllDust}
          >
            <Sparkles className="w-4 h-4" />
            Select All Dust
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
            className="btn btn-ghost btn-sm btn-icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" />
          </button>
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
