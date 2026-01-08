'use client';

/**
 * Vortex Protocol - Premium Landing Page
 * Apple-like design with smooth animations
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { 
  ArrowRight, ShieldCheck, Zap, Layers, 
  Sparkles, TrendingUp, ExternalLink, Play,
  Wallet, Globe, Lock, BarChart3, Gift
} from 'lucide-react';

interface LandingProps {
  onConnect?: () => void;
  isConnected?: boolean;
  address?: string;
  onNavigate?: (path: string) => void;
}

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 }
  }
};

// Chain data with logos
const CHAINS = [
  { name: 'Base', icon: '🔵', color: 'from-blue-500 to-blue-600' },
  { name: 'Ethereum', icon: '⟠', color: 'from-slate-600 to-slate-700' },
  { name: 'Arbitrum', icon: '🔷', color: 'from-blue-400 to-blue-500' },
  { name: 'Optimism', icon: '🔴', color: 'from-red-500 to-red-600' },
  { name: 'Polygon', icon: '💜', color: 'from-purple-500 to-purple-600' },
  { name: 'BNB', icon: '💛', color: 'from-yellow-500 to-yellow-600' },
  { name: 'Avalanche', icon: '🔺', color: 'from-red-500 to-red-600' },
  { name: 'zkSync', icon: '⚡', color: 'from-violet-500 to-violet-600' },
  { name: 'Monad', icon: '🟢', color: 'from-emerald-500 to-emerald-600' },
  { name: 'Solana', icon: '☀️', color: 'from-purple-500 to-teal-500' },
];

export function Landing({ onConnect, isConnected, address, onNavigate }: LandingProps) {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ volume: 45, wallets: 120, gas: 89 });

  useEffect(() => {
    setMounted(true);
    // Animated stats counter effect
    const interval = setInterval(() => {
      setStats(prev => ({
        volume: prev.volume + Math.random() * 0.1,
        wallets: prev.wallets + Math.random() * 0.5,
        gas: prev.gas + Math.random() * 0.2,
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleCta = () => {
    if (isConnected && onNavigate) {
      onNavigate('/scan');
    } else if (onConnect) {
      onConnect();
    }
  };

  if (!mounted) {
    return <div className="min-h-screen bg-slate-50" />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 overflow-hidden">
      <Navbar isConnected={isConnected || false} onConnect={onConnect || (() => {})} address={address} />
      
      {/* ========================================== */}
      {/* HERO SECTION */}
      {/* ========================================== */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-28 pb-24 px-4">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          {/* Gradient Orbs */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-gradient-to-r from-indigo-200/40 to-violet-200/40 rounded-full blur-3xl"
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            className="absolute bottom-20 right-1/4 w-[500px] h-[500px] bg-gradient-to-r from-emerald-100/40 to-teal-100/40 rounded-full blur-3xl"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_60%,transparent_100%)]" />
        </div>

        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="text-center max-w-5xl mx-auto relative z-10"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-8">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur border border-slate-200/80 shadow-lg shadow-slate-200/40 text-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-slate-700">Portfolio Hygiene Protocol</span>
              <span className="h-4 w-px bg-slate-200" />
              <span className="text-indigo-600 font-semibold">v2.0</span>
            </motion.div>
          </motion.div>

          {/* Main Heading */}
          <motion.h1 
            variants={fadeInUp}
            className="text-5xl sm:text-6xl md:text-7xl font-bold mb-6 leading-[1.1] tracking-tight"
          >
            <span className="text-slate-900">Clean Your Wallet,</span>
            <br />
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600">
                Zero Gas Fees
              </span>
              <motion.span 
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                className="absolute bottom-2 left-0 h-3 bg-indigo-200/50 -z-10 rounded"
              />
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p 
            variants={fadeInUp}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Scan, classify, and consolidate dust tokens across{' '}
            <span className="font-semibold text-slate-700">11 chains</span>{' '}
            with AI-powered risk analysis. Gas sponsored by Pimlico & Coinbase.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="lg" 
                onClick={handleCta}
                className="h-14 px-10 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-semibold shadow-xl shadow-slate-900/25 transition-all text-base"
              >
                {isConnected ? (
                  <>
                    <Sparkles className="mr-2 w-5 h-5" />
                    Scan Portfolio
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 w-5 h-5" />
                    Connect Wallet
                  </>
                )}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onNavigate?.('/grant-metrics')}
                className="h-14 px-8 rounded-2xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 font-medium text-base"
              >
                <BarChart3 className="mr-2 w-5 h-5" />
                View Metrics
              </Button>
            </motion.div>
          </motion.div>

          {/* Chain Showcase */}
          <motion.div variants={fadeInUp} className="mb-12">
            <p className="text-sm text-slate-400 mb-4">Supported across all major chains</p>
            <div className="flex flex-wrap justify-center gap-2">
              {CHAINS.map((chain, i) => (
                <motion.div
                  key={chain.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow cursor-default"
                >
                  <span className="text-base">{chain.icon}</span>
                  <span className="text-xs font-medium text-slate-600">{chain.name}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Live Stats */}
          <motion.div variants={fadeInUp} className="grid grid-cols-3 gap-6 sm:gap-12 max-w-2xl mx-auto">
            {[
              { value: `$${stats.volume.toFixed(1)}M+`, label: 'Volume Processed', icon: TrendingUp },
              { value: `${stats.wallets.toFixed(0)}K+`, label: 'Wallets Cleaned', icon: Wallet },
              { value: `$${stats.gas.toFixed(0)}K+`, label: 'Gas Saved', icon: Zap },
            ].map((stat, i) => (
              <motion.div 
                key={i} 
                className="text-center"
                whileHover={{ scale: 1.05 }}
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <stat.icon className="w-4 h-4 text-indigo-500" />
                  <span className="text-3xl sm:text-4xl font-bold text-slate-900">{stat.value}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ========================================== */}
      {/* FEATURES SECTION */}
      {/* ========================================== */}
      <section className="py-24 bg-white border-y border-slate-100 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-semibold mb-4">
              INTELLIGENT ANALYSIS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Enterprise-Grade Portfolio Management
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-lg">
              Advanced risk analysis meets seamless execution
            </p>
          </motion.div>
           
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Layers className="w-6 h-6" />}
              gradient="from-indigo-500 to-violet-500"
              title="20-Layer Risk Scoring"
              description="AI-powered analysis across liquidity, honeypot detection, rug-pull patterns, exploit history, and 16 more factors."
              delay={0}
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              gradient="from-amber-500 to-orange-500"
              title="Gasless Execution"
              description="Consolidate hundreds of dust tokens in a single transaction. Gas fees 100% sponsored by Pimlico & Coinbase."
              delay={0.1}
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6" />}
              gradient="from-emerald-500 to-teal-500"
              title="Secure Simulation"
              description="Every swap simulated via Tenderly before execution. Honeypot and rug-pull protection built-in."
              delay={0.2}
            />
            <FeatureCard 
              icon={<Globe className="w-6 h-6" />}
              gradient="from-blue-500 to-cyan-500"
              title="Multi-Chain Support"
              description="11 chains including Base, Ethereum, Arbitrum, Optimism, Polygon, BNB, Avalanche, zkSync, Monad & Solana."
              delay={0.3}
            />
            <FeatureCard 
              icon={<Lock className="w-6 h-6" />}
              gradient="from-rose-500 to-pink-500"
              title="Non-Custodial"
              description="Your keys, your tokens. All operations execute through your own wallet. We never hold your funds."
              delay={0.4}
            />
            <FeatureCard 
              icon={<Gift className="w-6 h-6" />}
              gradient="from-purple-500 to-fuchsia-500"
              title="Gamification & XP"
              description="Earn XP for cleaning your wallet. Level up, unlock achievements, and compete on the leaderboard."
              delay={0.5}
            />
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* HOW IT WORKS */}
      {/* ========================================== */}
      <section className="py-24 relative">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-semibold mb-4">
              SIMPLE PROCESS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Clean Your Wallet in 3 Steps
            </h2>
            <p className="text-slate-500 text-lg">From dusty to pristine in under a minute</p>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                step: '01',
                title: 'Connect & Scan',
                description: 'Connect your wallet and we instantly scan all 11 chains for token holdings. See the full picture in seconds.',
                icon: Wallet,
              },
              {
                step: '02',
                title: 'Review & Select',
                description: 'Tokens are classified into 4 tiers: Legit, Dust, Microdust, and Risk. Review the 20-layer risk analysis and select tokens to consolidate.',
                icon: BarChart3,
              },
              {
                step: '03',
                title: 'Consolidate',
                description: 'Execute gasless swaps to convert selected tokens into ETH or USDC on Base. No gas needed - we sponsor everything.',
                icon: Sparkles,
              },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ x: 8 }}
                className="flex items-start gap-5 p-6 rounded-2xl bg-white border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all group cursor-default"
              >
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-slate-900 text-xl">{item.title}</h3>
                    <item.icon className="w-5 h-5 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-slate-500 leading-relaxed">{item.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Final CTA */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
              <Button 
                size="lg" 
                onClick={handleCta}
                className="h-14 px-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold shadow-xl shadow-indigo-500/30 text-base"
              >
                {isConnected ? 'Start Scanning Now' : 'Get Started Free'}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </motion.div>
            <p className="text-sm text-slate-400 mt-4">No fees • No sign-up • Just connect and scan</p>
          </motion.div>
        </div>
      </section>

      {/* ========================================== */}
      {/* FOOTER */}
      {/* ========================================== */}
      <footer className="py-12 border-t border-slate-100 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-slate-900">Vortex Protocol</p>
                <p className="text-xs text-slate-500">Premium Portfolio Hygiene</p>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-slate-500">
              <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-slate-900 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Farcaster</a>
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Built on</span>
              <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-600 font-semibold">Base</span>
              <span>© 2026</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  gradient, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ReactNode;
  gradient: string;
  title: string; 
  description: string;
  delay?: number;
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      whileHover={{ y: -4 }}
      className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 hover:shadow-xl transition-all group"
    >
      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-5 text-white shadow-lg group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-500 leading-relaxed">{description}</p>
    </motion.div>
  );
}
