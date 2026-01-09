/**
 * Vortex Protocol - API Client
 * Frontend utilities for calling backend APIs
 */

// Use Next.js API routes (same origin) or backend URL if specified
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Generic API client
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Use Next.js API routes (relative path) or full backend URL
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * Scan wallet for tokens
 */
export async function scanWallet(
  walletAddress: string,
  chainIds?: number[],
  turnstileToken?: string | null
): Promise<{
  success: boolean;
  data: {
    wallet: string;
    tokens: any[];
    summary: any;
  };
}> {
  return apiCall('/api/v1/scan', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      walletAddress, 
      // Default to all 10 EVM MAINNET chains
      chainIds: chainIds || [1, 8453, 42161, 10, 137, 56, 43114, 324, 838592],
      turnstileToken: turnstileToken || null,
    }),
  });
}

/**
 * Create consolidation
 */
export async function createConsolidation(params: {
  walletAddress: string;
  selectedTokens: Array<{
    address: string;
    chainId: number;
    symbol?: string;
    valueUSD?: number;
  }>;
  outputToken?: 'ETH' | 'USDC';
  dryRun?: boolean;
  turnstileToken?: string | null;
}): Promise<{
  success: boolean;
  data: {
    requestId: string;
    status: string;
    plan: any;
  };
}> {
  return apiCall('/api/v1/swap', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

/**
 * Get consolidation status
 */
export async function getConsolidationStatus(
  requestId: string
): Promise<{
  success: boolean;
  data: any;
}> {
  return apiCall(`/api/v1/status/${requestId}`, {
    method: 'GET',
  });
}

/**
 * Get user history
 */
export async function getUserHistory(
  walletAddress: string,
  limit: number = 10,
  offset: number = 0
): Promise<{
  success: boolean;
  data: {
    requests: any[];
    summary: any;
  };
}> {
  const params = new URLSearchParams({
    walletAddress,
    limit: limit.toString(),
    offset: offset.toString(),
  });

  return apiCall(`/api/v1/user/history?${params}`, {
    method: 'GET',
  });
}

/**
 * Get analytics dashboard
 */
export async function getAnalyticsDashboard(): Promise<{
  success: boolean;
  data: {
    overview: {
      totalPortfoliosClean: number;
      dustValueCleaned: string;
      baseTvlAdded: string;
      gasSaved: string;
      totalConsolidations: number;
      uniqueUsers: number;
    };
    timeSeries: any[];
    recentActivity: any[];
  };
}> {
  return apiCall('/api/v1/analytics/dashboard', {
    method: 'GET',
  });
}

/**
 * Verify Cloudflare Turnstile token
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  try {
    const response = await apiCall<{ success: boolean }>('/api/v1/turnstile/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    return response.success;
  } catch {
    return false;
  }
}

