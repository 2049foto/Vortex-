'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Wallet, 
  ArrowRight, 
  Shield, 
  Zap, 
  TrendingUp,
  CheckCircle,
  Sparkles,
  Globe,
  Lock
} from 'lucide-react';

// Supported chains with colors
const CHAINS = [
  { name: 'Base', color: '#0052FF' },
  { name: 'Ethereum', color: '#627EEA' },
  { name: 'Arbitrum', color: '#28A0F0' },
  { name: 'Optimism', color: '#FF0420' },
  { name: 'Polygon', color: '#8247E5' },
  { name: 'BNB', color: '#F0B90B' },
  { name: 'Avalanche', color: '#E84142' },
  { name: 'zkSync', color: '#8C8DFC' },
  { name: 'Solana', color: '#9945FF' },
  { name: 'Monad', color: '#00D4AA' },
];

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Scan',
    description: '11 chains, instant detection',
  },
  {
    icon: Shield,
    title: 'Risk Analysis',
    description: '20-layer security scoring',
  },
  {
    icon: Zap,
    title: 'Gasless',
    description: 'Zero fees on Base',
  },
];

export default function LandingClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [walletInput, setWalletInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  // Auto-fill connected wallet
  useEffect(() => {
    if (isConnected && address && !walletInput) {
      setWalletInput(address);
    }
  }, [isConnected, address, walletInput]);

  // Validate wallet address
  const isValidAddress = useCallback((addr: string) => {
    return /^0x[a-fA-F0-9]{40}$/.test(addr) || addr.endsWith('.eth') || addr.endsWith('.base.eth');
  }, []);

  const handleScan = useCallback(async () => {
    const addressToScan = walletInput.trim() || address;
    if (!addressToScan) return;
    
    setIsLoading(true);
    router.push(`/scan?address=${encodeURIComponent(addressToScan)}`);
  }, [walletInput, address, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (walletInput || address)) {
      handleScan();
    }
  };

  return (
    <div className="page safe-top">
      <div className="container" style={{ paddingTop: '60px', paddingBottom: '40px' }}>
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full"
            style={{ background: 'hsl(var(--accent-light))' }}
          >
            <Sparkles className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--accent))' }}>
              Gasless on Base
            </span>
          </motion.div>

          {/* Headline */}
          <h1 className="mb-4">
            Clean Your
            <br />
            <span className="text-gradient">Crypto Dust</span>
          </h1>
          
          <p className="text-base mb-8 max-w-xs mx-auto" style={{ color: 'hsl(var(--text-secondary))' }}>
            Scan, analyze, and consolidate small tokens across 11 chains in seconds.
          </p>
        </motion.div>

        {/* Wallet Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="wallet-input-hero mb-8"
        >
          <div className="input-group">
            <Search className="input-icon w-5 h-5" />
            <input
              type="text"
              className="input input-with-icon input-wallet"
              placeholder={isConnected ? 'Connected wallet' : 'Enter wallet address'}
              value={walletInput}
              onChange={(e) => setWalletInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="btn btn-primary"
              onClick={handleScan}
              disabled={isLoading || (!walletInput && !address)}
            >
              {isLoading ? (
                <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
              ) : (
                <>
                  Scan
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
          
          {/* Quick action - use connected wallet */}
          <AnimatePresence>
            {isConnected && !walletInput && (
              <motion.button
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center gap-2 mt-3 mx-auto text-sm"
                style={{ color: 'hsl(var(--accent))' }}
                onClick={handleScan}
              >
                <Wallet className="w-4 h-4" />
                Use connected wallet
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Chains */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-10"
        >
          <p className="text-center text-xs mb-3" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Supported Networks
          </p>
          <div className="chain-list scrollbar-hidden justify-center flex-wrap">
            {CHAINS.map((chain, i) => (
              <motion.div
                key={chain.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.03 }}
                className="chain-chip"
              >
                <div 
                  className="chain-dot" 
                  style={{ background: chain.color }}
                />
                {chain.name}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-3 gap-3 mb-10"
        >
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="card text-center"
              style={{ padding: '16px 12px' }}
            >
              <div 
                className="inline-flex items-center justify-center w-10 h-10 rounded-full mb-3 mx-auto"
                style={{ background: 'hsl(var(--accent-light))' }}
              >
                <feature.icon className="w-5 h-5" style={{ color: 'hsl(var(--accent))' }} />
              </div>
              <h4 className="text-sm font-semibold mb-1">{feature.title}</h4>
              <p className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* How it works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card mb-10"
        >
          <h3 className="text-base font-semibold mb-4">How it works</h3>
          <div className="space-y-4">
            {[
              { step: 1, title: 'Scan', desc: 'Enter wallet to detect all tokens' },
              { step: 2, title: 'Select', desc: 'Choose dust to consolidate' },
              { step: 3, title: 'Clean', desc: 'One-click gasless swap to ETH' },
            ].map((item, i) => (
              <div key={item.step} className="flex items-start gap-4">
                <div 
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{ 
                    background: 'hsl(var(--accent-light))',
                    color: 'hsl(var(--accent))' 
                  }}
                >
                  {item.step}
                </div>
                <div>
                  <h4 className="text-sm font-semibold">{item.title}</h4>
                  <p className="text-sm" style={{ color: 'hsl(var(--text-tertiary))' }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-center justify-center gap-6 text-center"
          style={{ color: 'hsl(var(--text-tertiary))' }}
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="text-xs">Non-custodial</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            <span className="text-xs">Secure</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="text-xs">Open source</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
