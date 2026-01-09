'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X as XIcon, MessageCircle, Copy, Check, Sparkles, Leaf } from 'lucide-react';

interface ShareData {
  dustCleaned: number;
  tokensConsolidated: number;
  chainsScanned: number;
  outputReceived: string;
  carbonSaved?: number;
}

interface ShareButtonsProps {
  data: ShareData;
  variant?: 'compact' | 'full';
}

// Generate viral captions for different platforms
function generateCaption(data: ShareData, platform: 'x' | 'farcaster'): string {
  const { dustCleaned, tokensConsolidated, outputReceived, carbonSaved } = data;
  
  const captions = {
    x: [
      `🌀 Just cleaned ${dustCleaned.toFixed(2)} in dust tokens → ${outputReceived} ETH on @base\n\n${tokensConsolidated} tokens consolidated in one gasless tx\n\nTry it: vortexbase.vercel.app`,
      `✨ Portfolio hygiene complete!\n\n💸 ${dustCleaned.toFixed(2)} dust → ${outputReceived} ETH\n🔗 ${tokensConsolidated} tokens cleaned\n⛽ Zero gas paid\n\nVortex Protocol on @base 🌀\nvortexbase.vercel.app`,
      `Finally cleaned up my wallet dust 🧹\n\n${tokensConsolidated} small tokens → ${outputReceived} ETH\nGasless on @base ⛽️\n\nVortex Protocol = portfolio hygiene done right\nvortexbase.vercel.app`,
      `Stop leaving money scattered across chains 💸\n\nJust consolidated:\n• ${tokensConsolidated} dust tokens\n• ${dustCleaned.toFixed(2)} total value\n• → ${outputReceived} ETH on Base\n\n@VortexProtocol 🌀\nvortexbase.vercel.app`,
    ],
    farcaster: [
      `🌀 Vortex cleaned my wallet!\n\n${tokensConsolidated} tokens → ${outputReceived} ETH\nGasless on Base ⛽️\n\n/vortex`,
      `Just consolidated ${dustCleaned.toFixed(2)} of dust → ${outputReceived} ETH 🧹\n\nZero gas, one click\n\n/vortex on Base`,
      `Portfolio hygiene ✨\n\n${tokensConsolidated} small tokens → ${outputReceived} ETH\nGasless magic on Base\n\n/vortex`,
      `Wallet cleanup done 🌀\n\n💸 ${dustCleaned.toFixed(2)} dust collected\n📦 ${tokensConsolidated} tokens merged\n🎯 ${outputReceived} ETH received\n\n/vortex`,
    ],
  };
  
  // Add carbon offset mention if applicable
  if (carbonSaved && carbonSaved > 0) {
    const carbonCaption = `\n\n🌱 ${carbonSaved.toFixed(4)} kg CO₂ offset`;
    const selectedCaption = captions[platform][Math.floor(Math.random() * captions[platform].length)];
    return selectedCaption + carbonCaption;
  }
  
  return captions[platform][Math.floor(Math.random() * captions[platform].length)];
}

// Generate share card image URL (OG image)
function getShareImageUrl(data: ShareData): string {
  const params = new URLSearchParams({
    dust: data.dustCleaned.toFixed(2),
    tokens: data.tokensConsolidated.toString(),
    output: data.outputReceived,
    chains: data.chainsScanned.toString(),
  });
  return `${process.env.NEXT_PUBLIC_APP_URL || 'https://vortexbase.vercel.app'}/api/og/success?${params}`;
}

export function ShareButtons({ data, variant = 'full' }: ShareButtonsProps) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'x' | 'farcaster'>('x');
  
  const caption = generateCaption(data, selectedPlatform);
  const shareUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vortexbase.vercel.app';
  
  const handleShare = (platform: 'x' | 'farcaster') => {
    const text = generateCaption(data, platform);
    
    if (platform === 'x') {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
      window.open(twitterUrl, '_blank', 'width=550,height=420');
    } else {
      const warpcastUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(text)}`;
      window.open(warpcastUrl, '_blank', 'width=550,height=500');
    }
  };
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleShare('x')}
          className="btn btn-secondary btn-sm"
          title="Share on X"
        >
          <XIcon className="w-4 h-4" />
          Share
        </button>
        <button
          onClick={() => handleShare('farcaster')}
          className="btn btn-outline btn-sm"
          style={{ borderColor: 'hsl(265 82% 58%)', color: 'hsl(265 82% 58%)' }}
          title="Share on Farcaster"
        >
          <MessageCircle className="w-4 h-4" />
          Cast
        </button>
      </div>
    );
  }
  
  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="btn btn-primary btn-lg w-full gap-3"
      >
        <Share2 className="w-5 h-5" />
        Share Your Success
        <Sparkles className="w-4 h-4" />
      </button>
      
      <AnimatePresence>
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="modal"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="modal-header">
                <div>
                  <h3 className="text-lg font-bold">Share Your Clean</h3>
                  <p className="text-sm text-[hsl(var(--text-tertiary))]">
                    Let others know about your portfolio hygiene
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost btn-sm btn-icon"
                >
                  <XIcon className="w-5 h-5" />
                </button>
              </div>
              
              {/* Body */}
              <div className="modal-body space-y-5">
                {/* Stats Preview */}
                <div className="card-glass p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xl font-bold text-[hsl(var(--accent))]">
                        ${data.dustCleaned.toFixed(2)}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-tertiary))]">Dust Cleaned</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold text-[hsl(var(--success))]">
                        {data.tokensConsolidated}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-tertiary))]">Tokens</div>
                    </div>
                    <div>
                      <div className="text-xl font-bold">
                        {data.outputReceived}
                      </div>
                      <div className="text-xs text-[hsl(var(--text-tertiary))]">ETH Received</div>
                    </div>
                  </div>
                  
                  {data.carbonSaved && data.carbonSaved > 0 && (
                    <div className="mt-4 pt-4 border-t border-[hsl(var(--border))] flex items-center justify-center gap-2">
                      <Leaf className="w-4 h-4 text-[hsl(var(--success))]" />
                      <span className="text-sm text-[hsl(var(--success))]">
                        {data.carbonSaved.toFixed(4)} kg CO₂ offset
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Platform Tabs */}
                <div className="tabs">
                  <button
                    onClick={() => setSelectedPlatform('x')}
                    className={`tab ${selectedPlatform === 'x' ? 'active' : ''}`}
                  >
                    <XIcon className="w-4 h-4 inline mr-1" />
                    X (Twitter)
                  </button>
                  <button
                    onClick={() => setSelectedPlatform('farcaster')}
                    className={`tab ${selectedPlatform === 'farcaster' ? 'active' : ''}`}
                  >
                    <MessageCircle className="w-4 h-4 inline mr-1" />
                    Farcaster
                  </button>
                </div>
                
                {/* Caption Preview */}
                <div className="relative">
                  <div 
                    className="p-4 rounded-xl bg-[hsl(var(--bg-secondary))] border border-[hsl(var(--border))] text-sm whitespace-pre-wrap"
                    style={{ minHeight: '120px' }}
                  >
                    {caption}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="absolute top-3 right-3 btn btn-ghost btn-xs"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
                
                {/* Share Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => handleShare('x')}
                    className="btn btn-lg flex-1"
                    style={{ 
                      background: '#000',
                      color: '#fff'
                    }}
                  >
                    <XIcon className="w-5 h-5" />
                    Post on X
                  </button>
                  <button
                    onClick={() => handleShare('farcaster')}
                    className="btn btn-lg flex-1"
                    style={{ 
                      background: 'linear-gradient(135deg, hsl(265 82% 58%) 0%, hsl(285 91% 52%) 100%)',
                      color: '#fff'
                    }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    Cast
                  </button>
                </div>
                
                {/* Tips */}
                <p className="text-xs text-center text-[hsl(var(--text-tertiary))]">
                  💡 Sharing helps others discover portfolio hygiene tools
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default ShareButtons;
