'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';
import { 
  ArrowRight, ShieldCheck, Zap, Layers, 
  Sparkles, CheckCircle2, TrendingUp
} from 'lucide-react';

interface LandingProps {
  onConnect?: () => void;
  isConnected?: boolean;
  address?: string;
  onNavigate?: (path: string) => void;
}

export function Landing({ onConnect, isConnected, address, onNavigate }: LandingProps) {
  const handleCta = () => {
    if (isConnected && onNavigate) {
      onNavigate('/scan');
    } else if (onConnect) {
      onConnect();
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-subtle">
      <Navbar isConnected={isConnected || false} onConnect={onConnect || (() => {})} address={address} />
      
      {/* Hero Section */}
      <section className="relative flex-1 flex flex-col items-center justify-center pt-24 pb-20 px-4">
        {/* Subtle background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="text-center max-w-4xl mx-auto"
        >
          {/* Badge */}
          <motion.div variants={item} className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-sm">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span className="font-medium text-slate-700">Portfolio Hygiene Protocol</span>
              <span className="w-px h-4 bg-slate-200" />
              <span className="text-indigo-600 font-medium">v2.0</span>
            </div>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            variants={item}
            className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 leading-tight"
          >
            <span className="text-slate-900">Clean Your Wallet,</span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600">
              Zero Gas Fees
            </span>
          </motion.h1>

          <motion.p 
            variants={item}
            className="text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Scan, classify, and consolidate dust tokens across{' '}
            <span className="text-slate-700 font-medium">11 chains</span>{' '}
            with AI-powered risk analysis. Gas sponsored by Pimlico & Coinbase.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={item} className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-16">
            <Button 
              size="lg" 
              onClick={handleCta}
              className="w-full sm:w-auto h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-lg shadow-slate-900/20 transition-all hover:scale-105"
            >
              {isConnected ? 'Scan Portfolio' : 'Connect Wallet'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
            {isConnected && (
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => onNavigate?.('/dashboard')}
                className="w-full sm:w-auto h-12 px-8 rounded-xl border-slate-200 hover:bg-slate-50"
              >
                View Dashboard
              </Button>
            )}
          </motion.div>

          {/* Trust Metrics */}
          <motion.div variants={item} className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto">
            {[
              { value: '$45M+', label: 'Volume Processed' },
              { value: '120K+', label: 'Wallets Cleaned' },
              { value: '0 Gas', label: 'User Fees' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl sm:text-3xl font-bold text-slate-900">{stat.value}</div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              Intelligent Portfolio Management
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Advanced risk analysis meets seamless execution
            </p>
          </div>
           
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard 
              icon={<Layers className="w-6 h-6" />}
              iconBg="bg-indigo-100 text-indigo-600"
              title="20-Layer Risk Scoring"
              description="AI-powered analysis across liquidity, honeypot detection, rug-pull patterns, and 17 more factors."
            />
            <FeatureCard 
              icon={<Zap className="w-6 h-6" />}
              iconBg="bg-amber-100 text-amber-600"
              title="Gasless Swaps"
              description="Consolidate hundreds of dust tokens in a single transaction. Gas fees fully sponsored."
            />
            <FeatureCard 
              icon={<ShieldCheck className="w-6 h-6" />}
              iconBg="bg-emerald-100 text-emerald-600"
              title="Secure Execution"
              description="Every swap simulated via Tenderly before execution. Your assets are protected."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 sm:py-20 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">
              How It Works
            </h2>
            <p className="text-slate-500">Three simple steps to a cleaner wallet</p>
          </div>

          <div className="space-y-4">
            {[
              {
                step: '1',
                title: 'Connect & Scan',
                description: 'Connect your wallet and we scan all 11 chains for token holdings in seconds.',
              },
              {
                step: '2',
                title: 'Review & Select',
                description: 'See tokens classified into Legit, Dust, Microdust, and Risk tiers. Select what to consolidate.',
              },
              {
                step: '3',
                title: 'Consolidate',
                description: 'Execute gasless swaps to convert selected tokens into ETH or USDC on Base.',
              },
            ].map((item, i) => (
              <div 
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-lg mb-1">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-10 text-center">
            <Button 
              size="lg" 
              onClick={handleCta}
              className="h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold"
            >
              {isConnected ? 'Start Scanning' : 'Get Started'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Vortex Protocol © 2026</span>
            <span className="text-slate-300">•</span>
            <span>Built on Base</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  iconBg, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  iconBg: string;
  title: string; 
  description: string;
}) {
  return (
    <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:border-slate-200 transition-all group">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
