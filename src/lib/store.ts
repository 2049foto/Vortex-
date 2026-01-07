/**
 * Vortex Protocol - Zustand Store
 * Global state management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TokenHolding } from '../services/portfolioService';
import type { RiskScore } from '../services/riskScoringService';

// ============================================
// WALLET STATE
// ============================================
interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  setWallet: (address: string | null, chainId?: number | null) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  isConnected: false,
  chainId: null,
  setWallet: (address, chainId = null) =>
    set({
      address,
      isConnected: !!address,
      chainId,
    }),
  disconnect: () =>
    set({
      address: null,
      isConnected: false,
      chainId: null,
    }),
}));

// ============================================
// SCAN STATE
// ============================================
interface ScanState {
  isScanning: boolean;
  lastScanTime: number | null;
  tokens: TokenHolding[];
  riskScores: Map<string, RiskScore>;
  selectedTokens: Set<string>;
  
  startScan: () => void;
  completeScan: (tokens: TokenHolding[], riskScores: Map<string, RiskScore>) => void;
  clearScan: () => void;
  toggleTokenSelection: (tokenKey: string) => void;
  selectAllDust: () => void;
  clearSelection: () => void;
}

export const useScanStore = create<ScanState>((set, get) => ({
  isScanning: false,
  lastScanTime: null,
  tokens: [],
  riskScores: new Map(),
  selectedTokens: new Set(),

  startScan: () => set({ isScanning: true }),
  
  completeScan: (tokens, riskScores) =>
    set({
      isScanning: false,
      lastScanTime: Date.now(),
      tokens,
      riskScores,
    }),
  
  clearScan: () =>
    set({
      tokens: [],
      riskScores: new Map(),
      selectedTokens: new Set(),
      lastScanTime: null,
    }),
  
  toggleTokenSelection: (tokenKey) =>
    set((state) => {
      const newSelected = new Set(state.selectedTokens);
      if (newSelected.has(tokenKey)) {
        newSelected.delete(tokenKey);
      } else {
        newSelected.add(tokenKey);
      }
      return { selectedTokens: newSelected };
    }),
  
  selectAllDust: () =>
    set((state) => {
      const dustTokens = state.tokens.filter((t) => {
        const score = state.riskScores.get(`${t.chainId}:${t.address}`);
        return score?.tier === 'DUST' || score?.tier === 'MICRODUST';
      });
      return {
        selectedTokens: new Set(dustTokens.map((t) => `${t.chainId}:${t.address}`)),
      };
    }),
  
  clearSelection: () => set({ selectedTokens: new Set() }),
}));

// ============================================
// CONSOLIDATION STATE
// ============================================
type ConsolidationStatus = 'idle' | 'simulating' | 'bundling' | 'pending' | 'confirmed' | 'failed';

interface ConsolidationState {
  status: ConsolidationStatus;
  consolidationId: string | null;
  txHash: string | null;
  error: string | null;
  estimatedOutput: number;
  actualOutput: number | null;
  gasSaved: number;
  
  startConsolidation: (id: string) => void;
  updateStatus: (status: ConsolidationStatus, txHash?: string) => void;
  setResult: (actualOutput: number, gasSaved: number) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const useConsolidationStore = create<ConsolidationState>((set) => ({
  status: 'idle',
  consolidationId: null,
  txHash: null,
  error: null,
  estimatedOutput: 0,
  actualOutput: null,
  gasSaved: 0,

  startConsolidation: (id) =>
    set({
      status: 'simulating',
      consolidationId: id,
      txHash: null,
      error: null,
    }),
  
  updateStatus: (status, txHash) =>
    set((state) => ({
      status,
      txHash: txHash || state.txHash,
    })),
  
  setResult: (actualOutput, gasSaved) =>
    set({
      status: 'confirmed',
      actualOutput,
      gasSaved,
    }),
  
  setError: (error) =>
    set({
      status: 'failed',
      error,
    }),
  
  reset: () =>
    set({
      status: 'idle',
      consolidationId: null,
      txHash: null,
      error: null,
      estimatedOutput: 0,
      actualOutput: null,
      gasSaved: 0,
    }),
}));

// ============================================
// UI STATE
// ============================================
interface UIState {
  theme: 'light' | 'dark' | 'system';
  isMobileMenuOpen: boolean;
  isWalletModalOpen: boolean;
  activeTab: string;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setWalletModalOpen: (open: boolean) => void;
  setActiveTab: (tab: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'system',
      isMobileMenuOpen: false,
      isWalletModalOpen: false,
      activeTab: 'all',

      setTheme: (theme) => set({ theme }),
      toggleMobileMenu: () =>
        set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ isMobileMenuOpen: open }),
      setWalletModalOpen: (open) => set({ isWalletModalOpen: open }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'vortex-ui-state',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
);

// ============================================
// USER PREFERENCES
// ============================================
interface UserPreferences {
  defaultOutputToken: 'ETH' | 'USDC';
  slippageTolerance: number;
  autoHideMicrodust: boolean;
  notificationsEnabled: boolean;
  
  setDefaultOutputToken: (token: 'ETH' | 'USDC') => void;
  setSlippageTolerance: (slippage: number) => void;
  setAutoHideMicrodust: (hide: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

export const usePreferencesStore = create<UserPreferences>()(
  persist(
    (set) => ({
      defaultOutputToken: 'ETH',
      slippageTolerance: 0.5,
      autoHideMicrodust: true,
      notificationsEnabled: true,

      setDefaultOutputToken: (token) => set({ defaultOutputToken: token }),
      setSlippageTolerance: (slippage) => set({ slippageTolerance: slippage }),
      setAutoHideMicrodust: (hide) => set({ autoHideMicrodust: hide }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
    }),
    {
      name: 'vortex-user-preferences',
    }
  )
);

