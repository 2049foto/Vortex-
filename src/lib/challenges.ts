/**
 * Vortex Protocol - Weekly Challenge System
 * Gamified challenges to drive engagement and virality
 */

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'dust_amount' | 'token_count' | 'chain_count' | 'streak' | 'referral';
  target: number;
  reward: {
    xp: number;
    badge?: string;
    title?: string;
  };
  startDate: Date;
  endDate: Date;
  participants: number;
  completed: number;
}

export interface UserChallengeProgress {
  challengeId: string;
  userId: string;
  progress: number;
  completed: boolean;
  completedAt?: Date;
  rank?: number;
}

// Current active challenges (would be from DB in production)
export const ACTIVE_CHALLENGES: Challenge[] = [
  {
    id: 'weekly-dust-hunter',
    title: '🧹 Weekly Dust Hunter',
    description: 'Clean at least $50 worth of dust tokens this week',
    type: 'dust_amount',
    target: 50,
    reward: {
      xp: 500,
      badge: 'dust_hunter_weekly',
      title: 'Dust Hunter',
    },
    startDate: new Date('2026-01-06'),
    endDate: new Date('2026-01-13'),
    participants: 1247,
    completed: 389,
  },
  {
    id: 'multi-chain-master',
    title: '🔗 Multi-Chain Master',
    description: 'Clean tokens from at least 5 different chains',
    type: 'chain_count',
    target: 5,
    reward: {
      xp: 750,
      badge: 'multi_chain_master',
      title: 'Chain Hopper',
    },
    startDate: new Date('2026-01-06'),
    endDate: new Date('2026-01-13'),
    participants: 892,
    completed: 156,
  },
  {
    id: 'token-terminator',
    title: '💀 Token Terminator',
    description: 'Clean 20 or more tokens in a single session',
    type: 'token_count',
    target: 20,
    reward: {
      xp: 300,
      badge: 'token_terminator',
    },
    startDate: new Date('2026-01-06'),
    endDate: new Date('2026-01-13'),
    participants: 2103,
    completed: 678,
  },
  {
    id: 'streak-legend',
    title: '🔥 7-Day Streak',
    description: 'Use Vortex 7 days in a row',
    type: 'streak',
    target: 7,
    reward: {
      xp: 1000,
      badge: 'streak_legend',
      title: 'Streak Legend',
    },
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    participants: 567,
    completed: 89,
  },
  {
    id: 'viral-spreader',
    title: '📢 Viral Spreader',
    description: 'Get 3 friends to scan their wallets using your referral',
    type: 'referral',
    target: 3,
    reward: {
      xp: 500,
      badge: 'viral_spreader',
      title: 'Influencer',
    },
    startDate: new Date('2026-01-01'),
    endDate: new Date('2026-01-31'),
    participants: 234,
    completed: 45,
  },
];

/**
 * Get current active challenges
 */
export function getActiveChallenges(): Challenge[] {
  const now = new Date();
  return ACTIVE_CHALLENGES.filter(
    challenge => now >= challenge.startDate && now <= challenge.endDate
  );
}

/**
 * Get weekly challenge
 */
export function getWeeklyChallenge(): Challenge | undefined {
  const now = new Date();
  return ACTIVE_CHALLENGES.find(
    challenge => 
      challenge.id.includes('weekly') && 
      now >= challenge.startDate && 
      now <= challenge.endDate
  );
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, target: number): number {
  return Math.min(100, Math.round((current / target) * 100));
}

/**
 * Get time remaining for challenge
 */
export function getTimeRemaining(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  
  if (diff <= 0) return 'Ended';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  return `${minutes}m left`;
}

/**
 * Generate challenge share text
 */
export function getChallengeShareText(challenge: Challenge, progress?: number): string {
  const progressText = progress !== undefined 
    ? `\n📊 My progress: ${progress}/${challenge.target}`
    : '';
  
  return `🎯 I'm taking the "${challenge.title}" challenge on @vortex!

${challenge.description}
🏆 Reward: ${challenge.reward.xp} XP${progressText}

Join me 👇`;
}

/**
 * Generate referral link
 */
export function generateReferralLink(userId: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dust-sweeper-yrjq.vercel.app';
  return `${appUrl}/scan?ref=${userId}`;
}

/**
 * Get leaderboard position text
 */
export function getLeaderboardText(rank: number): string {
  if (rank === 1) return '🥇 1st Place';
  if (rank === 2) return '🥈 2nd Place';
  if (rank === 3) return '🥉 3rd Place';
  if (rank <= 10) return `🏅 Top 10 (#${rank})`;
  if (rank <= 50) return `🎖️ Top 50 (#${rank})`;
  if (rank <= 100) return `⭐ Top 100 (#${rank})`;
  return `#${rank}`;
}
