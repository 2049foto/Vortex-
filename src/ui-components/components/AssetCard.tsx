/**
 * AssetCard component for VORTEX PROTOCOL
 * Displays asset information with expandable risk details
 * Shows: token name, chain, value, liquidity, tier badge, and risk factors
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ExternalLink, AlertTriangle, Copy, Check } from 'lucide-react';
import { Asset } from '../types';
import { CHAINS } from '../constants/chains';
import { TierBadge } from './TierBadge';
import { RiskScoreMeter } from './RiskScoreMeter';
import { cn } from '../utils/cn';

interface AssetCardProps {
  asset: Asset;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  showCheckbox?: boolean;
  disabled?: boolean;
}

export function AssetCard({
  asset,
  isSelected = false,
  onToggleSelect,
  showCheckbox = false,
  disabled = false,
}: AssetCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const chain = CHAINS[asset.chainId];
  const hasRiskDetails = asset.riskDetails && asset.tier === 'RISK_SCAM';

  const handleCopyAddress = async () => {
    if (asset.contractAddress) {
      await navigator.clipboard.writeText(asset.contractAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const liquidityColors = {
    high: 'text-accent',
    medium: 'text-amber-500',
    low: 'text-amber-600',
    none: 'text-muted-foreground',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-card border rounded-xl overflow-hidden transition-all duration-200',
        isSelected ? 'border-primary shadow-md' : 'border-border',
        disabled && 'opacity-50'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {showCheckbox && (
            <label className="relative flex items-center justify-center min-w-[24px] min-h-[24px] mt-1">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => onToggleSelect?.(asset.id)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={cn(
                  'w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all',
                  isSelected
                    ? 'bg-primary border-primary'
                    : 'bg-card border-border hover:border-muted-foreground'
                )}
              >
                {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
            </label>
          )}

          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
            <span className="text-lg">{chain?.icon || '🪙'}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">{asset.name}</h4>
              <span className="text-sm text-muted-foreground">{asset.symbol}</span>
              <TierBadge tier={asset.tier} size="sm" />
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm">
              <span className="text-muted-foreground">{chain?.name || 'Unknown'}</span>
              <span className="text-muted-foreground">•</span>
              <span className={cn('capitalize', liquidityColors[asset.liquidity])}>
                {asset.liquidity} liquidity
              </span>
            </div>
          </div>

          <div className="text-right flex-shrink-0">
            <p className="font-semibold text-foreground">
              ${asset.valueUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm text-muted-foreground">
              {asset.balance} {asset.symbol}
            </p>
          </div>
        </div>

        {asset.tier === 'RISK_SCAM' && (
          <div className="mt-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Never swap—high risk asset</span>
            </div>
          </div>
        )}

        {hasRiskDetails && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Risk details</span>
            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && hasRiskDetails && asset.riskDetails && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 bg-muted/30 space-y-4">
              <RiskScoreMeter
                score={asset.riskDetails.score}
                confidence={asset.riskDetails.confidence}
              />

              <div className="space-y-2">
                <h5 className="text-sm font-medium text-foreground">Risk Factors</h5>
                {asset.riskDetails.factors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <span
                      className={cn(
                        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        factor.severity === 'critical' && 'bg-destructive',
                        factor.severity === 'high' && 'bg-amber-500',
                        factor.severity === 'medium' && 'bg-yellow-500',
                        factor.severity === 'low' && 'bg-muted-foreground'
                      )}
                    />
                    <div>
                      <p className="font-medium text-foreground">{factor.name}</p>
                      <p className="text-muted-foreground">{factor.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {asset.contractAddress && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Contract:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">
                    {asset.contractAddress.slice(0, 10)}...{asset.contractAddress.slice(-8)}
                  </code>
                  <button
                    onClick={handleCopyAddress}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Copy contract address"
                  >
                    {copied ? <Check className="w-4 h-4 text-accent" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <a
                    href={`${chain?.blockExplorer}/address/${asset.contractAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                    aria-label="View on explorer"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default AssetCard;

