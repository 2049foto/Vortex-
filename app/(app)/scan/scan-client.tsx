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
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  Shield,
  RefreshCw,
  AlertCircle,
  Zap,
  Flame,
  Eye,
  Wallet,
  Globe,
  ArrowUpRight,
  Check,
  X,
  Info,
  TrendingUp,
  DollarSign,
  Layers
} from 'lucide-react';
import { useToast } from '../../providers';
import { WalletConnectButton } from '@/components/WalletConnectButton';
import { 
  analyzeAllTokens, 
  getSmartSelection,
  getBurnSelection,
  type SwapAnalysis,
  type SwapSummary,
  THRESHOLDS 
} from '@/lib/swapAnalyzer';

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
// CHAIN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const EVM_CHAINS: Record<number, { name: string; color: string; icon: string; gasLevel: 'low' | 'medium' | 'high' }> = {
  8453: { name: 'Base', color: '#0052FF', icon: '🔵', gasLevel: 'low' },
  1: { name: 'Ethereum', color: '#627EEA', icon: '⟠', gasLevel: 'high' },
  42161: { name: 'Arbitrum', color: '#28A0F0', icon: '🔷', gasLevel: 'low' },
  10: { name: 'Optimism', color: '#FF0420', icon: '🔴', gasLevel: 'low' },
  137: { name: 'Polygon', color: '#8247E5', icon: '💜', gasLevel: 'low' },
  56: { name: 'BNB', color: '#F0B90B', icon: '🟡', gasLevel: 'low' },
  43114: { name: 'Avalanche', color: '#E84142', icon: '🔺', gasLevel: 'medium' },
  324: { name: 'zkSync', color: '#8C8DFC', icon: '⬡', gasLevel: 'low' },
};

const SOLANA_CHAIN = { chainId: 0, name: 'Solana', color: '#9945FF', icon: '◎', gasLevel: 'low' as const };

// Known token logos
const KNOWN_LOGOS: Record<string, string> = {
  'ETH': 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  'WETH': 'https://assets.coingecko.com/coins/images/2518/small/weth.png',
  'USDC': 'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  'USDT': 'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  'DAI': 'https://assets.coingecko.com/coins/images/9956/small/Badge_Dai.png',
  'MATIC': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'POL': 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  'BNB': 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  'AVAX': 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  'LINK': 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  'UNI': 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg',
  'ARB': 'https://assets.coingecko.com/coins/images/16547/small/photo_2023-03-29_21.47.00.jpeg',
  'OP': 'https://assets.coingecko.com/coins/images/25244/small/Optimism.png',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ScanClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address: connectedAddress, isConnected } = useAccount();
  const { error: toastError, success: toastSuccess, info: toastInfo } = useToast();
  
  // State
  const [step, setStep] = useState<'input' | 'scanning' | 'review'>('input');
  const [walletAddress, setWalletAddress] = useState(searchParams.get('address') || '');
  const [scanProgress, setScanProgress] = useState(0);
  const [currentChain, setCurrentChain] = useState<string>();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // Chain selection
  const [selectedChains, setSelectedChains] = useState<Set<number>>(new Set(Object.keys(EVM_CHAINS).map(Number)));
  const [includeSolana, setIncludeSolana] = useState(false);
  
  // Token selection & analysis
  const [selectedTokens, setSelectedTokens] = useState<Set<string>>(new Set());
  const [burnTokens, setBurnTokens] = useState<Set<string>>(new Set());
  const [outputToken, setOutputToken] = useState<'ETH' | 'USDC'>('ETH');
  const [tokenAnalyses, setTokenAnalyses] = useState<Map<string, SwapAnalysis>>(new Map());
  const [swapSummary, setSwapSummary] = useState<SwapSummary | null>(null);
  
  // View state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['swappable', 'burnable']));
  const [showChainDetails, setShowChainDetails] = useState(false);

  // Auto-fill connected wallet
  useEffect(() => {
    if (isConnected && connectedAddress && !walletAddress) {
      setWalletAddress(connectedAddress);
    }
  }, [isConnected, connectedAddress, walletAddress]);

  // Analyze tokens when scan result changes
  useEffect(() => {
    if (scanResult?.tokens) {
      const { analyses, summary } = analyzeAllTokens(scanResult.tokens, outputToken);
      setTokenAnalyses(analyses);
      setSwapSummary(summary);
      
      // Auto-select swappable tokens
      const smartSelection = getSmartSelection(scanResult.tokens, outputToken);
      setSelectedTokens(smartSelection);
      
      // Auto-select burnable tokens
      const burnSelection = getBurnSelection(scanResult.tokens, outputToken);
      setBurnTokens(burnSelection);
    }
  }, [scanResult, outputToken]);

  // Scan handler
  const handleScan = useCallback(async () => {
    if (!walletAddress) {
      toastError('Enter a wallet address', 'Please enter a valid wallet or ENS name');
      return;
    }
    
    const isValidEth = /^0x[a-fA-F0-9]{40}$/.test(walletAddress);
    const isValidENS = /^[a-zA-Z0-9-]+\.(eth|base\.eth)$/.test(walletAddress);
    
    if (!isValidEth && !isValidENS) {
      toastError('Invalid address', 'Please enter a valid wallet address or ENS name');
      return;
    }
    
    setStep('scanning');
    setScanProgress(0);
    setScanError(null);
    
    const chainNames = Array.from(selectedChains).map(id => EVM_CHAINS[id]?.name || 'Unknown');
    if (includeSolana) chainNames.push('Solana');
    
    // Progress animation
    let progress = 0;
    let chainIndex = 0;
    const progressInterval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 8, 95);
      setScanProgress(Math.floor(progress));
      
      if (Math.random() > 0.7 && chainIndex < chainNames.length) {
        setCurrentChain(chainNames[chainIndex]);
        chainIndex++;
      }
    }, 200);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch('/api/v1/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          chainIds: Array.from(selectedChains),
          includeSolana,
        }),
        signal: controller.signal,
      });
      
      clearTimeout(timeout);
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Scan failed');
      }
      
      const result = await response.json();
      setScanProgress(100);
      setScanResult(result.data);
      
      setTimeout(() => {
        setStep('review');
        toastSuccess('Scan Complete', `Found ${result.data.tokens.length} tokens across ${result.data.chainsScanned} chains`);
      }, 500);
      
    } catch (error) {
      clearInterval(progressInterval);
      const message = error instanceof Error ? error.message : 'Unknown error';
      setScanError(message);
      setStep('input');
      toastError('Scan Failed', message);
    }
  }, [walletAddress, selectedChains, includeSolana, toastError, toastSuccess]);

  // Toggle chain selection
  const toggleChain = (chainId: number) => {
    setSelectedChains(prev => {
      const next = new Set(prev);
      if (next.has(chainId)) {
        next.delete(chainId);
        if (next.size === 0) next.add(8453); // At least Base
      } else {
        next.add(chainId);
      }
      return next;
    });
  };

  // Select all/none chains
  const selectAllChains = () => {
    setSelectedChains(new Set(Object.keys(EVM_CHAINS).map(Number)));
    setIncludeSolana(true);
  };
  
  const selectBaseOnly = () => {
    setSelectedChains(new Set([8453]));
    setIncludeSolana(false);
  };

  // Toggle section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Toggle token selection
  const toggleToken = (tokenId: string) => {
    setSelectedTokens(prev => {
      const next = new Set(prev);
      if (next.has(tokenId)) next.delete(tokenId);
      else next.add(tokenId);
      return next;
    });
  };

  // Calculate totals
  const selectedTotal = useMemo(() => {
    if (!swapSummary) return { value: 0, gas: 0, net: 0 };
    let value = 0, gas = 0;
    for (const token of swapSummary.swappableTokens) {
      if (selectedTokens.has(token.id)) {
        const analysis = tokenAnalyses.get(token.id);
        if (analysis) {
          value += analysis.estimatedOutput;
          gas += analysis.estimatedGasCost;
        }
      }
    }
    return { value, gas, net: value - gas };
  }, [swapSummary, selectedTokens, tokenAnalyses]);

  // Proceed to consolidate
  const handleConsolidate = () => {
    if (selectedTokens.size === 0) {
      toastError('No tokens selected', 'Please select at least one token to consolidate');
      return;
    }
    
    const tokensToConsolidate = scanResult?.tokens
      .filter(t => selectedTokens.has(t.id))
      .map(t => ({
        ...t,
        amountPct: 100,
        swapBalance: t.balance,
        swapBalanceUsd: t.balanceUsd,
      })) || [];
    
    sessionStorage.setItem('vortex_consolidation', JSON.stringify({
      wallet: scanResult?.wallet,
      tokens: tokensToConsolidate,
      totalValue: selectedTotal.value,
      outputToken,
    }));
    
    router.push('/consolidate');
  };

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Input Step
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (step === 'input') {
    return (
      <div className="min-h-[100dvh] relative overflow-hidden" style={{ background: 'linear-gradient(180deg, hsl(var(--bg-primary)) 0%, hsl(var(--bg-secondary)) 100%)' }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, hsl(var(--accent) / 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 50%, hsl(var(--accent-2) / 0.1) 0%, transparent 50%)`
        }} />
        
        <div className="relative z-10 container max-w-lg mx-auto px-4 pt-12 pb-24">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center relative"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))',
                boxShadow: '0 20px 40px hsl(var(--accent) / 0.3)'
              }}
            >
              <Search className="w-10 h-10 text-white" />
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute inset-0 rounded-3xl"
                style={{ background: 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' }}
              />
            </motion.div>
            
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--accent-2))] bg-clip-text text-transparent">
              Portfolio Scanner
            </h1>
            <p className="text-base" style={{ color: 'hsl(var(--text-secondary))' }}>
              Scan {selectedChains.size + (includeSolana ? 1 : 0)} chains • Smart dust detection • AI-powered analysis
            </p>
          </motion.div>

          {/* Wallet Connect Section */}
          {!isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <WalletConnectButton variant="page" />
              
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--border)), transparent)' }} />
                <span className="text-sm font-medium" style={{ color: 'hsl(var(--text-tertiary))' }}>or scan any address</span>
                <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, hsl(var(--border)), transparent)' }} />
              </div>
            </motion.div>
          )}

          {/* Wallet Input Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl p-5 mb-4"
            style={{ 
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {isConnected && (
              <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'hsl(var(--success-light))' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'hsl(var(--success))' }}>
                  <Check className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: 'hsl(var(--success))' }}>Wallet Connected</div>
                  <div className="text-xs font-mono" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    {connectedAddress?.slice(0, 10)}...{connectedAddress?.slice(-8)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="relative">
              <Wallet 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: 'hsl(var(--text-tertiary))' }}
              />
              <input
                type="text"
                className="w-full h-14 pl-12 pr-4 rounded-xl text-base font-medium transition-all"
                style={{ 
                  background: 'hsl(var(--bg-tertiary))',
                  border: '2px solid hsl(var(--border))',
                  color: 'hsl(var(--text-primary))'
                }}
                placeholder={isConnected ? 'Using connected wallet...' : '0x... or name.eth'}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              />
            </div>
          </motion.div>

          {/* Chain Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl overflow-hidden mb-6"
            style={{ 
              background: 'hsl(var(--bg-elevated))',
              border: '1px solid hsl(var(--border))',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid hsl(var(--border))' }}>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, hsl(var(--accent-light)), hsl(var(--accent-2-light)))' }}
                >
                  <Globe className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
                </div>
                <div>
                  <div className="font-semibold">Chains to Scan</div>
                  <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    {selectedChains.size} EVM + {includeSolana ? '1 Solana' : '0 Solana'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowChainDetails(!showChainDetails)}
                className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{ color: 'hsl(var(--accent))', background: 'hsl(var(--accent-light))' }}
              >
                {showChainDetails ? 'Hide' : 'Customize'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showChainDetails ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 p-3" style={{ background: 'hsl(var(--bg-tertiary))' }}>
              <button
                onClick={selectAllChains}
                className="py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{ 
                  background: selectedChains.size === 8 && includeSolana ? 'hsl(var(--accent))' : 'hsl(var(--bg-elevated))',
                  color: selectedChains.size === 8 && includeSolana ? 'white' : 'hsl(var(--text-primary))',
                  boxShadow: selectedChains.size === 8 && includeSolana ? 'var(--shadow-md)' : 'none'
                }}
              >
                <Layers className="w-4 h-4" />
                All 11 Chains
              </button>
              <button
                onClick={selectBaseOnly}
                className="py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2"
                style={{ 
                  background: selectedChains.size === 1 && !includeSolana ? 'hsl(var(--accent))' : 'hsl(var(--bg-elevated))',
                  color: selectedChains.size === 1 && !includeSolana ? 'white' : 'hsl(var(--text-primary))',
                  boxShadow: selectedChains.size === 1 && !includeSolana ? 'var(--shadow-md)' : 'none'
                }}
              >
                🔵 Base Only
              </button>
            </div>

            {/* Detailed Chain Selection */}
            <AnimatePresence>
              {showChainDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 grid grid-cols-3 gap-2">
                    {Object.entries(EVM_CHAINS).map(([id, chain]) => {
                      const chainId = parseInt(id);
                      const isSelected = selectedChains.has(chainId);
                      return (
                        <motion.button
                          key={id}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleChain(chainId)}
                          className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all relative"
                          style={{ 
                            background: isSelected ? `${chain.color}15` : 'hsl(var(--bg-tertiary))',
                            border: `2px solid ${isSelected ? chain.color : 'transparent'}`,
                          }}
                        >
                          <span className="text-xl">{chain.icon}</span>
                          <span className="text-xs font-medium" style={{ color: isSelected ? chain.color : 'hsl(var(--text-secondary))' }}>
                            {chain.name}
                          </span>
                          {chain.gasLevel === 'high' && (
                            <span className="absolute top-1 right-1 text-[9px] px-1 rounded" style={{ background: 'hsl(var(--warning-light))', color: 'hsl(var(--warning))' }}>
                              $$
                            </span>
                          )}
                          {isSelected && (
                            <CheckCircle className="absolute top-1 left-1 w-4 h-4" style={{ color: chain.color }} />
                          )}
                        </motion.button>
                      );
                    })}
                    
                    {/* Solana */}
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setIncludeSolana(!includeSolana)}
                      className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all relative"
                      style={{ 
                        background: includeSolana ? `${SOLANA_CHAIN.color}15` : 'hsl(var(--bg-tertiary))',
                        border: `2px solid ${includeSolana ? SOLANA_CHAIN.color : 'transparent'}`,
                      }}
                    >
                      <span className="text-xl">{SOLANA_CHAIN.icon}</span>
                      <span className="text-xs font-medium" style={{ color: includeSolana ? SOLANA_CHAIN.color : 'hsl(var(--text-secondary))' }}>
                        Solana
                      </span>
                      <span className="absolute top-1 right-1 text-[8px] px-1 rounded" style={{ background: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' }}>
                        Non-EVM
                      </span>
                      {includeSolana && (
                        <CheckCircle className="absolute top-1 left-1 w-4 h-4" style={{ color: SOLANA_CHAIN.color }} />
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Scan Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleScan}
            disabled={!walletAddress}
            className="w-full h-16 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
            style={{
              background: walletAddress 
                ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' 
                : 'hsl(var(--bg-tertiary))',
              color: walletAddress ? 'white' : 'hsl(var(--text-tertiary))',
              boxShadow: walletAddress ? '0 10px 30px hsl(var(--accent) / 0.4)' : 'none',
              opacity: walletAddress ? 1 : 0.6,
            }}
          >
            <Search className="w-6 h-6" />
            Scan {selectedChains.size + (includeSolana ? 1 : 0)} Chains
            <ArrowRight className="w-6 h-6" />
          </motion.button>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-3 mt-8"
          >
            {[
              { icon: Zap, label: 'Fast Scan', value: '<10s', color: 'var(--accent)' },
              { icon: Shield, label: '20-Layer', value: 'Security', color: 'var(--success)' },
              { icon: Sparkles, label: 'Smart AI', value: 'Selection', color: 'var(--accent-2)' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="text-center p-4 rounded-2xl"
                style={{ background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border))' }}
              >
                <div 
                  className="w-10 h-10 mx-auto mb-2 rounded-xl flex items-center justify-center"
                  style={{ background: `hsl(${feature.color} / 0.15)` }}
                >
                  <feature.icon className="w-5 h-5" style={{ color: `hsl(${feature.color})` }} />
                </div>
                <div className="text-xs font-bold">{feature.value}</div>
                <div className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>{feature.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Scanning Step
  // ═══════════════════════════════════════════════════════════════════════════════
  
  if (step === 'scanning') {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: 'hsl(var(--bg-primary))' }}>
        <div className="text-center px-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 mx-auto mb-8 rounded-full relative"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent-light)), hsl(var(--accent-2-light)))' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-2 rounded-full"
              style={{ 
                border: '4px solid transparent',
                borderTopColor: 'hsl(var(--accent))',
                borderRightColor: 'hsl(var(--accent-2))',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: 'hsl(var(--accent))' }}>
                {scanProgress}%
              </span>
            </div>
          </motion.div>
          
          <h2 className="text-2xl font-bold mb-2">Scanning Portfolio</h2>
          <p className="text-sm mb-6" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {currentChain ? `Analyzing ${currentChain}...` : 'Connecting to networks...'}
          </p>
          
          {/* Chain Progress */}
          <div className="flex justify-center gap-2 flex-wrap max-w-sm mx-auto">
            {Array.from(selectedChains).map(chainId => {
              const chain = EVM_CHAINS[chainId];
              const isActive = currentChain === chain?.name;
              return (
                <motion.div
                  key={chainId}
                  animate={isActive ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.5, repeat: isActive ? Infinity : 0 }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ 
                    background: isActive ? `${chain?.color}20` : 'hsl(var(--bg-tertiary))',
                    border: isActive ? `2px solid ${chain?.color}` : 'none'
                  }}
                >
                  {chain?.icon}
                </motion.div>
              );
            })}
            {includeSolana && (
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ background: currentChain === 'Solana' ? `${SOLANA_CHAIN.color}20` : 'hsl(var(--bg-tertiary))' }}
              >
                {SOLANA_CHAIN.icon}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════════
  // RENDER: Review Step
  // ═══════════════════════════════════════════════════════════════════════════════
  
  return (
    <div className="min-h-[100dvh] pb-40" style={{ background: 'hsl(var(--bg-secondary))' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-20 px-4 py-3"
        style={{ 
          background: 'hsl(var(--bg-elevated) / 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid hsl(var(--border))'
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Review & Consolidate</h1>
            <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
              {scanResult?.tokens.length} tokens found • Smart selection applied
            </p>
          </div>
          <button 
            onClick={() => setStep('input')}
            className="p-2 rounded-lg transition-all"
            style={{ background: 'hsl(var(--bg-tertiary))' }}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="container max-w-lg mx-auto px-4 py-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div 
            className="p-4 rounded-2xl"
            style={{ background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border))' }}
          >
            <div className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--text-tertiary))' }}>
              Portfolio Value
            </div>
            <div className="text-2xl font-bold">${scanResult?.totalValue.toFixed(2)}</div>
          </div>
          <div 
            className="p-4 rounded-2xl"
            style={{ background: 'linear-gradient(135deg, hsl(var(--accent-light)), hsl(var(--accent-2-light)))', border: '1px solid hsl(var(--accent) / 0.2)' }}
          >
            <div className="text-xs font-medium mb-1" style={{ color: 'hsl(var(--accent))' }}>
              Recoverable
            </div>
            <div className="text-2xl font-bold" style={{ color: 'hsl(var(--accent))' }}>
              ${swapSummary?.estimatedNetGain.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Output Token Selection */}
        <div 
          className="flex items-center gap-2 p-3 rounded-xl mb-4"
          style={{ background: 'hsl(var(--bg-elevated))', border: '1px solid hsl(var(--border))' }}
        >
          <span className="text-sm font-medium flex-1">Swap all to:</span>
          <div className="flex gap-2">
            {(['ETH', 'USDC'] as const).map(token => (
              <button
                key={token}
                onClick={() => setOutputToken(token)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: outputToken === token ? 'hsl(var(--accent))' : 'hsl(var(--bg-tertiary))',
                  color: outputToken === token ? 'white' : 'hsl(var(--text-primary))',
                }}
              >
                {token === 'ETH' ? '⟠' : '💵'} {token}
              </button>
            ))}
          </div>
        </div>

        {/* Smart Analysis Info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl mb-4"
          style={{ 
            background: 'linear-gradient(135deg, hsl(var(--success-light)), hsl(var(--bg-elevated)))',
            border: '1px solid hsl(var(--success) / 0.2)'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'hsl(var(--success))' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="font-semibold text-sm mb-1">Smart Selection Applied</div>
              <div className="text-xs" style={{ color: 'hsl(var(--text-secondary))' }}>
                {swapSummary?.totalSwappable} tokens can be profitably swapped. 
                {swapSummary?.totalSkipped ? ` ${swapSummary.totalSkipped} skipped (gas > value).` : ''}
                {swapSummary?.totalBurnable ? ` ${swapSummary.totalBurnable} recommended for burning.` : ''}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Swappable Tokens Section */}
        {swapSummary && swapSummary.swappableTokens.length > 0 && (
          <TokenSection
            title="Swappable Tokens"
            subtitle={`${swapSummary.swappableTokens.length} tokens • Est. +$${swapSummary.estimatedNetGain.toFixed(2)} net`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="var(--success)"
            expanded={expandedSections.has('swappable')}
            onToggle={() => toggleSection('swappable')}
            tokens={swapSummary.swappableTokens}
            selectedTokens={selectedTokens}
            tokenAnalyses={tokenAnalyses}
            onToggleToken={toggleToken}
            onSelectAll={() => {
              const all = new Set(selectedTokens);
              swapSummary.swappableTokens.forEach(t => all.add(t.id));
              setSelectedTokens(all);
            }}
            onDeselectAll={() => {
              const next = new Set(selectedTokens);
              swapSummary.swappableTokens.forEach(t => next.delete(t.id));
              setSelectedTokens(next);
            }}
          />
        )}

        {/* Burnable Tokens Section */}
        {swapSummary && swapSummary.burnableTokens.length > 0 && (
          <TokenSection
            title="Burn for Carbon Credits"
            subtitle={`${swapSummary.burnableTokens.length} micro-dust tokens`}
            icon={<Flame className="w-5 h-5" />}
            color="var(--warning)"
            expanded={expandedSections.has('burnable')}
            onToggle={() => toggleSection('burnable')}
            tokens={swapSummary.burnableTokens}
            selectedTokens={burnTokens}
            tokenAnalyses={tokenAnalyses}
            onToggleToken={(id) => {
              setBurnTokens(prev => {
                const next = new Set(prev);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              });
            }}
            isBurnSection
          />
        )}

        {/* Skipped Tokens Section */}
        {swapSummary && swapSummary.skippedTokens.length > 0 && (
          <TokenSection
            title="Skipped (Not Profitable)"
            subtitle={`${swapSummary.skippedTokens.length} tokens • Gas > Value`}
            icon={<X className="w-5 h-5" />}
            color="var(--text-tertiary)"
            expanded={expandedSections.has('skipped')}
            onToggle={() => toggleSection('skipped')}
            tokens={swapSummary.skippedTokens}
            selectedTokens={new Set()}
            tokenAnalyses={tokenAnalyses}
            onToggleToken={() => {}}
            isDisabled
          />
        )}

        {/* Hold Tokens Section */}
        {swapSummary && swapSummary.holdTokens.length > 0 && (
          <TokenSection
            title="Valuable (Consider Holding)"
            subtitle={`${swapSummary.holdTokens.length} tokens`}
            icon={<Eye className="w-5 h-5" />}
            color="var(--accent)"
            expanded={expandedSections.has('hold')}
            onToggle={() => toggleSection('hold')}
            tokens={swapSummary.holdTokens}
            selectedTokens={new Set()}
            tokenAnalyses={tokenAnalyses}
            onToggleToken={() => {}}
            isDisabled
          />
        )}
      </div>

      {/* Bottom Action Bar */}
      <div 
        className="fixed bottom-0 left-0 right-0 p-4 z-30"
        style={{ 
          background: 'hsl(var(--bg-elevated) / 0.98)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid hsl(var(--border))',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom))'
        }}
      >
        <div className="container max-w-lg mx-auto">
          {/* Summary */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div>
              <span style={{ color: 'hsl(var(--text-tertiary))' }}>Selected: </span>
              <span className="font-semibold">{selectedTokens.size} tokens</span>
            </div>
            <div className="text-right">
              <span style={{ color: 'hsl(var(--text-tertiary))' }}>Est. output: </span>
              <span className="font-bold" style={{ color: 'hsl(var(--success))' }}>
                ${selectedTotal.net.toFixed(2)}
              </span>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3">
            {burnTokens.size > 0 && (
              <button
                className="flex-1 h-14 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                style={{ 
                  background: 'hsl(var(--warning-light))',
                  color: 'hsl(var(--warning))',
                  border: '1px solid hsl(var(--warning) / 0.2)'
                }}
              >
                <Flame className="w-5 h-5" />
                Burn {burnTokens.size}
              </button>
            )}
            <button
              onClick={handleConsolidate}
              disabled={selectedTokens.size === 0}
              className="flex-[2] h-14 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-all"
              style={{
                background: selectedTokens.size > 0 
                  ? 'linear-gradient(135deg, hsl(var(--accent)), hsl(var(--accent-2)))' 
                  : 'hsl(var(--bg-tertiary))',
                color: selectedTokens.size > 0 ? 'white' : 'hsl(var(--text-tertiary))',
                boxShadow: selectedTokens.size > 0 ? '0 8px 24px hsl(var(--accent) / 0.4)' : 'none',
                opacity: selectedTokens.size > 0 ? 1 : 0.6,
              }}
            >
              <ArrowUpRight className="w-5 h-5" />
              Consolidate to {outputToken}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN SECTION COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TokenSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  tokens: Token[];
  selectedTokens: Set<string>;
  tokenAnalyses: Map<string, SwapAnalysis>;
  onToggleToken: (id: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  isBurnSection?: boolean;
  isDisabled?: boolean;
}

function TokenSection({
  title,
  subtitle,
  icon,
  color,
  expanded,
  onToggle,
  tokens,
  selectedTokens,
  tokenAnalyses,
  onToggleToken,
  onSelectAll,
  onDeselectAll,
  isBurnSection,
  isDisabled,
}: TokenSectionProps) {
  const selectedCount = tokens.filter(t => selectedTokens.has(t.id)).length;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden mb-3"
      style={{ 
        background: 'hsl(var(--bg-elevated))',
        border: '1px solid hsl(var(--border))'
      }}
    >
      {/* Section Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 transition-all hover:bg-[hsl(var(--bg-tertiary))]"
      >
        <div 
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `hsl(${color} / 0.15)`, color: `hsl(${color})` }}
        >
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className="font-semibold text-sm flex items-center gap-2">
            {title}
            {selectedCount > 0 && !isDisabled && (
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: `hsl(${color} / 0.15)`, color: `hsl(${color})` }}
              >
                {selectedCount}/{tokens.length}
              </span>
            )}
          </div>
          <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>{subtitle}</div>
        </div>
        <ChevronRight 
          className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
          style={{ color: 'hsl(var(--text-tertiary))' }}
        />
      </button>

      {/* Section Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            {/* Quick Actions */}
            {onSelectAll && onDeselectAll && !isDisabled && (
              <div 
                className="flex items-center gap-2 px-4 py-2 text-xs"
                style={{ background: 'hsl(var(--bg-tertiary))', borderTop: '1px solid hsl(var(--border))' }}
              >
                <button
                  onClick={(e) => { e.stopPropagation(); onSelectAll(); }}
                  className="font-medium"
                  style={{ color: 'hsl(var(--accent))' }}
                >
                  Select All
                </button>
                {selectedCount > 0 && (
                  <>
                    <span style={{ color: 'hsl(var(--border))' }}>•</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeselectAll(); }}
                      className="font-medium"
                      style={{ color: 'hsl(var(--danger))' }}
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            )}
            
            {/* Token List */}
            <div className="p-2">
              {tokens.map((token, i) => (
                <TokenRow
                  key={token.id}
                  token={token}
                  analysis={tokenAnalyses.get(token.id)}
                  selected={selectedTokens.has(token.id)}
                  onToggle={() => onToggleToken(token.id)}
                  isBurn={isBurnSection}
                  isDisabled={isDisabled}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TOKEN ROW COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

interface TokenRowProps {
  token: Token;
  analysis?: SwapAnalysis;
  selected: boolean;
  onToggle: () => void;
  isBurn?: boolean;
  isDisabled?: boolean;
}

function TokenRow({ token, analysis, selected, onToggle, isBurn, isDisabled }: TokenRowProps) {
  const chain = EVM_CHAINS[token.chainId];
  const logo = token.logo || KNOWN_LOGOS[token.symbol.toUpperCase()];
  
  return (
    <motion.div
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      onClick={!isDisabled ? onToggle : undefined}
      className={`flex items-center gap-3 p-3 rounded-xl mb-1 transition-all ${!isDisabled ? 'cursor-pointer' : ''}`}
      style={{ 
        background: selected 
          ? isBurn ? 'hsl(var(--warning-light))' : 'hsl(var(--accent-light))'
          : 'hsl(var(--bg-tertiary))',
        border: selected 
          ? `1px solid ${isBurn ? 'hsl(var(--warning) / 0.3)' : 'hsl(var(--accent) / 0.3)'}` 
          : '1px solid transparent',
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      {!isDisabled && (
        <div 
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
          style={{ 
            background: selected 
              ? isBurn ? 'hsl(var(--warning))' : 'hsl(var(--accent))'
              : 'hsl(var(--bg-elevated))',
            border: selected ? 'none' : '2px solid hsl(var(--border))'
          }}
        >
          {selected && <Check className="w-3 h-3 text-white" />}
        </div>
      )}
      
      {/* Token Icon */}
      <div className="relative flex-shrink-0">
        {logo ? (
          <img 
            src={logo} 
            alt={token.symbol}
            className="w-9 h-9 rounded-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs"
            style={{ background: 'hsl(var(--bg-secondary))', color: 'hsl(var(--text-secondary))' }}
          >
            {token.symbol.slice(0, 2)}
          </div>
        )}
        <div 
          className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
          style={{ 
            background: chain?.color || 'hsl(var(--bg-tertiary))',
            border: '2px solid hsl(var(--bg-elevated))'
          }}
        >
          {chain?.icon || '?'}
        </div>
      </div>
      
      {/* Token Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-sm truncate">{token.symbol}</span>
          {token.riskScore >= 70 && (
            <AlertTriangle className="w-3 h-3 flex-shrink-0" style={{ color: 'hsl(var(--warning))' }} />
          )}
        </div>
        <div className="text-xs truncate" style={{ color: 'hsl(var(--text-tertiary))' }}>
          {analysis?.reason || token.name}
        </div>
      </div>
      
      {/* Value */}
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-sm">
          ${token.balanceUsd < 0.01 ? '<0.01' : token.balanceUsd.toFixed(2)}
        </div>
        {analysis && analysis.netGain > 0 && !isDisabled && (
          <div className="text-[10px] font-medium" style={{ color: 'hsl(var(--success))' }}>
            +${analysis.netGain.toFixed(2)} net
          </div>
        )}
        {isDisabled && analysis && (
          <div className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
            {analysis.action === 'skip' ? 'Gas > Value' : 'Hold'}
          </div>
        )}
      </div>
    </motion.div>
  );
}
