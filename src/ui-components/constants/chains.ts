/**
 * Chain definitions for VORTEX PROTOCOL
 * Supports 11 chains: 10 EVM chains + Solana
 * Updated: Celo replaced with Avalanche (AVAX)
 */

import { Chain } from '../types';

export const CHAINS: Record<number, Chain> = {
  // Base (Primary)
  8453: {
    id: 'base',
    chainId: 8453,
    name: 'Base',
    icon: '🔵',
    nativeCurrency: 'ETH',
    blockExplorer: 'https://basescan.org',
  },
  // Ethereum
  1: {
    id: 'ethereum',
    chainId: 1,
    name: 'Ethereum',
    icon: '⟠',
    nativeCurrency: 'ETH',
    blockExplorer: 'https://etherscan.io',
  },
  // Arbitrum
  42161: {
    id: 'arbitrum',
    chainId: 42161,
    name: 'Arbitrum',
    icon: '🔷',
    nativeCurrency: 'ETH',
    blockExplorer: 'https://arbiscan.io',
  },
  // Optimism
  10: {
    id: 'optimism',
    chainId: 10,
    name: 'Optimism',
    icon: '🔴',
    nativeCurrency: 'ETH',
    blockExplorer: 'https://optimistic.etherscan.io',
  },
  // Polygon
  137: {
    id: 'polygon',
    chainId: 137,
    name: 'Polygon',
    icon: '💜',
    nativeCurrency: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
  },
  // BNB Chain
  56: {
    id: 'bnb',
    chainId: 56,
    name: 'BNB Chain',
    icon: '💛',
    nativeCurrency: 'BNB',
    blockExplorer: 'https://bscscan.com',
  },
  // Avalanche (AVAX) - Replaced Celo
  43114: {
    id: 'avalanche',
    chainId: 43114,
    name: 'Avalanche',
    icon: '🔺',
    nativeCurrency: 'AVAX',
    blockExplorer: 'https://snowtrace.io',
  },
  // Monad
  838592: {
    id: 'monad',
    chainId: 838592,
    name: 'Monad',
    icon: '🟣',
    nativeCurrency: 'MONAD',
    blockExplorer: 'https://explorer.monad.xyz',
  },
  // zkSync Era
  324: {
    id: 'zksync',
    chainId: 324,
    name: 'zkSync Era',
    icon: '⚡',
    nativeCurrency: 'ETH',
    blockExplorer: 'https://explorer.zksync.io',
  },
  // Solana (represented as chainId -1 for compatibility)
  [-1]: {
    id: 'solana',
    chainId: -1,
    name: 'Solana',
    icon: '◎',
    nativeCurrency: 'SOL',
    blockExplorer: 'https://solscan.io',
  },
};

// Chain list for selectors (excludes Solana from EVM operations)
export const EVM_CHAINS = Object.values(CHAINS).filter(chain => chain.chainId > 0);

// All supported chain IDs
export const SUPPORTED_CHAIN_IDS = Object.keys(CHAINS).map(Number);

// Default selected chains (Base first)
export const DEFAULT_SELECTED_CHAINS = ['base', 'ethereum', 'arbitrum', 'optimism', 'polygon'];

// Get chain by ID
export function getChainById(chainId: number): Chain | undefined {
  return CHAINS[chainId];
}

// Get chain by string ID
export function getChainByStringId(id: string): Chain | undefined {
  return Object.values(CHAINS).find(chain => chain.id === id);
}

