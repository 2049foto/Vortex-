/**
 * Vortex Protocol - Web3 Configuration
 * Reown AppKit + Wagmi v3 + Viem v2
 * Multi-chain support: 10 EVM + Solana (Phase 1)
 */

import { cookieStorage, createStorage, http } from 'wagmi';
import { 
  base, 
  mainnet, 
  arbitrum, 
  optimism, 
  polygon,
  bsc,
  avalanche,
  zkSync,
} from 'wagmi/chains';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';

// Custom Monad chain (not in wagmi/chains yet)
export const monad = {
  id: 838592,
  name: 'Monad',
  nativeCurrency: { name: 'Monad', symbol: 'MONAD', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.monad.xyz'] },
  },
  blockExplorers: {
    default: { name: 'Monad Explorer', url: 'https://monad.xyz/explorer' },
  },
} as const;

// Reown Project ID
export const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '69915bbd15f146b792917c4f1a657139';

// All 10 EVM chains supported (Solana handled separately)
export const supportedChains = [
  base,       // Primary chain (8453)
  mainnet,    // Ethereum (1)
  arbitrum,   // Arbitrum (42161)
  optimism,   // Optimism (10)
  polygon,    // Polygon (137)
  bsc,        // BNB Chain (56)
  avalanche,  // Avalanche (43114)
  zkSync,     // zkSync Era (324)
  monad,      // Monad (838592)
] as const;

// Chain IDs for easy reference
export const CHAIN_IDS = {
  BASE: 8453,
  ETHEREUM: 1,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  POLYGON: 137,
  BSC: 56,
  AVALANCHE: 43114,
  ZKSYNC: 324,
  MONAD: 838592,
  SOLANA: 0, // Non-EVM, handled separately
} as const;

// Metadata for Reown AppKit
export const metadata = {
  name: 'Vortex Protocol',
  description: 'Premium Portfolio Hygiene Engine - Gasless multi-chain consolidator optimized for Base',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://vortexbase.vercel.app',
  icons: ['https://vortexbase.vercel.app/logo.svg'],
};

// Networks array for AppKit - needs to be mutable
const networks = [
  base, mainnet, arbitrum, optimism, polygon, bsc, avalanche, zkSync, monad
] as const;

// Create Wagmi Adapter for Reown
export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({
    storage: typeof window !== 'undefined' ? cookieStorage : undefined,
  }),
  ssr: true,
  projectId,
  // @ts-expect-error - AppKit types are stricter than wagmi chains
  networks,
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS || 'https://mainnet.base.org'),
    [mainnet.id]: http(process.env.ALCHEMY_ETH_RPC || 'https://eth.llamarpc.com'),
    [arbitrum.id]: http(process.env.ALCHEMY_ARB_RPC || 'https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http(process.env.ALCHEMY_OPT_RPC || 'https://mainnet.optimism.io'),
    [polygon.id]: http(process.env.ALCHEMY_POLYGON_RPC || 'https://polygon-rpc.com'),
    [bsc.id]: http(process.env.ALCHEMY_BNB_RPC || 'https://bsc-dataseed.binance.org'),
    [avalanche.id]: http(process.env.ALCHEMY_AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc'),
    [zkSync.id]: http(process.env.ALCHEMY_ZKSYNC_RPC || 'https://mainnet.era.zksync.io'),
    [monad.id]: http('https://rpc.monad.xyz'),
  },
});

// Export wagmi config for use with WagmiProvider
export const wagmiConfig = wagmiAdapter.wagmiConfig;

/**
 * Get chain by ID
 */
export function getChain(chainId: number) {
  return supportedChains.find((c) => c.id === chainId);
}

/**
 * Get chain name by ID
 */
export function getChainName(chainId: number): string {
  const chain = getChain(chainId);
  return chain?.name || 'Unknown';
}

/**
 * Get chain color for UI
 */
export function getChainColor(chainId: number): string {
  const colors: Record<number, string> = {
    [CHAIN_IDS.BASE]: '#0052FF',
    [CHAIN_IDS.ETHEREUM]: '#627EEA',
    [CHAIN_IDS.ARBITRUM]: '#28A0F0',
    [CHAIN_IDS.OPTIMISM]: '#FF0420',
    [CHAIN_IDS.POLYGON]: '#8247E5',
    [CHAIN_IDS.BSC]: '#F0B90B',
    [CHAIN_IDS.AVALANCHE]: '#E84142',
    [CHAIN_IDS.ZKSYNC]: '#8C8DFC',
    [CHAIN_IDS.MONAD]: '#00D4AA',
    [CHAIN_IDS.SOLANA]: '#9945FF',
  };
  return colors[chainId] || '#666666';
}

/**
 * Format address for display
 */
export function formatAddress(address: string, length: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, length + 2)}...${address.slice(-length)}`;
}

/**
 * Format token amount
 */
export function formatTokenAmount(
  amount: string | number | bigint,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const value = typeof amount === 'bigint' 
    ? Number(amount) 
    : typeof amount === 'string' 
      ? parseFloat(amount) 
      : amount;
  
  const formatted = value / 10 ** decimals;
  
  if (formatted < 0.0001) return '<0.0001';
  if (formatted > 1000000) return `${(formatted / 1000000).toFixed(2)}M`;
  if (formatted > 1000) return `${(formatted / 1000).toFixed(2)}K`;
  
  return formatted.toFixed(displayDecimals);
}

/**
 * Format USD value
 */
export function formatUSD(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) return '$0.00';
  if (num < 0.01 && num > 0) return '<$0.01';
  if (num > 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num > 1000) return `$${(num / 1000).toFixed(2)}K`;
  
  return `$${num.toFixed(2)}`;
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return supportedChains.some(c => c.id === chainId);
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = getChain(chainId);
  if (!chain?.blockExplorers?.default) return '';
  return `${chain.blockExplorers.default.url}/tx/${txHash}`;
}

/**
 * Get explorer URL for address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = getChain(chainId);
  if (!chain?.blockExplorers?.default) return '';
  return `${chain.blockExplorers.default.url}/address/${address}`;
}
