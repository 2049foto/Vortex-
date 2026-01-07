/**
 * Vortex Protocol - Chain Configurations
 * Multi-chain support with RPC fallback
 */

import { env } from '../config/env';
import { SUPPORTED_CHAINS } from '../config/constants';

export interface ChainConfig {
  chainId: number;
  name: string;
  nativeToken: string;
  rpcUrls: string[];
  blockExplorer: string;
  isTestnet: boolean;
}

// ============================================
// CHAIN CONFIGURATIONS
// ============================================
export const chains: Record<string, ChainConfig> = {
  ethereum: {
    chainId: SUPPORTED_CHAINS.ETHEREUM.chainId,
    name: SUPPORTED_CHAINS.ETHEREUM.name,
    nativeToken: SUPPORTED_CHAINS.ETHEREUM.nativeToken,
    rpcUrls: [
      `https://eth-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      `https://mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://eth.llamarpc.com',
      'https://ethereum.publicnode.com',
    ],
    blockExplorer: 'https://etherscan.io',
    isTestnet: false,
  },
  base: {
    chainId: SUPPORTED_CHAINS.BASE.chainId,
    name: SUPPORTED_CHAINS.BASE.name,
    nativeToken: SUPPORTED_CHAINS.BASE.nativeToken,
    rpcUrls: [
      env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS,
      `https://base-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      `https://base-mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://base.llamarpc.com',
      'https://mainnet.base.org',
    ],
    blockExplorer: 'https://basescan.org',
    isTestnet: false,
  },
  arbitrum: {
    chainId: SUPPORTED_CHAINS.ARBITRUM.chainId,
    name: SUPPORTED_CHAINS.ARBITRUM.name,
    nativeToken: SUPPORTED_CHAINS.ARBITRUM.nativeToken,
    rpcUrls: [
      `https://arb-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      `https://arbitrum-mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum.llamarpc.com',
    ],
    blockExplorer: 'https://arbiscan.io',
    isTestnet: false,
  },
  optimism: {
    chainId: SUPPORTED_CHAINS.OPTIMISM.chainId,
    name: SUPPORTED_CHAINS.OPTIMISM.name,
    nativeToken: SUPPORTED_CHAINS.OPTIMISM.nativeToken,
    rpcUrls: [
      `https://opt-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      `https://optimism-mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://mainnet.optimism.io',
      'https://optimism.llamarpc.com',
    ],
    blockExplorer: 'https://optimistic.etherscan.io',
    isTestnet: false,
  },
  polygon: {
    chainId: SUPPORTED_CHAINS.POLYGON.chainId,
    name: SUPPORTED_CHAINS.POLYGON.name,
    nativeToken: SUPPORTED_CHAINS.POLYGON.nativeToken,
    rpcUrls: [
      `https://polygon-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      `https://polygon-mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://polygon-rpc.com',
      'https://polygon.llamarpc.com',
    ],
    blockExplorer: 'https://polygonscan.com',
    isTestnet: false,
  },
  bnb: {
    chainId: SUPPORTED_CHAINS.BNB.chainId,
    name: SUPPORTED_CHAINS.BNB.name,
    nativeToken: SUPPORTED_CHAINS.BNB.nativeToken,
    rpcUrls: [
      `https://bsc-mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://bsc-dataseed.binance.org',
      'https://bsc-dataseed1.defibit.io',
      'https://rpc.ankr.com/bsc',
    ],
    blockExplorer: 'https://bscscan.com',
    isTestnet: false,
  },
  avalanche: {
    chainId: SUPPORTED_CHAINS.AVALANCHE.chainId,
    name: SUPPORTED_CHAINS.AVALANCHE.name,
    nativeToken: SUPPORTED_CHAINS.AVALANCHE.nativeToken,
    rpcUrls: [
      `https://avalanche-mainnet.infura.io/v3/${env.NEXT_PUBLIC_INFURA_PROJECT_ID}`,
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.public-rpc.com',
      'https://rpc.ankr.com/avalanche',
    ],
    blockExplorer: 'https://snowtrace.io',
    isTestnet: false,
  },
  monad: {
    chainId: SUPPORTED_CHAINS.MONAD.chainId,
    name: SUPPORTED_CHAINS.MONAD.name,
    nativeToken: SUPPORTED_CHAINS.MONAD.nativeToken,
    rpcUrls: [
      'https://rpc.monad.xyz',
      'https://monad.drpc.org',
    ],
    blockExplorer: 'https://monad.xyz/explorer',
    isTestnet: false,
  },
  zksync: {
    chainId: SUPPORTED_CHAINS.ZKSYNC.chainId,
    name: SUPPORTED_CHAINS.ZKSYNC.name,
    nativeToken: SUPPORTED_CHAINS.ZKSYNC.nativeToken,
    rpcUrls: [
      `https://zksync-mainnet.g.alchemy.com/v2/${env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
      'https://mainnet.era.zksync.io',
      'https://zksync.drpc.org',
      'https://zksync-era.blockpi.network/v1/rpc/public',
    ],
    blockExplorer: 'https://explorer.zksync.io',
    isTestnet: false,
  },
};

/**
 * Get chain configuration by ID
 */
export function getChainById(chainId: number): ChainConfig | undefined {
  return Object.values(chains).find((chain) => chain.chainId === chainId);
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.values(chains).map((chain) => chain.chainId);
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return getSupportedChainIds().includes(chainId);
}

