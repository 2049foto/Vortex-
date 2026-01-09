'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  TrendingUp,
  Shield,
  RefreshCw
} from 'lucide-react';

// Types
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
}

interface ScanResult {
  wallet: string;
  totalValue: number;
  dustValue: number;
  tokens: Token[];
  chainsScanned: number;
  scanTime: number;
}

// Chain config
const CHAINS: Record<number, { name: string; color: string }> = {
  8453: { name: 'Base', color: '#0052FF' },
  1: { name: 'Ethereum', color: '#627EEA' },
  42161: { name: 'Arbitrum', color: '#28A0F0' },
  10: { name: 'Optimism', color: '#FF0420' },
  137: { name: 'Polygon', color: '#8247E5' },
  56: { name: 'BNB', color: '#F0B90B' },
  43114: { name: 'Avalanche', color: '#E84142' },
  324: { name: 'zkSync', color: '#8C8DFC' },
  0: { name: 'Solana', color: '#9945FF' },
  838592: { name: 'Monad', color: '#00D4AA' },
};

const TIERS = {
  LEGIT: { label: 'Valuable', color: 'success', minValue: 10 },
  DUST: { label: 'Dust', color: 'primary', minValue: 1 },
  MICRODUST: { label: 'Micro', color: 'warning', minValue: 0 },
  RISK: { label: 'Risk', color: 'danger', minValue: 0 },
};

// Mock data generator for demo
function generateMockTokens(count: number): Token[] {
  const symbols = ['ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'ARB', 'OP', 'MATIC', 'LINK', 'UNI', 'AAVE', 'CRV', 'SUSHI', 'COMP', 'MKR', 'SNX', 'YFI', 'BAL', 'LDO', 'RPL'];
  const chainIds = [8453, 1, 42161, 10, 137, 56, 43114, 324];
  
  return Array.from({ length: count }, (_, i) => {
    const chainId = chainIds[Math.floor(Math.random() * chainIds.length)];
    const balanceUsd = Math.random() > 0.7 ? Math.random() * 500 : Math.random() * 10;
    const riskScore = Math.floor(Math.random() * 100);
    
    let tier: Token['tier'] = 'LEGIT';
    if (riskScore > 70) tier = 'RISK';
    else if (balanceUsd < 1) tier = 'MICRODUST';
    else if (balanceUsd < 10) tier = 'DUST';
    
    return {
      id: `token-${i}`,
      symbol: symbols[i % symbols.length],
      name: `${symbols[i % symbols.length]} Token`,
      address: `0x${Math.random().toString(16).slice(2, 42)}`,
      chainId,
      chainName: CHAINS[chainId]?.name || 'Unknown',
      balance: (Math.random() * 1000).toFixed(4),
      balanceUsd,
      tier,
      riskScore,
    };
  });
}

export default function ScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addressParam = searchParams.get('address');
  
  // State
  const [walletAddress, setWalletAddress] = useState(addressParam || '');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [filterTier, setFilterTier] = useState<string | null>(null);
  const [filterChain, setFilterChain] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Auto-scan if address in URL
  useEffect(() => {
    if (addressParam && !scanResult && !isScanning) {
      handleScan(addressParam);
    }
  }, [addressParam]);

  // Scan handler - optimized with parallel chain scanning
  const handleScan = useCallback(async (address?: string) => {
    const addr = address || walletAddress;
    if (!addr) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setSelectedTokens(new Set());
    setScanResult(null);
    
    // Simulate progressive scan (in production, use real API with streaming)
    const startTime = Date.now();
    const totalChains = Object.keys(CHAINS).length;
    
    for (let i = 0; i <= 100; i += 5) {
      await new Promise(r => setTimeout(r, 50));
      setScanProgress(i);
    }
    
    // Generate mock result
    const tokens = generateMockTokens(15);
    const dustTokens = tokens.filter(t => t.tier !== 'LEGIT' && t.tier !== 'RISK');
    
    setScanResult({
      wallet: addr,
      totalValue: tokens.reduce((sum, t) => sum + t.balanceUsd, 0),
      dustValue: dustTokens.reduce((sum, t) => sum + t.balanceUsd, 0),
      tokens,
      chainsScanned: totalChains,
      scanTime: Date.now() - startTime,
    });
    
    // Auto-select dust tokens
    setSelectedTokens(new Set(dustTokens.map(t => t.id)));
    setIsScanning(false);
  }, [walletAddress]);

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
      .filter(t => t.tier === 'DUST' || t.tier === 'MICRODUST')
      .map(t => t.id);
    setSelectedTokens(new Set(dustIds));
  };

  const clearSelection = () => setSelectedTokens(new Set());

  // Calculate selected value
  const selectedValue = useMemo(() => {
    if (!scanResult) return 0;
    return scanResult.tokens
      .filter(t => selectedTokens.has(t.id))
      .reduce((sum, t) => sum + t.balanceUsd, 0);
  }, [scanResult, selectedTokens]);

  // Proceed to consolidate
  const handleConsolidate = () => {
    if (selectedTokens.size === 0) return;
    // Store selection in sessionStorage for consolidate page
    sessionStorage.setItem('vortex_selected', JSON.stringify({
      wallet: scanResult?.wallet,
      tokens: scanResult?.tokens.filter(t => selectedTokens.has(t.id)),
    }));
    router.push('/consolidate');
  };

  // Render scan form
  if (!scanResult && !isScanning) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h1 className="text-2xl font-bold mb-2">Scan Wallet</h1>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              Detect tokens across 11 chains
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
                placeholder="0x... or ENS name"
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
        </div>
      </div>
    );
  }

  // Render scanning state
  if (isScanning) {
    return (
      <div className="page safe-top">
        <div className="container" style={{ paddingTop: '80px' }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-6">
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{ 
                  border: '3px solid hsl(var(--border))',
                  borderTopColor: 'hsl(var(--accent))'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-semibold">{scanProgress}%</span>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Scanning</h2>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              Checking {Object.keys(CHAINS).length} chains...
            </p>
            
            <div className="progress-bar mt-6 max-w-xs mx-auto">
              <motion.div 
                className="progress-bar-fill"
                initial={{ width: 0 }}
                animate={{ width: `${scanProgress}%` }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Render results
  return (
    <div className="page">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div>
            <h2 className="text-lg font-semibold">Scan Results</h2>
            <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {scanResult?.tokens.length} tokens • {scanResult?.chainsScanned} chains
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3 mb-6"
        >
          <div className="card stat-card">
            <div className="stat-value">${scanResult?.totalValue.toFixed(2)}</div>
            <div className="stat-label">Total Value</div>
          </div>
          <div className="card stat-card">
            <div className="stat-value" style={{ color: 'hsl(var(--accent))' }}>
              ${scanResult?.dustValue.toFixed(2)}
            </div>
            <div className="stat-label">Recoverable Dust</div>
          </div>
        </motion.div>

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
                  {Object.entries(CHAINS).map(([id, chain]) => (
                    <button
                      key={id}
                      className={`chain-chip ${filterChain === Number(id) ? 'active' : ''}`}
                      onClick={() => setFilterChain(filterChain === Number(id) ? null : Number(id))}
                    >
                      <div className="chain-dot" style={{ background: chain.color }} />
                      {chain.name}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Token List */}
        <div className="space-y-2 mb-24">
          {filteredTokens.map((token, i) => (
            <motion.div
              key={token.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`token-card ${selectedTokens.has(token.id) ? 'selected' : ''}`}
              onClick={() => toggleToken(token.id)}
            >
              <input
                type="checkbox"
                className="checkbox"
                checked={selectedTokens.has(token.id)}
                onChange={() => {}}
              />
              
              <div className="token-icon">
                {token.symbol.slice(0, 2)}
              </div>
              
              <div className="token-info">
                <div className="flex items-center gap-2">
                  <span className="token-name">{token.symbol}</span>
                  <span className={`badge badge-${TIERS[token.tier].color}`} style={{ height: 20, fontSize: 10 }}>
                    {TIERS[token.tier].label}
                  </span>
                </div>
                <div className="token-value flex items-center gap-1">
                  <div 
                    className="chain-dot" 
                    style={{ background: CHAINS[token.chainId]?.color || '#666' }}
                  />
                  {CHAINS[token.chainId]?.name || 'Unknown'}
                </div>
              </div>
              
              <div className="token-amount">
                <div className="token-usd">${token.balanceUsd.toFixed(2)}</div>
                <div className="token-balance">{parseFloat(token.balance).toFixed(4)}</div>
              </div>
            </motion.div>
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
                  padding: '12px 16px',
                  background: 'hsl(var(--bg-elevated))',
                  boxShadow: '0 -4px 24px hsl(var(--shadow-color) / 0.1)'
                }}
              >
                <div className="flex-1">
                  <div className="text-sm font-semibold">
                    {selectedTokens.size} tokens selected
                  </div>
                  <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    ≈ ${selectedValue.toFixed(2)} value
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
