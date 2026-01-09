/**
 * Vortex Protocol - Viral Share Buttons
 * Easy one-click sharing to Farcaster, Twitter, and more
 */

'use client';

import { motion } from 'framer-motion';
import { Share2, Twitter, MessageCircle, Copy, Check, ExternalLink } from 'lucide-react';
import { useState, useCallback } from 'react';
import { Button } from './ui/Button';

interface ShareButtonsProps {
  type: 'scan' | 'clean' | 'achievement' | 'leaderboard';
  data: {
    // Scan data
    tokenCount?: number;
    chainCount?: number;
    dustValue?: number;
    totalValue?: number;
    
    // Clean data
    tokensCleaned?: number;
    recovered?: number;
    outputToken?: string;
    gasSaved?: number;
    txHash?: string;
    
    // Achievement data
    title?: string;
    xpEarned?: number;
    level?: number;
    
    // Leaderboard data
    rank?: number;
    period?: string;
  };
  walletAddress?: string;
}

export function ShareButtons({ type, data, walletAddress }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vortexbase.vercel.app';

  // Generate share text based on type
  const generateShareText = useCallback(() => {
    switch (type) {
      case 'scan':
        return `🔍 Just scanned my wallet with @vortex

💰 ${data.tokenCount || 0} tokens across ${data.chainCount || 0} chains
🧹 $${(data.dustValue || 0).toFixed(2)} dust detected

Scan yours 👇`;

      case 'clean':
        return `🧹 Just cleaned ${data.tokensCleaned || 0} dust tokens with @vortex!

✨ Recovered: ${(data.recovered || 0).toFixed(4)} ${data.outputToken || 'ETH'}
⛽ Gas saved: ${(data.gasSaved || 0).toFixed(4)} ETH

Clean your wallet too 👇`;

      case 'achievement':
        return `🏆 Achievement Unlocked on @vortex!

${data.title || 'New Badge'}
+${data.xpEarned || 0} XP

Level ${data.level || 1} Dust Cleaner 🚀`;

      case 'leaderboard':
        return `🏆 I'm ranked #${data.rank || '?'} on the @vortex ${data.period || 'weekly'} leaderboard!

Join the dust cleaning challenge 👇`;

      default:
        return `Check out @vortex - the best way to clean dust tokens! 🧹✨`;
    }
  }, [type, data]);

  // Share URLs
  const shareText = generateShareText();
  const encodedText = encodeURIComponent(shareText);
  const shareUrl = `${appUrl}/scan${walletAddress ? `?wallet=${walletAddress}` : ''}`;
  const encodedUrl = encodeURIComponent(shareUrl);

  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodedText}&embeds[]=${encodedUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
  const telegramUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }, [shareText, shareUrl]);

  return (
    <div className="flex flex-col gap-3">
      {/* Main Share Buttons */}
      <div className="flex gap-2">
        {/* Warpcast (Farcaster) - Primary */}
        <motion.a
          href={warpcastUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Share on Warpcast</span>
        </motion.a>

        {/* Twitter */}
        <motion.a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
        >
          <Twitter className="w-5 h-5" />
          <span className="hidden sm:inline">Twitter</span>
        </motion.a>
      </div>

      {/* Secondary Actions */}
      <div className="flex gap-2">
        {/* Copy Link */}
        <Button
          variant="outline"
          onClick={handleCopy}
          className="flex-1 h-10"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Copy Link
            </>
          )}
        </Button>

        {/* Telegram */}
        <a
          href={telegramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Telegram</span>
        </a>

        {/* View Transaction (if available) */}
        {data.txHash && (
          <a
            href={`https://basescan.org/tx/${data.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">View TX</span>
          </a>
        )}
      </div>
    </div>
  );
}

/**
 * Quick Share Button (compact version for inline use)
 */
export function QuickShareButton({ 
  text, 
  url,
  className = '' 
}: { 
  text: string; 
  url: string;
  className?: string;
}) {
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(url)}`;

  return (
    <motion.a
      href={warpcastUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-700 text-sm font-medium transition-colors ${className}`}
    >
      <Share2 className="w-3.5 h-3.5" />
      Share
    </motion.a>
  );
}

/**
 * Farcaster Cast Button (creates a cast with frame embed)
 */
export function CastFrameButton({
  frameUrl,
  text = 'Check this out!',
}: {
  frameUrl: string;
  text?: string;
}) {
  const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}&embeds[]=${encodeURIComponent(frameUrl)}`;

  return (
    <motion.a
      href={warpcastUrl}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all"
    >
      <MessageCircle className="w-5 h-5" />
      Cast to Farcaster
    </motion.a>
  );
}
