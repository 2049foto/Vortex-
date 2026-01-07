/**
 * Vortex Protocol - Web3 Configuration
 * Wagmi v3 + Viem v2 + Multi-chain support (10 EVM + Solana)
 */

import { createConfig, http } from 'wagmi';
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
import { coinbaseWallet, walletConnect, injected } from 'wagmi/connectors';

// Custom Monad chain (not in wagmi/chains yet)
const monad = {
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

// All 10 EVM chains supported (Solana handled separately)
export const supportedChains = [
  base,       // Primary chain
  mainnet,    // Ethereum
  arbitrum,   // Arbitrum
  optimism,   // Optimism
  polygon,    // Polygon
  bsc,        // BNB Chain
  avalanche,  // Avalanche
  zkSync,     // zkSync Era
  monad,      // Monad
] as const;

// Connectors - only initialize on client
const getConnectors = () => {
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '69915bbd15f146b792917c4f1a657139';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dust-sweeper-yrjq.vercel.app';
  
  // Skip WalletConnect on server to avoid indexedDB error
  if (typeof window === 'undefined') {
    return [
      coinbaseWallet({
        appName: 'Vortex Protocol',
        appLogoUrl: `${appUrl}/logo.png`,
      }),
    ];
  }

  return [
    // MetaMask and other injected wallets
    injected({
      shimDisconnect: true,
    }),
    // Coinbase Wallet (supports Smart Wallet)
    coinbaseWallet({
      appName: 'Vortex Protocol',
      appLogoUrl: `${appUrl}/logo.png`,
    }),
    // WalletConnect for mobile wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'Vortex Protocol',
        description: 'Premium Portfolio Hygiene Engine - Gasless consolidator for Base',
        url: appUrl,
        icons: [`${appUrl}/logo.png`],
      },
      showQrModal: true,
    }),
  ];
};

// Wagmi configuration with all 10 EVM chains
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: getConnectors(),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_QUICKNODE_BASE_HTTPS || 'https://mainnet.base.org'),
    [mainnet.id]: http('https://eth.llamarpc.com'),
    [arbitrum.id]: http('https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http('https://mainnet.optimism.io'),
    [polygon.id]: http('https://polygon-rpc.com'),
    [bsc.id]: http('https://bsc-dataseed.binance.org'),
    [avalanche.id]: http('https://api.avax.network/ext/bc/C/rpc'),
    [zkSync.id]: http('https://mainnet.era.zksync.io'),
    [monad.id]: http('https://rpc.monad.xyz'),
  },
  ssr: true,
});

/**
 * Get chain name by ID
 */
export function getChainName(chainId: number): string {
  const chain = supportedChains.find((c) => c.id === chainId);
  return chain?.name || 'Unknown';
}

/**
 * Get chain logo URL
 */
export function getChainLogo(chainId: number): string {
  const logos: Record<number, string> = {
    1: '/chains/ethereum.svg',
    8453: '/chains/base.svg',
    42161: '/chains/arbitrum.svg',
    10: '/chains/optimism.svg',
    137: '/chains/polygon.svg',
  };
  return logos[chainId] || '/chains/unknown.svg';
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
  amount: string | number,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
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
  
  if (num < 0.01) return '<$0.01';
  if (num > 1000000) return `$${(num / 1000000).toFixed(2)}M`;
  if (num > 1000) return `$${(num / 1000).toFixed(2)}K`;
  
  return `$${num.toFixed(2)}`;
}

