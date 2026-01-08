/**
 * TierBadge component for VORTEX PROTOCOL
 * Displays risk classification tier with appropriate styling
 * Tiers: LEGIT (green), DUST (amber), MICRODUST (gray), RISK_SCAM (red)
 */

'use client';

import React from 'react';
import { Shield, Sparkles, Skull } from 'lucide-react';
import { RiskTier } from '../types';
import { cn } from '../utils/cn';

interface TierBadgeProps {
  tier: RiskTier;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

const tierConfig: Record<RiskTier, {
  label: string;
  icon: React.ElementType;
  styles: string;
}> = {
  LEGIT: {
    label: 'Legit',
    icon: Shield,
    styles: 'bg-accent/10 text-accent border-accent/20',
  },
  DUST: {
    label: 'Dust',
    icon: Sparkles,
    styles: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  MICRODUST: {
    label: 'Microdust',
    icon: Sparkles,
    styles: 'bg-muted text-muted-foreground border-border',
  },
  RISK_SCAM: {
    label: 'Risk/Scam',
    icon: Skull,
    styles: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-3 py-1 text-sm gap-1.5',
  lg: 'px-4 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TierBadge({ tier, size = 'md', showIcon = true, className }: TierBadgeProps) {
  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        config.styles,
        sizes[size],
        className
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}

export default TierBadge;

