/**
 * ShareButtons component for VORTEX PROTOCOL
 * Social sharing buttons for X (Twitter), Farcaster, and copy link
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import { cn } from '../utils/cn';

interface ShareButtonsProps {
  title?: string;
  text?: string;
  url?: string;
  className?: string;
}

// Custom X (Twitter) icon
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

// Custom Farcaster icon
function FarcasterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 5.5v13A2.5 2.5 0 005.5 21h13a2.5 2.5 0 002.5-2.5v-13A2.5 2.5 0 0018.5 3h-13A2.5 2.5 0 003 5.5zm4.5 2h9v2h-9v-2zm0 4h9v2h-9v-2zm0 4h6v2h-6v-2z" />
    </svg>
  );
}

export function ShareButtons({
  title = 'VORTEX PROTOCOL',
  text = 'Just cleaned my portfolio with VORTEX!',
  url = typeof window !== 'undefined' ? window.location.href : '',
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareX = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareFarcaster = () => {
    const castUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text + ' ' + url)}`;
    window.open(castUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShareX}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background font-medium hover:opacity-90 transition-opacity min-h-[44px]"
        aria-label="Share on X (Twitter)"
      >
        <XIcon className="w-4 h-4" />
        <span>Share</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleShareFarcaster}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors min-h-[44px]"
        aria-label="Share on Farcaster"
      >
        <FarcasterIcon className="w-4 h-4" />
        <span>Cast</span>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCopyLink}
        className={cn(
          'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium min-h-[44px] transition-all',
          copied
            ? 'bg-accent/10 border-accent text-accent'
            : 'bg-card border-border text-foreground hover:border-muted-foreground'
        )}
        aria-label={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? (
          <>
            <Check className="w-4 h-4" />
            <span>Copied!</span>
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <span>Copy</span>
          </>
        )}
      </motion.button>
    </div>
  );
}

export default ShareButtons;

