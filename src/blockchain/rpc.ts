/**
 * Vortex Protocol - RPC Client
 * Multi-provider with automatic fallback
 */

import { createPublicClient, http, PublicClient, Chain } from 'viem';
import { getChainById } from './chains';
import { TIMEOUTS } from '../config/constants';
import { retry } from '../utils/helpers';
import { createLogger } from '../utils/logger';

const logger = createLogger('rpc');

// Cache for RPC clients
const clientCache = new Map<number, PublicClient>();

/**
 * Get viem chain config from chain ID
 */
function getViemChain(chainId: number): Chain {
  const config = getChainById(chainId);
  if (!config) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  return {
    id: chainId,
    name: config.name,
    network: config.name.toLowerCase().replace(' ', '-'),
    nativeCurrency: {
      name: config.nativeToken,
      symbol: config.nativeToken,
      decimals: 18,
    },
    rpcUrls: {
      default: { http: [config.rpcUrls[0]] },
      public: { http: config.rpcUrls },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: config.blockExplorer },
    },
  };
}

/**
 * Create RPC client with fallback support
 */
export function getRpcClient(chainId: number): PublicClient {
  // Check cache
  if (clientCache.has(chainId)) {
    return clientCache.get(chainId)!;
  }

  const chain = getViemChain(chainId);
  const config = getChainById(chainId)!;

  // Create client with fallback transport
  const client = createPublicClient({
    chain,
    transport: http(config.rpcUrls[0], {
      timeout: TIMEOUTS.RPC,
      retryCount: 0, // We handle retries manually
    }),
  });

  clientCache.set(chainId, client);
  return client;
}

/**
 * Call RPC with automatic fallback across providers
 */
export async function callWithFallback<T>(
  chainId: number,
  fn: (client: PublicClient) => Promise<T>
): Promise<T> {
  const config = getChainById(chainId);
  if (!config) {
    throw new Error(`Chain ${chainId} not supported`);
  }

  const chain = getViemChain(chainId);
  let lastError: Error | undefined;

  // Try each RPC URL
  for (const [index, rpcUrl] of config.rpcUrls.entries()) {
    try {
      const client = createPublicClient({
        chain,
        transport: http(rpcUrl, {
          timeout: TIMEOUTS.RPC,
        }),
      });

      return await retry(() => fn(client), {
        maxAttempts: 2,
        initialDelay: 500,
        onRetry: (error, attempt) => {
          logger.debug(
            { chainId, rpcUrl, attempt, error: error.message },
            'RPC call retry'
          );
        },
      });
    } catch (error) {
      lastError = error as Error;
      logger.warn(
        {
          chainId,
          rpcUrl,
          providerIndex: index,
          error: lastError.message,
        },
        'RPC provider failed, trying next'
      );
      continue;
    }
  }

  // All providers failed
  logger.error({ chainId, error: lastError?.message }, 'All RPC providers failed');
  throw new Error(`RPC call failed for chain ${chainId}: ${lastError?.message}`);
}

/**
 * Get block number
 */
export async function getBlockNumber(chainId: number): Promise<bigint> {
  return callWithFallback(chainId, async (client) => {
    return await client.getBlockNumber();
  });
}

/**
 * Get gas price
 */
export async function getGasPrice(chainId: number): Promise<bigint> {
  return callWithFallback(chainId, async (client) => {
    return await client.getGasPrice();
  });
}

/**
 * Estimate gas
 */
export async function estimateGas(
  chainId: number,
  params: {
    account: `0x${string}`;
    to: `0x${string}`;
    data: `0x${string}`;
    value?: bigint;
  }
): Promise<bigint> {
  return callWithFallback(chainId, async (client) => {
    return await client.estimateGas(params);
  });
}

/**
 * Get transaction receipt
 */
export async function getTransactionReceipt(
  chainId: number,
  hash: `0x${string}`
) {
  return callWithFallback(chainId, async (client) => {
    return await client.getTransactionReceipt({ hash });
  });
}

/**
 * Wait for transaction
 */
export async function waitForTransaction(
  chainId: number,
  hash: `0x${string}`,
  confirmations: number = 1
) {
  return callWithFallback(chainId, async (client) => {
    return await client.waitForTransactionReceipt({
      hash,
      confirmations,
      timeout: 60_000, // 60 seconds
    });
  });
}

/**
 * Get token balance
 */
export async function getTokenBalance(
  chainId: number,
  tokenAddress: `0x${string}`,
  walletAddress: `0x${string}`
): Promise<bigint> {
  return callWithFallback(chainId, async (client) => {
    const data = await client.readContract({
      address: tokenAddress,
      abi: [
        {
          name: 'balanceOf',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'account', type: 'address' }],
          outputs: [{ name: '', type: 'uint256' }],
        },
      ],
      functionName: 'balanceOf',
      args: [walletAddress],
    });
    return data as bigint;
  });
}

/**
 * Get ETH balance
 */
export async function getEthBalance(
  chainId: number,
  address: `0x${string}`
): Promise<bigint> {
  return callWithFallback(chainId, async (client) => {
    return await client.getBalance({ address });
  });
}

