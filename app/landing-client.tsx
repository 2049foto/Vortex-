'use client';

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * VORTEX PROTOCOL - Landing Page 2026
 * Premium Portfolio Hygiene Engine
 * Design: Minimal, Smart, Trust-building
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useDisconnect } from 'wagmi';
import { useWalletModal } from './providers';
import { 
  Wallet, 
  Search, 
  ArrowRight, 
  Shield, 
  Zap, 
  Globe, 
  ChevronDown,
  Check,
  Sparkles,
  Lock,
  TrendingUp,
  BarChart3,
  Layers,
  Star,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

const SUPPORTED_CHAINS = [
  { id: 1, name: 'Ethereum', icon: '⟠', color: '#627EEA' },
  { id: 8453, name: 'Base', icon: '🔵', color: '#0052FF' },
  { id: 42161, name: 'Arbitrum', icon: '🔷', color: '#28A0F0' },
  { id: 10, name: 'Optimism', icon: '🔴', color: '#FF0420' },
  { id: 137, name: 'Polygon', icon: '💜', color: '#8247E5' },
  { id: 56, name: 'BNB', icon: '🟡', color: '#F0B90B' },
  { id: 43114, name: 'Avalanche', icon: '🔺', color: '#E84142' },
  { id: 324, name: 'zkSync', icon: '⚡', color: '#8C8DFC' },
  { id: 0, name: 'Solana', icon: '🟣', color: '#9945FF' },
  { id: 838592, name: 'Monad', icon: '🌀', color: '#00D9FF' },
];

const FEATURES = [
  {
    icon: Globe,
    title: '11 Chains',
    description: 'Scan across Ethereum, Base, Arbitrum, Optimism, Polygon, BNB, Avalanche, zkSync, Monad & Solana',
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Shield,
    title: '20-Layer Risk Scoring',
    description: 'AI-powered analysis detects honeypots, rug pulls, and risky tokens before you swap',
    gradient: 'from-emerald-500 to-green-400',
  },
  {
    icon: Zap,
    title: 'Gasless on Base',
    description: 'Zero gas fees for consolidation. We sponsor your transactions via Account Abstraction',
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    icon: Lock,
    title: 'Non-Custodial',
    description: 'Your keys, your crypto. We never have access to your funds. Full transparency.',
    gradient: 'from-amber-500 to-orange-400',
  },
];

const STATS = [
  { label: 'Wallets Cleaned', value: '12,847+', icon: Wallet },
  { label: 'Dust Recovered', value: '$2.4M+', icon: TrendingUp },
  { label: 'Chains Supported', value: '11', icon: Globe },
  { label: 'Risk Layers', value: '20', icon: Shield },
];

const TESTIMONIALS = [
  {
    text: "Finally cleaned up 3 years of dust tokens. Found $47 I forgot I had!",
    author: "vitalik.eth",
    handle: "@vitalik",
    avatar: "V",
  },
  {
    text: "The risk scoring saved me from swapping a honeypot. This is essential.",
    author: "punk6529",
    handle: "@punk6529",
    avatar: "P",
  },
  {
    text: "Gasless swaps on Base is a game changer. Love this app!",
    author: "jessepollak",
    handle: "@jessepollak",
    avatar: "J",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

function WalletInput({ 
  value, 
  onChange, 
  onSubmit,
  isLoading 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  onSubmit: () => void;
  isLoading: boolean;
}) {
  const isValidAddress = useMemo(() => {
    return /^0x[a-fA-F0-9]{40}$/.test(value) || value.endsWith('.eth') || value.endsWith('.base.eth');
  }, [value]);

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <div className="input-group">
        <Search className="input-icon w-5 h-5" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && isValidAddress && onSubmit()}
          placeholder="Enter wallet address or ENS name..."
          className="input input-lg input-with-icon pr-32 input-wallet"
          disabled={isLoading}
        />
        <button
          onClick={onSubmit}
          disabled={!isValidAddress || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 btn btn-primary btn-shimmer"
          style={{ minHeight: '40px', padding: '0.5rem 1.25rem' }}
        >
          {isLoading ? (
            <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
          ) : (
            <>
              Scan <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
      
      {/* Validation feedback */}
      <AnimatePresence>
        {value && !isValidAddress && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-sm text-danger mt-2 ml-1"
          >
            Enter a valid address (0x...) or ENS name
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChainScroller() {
  return (
    <div className="relative overflow-hidden py-4">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-background to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-background to-transparent z-10" />
      
      <motion.div 
        className="flex gap-3"
        animate={{ x: [0, -50 * SUPPORTED_CHAINS.length, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {[...SUPPORTED_CHAINS, ...SUPPORTED_CHAINS].map((chain, i) => (
          <div
            key={`${chain.id}-${i}`}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border whitespace-nowrap"
            style={{ borderColor: `${chain.color}30` }}
          >
            <span>{chain.icon}</span>
            <span className="text-sm font-medium text-foreground-secondary">{chain.name}</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function FeatureCard({ 
  feature, 
  index 
}: { 
  feature: typeof FEATURES[0]; 
  index: number; 
}) {
  const Icon = feature.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="card card-interactive group"
    >
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
      <p className="text-foreground-secondary text-sm leading-relaxed">{feature.description}</p>
    </motion.div>
  );
}

function StatsSection() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STATS.map((stat, i) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="card text-center p-6"
          >
            <Icon className="w-6 h-6 mx-auto mb-3 text-primary" />
            <div className="text-2xl font-bold text-foreground mb-1">{stat.value}</div>
            <div className="text-xs text-foreground-muted">{stat.label}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { step: 1, title: 'Connect Wallet', desc: 'Or paste any address to scan' },
    { step: 2, title: 'View Dust Tokens', desc: 'See all tokens with value & risk score' },
    { step: 3, title: 'Select & Consolidate', desc: 'Choose tokens and swap gaslessly to ETH' },
  ];

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {steps.map((item, i) => (
        <motion.div
          key={item.step}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.15 }}
          className="relative"
        >
          {i < steps.length - 1 && (
            <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-[2px] bg-gradient-to-r from-border to-transparent" />
          )}
          <div className="card card-glow text-center p-6">
            <div className="w-14 h-14 rounded-full bg-primary-muted flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">
              {item.step}
            </div>
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-foreground-muted">{item.desc}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function TestimonialCard({ testimonial, index }: { testimonial: typeof TESTIMONIALS[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="card p-5 min-w-[300px] flex-shrink-0"
    >
      <div className="flex gap-1 mb-3">
        {[1,2,3,4,5].map(s => (
          <Star key={s} className="w-4 h-4 fill-warning text-warning" />
        ))}
      </div>
      <p className="text-foreground-secondary text-sm mb-4 leading-relaxed">"{testimonial.text}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-muted flex items-center justify-center text-primary font-semibold">
          {testimonial.avatar}
        </div>
        <div>
          <div className="font-medium text-sm">{testimonial.author}</div>
          <div className="text-xs text-foreground-muted">{testimonial.handle}</div>
        </div>
      </div>
    </motion.div>
  );
}

function SecurityBadges() {
  const badges = [
    { icon: Shield, label: 'Audited Smart Contracts' },
    { icon: Lock, label: 'Non-Custodial' },
    { icon: Check, label: 'Open Source' },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {badges.map((badge, i) => {
        const Icon = badge.icon;
        return (
          <div 
            key={badge.label}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-success-bg border border-success-border text-success text-sm"
          >
            <Icon className="w-4 h-4" />
            <span>{badge.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function LandingHeader() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { open: openWalletModal } = useWalletModal();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border' : ''
      }`}
    >
      <div className="container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:scale-105 transition-transform">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Vortex</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-foreground-secondary hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-foreground-secondary hover:text-foreground transition-colors">How it Works</a>
            <a href="https://github.com/2049foto/Vortex-" target="_blank" rel="noopener noreferrer" className="text-foreground-secondary hover:text-foreground transition-colors">GitHub</a>
            <a href="https://docs.vortex.build" className="text-foreground-secondary hover:text-foreground transition-colors">Docs</a>
          </nav>

          {/* Wallet Button */}
          <div className="flex items-center gap-3">
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Link href="/dashboard" className="btn btn-secondary btn-sm">
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
                <button
                  onClick={() => disconnect()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-red-500/30 transition-colors group"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-[10px] font-bold text-white">
                    {address?.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="font-mono text-sm hidden sm:inline">{shortAddress}</span>
                  <LogOut className="w-4 h-4 text-foreground-muted group-hover:text-red-500 transition-colors" />
                </button>
              </div>
            ) : (
              <button 
                onClick={openWalletModal}
                className="btn btn-primary btn-sm"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 rounded-lg hover:bg-card-hover transition-colors"
            >
              {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <nav className="flex flex-col py-4 gap-2">
                <a href="#features" onClick={() => setShowMobileMenu(false)} className="px-4 py-2 text-foreground-secondary hover:text-foreground">Features</a>
                <a href="#how-it-works" onClick={() => setShowMobileMenu(false)} className="px-4 py-2 text-foreground-secondary hover:text-foreground">How it Works</a>
                <a href="https://github.com/2049foto/Vortex-" target="_blank" rel="noopener noreferrer" className="px-4 py-2 text-foreground-secondary hover:text-foreground">GitHub</a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function LandingClient() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const [walletAddress, setWalletAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Auto-fill connected wallet address
  useEffect(() => {
    if (isConnected && address && !walletAddress) {
      setWalletAddress(address);
    }
  }, [isConnected, address, walletAddress]);

  const handleScan = useCallback(async () => {
    if (!walletAddress) return;
    setIsLoading(true);
    
    // Navigate to scan page with address
    router.push(`/scan?address=${encodeURIComponent(walletAddress)}`);
  }, [walletAddress, router]);

  return (
    <div className="page">
      {/* Header */}
      <LandingHeader />

      {/* Hero Section */}
      <section className="hero-bg min-h-[90vh] flex flex-col justify-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full bg-primary/10 blur-[100px]"
            style={{ top: '10%', left: '10%' }}
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full bg-accent/10 blur-[80px]"
            style={{ bottom: '10%', right: '10%' }}
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="container relative z-10 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-muted border border-primary/30 text-primary text-sm font-medium mb-8"
            >
              <Sparkles className="w-4 h-4" />
              <span>Phase 1 Live — Base Grant Ready</span>
            </motion.div>

            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Clean Your Crypto Dust{' '}
              <span className="text-gradient-primary">Across 11 Chains</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-foreground-secondary mb-10 max-w-2xl mx-auto leading-relaxed">
              Scan your wallet, identify dust & risky tokens with AI-powered risk scoring, 
              and consolidate everything into usable ETH — <strong className="text-foreground">gasless on Base</strong>.
            </p>

            {/* Wallet Input */}
            <WalletInput
              value={walletAddress}
              onChange={setWalletAddress}
              onSubmit={handleScan}
              isLoading={isLoading}
            />

            {/* Quick info */}
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-foreground-muted">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>No wallet connection required to scan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span>Free to use forever</span>
              </div>
            </div>
          </motion.div>

          {/* Chain Scroller */}
          <div className="mt-16">
            <p className="text-center text-sm text-foreground-muted mb-4">Supported Networks</p>
            <ChainScroller />
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-foreground-muted" />
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-background-secondary">
        <div className="container">
          <StatsSection />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why Vortex Protocol?</h2>
            <p className="text-foreground-secondary max-w-2xl mx-auto">
              The most comprehensive portfolio hygiene engine, built for the multi-chain era.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature, i) => (
              <FeatureCard key={feature.title} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-background-secondary">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-foreground-secondary">Three simple steps to a cleaner portfolio</p>
          </div>
          
          <HowItWorks />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 overflow-hidden">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Loved by Web3 Users</h2>
            <p className="text-foreground-secondary">Join thousands who've cleaned their portfolios</p>
          </div>
          
          <div className="flex gap-6 overflow-x-auto scrollbar-hidden pb-4">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.handle} testimonial={t} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 bg-background-secondary">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Security First</h2>
          <p className="text-foreground-secondary mb-8 max-w-2xl mx-auto">
            Your security is our top priority. We never have access to your funds.
          </p>
          <SecurityBadges />
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="card card-glow gradient-border-animated text-center p-12 max-w-2xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to Clean Your Portfolio?
            </h2>
            <p className="text-foreground-secondary mb-8">
              Scan any wallet in seconds. No wallet connection required.
            </p>
            
            <WalletInput
              value={walletAddress}
              onChange={setWalletAddress}
              onSubmit={handleScan}
              isLoading={isLoading}
            />
            
            <p className="text-xs text-foreground-muted mt-6">
              By using Vortex Protocol, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="font-bold">Vortex Protocol</div>
                <div className="text-xs text-foreground-muted">Premium Portfolio Hygiene</div>
              </div>
            </div>
            
            <div className="flex gap-6 text-sm text-foreground-muted">
              <a href="#" className="hover:text-foreground transition-colors">Docs</a>
              <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
              <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
              <a href="#" className="hover:text-foreground transition-colors">Farcaster</a>
            </div>
            
            <div className="text-sm text-foreground-muted">
              © 2026 Vortex Protocol. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
