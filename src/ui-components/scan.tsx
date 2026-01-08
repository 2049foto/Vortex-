/**
 * Scan Component for VORTEX PROTOCOL
 * Portfolio scanning with 11-chain support and asset classification
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, ArrowRight, RefreshCw, Wallet } from 'lucide-react';
import { Button } from './components/ui/Button';
import { Card, CardContent } from './components/ui/Card';
import { Badge } from './components/ui/Badge';
import { AssetCard } from './components/AssetCard';
import { ChainSelector } from './components/ChainChip';
import { EmptyState } from './components/ui/EmptyState';
import { SkeletonAssetCard } from './components/ui/Skeleton';
import { MOCK_ASSETS } from './constants/mockData';
import { EVM_CHAINS, CHAINS } from './constants/chains';
import { Asset, RiskTier } from './types';
import { cn } from './utils/cn';

interface ScanProps {
  address?: string;
  isLoading?: boolean;
  scanResult?: any;
  error?: string | null;
  onScan?: (address?: string) => void;
  onNavigate?: (path: string) => void;
}

type TabType = 'LEGIT' | 'DUST' | 'MICRODUST' | 'RISK_SCAM';

export function Scan({ address, isLoading: externalLoading, scanResult, error, onScan, onNavigate }: ScanProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('DUST');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [selectedChains, setSelectedChains] = useState<string[]>(['base', 'ethereum', 'arbitrum', 'optimism', 'polygon']);
  const [assets, setAssets] = useState<Asset[]>([]);

  // Simulate scanning
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              setIsScanning(false);
              // Use scan result if available, otherwise mock data
              setAssets(scanResult?.tokens || MOCK_ASSETS);
            }, 800);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isScanning, scanResult]);

  // Pre-select dust tokens once scan finishes
  useEffect(() => {
    if (!isScanning && assets.length > 0) {
      const dustIds = assets.filter(t => t.tier === 'DUST').map(t => t.id);
      setSelectedTokens(dustIds);
    }
  }, [isScanning, assets]);

  const handleToggleToken = (id: string) => {
    setSelectedTokens(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  const handleToggleChain = (chainId: string) => {
    setSelectedChains(prev =>
      prev.includes(chainId) ? prev.filter(c => c !== chainId) : [...prev, chainId]
    );
  };

  const handleRescan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setAssets([]);
    setSelectedTokens([]);
    if (onScan) onScan(address);
  };

  const handleConsolidate = () => {
    const selected = assets.filter(a => selectedTokens.includes(a.id));
    const params = encodeURIComponent(JSON.stringify(selected));
    if (onNavigate) {
      onNavigate(`/consolidate?tokens=${params}`);
    }
  };

  // Filter assets by tab and selected chains
  const filteredAssets = assets.filter(asset => {
    const chain = CHAINS[asset.chainId];
    const matchesTab = activeTab === 'RISK_SCAM' ? asset.tier === 'RISK_SCAM' : asset.tier === activeTab;
    const matchesChain = chain && selectedChains.includes(chain.id);
    return matchesTab && matchesChain;
  });

  const selectedValue = assets
    .filter(t => selectedTokens.includes(t.id))
    .reduce((acc, t) => acc + t.valueUSD, 0);

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'LEGIT', label: 'Legit', count: assets.filter(t => t.tier === 'LEGIT').length },
    { key: 'DUST', label: 'Dust', count: assets.filter(t => t.tier === 'DUST').length },
    { key: 'MICRODUST', label: 'Microdust', count: assets.filter(t => t.tier === 'MICRODUST').length },
    { key: 'RISK_SCAM', label: 'Risk/Scam', count: assets.filter(t => t.tier === 'RISK_SCAM').length },
  ];

  // Scanning State
  if (isScanning) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background relative overflow-hidden px-4">
        {/* Background Animation */}
        <div className="absolute inset-0 flex items-center justify-center -z-10">
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-[600px] h-[600px] bg-primary/10 rounded-full blur-[100px]"
          />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
            {/* Spinning Rings */}
            <motion.div 
              className="absolute inset-0 border-[3px] border-muted rounded-full"
            />
            <motion.div 
              className="absolute inset-0 border-[3px] border-transparent border-t-primary rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div 
              className="absolute inset-4 border-[3px] border-transparent border-t-accent rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
            
            <div className="flex flex-col items-center justify-center bg-card w-32 h-32 rounded-full shadow-2xl border border-border">
              <span className="text-3xl font-bold text-foreground">{Math.round(scanProgress)}%</span>
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Scanning</span>
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 text-foreground text-center">
            Analyzing Portfolio
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md text-center">
            Checking liquidity, approvals, and calculating risk scores across <span className="font-semibold text-foreground">11 chains</span>.
          </p>
          
          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-medium">
            {['Base', 'Ethereum', 'Arbitrum', 'Solana'].map((chain, i) => (
              <motion.div 
                key={chain}
                animate={{ opacity: scanProgress > (i + 1) * 20 ? 1 : 0.3, y: scanProgress > (i + 1) * 20 ? 0 : 5 }}
                className="flex items-center gap-2 text-primary"
              >
                <div className={`w-2 h-2 rounded-full ${scanProgress > (i + 1) * 20 ? 'bg-primary' : 'bg-muted'}`} />
                {chain}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Results State
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Scan Results</h1>
          <p className="text-muted-foreground mt-1">
            Found <span className="font-semibold text-foreground">{assets.length} assets</span> across {selectedChains.length} chains
          </p>
        </div>
        <Button variant="outline" onClick={handleRescan} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Rescan
        </Button>
      </div>

      {/* Chain Selector */}
      <div className="mb-6">
        <ChainSelector
          selectedChains={selectedChains}
          onToggleChain={handleToggleChain}
          chains={EVM_CHAINS}
        />
      </div>

      {/* Tier Tabs */}
      <div className="mb-6 overflow-x-auto scrollbar-hide">
        <div className="inline-flex p-1.5 bg-card rounded-xl border border-border gap-1 min-w-full sm:min-w-0">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px]',
                activeTab === tab.key 
                  ? 'text-primary-foreground' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              {activeTab === tab.key && (
                <motion.div 
                  layoutId="tab-pill"
                  className="absolute inset-0 bg-primary rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.label}
                <Badge 
                  variant={activeTab === tab.key ? 'default' : 'muted'} 
                  size="sm"
                  className={activeTab === tab.key ? 'bg-white/20' : ''}
                >
                  {tab.count}
                </Badge>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-destructive/5 border-destructive/20">
          <CardContent className="py-4 flex items-center gap-3 text-destructive">
            <span className="text-sm font-medium">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Asset Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {externalLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <SkeletonAssetCard key={i} />
            ))
          ) : filteredAssets.length > 0 ? (
            filteredAssets.map(asset => (
              <AssetCard 
                key={asset.id} 
                asset={asset}
                isSelected={selectedTokens.includes(asset.id)}
                onToggleSelect={handleToggleToken}
                showCheckbox={asset.tier !== 'RISK_SCAM'}
                disabled={asset.tier === 'RISK_SCAM'}
              />
            ))
          ) : (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="col-span-2"
            >
              <EmptyState
                icon={<Search className="w-8 h-8 text-muted-foreground" />}
                title="No assets found"
                description={`There are no assets in the ${activeTab.replace('_', '/')} category for selected chains.`}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Action Bar */}
      <motion.div 
        initial={{ y: 150 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.3 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[95%] max-w-2xl z-40"
      >
        <Card variant="elevated" className="p-3 pr-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 pl-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selected</span>
                <span className="text-lg font-bold text-foreground flex items-center gap-2">
                  {selectedTokens.length} <span className="text-sm font-normal text-muted-foreground">assets</span>
                </span>
              </div>
              <div className="h-10 w-px bg-border" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Value</span>
                <span className="text-lg font-bold text-accent">${selectedValue.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              {selectedTokens.length > 0 && (
                <Button variant="ghost" onClick={() => setSelectedTokens([])}>
                  Clear
                </Button>
              )}
              <Button 
                variant="primary"
                size="md"
                onClick={handleConsolidate}
                disabled={selectedTokens.length === 0}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Consolidate
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

export default Scan;
