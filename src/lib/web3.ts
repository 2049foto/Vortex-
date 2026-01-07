/**
 * Vortex Protocol - Web3 Configuration
 * Wagmi v3 + Viem v2 + Reown AppKit v6
 */

import { createConfig, http } from 'wagmi';
import { base, mainnet, arbitrum, optimism, polygon } from 'wagmi/chains';
import { coinbaseWallet, walletConnect } from 'wagmi/connectors';

// Custom chains can be added here
export const supportedChains = [
  base, // Base - Primary chain
  mainnet,
  arbitrum,
  optimism,
  polygon,
] as const;

// Connectors - only initialize on client
const getConnectors = () => {
  // Skip WalletConnect on server to avoid indexedDB error
  if (typeof window === 'undefined') {
    return [
      coinbaseWallet({
        appName: 'Vortex Protocol',
        appLogoUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/logo.png`,
        preference: {
          options: 'smartWalletOnly', // Force Smart Wallet
        },
      }),
    ];
  }

  return [
    coinbaseWallet({
      appName: 'Vortex Protocol',
      appLogoUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/logo.png`,
      preference: {
        options: 'smartWalletOnly', // Force Smart Wallet
      },
    }),
    walletConnect({
      projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
      metadata: {
        name: 'Vortex Protocol',
        description: 'Premium Portfolio Hygiene Engine',
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        icons: [`${process.env.NEXT_PUBLIC_APP_URL || ''}/logo.png`],
      },
      showQrModal: true,
    }),
  ];
};

// Wagmi configuration
export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: getConnectors(),
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org'),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL || 'https://eth.llamarpc.com'),
    [arbitrum.id]: http(process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'),
    [optimism.id]: http(process.env.NEXT_PUBLIC_OPTIMISM_RPC_URL || 'https://mainnet.optimism.io'),
    [polygon.id]: http(process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com'),
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

