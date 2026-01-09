/**
 * Vortex Protocol - Farcaster Frame V2 Integration
 * Viral features for maximum engagement and shareability
 * Updated: Jan 9, 2026
 */

import { CHAINS } from './chainIcons';

// Frame V2 Types
export interface FrameAction {
  type: 'post' | 'link' | 'mint' | 'tx';
  label: string;
  target?: string;
  postUrl?: string;
}

export interface FrameButton {
  label: string;
  action: FrameAction['type'];
  target?: string;
}

export interface FrameMetadata {
  version: 'vNext';
  image: string;
  imageAspectRatio: '1.91:1' | '1:1';
  buttons?: FrameButton[];
  input?: { text: string };
  state?: string;
  postUrl?: string;
}

// ============================================
// VIRAL FRAME GENERATORS
// ============================================

/**
 * Generate Portfolio Summary Frame
 * Shows total value, chains, and dust recovered
 */
export function generatePortfolioFrame(data: {
  walletAddress: string;
  totalValue: number;
  dustValue: number;
  tokenCount: number;
  chainCount: number;
  riskScore: number;
}): FrameMetadata {
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/portfolio?` + 
    new URLSearchParams({
      wallet: data.walletAddress,
      total: data.totalValue.toFixed(2),
      dust: data.dustValue.toFixed(2),
      tokens: data.tokenCount.toString(),
      chains: data.chainCount.toString(),
      risk: data.riskScore.toString(),
    }).toString();

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1.91:1',
    buttons: [
      { label: '🔍 Scan My Wallet', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/frame` },
      { label: '🧹 Clean Dust', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/scan` },
      { label: '📊 Leaderboard', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard` },
    ],
    postUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/scan`,
  };
}

/**
 * Generate Achievement Unlocked Frame
 * Shareable badge when user completes actions
 */
export function generateAchievementFrame(achievement: {
  id: string;
  title: string;
  description: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xpEarned: number;
  totalXp: number;
  level: number;
}): FrameMetadata {
  const rarityColors = {
    common: '4B5563',
    rare: '3B82F6', 
    epic: '8B5CF6',
    legendary: 'F59E0B',
  };

  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/achievement?` +
    new URLSearchParams({
      title: achievement.title,
      desc: achievement.description,
      rarity: achievement.rarity,
      color: rarityColors[achievement.rarity],
      xp: achievement.xpEarned.toString(),
      totalXp: achievement.totalXp.toString(),
      level: achievement.level.toString(),
    }).toString();

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1:1',
    buttons: [
      { label: '🏆 View All Badges', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard` },
      { label: '🎯 Start Challenge', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/challenge` },
      { label: '👀 Scan Wallet', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/scan` },
    ],
  };
}

/**
 * Generate Consolidation Success Frame
 * Shows before/after of dust cleanup
 */
export function generateConsolidationFrame(data: {
  walletAddress: string;
  tokensCleaned: number;
  dustRecovered: number;
  gasSaved: number;
  outputToken: string;
  txHash?: string;
}): FrameMetadata {
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/success?` +
    new URLSearchParams({
      wallet: data.walletAddress,
      tokens: data.tokensCleaned.toString(),
      recovered: data.dustRecovered.toFixed(4),
      gas: data.gasSaved.toFixed(4),
      output: data.outputToken,
    }).toString();

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1.91:1',
    buttons: [
      { label: '🎉 I Cleaned My Dust!', action: 'link', target: `https://warpcast.com/~/compose?text=Just%20cleaned%20${data.tokensCleaned}%20dust%20tokens%20with%20@vortex%20and%20recovered%20${data.dustRecovered.toFixed(4)}%20${data.outputToken}!%20🧹✨&embeds[]=${process.env.NEXT_PUBLIC_APP_URL}/scan` },
      { label: '🔗 View TX', action: 'link', target: `https://basescan.org/tx/${data.txHash}` },
      { label: '🧹 Clean More', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/scan` },
    ],
  };
}

/**
 * Generate Leaderboard Frame
 * Weekly/monthly top cleaners
 */
export function generateLeaderboardFrame(data: {
  period: 'weekly' | 'monthly' | 'all-time';
  topUsers: Array<{
    rank: number;
    address: string;
    dustCleaned: number;
    xp: number;
  }>;
  userRank?: number;
  userDustCleaned?: number;
}): FrameMetadata {
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/leaderboard?` +
    new URLSearchParams({
      period: data.period,
      users: JSON.stringify(data.topUsers.slice(0, 10)),
      userRank: data.userRank?.toString() || '',
      userDust: data.userDustCleaned?.toString() || '',
    }).toString();

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1.91:1',
    buttons: [
      { label: '📊 Weekly', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard?period=weekly` },
      { label: '📈 Monthly', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard?period=monthly` },
      { label: '🏆 All-Time', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard?period=all-time` },
      { label: '🎯 Join Challenge', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/scan` },
    ],
  };
}

/**
 * Generate Challenge Frame
 * Gamified weekly challenges
 */
export function generateChallengeFrame(challenge: {
  id: string;
  title: string;
  description: string;
  reward: number; // XP reward
  progress: number; // 0-100
  endDate: Date;
  participants: number;
}): FrameMetadata {
  const daysLeft = Math.ceil((challenge.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/challenge?` +
    new URLSearchParams({
      title: challenge.title,
      desc: challenge.description,
      reward: challenge.reward.toString(),
      progress: challenge.progress.toString(),
      days: daysLeft.toString(),
      participants: challenge.participants.toString(),
    }).toString();

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1:1',
    buttons: [
      { label: '🎯 Join Challenge', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/scan?challenge=${challenge.id}` },
      { label: '📊 My Progress', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/progress?challenge=${challenge.id}` },
      { label: '🏆 Leaderboard', action: 'post', target: `${process.env.NEXT_PUBLIC_APP_URL}/api/frame/leaderboard` },
    ],
  };
}

/**
 * Generate Risk Report Frame
 * Shareable security analysis
 */
export function generateRiskReportFrame(data: {
  walletAddress: string;
  overallScore: number;
  safeTokens: number;
  riskyTokens: number;
  scamTokens: number;
  totalValue: number;
  atRiskValue: number;
}): FrameMetadata {
  const scoreColor = data.overallScore < 30 ? '22C55E' : data.overallScore < 60 ? 'F59E0B' : 'EF4444';
  
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/og/risk?` +
    new URLSearchParams({
      wallet: data.walletAddress,
      score: data.overallScore.toString(),
      color: scoreColor,
      safe: data.safeTokens.toString(),
      risky: data.riskyTokens.toString(),
      scam: data.scamTokens.toString(),
      total: data.totalValue.toFixed(2),
      atRisk: data.atRiskValue.toFixed(2),
    }).toString();

  return {
    version: 'vNext',
    image: imageUrl,
    imageAspectRatio: '1.91:1',
    buttons: [
      { label: '🛡️ Check My Wallet', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/scan` },
      { label: '⚠️ Clean Risky Tokens', action: 'link', target: `${process.env.NEXT_PUBLIC_APP_URL}/consolidate` },
      { label: '📢 Share Report', action: 'link', target: `https://warpcast.com/~/compose?text=My%20wallet%20security%20score%20is%20${100 - data.overallScore}%2F100%20🛡️%20Checked%20with%20@vortex&embeds[]=${process.env.NEXT_PUBLIC_APP_URL}/scan` },
    ],
  };
}

// ============================================
// FRAME HTML GENERATORS
// ============================================

/**
 * Generate Frame HTML meta tags
 */
export function generateFrameHtml(metadata: FrameMetadata): string {
  const tags: string[] = [
    `<meta property="fc:frame" content="${metadata.version}" />`,
    `<meta property="fc:frame:image" content="${metadata.image}" />`,
    `<meta property="fc:frame:image:aspect_ratio" content="${metadata.imageAspectRatio}" />`,
  ];

  if (metadata.postUrl) {
    tags.push(`<meta property="fc:frame:post_url" content="${metadata.postUrl}" />`);
  }

  if (metadata.buttons) {
    metadata.buttons.forEach((button, index) => {
      const i = index + 1;
      tags.push(`<meta property="fc:frame:button:${i}" content="${button.label}" />`);
      tags.push(`<meta property="fc:frame:button:${i}:action" content="${button.action}" />`);
      if (button.target) {
        tags.push(`<meta property="fc:frame:button:${i}:target" content="${button.target}" />`);
      }
    });
  }

  if (metadata.input) {
    tags.push(`<meta property="fc:frame:input:text" content="${metadata.input.text}" />`);
  }

  if (metadata.state) {
    tags.push(`<meta property="fc:frame:state" content="${metadata.state}" />`);
  }

  return tags.join('\n');
}

// ============================================
// WARPCAST SHARE HELPERS
// ============================================

export function generateShareText(type: 'scan' | 'clean' | 'achievement' | 'challenge', data: Record<string, any>): string {
  const templates = {
    scan: `🔍 Just scanned my wallet with @vortex\n\n💰 ${data.tokenCount} tokens across ${data.chainCount} chains\n🧹 ${data.dustValue} dust detected\n\nCheck yours 👇`,
    clean: `🧹 Just cleaned ${data.tokensCleaned} dust tokens!\n\n✨ Recovered: ${data.recovered} ${data.outputToken}\n⛽ Gas saved: ${data.gasSaved} ETH\n\nClean your wallet with @vortex 👇`,
    achievement: `🏆 Achievement Unlocked!\n\n${data.title}\n+${data.xpEarned} XP\n\nLevel ${data.level} on @vortex 🚀`,
    challenge: `🎯 Joined the "${data.title}" challenge!\n\n🏆 ${data.reward} XP reward\n👥 ${data.participants} participants\n\nJoin on @vortex 👇`,
  };

  return encodeURIComponent(templates[type]);
}

export function generateWarpcastUrl(text: string, embedUrl?: string): string {
  const baseUrl = 'https://warpcast.com/~/compose';
  const params = new URLSearchParams({ text });
  if (embedUrl) {
    params.append('embeds[]', embedUrl);
  }
  return `${baseUrl}?${params.toString()}`;
}
