/**
 * Vortex Protocol - Chain Icons & Configuration
 * Official chain logos and colors
 */

export interface ChainInfo {
  id: number;
  name: string;
  shortName: string;
  nativeToken: string;
  color: string;
  bgColor: string;
  textColor: string;
  gradientFrom: string;
  gradientTo: string;
  logoUrl: string;
  isMainnet: boolean;
}

// Official chain logos from trusted CDNs
const CHAIN_LOGO_BASE = 'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains';

export const CHAIN_CONFIG: Record<number, ChainInfo> = {
  // Ethereum Mainnet
  1: {
    id: 1,
    name: 'Ethereum',
    shortName: 'ETH',
    nativeToken: 'ETH',
    color: '#627EEA',
    bgColor: 'bg-slate-700',
    textColor: 'text-white',
    gradientFrom: '#627EEA',
    gradientTo: '#3C3C3D',
    logoUrl: `${CHAIN_LOGO_BASE}/ethereum/info/logo.png`,
    isMainnet: true,
  },
  
  // Base Mainnet
  8453: {
    id: 8453,
    name: 'Base',
    shortName: 'Base',
    nativeToken: 'ETH',
    color: '#0052FF',
    bgColor: 'bg-blue-600',
    textColor: 'text-white',
    gradientFrom: '#0052FF',
    gradientTo: '#0066FF',
    logoUrl: 'https://raw.githubusercontent.com/base-org/brand-kit/main/logo/symbol/Base_Symbol_Blue.png',
    isMainnet: true,
  },
  
  // Arbitrum One
  42161: {
    id: 42161,
    name: 'Arbitrum',
    shortName: 'ARB',
    nativeToken: 'ETH',
    color: '#28A0F0',
    bgColor: 'bg-blue-500',
    textColor: 'text-white',
    gradientFrom: '#28A0F0',
    gradientTo: '#12AAFF',
    logoUrl: `${CHAIN_LOGO_BASE}/arbitrum/info/logo.png`,
    isMainnet: true,
  },
  
  // Optimism
  10: {
    id: 10,
    name: 'Optimism',
    shortName: 'OP',
    nativeToken: 'ETH',
    color: '#FF0420',
    bgColor: 'bg-red-500',
    textColor: 'text-white',
    gradientFrom: '#FF0420',
    gradientTo: '#FF3D54',
    logoUrl: `${CHAIN_LOGO_BASE}/optimism/info/logo.png`,
    isMainnet: true,
  },
  
  // Polygon
  137: {
    id: 137,
    name: 'Polygon',
    shortName: 'POL',
    nativeToken: 'POL',
    color: '#8247E5',
    bgColor: 'bg-purple-600',
    textColor: 'text-white',
    gradientFrom: '#8247E5',
    gradientTo: '#A563FF',
    logoUrl: `${CHAIN_LOGO_BASE}/polygon/info/logo.png`,
    isMainnet: true,
  },
  
  // BNB Chain
  56: {
    id: 56,
    name: 'BNB Chain',
    shortName: 'BNB',
    nativeToken: 'BNB',
    color: '#F0B90B',
    bgColor: 'bg-yellow-500',
    textColor: 'text-black',
    gradientFrom: '#F0B90B',
    gradientTo: '#FCD535',
    logoUrl: `${CHAIN_LOGO_BASE}/binance/info/logo.png`,
    isMainnet: true,
  },
  
  // Avalanche C-Chain
  43114: {
    id: 43114,
    name: 'Avalanche',
    shortName: 'AVAX',
    nativeToken: 'AVAX',
    color: '#E84142',
    bgColor: 'bg-red-600',
    textColor: 'text-white',
    gradientFrom: '#E84142',
    gradientTo: '#FF5B5C',
    logoUrl: `${CHAIN_LOGO_BASE}/avalanchec/info/logo.png`,
    isMainnet: true,
  },
  
  // zkSync Era
  324: {
    id: 324,
    name: 'zkSync Era',
    shortName: 'zkS',
    nativeToken: 'ETH',
    color: '#8C8DFC',
    bgColor: 'bg-violet-500',
    textColor: 'text-white',
    gradientFrom: '#8C8DFC',
    gradientTo: '#A5A6FF',
    logoUrl: 'https://zksync.io/favicon-32x32.png',
    isMainnet: true,
  },
  
  // Solana (chainId 0 for internal use)
  0: {
    id: 0,
    name: 'Solana',
    shortName: 'SOL',
    nativeToken: 'SOL',
    color: '#9945FF',
    bgColor: 'bg-gradient-to-r from-purple-500 to-teal-400',
    textColor: 'text-white',
    gradientFrom: '#9945FF',
    gradientTo: '#14F195',
    logoUrl: `${CHAIN_LOGO_BASE}/solana/info/logo.png`,
    isMainnet: true,
  },
};

// Mainnet chain IDs only (for filtering)
export const MAINNET_CHAIN_IDS = Object.values(CHAIN_CONFIG)
  .filter(c => c.isMainnet && c.id !== 0) // Exclude Solana (handled separately)
  .map(c => c.id);

// All chain IDs including Solana
export const ALL_CHAIN_IDS = Object.keys(CHAIN_CONFIG).map(Number);

/**
 * Get chain info by ID
 */
export function getChainInfo(chainId: number): ChainInfo | undefined {
  return CHAIN_CONFIG[chainId];
}

/**
 * Get chain logo URL
 */
export function getChainLogoUrl(chainId: number): string {
  const chain = CHAIN_CONFIG[chainId];
  if (chain) return chain.logoUrl;
  
  // Default fallback
  return `https://ui-avatars.com/api/?name=${chainId}&background=6366f1&color=fff&size=32`;
}

/**
 * Get chain color
 */
export function getChainColor(chainId: number): string {
  return CHAIN_CONFIG[chainId]?.color || '#6366f1';
}

/**
 * Get chain gradient style
 */
export function getChainGradient(chainId: number): string {
  const chain = CHAIN_CONFIG[chainId];
  if (!chain) return 'linear-gradient(135deg, #6366f1, #8b5cf6)';
  return `linear-gradient(135deg, ${chain.gradientFrom}, ${chain.gradientTo})`;
}

/**
 * Is chain supported?
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in CHAIN_CONFIG;
}

/**
 * Get display name for chain
 */
export function getChainDisplayName(chainId: number, short = false): string {
  const chain = CHAIN_CONFIG[chainId];
  if (!chain) return `Chain ${chainId}`;
  return short ? chain.shortName : chain.name;
}
