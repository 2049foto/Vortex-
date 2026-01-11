/**
 * Vortex Protocol - Centralized Chain Configuration
 * Single source of truth for all chain-related data
 * 
 * M-003/L-003: Eliminates duplicated chain mappings across files
 */

export interface ChainConfig {
  chainId: number;
  name: string;
  shortName: string;
  nativeToken: string;
  nativeTokenDecimals: number;
  color: string;
  icon: string;
  enabled: boolean;
  
  // API identifiers
  moralisId?: string;
  alchemySubdomain?: string;
  dexscreenerId?: string;
  coingeckoId?: string;
  
  // RPC
  rpcUrl?: string;
  blockExplorerUrl?: string;
  
  // Bridge support
  relaySupported: boolean;
  
  // Priority (higher = faster/cheaper)
  priority: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVM CHAINS (Mainnet Only)
// ═══════════════════════════════════════════════════════════════════════════════

export const EVM_CHAINS: Record<number, ChainConfig> = {
  // Base - Primary target chain
  8453: {
    chainId: 8453,
    name: 'Base',
    shortName: 'base',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    color: '#0052FF',
    icon: '🔵',
    enabled: true,
    moralisId: 'base',
    alchemySubdomain: 'base-mainnet',
    dexscreenerId: 'base',
    coingeckoId: 'ethereum',
    blockExplorerUrl: 'https://basescan.org',
    relaySupported: true,
    priority: 10,
  },
  
  // Arbitrum - Fast L2
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    shortName: 'arb',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    color: '#28A0F0',
    icon: '🔷',
    enabled: true,
    moralisId: 'arbitrum',
    alchemySubdomain: 'arb-mainnet',
    dexscreenerId: 'arbitrum',
    coingeckoId: 'ethereum',
    blockExplorerUrl: 'https://arbiscan.io',
    relaySupported: true,
    priority: 9,
  },
  
  // Optimism - Fast L2
  10: {
    chainId: 10,
    name: 'Optimism',
    shortName: 'op',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    color: '#FF0420',
    icon: '🔴',
    enabled: true,
    moralisId: 'optimism',
    alchemySubdomain: 'opt-mainnet',
    dexscreenerId: 'optimism',
    coingeckoId: 'ethereum',
    blockExplorerUrl: 'https://optimistic.etherscan.io',
    relaySupported: true,
    priority: 8,
  },
  
  // Polygon - Cheap
  137: {
    chainId: 137,
    name: 'Polygon',
    shortName: 'polygon',
    nativeToken: 'POL',
    nativeTokenDecimals: 18,
    color: '#8247E5',
    icon: '💜',
    enabled: true,
    moralisId: 'polygon',
    alchemySubdomain: 'polygon-mainnet',
    dexscreenerId: 'polygon',
    coingeckoId: 'matic-network',
    blockExplorerUrl: 'https://polygonscan.com',
    relaySupported: true,
    priority: 7,
  },
  
  // BNB Chain
  56: {
    chainId: 56,
    name: 'BNB Chain',
    shortName: 'bsc',
    nativeToken: 'BNB',
    nativeTokenDecimals: 18,
    color: '#F0B90B',
    icon: '🟡',
    enabled: true,
    moralisId: 'bsc',
    alchemySubdomain: 'bnb-mainnet',
    dexscreenerId: 'bsc',
    coingeckoId: 'binancecoin',
    blockExplorerUrl: 'https://bscscan.com',
    relaySupported: true,
    priority: 6,
  },
  
  // Avalanche
  43114: {
    chainId: 43114,
    name: 'Avalanche',
    shortName: 'avax',
    nativeToken: 'AVAX',
    nativeTokenDecimals: 18,
    color: '#E84142',
    icon: '🔺',
    enabled: true,
    moralisId: 'avalanche',
    alchemySubdomain: 'avax-mainnet',
    dexscreenerId: 'avalanche',
    coingeckoId: 'avalanche-2',
    blockExplorerUrl: 'https://snowtrace.io',
    relaySupported: true,
    priority: 5,
  },
  
  // zkSync Era
  324: {
    chainId: 324,
    name: 'zkSync Era',
    shortName: 'zksync',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    color: '#8C8DFC',
    icon: '⬡',
    enabled: true,
    moralisId: 'zksync',
    alchemySubdomain: 'zksync-mainnet',
    dexscreenerId: 'zksync',
    coingeckoId: 'ethereum',
    blockExplorerUrl: 'https://explorer.zksync.io',
    relaySupported: true,
    priority: 4,
  },
  
  // Ethereum Mainnet - Expensive but foundational
  1: {
    chainId: 1,
    name: 'Ethereum',
    shortName: 'eth',
    nativeToken: 'ETH',
    nativeTokenDecimals: 18,
    color: '#627EEA',
    icon: '⟠',
    enabled: true,
    moralisId: 'eth',
    alchemySubdomain: 'eth-mainnet',
    dexscreenerId: 'ethereum',
    coingeckoId: 'ethereum',
    blockExplorerUrl: 'https://etherscan.io',
    relaySupported: true,
    priority: 3,
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SOLANA
// ═══════════════════════════════════════════════════════════════════════════════

export const SOLANA_CHAIN: ChainConfig = {
  chainId: 0, // Special identifier for non-EVM
  name: 'Solana',
  shortName: 'sol',
  nativeToken: 'SOL',
  nativeTokenDecimals: 9,
  color: '#9945FF',
  icon: '◎',
  enabled: true,
  coingeckoId: 'solana',
  blockExplorerUrl: 'https://solscan.io',
  relaySupported: false, // Relay doesn't support Solana yet
  priority: 2,
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get chain config by ID
 */
export function getChainConfig(chainId: number): ChainConfig | undefined {
  if (chainId === 0) return SOLANA_CHAIN;
  return EVM_CHAINS[chainId];
}

/**
 * Get all supported chain IDs
 */
export function getSupportedChainIds(): number[] {
  return Object.keys(EVM_CHAINS).map(Number);
}

/**
 * Get all enabled chains
 */
export function getEnabledChains(): ChainConfig[] {
  return Object.values(EVM_CHAINS).filter(c => c.enabled);
}

/**
 * Get chains sorted by priority (highest first)
 */
export function getChainsByPriority(): ChainConfig[] {
  return Object.values(EVM_CHAINS)
    .filter(c => c.enabled)
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Get Moralis chain name
 */
export function getMoralisChainName(chainId: number): string | undefined {
  return EVM_CHAINS[chainId]?.moralisId;
}

/**
 * Get Alchemy subdomain
 */
export function getAlchemySubdomain(chainId: number): string | undefined {
  return EVM_CHAINS[chainId]?.alchemySubdomain;
}

/**
 * Get CoinGecko ID for native token price
 */
export function getCoinGeckoId(chainId: number): string | undefined {
  if (chainId === 0) return SOLANA_CHAIN.coingeckoId;
  return EVM_CHAINS[chainId]?.coingeckoId;
}

/**
 * Get DexScreener chain identifier
 */
export function getDexScreenerChain(chainId: number): string | undefined {
  return EVM_CHAINS[chainId]?.dexscreenerId;
}

/**
 * Check if Relay bridge is supported for chain pair
 */
export function isRelaySupported(fromChainId: number, toChainId: number): boolean {
  const fromChain = getChainConfig(fromChainId);
  const toChain = getChainConfig(toChainId);
  return !!(fromChain?.relaySupported && toChain?.relaySupported);
}

/**
 * Get block explorer URL for transaction
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const chain = getChainConfig(chainId);
  if (!chain?.blockExplorerUrl) return '';
  return `${chain.blockExplorerUrl}/tx/${txHash}`;
}

/**
 * Get block explorer URL for address
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const chain = getChainConfig(chainId);
  if (!chain?.blockExplorerUrl) return '';
  return `${chain.blockExplorerUrl}/address/${address}`;
}

// Output chain configuration
export const OUTPUT_CHAIN_ID = 8453; // Base
export const OUTPUT_TOKENS = {
  ETH: '0x4200000000000000000000000000000000000006', // WETH on Base
  USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC on Base
} as const;

// Native token sentinel address
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
