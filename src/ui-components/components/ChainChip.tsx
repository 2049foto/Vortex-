/**
 * ChainChip component for VORTEX PROTOCOL
 * Selectable chain pill with icon, name, and selection states
 * Used in chain selector for multi-chain support
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Chain } from '../types';
import { cn } from '../utils/cn';

interface ChainChipProps {
  chain: Chain;
  isSelected: boolean;
  onToggle: (chainId: string) => void;
  disabled?: boolean;
}

export function ChainChip({ chain, isSelected, onToggle, disabled }: ChainChipProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={() => !disabled && onToggle(chain.id)}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-full font-medium',
        'border-2 transition-all duration-200 min-w-[100px] min-h-[44px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary',
        isSelected
          ? 'bg-accent/10 border-accent text-accent'
          : 'bg-card border-border text-foreground hover:border-muted-foreground/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? 'Deselect' : 'Select'} ${chain.name}`}
    >
      <span className="text-lg" role="img" aria-hidden>
        {chain.icon}
      </span>
      <span className="whitespace-nowrap">{chain.name}</span>
      {isSelected && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto"
        >
          <Check className="w-4 h-4" />
        </motion.span>
      )}
    </motion.button>
  );
}

interface ChainSelectorProps {
  selectedChains: string[];
  onToggleChain: (chainId: string) => void;
  chains: Chain[];
  disabled?: boolean;
}

export function ChainSelector({ selectedChains, onToggleChain, chains, disabled }: ChainSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Select Chains</label>
        <span className="text-sm text-muted-foreground">
          {selectedChains.length} selected
        </span>
      </div>
      <div 
        className="flex flex-wrap gap-2 p-1 -m-1 overflow-x-auto scrollbar-hide"
        role="group"
        aria-label="Chain selection"
      >
        {chains.map(chain => (
          <ChainChip
            key={chain.id}
            chain={chain}
            isSelected={selectedChains.includes(chain.id)}
            onToggle={onToggleChain}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

export default ChainChip;

