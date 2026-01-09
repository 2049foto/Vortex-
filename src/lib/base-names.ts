/**
 * Vortex Protocol - Base Names Integration
 * Resolve .base.eth names and display user identities
 * Critical for Base Grant eligibility
 */

import { createPublicClient, http, namehash, Address } from 'viem';
import { base, mainnet } from 'viem/chains';

// Base Name Service contract on Base mainnet
const BASE_RESOLVER_ADDRESS = '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' as const;

// Universal Resolver on Ethereum mainnet (for .eth names)
const ENS_UNIVERSAL_RESOLVER = '0xc0497E381f536Be9ce14B0dD3817cBcAe57d2F62' as const;

// Create clients
const baseClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

const mainnetClient = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

export interface ResolvedName {
  address: Address;
  name: string;
  avatar?: string;
  displayName?: string;
}

/**
 * Resolve a Base Name (.base.eth) to an address
 */
export async function resolveBaseName(name: string): Promise<Address | null> {
  try {
    // Normalize name
    const normalizedName = name.toLowerCase().trim();
    
    // If it's already an address, return it
    if (/^0x[a-fA-F0-9]{40}$/.test(normalizedName)) {
      return normalizedName as Address;
    }

    // If it ends with .base.eth, resolve using Base resolver
    if (normalizedName.endsWith('.base.eth')) {
      const node = namehash(normalizedName);
      
      // Call resolver to get address
      const address = await baseClient.readContract({
        address: BASE_RESOLVER_ADDRESS,
        abi: [
          {
            inputs: [{ name: 'node', type: 'bytes32' }],
            name: 'addr',
            outputs: [{ name: '', type: 'address' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'addr',
        args: [node],
      });

      return address as Address;
    }

    // If it ends with .eth (not .base.eth), resolve using ENS
    if (normalizedName.endsWith('.eth')) {
      const address = await mainnetClient.getEnsAddress({
        name: normalizedName,
      });
      return address;
    }

    // Try adding .base.eth if no suffix
    if (!normalizedName.includes('.')) {
      return resolveBaseName(`${normalizedName}.base.eth`);
    }

    return null;
  } catch (error) {
    console.error('Failed to resolve name:', error);
    return null;
  }
}

/**
 * Reverse resolve an address to its Base Name
 */
export async function getBaseName(address: Address): Promise<string | null> {
  try {
    // First try Base Names
    const baseNode = namehash(`${address.slice(2).toLowerCase()}.addr.reverse`);
    
    const baseName = await baseClient.readContract({
      address: BASE_RESOLVER_ADDRESS,
      abi: [
        {
          inputs: [{ name: 'node', type: 'bytes32' }],
          name: 'name',
          outputs: [{ name: '', type: 'string' }],
          stateMutability: 'view',
          type: 'function',
        },
      ],
      functionName: 'name',
      args: [baseNode],
    }).catch(() => null);

    if (baseName) return baseName;

    // Fallback to ENS
    const ensName = await mainnetClient.getEnsName({ address });
    return ensName;
  } catch (error) {
    console.error('Failed to get name for address:', error);
    return null;
  }
}

/**
 * Get avatar for a name
 */
export async function getAvatar(nameOrAddress: string): Promise<string | null> {
  try {
    // If address, try to resolve to name first
    let name = nameOrAddress;
    if (/^0x[a-fA-F0-9]{40}$/.test(nameOrAddress)) {
      const resolved = await getBaseName(nameOrAddress as Address);
      if (resolved) name = resolved;
      else return null;
    }

    // Get avatar text record
    if (name.endsWith('.base.eth')) {
      const node = namehash(name);
      const avatar = await baseClient.readContract({
        address: BASE_RESOLVER_ADDRESS,
        abi: [
          {
            inputs: [
              { name: 'node', type: 'bytes32' },
              { name: 'key', type: 'string' },
            ],
            name: 'text',
            outputs: [{ name: '', type: 'string' }],
            stateMutability: 'view',
            type: 'function',
          },
        ],
        functionName: 'text',
        args: [node, 'avatar'],
      }).catch(() => null);

      return avatar || null;
    }

    // ENS avatar
    if (name.endsWith('.eth')) {
      const avatar = await mainnetClient.getEnsAvatar({ name });
      return avatar;
    }

    return null;
  } catch (error) {
    console.error('Failed to get avatar:', error);
    return null;
  }
}

/**
 * Format address for display (with name if available)
 */
export async function formatAddressWithName(address: Address): Promise<ResolvedName> {
  const name = await getBaseName(address);
  const avatar = name ? await getAvatar(name) : null;

  return {
    address,
    name: name || '',
    avatar: avatar || undefined,
    displayName: name || `${address.slice(0, 6)}...${address.slice(-4)}`,
  };
}

/**
 * Check if an address has a Base Name
 */
export async function hasBaseName(address: Address): Promise<boolean> {
  const name = await getBaseName(address);
  return !!name && name.endsWith('.base.eth');
}

/**
 * Generate Basescan link
 */
export function getBasescanLink(addressOrTx: string, type: 'address' | 'tx' = 'address'): string {
  return `https://basescan.org/${type}/${addressOrTx}`;
}

/**
 * Generate Base Name registration link
 */
export function getBaseNameRegistrationLink(name?: string): string {
  const base = 'https://www.base.org/names';
  return name ? `${base}?name=${name}` : base;
}
