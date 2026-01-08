/**
 * Vortex Protocol - Gamification System
 * XP, Levels, Streaks, and Achievements
 */

// ================================================
// XP & LEVEL CONFIGURATION
// ================================================

// XP rewards for different actions
export const XP_REWARDS = {
  SCAN_COMPLETE: 25,        // Complete a scan
  CONSOLIDATE_DUST: 50,     // Per token consolidated (DUST tier)
  CONSOLIDATE_MICRODUST: 10, // Per token consolidated (MICRODUST tier)
  CONSOLIDATE_LEGIT: 100,   // Per token consolidated (LEGIT tier)
  FIRST_SCAN: 100,          // First ever scan bonus
  FIRST_CONSOLIDATION: 200, // First ever consolidation bonus
  DAILY_LOGIN: 15,          // Daily login bonus
  STREAK_BONUS: 10,         // Per day of streak
  REFERRAL: 500,            // For referring a new user
  SHARE_SOCIAL: 50,         // For sharing on social
  MULTI_CHAIN_SCAN: 75,     // Scan across 5+ chains
  HIGH_VALUE_CLEAN: 150,    // Consolidate >$100 in one go
  GAS_SAVER: 100,           // Save >$10 in gas
} as const;

// Level thresholds
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  250,    // Level 2
  600,    // Level 3
  1100,   // Level 4
  1800,   // Level 5
  2700,   // Level 6
  3800,   // Level 7
  5100,   // Level 8
  6600,   // Level 9
  8300,   // Level 10
  10200,  // Level 11
  12300,  // Level 12
  14600,  // Level 13
  17100,  // Level 14
  19800,  // Level 15
  22700,  // Level 16
  25800,  // Level 17
  29100,  // Level 18
  32600,  // Level 19
  36300,  // Level 20 - Max
];

// Level titles
export const LEVEL_TITLES: Record<number, string> = {
  1: 'Dust Novice',
  2: 'Token Apprentice',
  3: 'Portfolio Cadet',
  4: 'Chain Explorer',
  5: 'Sweep Specialist',
  6: 'Consolidator',
  7: 'Multi-Chain Pro',
  8: 'Dust Destroyer',
  9: 'Value Hunter',
  10: 'Portfolio Master',
  11: 'Chain Conqueror',
  12: 'Sweep Commander',
  13: 'Dust Dominator',
  14: 'Elite Cleaner',
  15: 'Vortex Veteran',
  16: 'Legendary Sweeper',
  17: 'Portfolio Sage',
  18: 'Chain Champion',
  19: 'Dust Legend',
  20: 'Vortex Grand Master',
};

// ================================================
// ACHIEVEMENTS SYSTEM
// ================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'scan' | 'consolidate' | 'streak' | 'social' | 'special';
  requirement: number;
  xpReward: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const ACHIEVEMENTS: Achievement[] = [
  // SCAN ACHIEVEMENTS
  {
    id: 'first_scan',
    name: 'First Glimpse',
    description: 'Complete your first portfolio scan',
    icon: '👀',
    category: 'scan',
    requirement: 1,
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'scan_10',
    name: 'Frequent Scanner',
    description: 'Complete 10 portfolio scans',
    icon: '🔍',
    category: 'scan',
    requirement: 10,
    xpReward: 200,
    rarity: 'common',
  },
  {
    id: 'scan_50',
    name: 'Scan Enthusiast',
    description: 'Complete 50 portfolio scans',
    icon: '🔬',
    category: 'scan',
    requirement: 50,
    xpReward: 500,
    rarity: 'rare',
  },
  {
    id: 'scan_100',
    name: 'Portfolio Analyst',
    description: 'Complete 100 portfolio scans',
    icon: '📊',
    category: 'scan',
    requirement: 100,
    xpReward: 1000,
    rarity: 'epic',
  },
  {
    id: 'multi_chain_master',
    name: 'Multi-Chain Master',
    description: 'Scan tokens across all 11 chains',
    icon: '🌐',
    category: 'scan',
    requirement: 11,
    xpReward: 750,
    rarity: 'epic',
  },

  // CONSOLIDATION ACHIEVEMENTS
  {
    id: 'first_consolidation',
    name: 'Dust Buster',
    description: 'Complete your first consolidation',
    icon: '🧹',
    category: 'consolidate',
    requirement: 1,
    xpReward: 200,
    rarity: 'common',
  },
  {
    id: 'consolidate_10',
    name: 'Serial Cleaner',
    description: 'Complete 10 consolidations',
    icon: '✨',
    category: 'consolidate',
    requirement: 10,
    xpReward: 400,
    rarity: 'common',
  },
  {
    id: 'consolidate_50',
    name: 'Sweep Commander',
    description: 'Complete 50 consolidations',
    icon: '🌪️',
    category: 'consolidate',
    requirement: 50,
    xpReward: 1000,
    rarity: 'rare',
  },
  {
    id: 'consolidate_100',
    name: 'Portfolio Perfectionist',
    description: 'Complete 100 consolidations',
    icon: '💎',
    category: 'consolidate',
    requirement: 100,
    xpReward: 2000,
    rarity: 'epic',
  },
  {
    id: 'token_100',
    name: 'Centurion',
    description: 'Consolidate 100 tokens total',
    icon: '💯',
    category: 'consolidate',
    requirement: 100,
    xpReward: 500,
    rarity: 'rare',
  },
  {
    id: 'token_500',
    name: 'Token Tornado',
    description: 'Consolidate 500 tokens total',
    icon: '🌀',
    category: 'consolidate',
    requirement: 500,
    xpReward: 1500,
    rarity: 'epic',
  },
  {
    id: 'high_value',
    name: 'Big Cleanup',
    description: 'Consolidate $100+ in a single transaction',
    icon: '💰',
    category: 'consolidate',
    requirement: 100,
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: 'whale_cleanup',
    name: 'Whale Wash',
    description: 'Consolidate $1000+ in a single transaction',
    icon: '🐋',
    category: 'consolidate',
    requirement: 1000,
    xpReward: 1000,
    rarity: 'legendary',
  },

  // STREAK ACHIEVEMENTS
  {
    id: 'streak_3',
    name: 'Getting Warmed Up',
    description: 'Maintain a 3-day streak',
    icon: '🔥',
    category: 'streak',
    requirement: 3,
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    icon: '📅',
    category: 'streak',
    requirement: 7,
    xpReward: 300,
    rarity: 'rare',
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    description: 'Maintain a 30-day streak',
    icon: '🏆',
    category: 'streak',
    requirement: 30,
    xpReward: 1000,
    rarity: 'epic',
  },
  {
    id: 'streak_100',
    name: 'Legendary Dedication',
    description: 'Maintain a 100-day streak',
    icon: '👑',
    category: 'streak',
    requirement: 100,
    xpReward: 5000,
    rarity: 'legendary',
  },

  // SOCIAL ACHIEVEMENTS
  {
    id: 'first_share',
    name: 'Sharing is Caring',
    description: 'Share your first consolidation on social media',
    icon: '📢',
    category: 'social',
    requirement: 1,
    xpReward: 100,
    rarity: 'common',
  },
  {
    id: 'influencer',
    name: 'Vortex Ambassador',
    description: 'Share 10 consolidations on social media',
    icon: '⭐',
    category: 'social',
    requirement: 10,
    xpReward: 500,
    rarity: 'rare',
  },

  // SPECIAL ACHIEVEMENTS
  {
    id: 'gas_saver',
    name: 'Gas Guardian',
    description: 'Save $50+ in gas fees',
    icon: '⛽',
    category: 'special',
    requirement: 50,
    xpReward: 500,
    rarity: 'rare',
  },
  {
    id: 'gas_master',
    name: 'Gas Guru',
    description: 'Save $500+ in gas fees',
    icon: '🛢️',
    category: 'special',
    requirement: 500,
    xpReward: 2000,
    rarity: 'epic',
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Join during Phase 1 launch',
    icon: '🌟',
    category: 'special',
    requirement: 1,
    xpReward: 1000,
    rarity: 'legendary',
  },
  {
    id: 'base_builder',
    name: 'Base Builder',
    description: 'Add $1000+ TVL to Base',
    icon: '🏗️',
    category: 'special',
    requirement: 1000,
    xpReward: 1500,
    rarity: 'epic',
  },
];

// ================================================
// HELPER FUNCTIONS
// ================================================

/**
 * Calculate level from XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Get XP needed for next level
 */
export function getXpForNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 0; // Max level
  }
  return LEVEL_THRESHOLDS[currentLevel] - currentXp;
}

/**
 * Get XP progress percentage to next level
 */
export function getXpProgress(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  if (currentLevel >= LEVEL_THRESHOLDS.length) {
    return 100; // Max level
  }
  
  const currentLevelXp = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextLevelXp = LEVEL_THRESHOLDS[currentLevel];
  const xpInLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  
  return (xpInLevel / xpNeeded) * 100;
}

/**
 * Get level title
 */
export function getLevelTitle(level: number): string {
  return LEVEL_TITLES[level] || 'Unknown';
}

/**
 * Calculate XP reward for consolidation
 */
export function calculateConsolidationXp(
  tokensCount: number,
  totalValueUsd: number,
  gasSavedUsd: number,
  tiers: { dust: number; microdust: number; legit: number }
): number {
  let xp = 0;
  
  // Base XP per token tier
  xp += tiers.dust * XP_REWARDS.CONSOLIDATE_DUST;
  xp += tiers.microdust * XP_REWARDS.CONSOLIDATE_MICRODUST;
  xp += tiers.legit * XP_REWARDS.CONSOLIDATE_LEGIT;
  
  // Bonus for high value
  if (totalValueUsd >= 100) {
    xp += XP_REWARDS.HIGH_VALUE_CLEAN;
  }
  
  // Bonus for gas savings
  if (gasSavedUsd >= 10) {
    xp += XP_REWARDS.GAS_SAVER;
  }
  
  return xp;
}

/**
 * Check if achievement is unlocked
 */
export function checkAchievement(
  achievement: Achievement,
  stats: {
    scans: number;
    consolidations: number;
    tokensConsolidated: number;
    streak: number;
    shares: number;
    gasSaved: number;
    tvlAdded: number;
    chainsUsed: number;
    highestConsolidation: number;
  }
): boolean {
  switch (achievement.id) {
    case 'first_scan':
    case 'scan_10':
    case 'scan_50':
    case 'scan_100':
      return stats.scans >= achievement.requirement;
    
    case 'first_consolidation':
    case 'consolidate_10':
    case 'consolidate_50':
    case 'consolidate_100':
      return stats.consolidations >= achievement.requirement;
    
    case 'token_100':
    case 'token_500':
      return stats.tokensConsolidated >= achievement.requirement;
    
    case 'streak_3':
    case 'streak_7':
    case 'streak_30':
    case 'streak_100':
      return stats.streak >= achievement.requirement;
    
    case 'first_share':
    case 'influencer':
      return stats.shares >= achievement.requirement;
    
    case 'gas_saver':
    case 'gas_master':
      return stats.gasSaved >= achievement.requirement;
    
    case 'base_builder':
      return stats.tvlAdded >= achievement.requirement;
    
    case 'multi_chain_master':
      return stats.chainsUsed >= achievement.requirement;
    
    case 'high_value':
    case 'whale_cleanup':
      return stats.highestConsolidation >= achievement.requirement;
    
    case 'early_adopter':
      return true; // Always unlocked for Phase 1 users
    
    default:
      return false;
  }
}

/**
 * Get all unlocked achievements
 */
export function getUnlockedAchievements(stats: Parameters<typeof checkAchievement>[1]): Achievement[] {
  return ACHIEVEMENTS.filter(achievement => checkAchievement(achievement, stats));
}

/**
 * Get achievement progress
 */
export function getAchievementProgress(
  achievement: Achievement,
  stats: Parameters<typeof checkAchievement>[1]
): number {
  let current = 0;
  
  switch (achievement.category) {
    case 'scan':
      current = stats.scans;
      break;
    case 'consolidate':
      if (achievement.id.includes('token')) {
        current = stats.tokensConsolidated;
      } else if (achievement.id.includes('value') || achievement.id.includes('whale')) {
        current = stats.highestConsolidation;
      } else {
        current = stats.consolidations;
      }
      break;
    case 'streak':
      current = stats.streak;
      break;
    case 'social':
      current = stats.shares;
      break;
    case 'special':
      if (achievement.id.includes('gas')) {
        current = stats.gasSaved;
      } else if (achievement.id.includes('base')) {
        current = stats.tvlAdded;
      }
      break;
  }
  
  return Math.min((current / achievement.requirement) * 100, 100);
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    case 'rare':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'epic':
      return 'bg-purple-50 text-purple-700 border-purple-300';
    case 'legendary':
      return 'bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

/**
 * Get rarity gradient for badges
 */
export function getRarityGradient(rarity: Achievement['rarity']): string {
  switch (rarity) {
    case 'common':
      return 'from-slate-400 to-slate-600';
    case 'rare':
      return 'from-blue-400 to-blue-600';
    case 'epic':
      return 'from-purple-400 to-purple-600';
    case 'legendary':
      return 'from-amber-400 via-orange-400 to-amber-500';
    default:
      return 'from-slate-400 to-slate-600';
  }
}
