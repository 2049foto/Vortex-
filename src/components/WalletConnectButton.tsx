'use client';

import { useAccount, useBalance, useDisconnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  ChevronDown, 
  Copy, 
  ExternalLink, 
  LogOut,
  Check,
  Network,
  Coins
} from 'lucide-react';
import { useState } from 'react';

// Wallet icons for popular wallets
const WALLET_ICONS = {
  metamask: (
    <svg viewBox="0 0 32 32" className="w-5 h-5">
      <path fill="#E17726" d="M27.2 3.1l-9.5 7.1 1.8-4.2z"/>
      <path fill="#E27625" d="M4.8 3.1l9.4 7.2-1.7-4.3zM23.5 21.8l-2.5 3.9 5.4 1.5 1.5-5.3zM4.1 21.9l1.5 5.3 5.4-1.5-2.5-3.9z"/>
      <path fill="#E27625" d="M10.7 13.4L9.2 15.7l5.4.2-.2-5.8zM21.3 13.4L18.2 10 18 15.9l5.4-.2zM11 25.7l3.3-1.6-2.8-2.2zM17.7 24.1l3.3 1.6-.5-3.8z"/>
      <path fill="#D5BFB2" d="M21 25.7l-3.3-1.6.3 2.2v.9zM11 25.7l3.5 1.5v-.9l.2-2.2z"/>
      <path fill="#233447" d="M14.6 20.2l-2.8-.8 2-1zM17.4 20.2l.8-1.7 2 1z"/>
      <path fill="#CC6228" d="M11 25.7l.5-3.9-3-.1zM20.5 21.8l.5 3.9 2.5-4zM23.4 15.5l-5.4.2.5 4.5.8-1.7 2 1zM11.8 19.5l2-1 .8 1.7.5-4.5-5.4-.2z"/>
      <path fill="#E27625" d="M8.6 15.5l2.3 4.5-.1-2.2zM21.2 17.8l-.1 2.2 2.3-4.5zM14 15.7l-.5 4.5.7 3.3.1-4.4zM18 15.7l-.3 3.3.1 4.4.6-3.3z"/>
      <path fill="#F5841F" d="M18.5 20.2l-.6 3.3.5.3 2.8-2.2.1-2.2zM11.8 19.5l.1 2.2 2.8 2.2.4-.3-.6-3.3z"/>
      <path fill="#C0AC9D" d="M18.6 27.2v-.9l-.2-.2h-4.8l-.2.2v.9L10 25.7l1.1.9 2.2 1.5h4.6l2.2-1.5 1.1-.9z"/>
      <path fill="#161616" d="M17.7 24.1l-.5-.3h-2.4l-.4.3-.2 2.2.2-.2h4.8l.2.2z"/>
      <path fill="#763E1A" d="M27.7 10.6l.8-3.8L27.2 3l-9.5 7 3.6 3.1 5.1 1.5 1.1-1.3-.5-.4.8-.7-.6-.5.8-.6zM3.5 6.8l.8 3.8-.5.4.8.6-.6.5.8.7-.5.4 1.1 1.3 5.1-1.5L14.1 10 4.8 3z"/>
      <path fill="#F5841F" d="M26.4 14.6l-5.1-1.5 1.5 2.4-2.3 4.5 3.1-.1h4.5zM10.7 13.1l-5.1 1.5-1.7 5.3H8.4l3.1.1-2.3-4.5zM18 15.7l.3-5.7 1.5-4h-7.6l1.5 4 .3 5.7.1 1.4v4.4h2.4l.1-4.4z"/>
    </svg>
  ),
  coinbase: (
    <svg viewBox="0 0 32 32" className="w-5 h-5">
      <rect width="32" height="32" rx="8" fill="#0052FF"/>
      <path fill="#fff" d="M16 6a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 15.5a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/>
    </svg>
  ),
  walletconnect: (
    <svg viewBox="0 0 32 32" className="w-5 h-5">
      <rect width="32" height="32" rx="8" fill="#3B99FC"/>
      <path fill="#fff" d="M9.6 12c3.5-3.5 9.3-3.5 12.8 0l.4.4a.4.4 0 0 1 0 .6l-1.5 1.5a.2.2 0 0 1-.3 0l-.6-.6a6.7 6.7 0 0 0-9.4 0l-.6.6a.2.2 0 0 1-.3 0L8.6 13a.4.4 0 0 1 0-.6l.4-.4zm15.8 3l1.3 1.3c.2.2.2.5 0 .6l-6 6a.4.4 0 0 1-.6 0l-4.2-4.2a.1.1 0 0 0-.2 0L11.6 23a.4.4 0 0 1-.6 0l-6-6a.4.4 0 0 1 0-.6l1.3-1.3c.2-.2.5-.2.6 0l4.3 4.2a.1.1 0 0 0 .1 0l4.3-4.3c.1-.2.4-.2.6 0l4.3 4.3a.1.1 0 0 0 .1 0l4.3-4.3c.2-.2.5-.2.6 0z"/>
    </svg>
  ),
  rabby: (
    <svg viewBox="0 0 32 32" className="w-5 h-5">
      <rect width="32" height="32" rx="8" fill="#8697FF"/>
      <path fill="#fff" d="M16 6c-5.5 0-10 4.5-10 10s4.5 10 10 10 10-4.5 10-10S21.5 6 16 6zm0 17c-3.9 0-7-3.1-7-7s3.1-7 7-7 7 3.1 7 7-3.1 7-7 7z"/>
    </svg>
  ),
};

interface WalletConnectButtonProps {
  variant?: 'header' | 'page';
  showBalance?: boolean;
}

export function WalletConnectButton({ 
  variant = 'header',
  showBalance = true 
}: WalletConnectButtonProps) {
  const { address, isConnected, connector } = useAccount();
  const { data: balance } = useBalance({ address });
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}` 
    : '';

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Not connected - show connect button with wallet options
  if (!isConnected) {
    if (variant === 'page') {
      return (
        <div className="card p-6">
          <h3 className="text-lg font-semibold mb-2 text-center">Connect Your Wallet</h3>
          <p className="text-sm text-center mb-6" style={{ color: 'hsl(var(--text-tertiary))' }}>
            Choose your preferred wallet to continue
          </p>
          
          {/* Popular Wallets */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { name: 'MetaMask', icon: WALLET_ICONS.metamask, popular: true },
              { name: 'Coinbase', icon: WALLET_ICONS.coinbase, popular: true },
              { name: 'WalletConnect', icon: WALLET_ICONS.walletconnect },
              { name: 'Rabby', icon: WALLET_ICONS.rabby },
            ].map((wallet) => (
              <motion.button
                key={wallet.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => open({ view: 'Connect' })}
                className="flex items-center gap-3 p-3 rounded-xl transition-all"
                style={{ 
                  background: 'hsl(var(--bg-tertiary))',
                  border: '1px solid hsl(var(--border))'
                }}
              >
                <div className="flex-shrink-0">
                  {wallet.icon}
                </div>
                <div className="text-left flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{wallet.name}</div>
                  {wallet.popular && (
                    <div className="text-[10px]" style={{ color: 'hsl(var(--accent))' }}>
                      Popular
                    </div>
                  )}
                </div>
              </motion.button>
            ))}
          </div>
          
          {/* All Wallets Button */}
          <button
            onClick={() => open({ view: 'Connect' })}
            className="w-full btn btn-secondary btn-sm"
          >
            <Wallet className="w-4 h-4" />
            View 300+ Wallets
          </button>
          
          {/* Trust Badge */}
          <div className="mt-4 text-center">
            <p className="text-[10px]" style={{ color: 'hsl(var(--text-tertiary))' }}>
              🔒 Non-custodial • Your keys, your crypto
            </p>
          </div>
        </div>
      );
    }

    // Header variant
    return (
      <button 
        onClick={() => open({ view: 'Connect' })}
        className="btn btn-primary btn-sm"
      >
        <Wallet className="w-4 h-4" />
        <span className="hidden sm:inline">Connect</span>
      </button>
    );
  }

  // Connected state
  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="btn btn-secondary btn-sm"
        style={{ paddingRight: '10px' }}
      >
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: 'hsl(var(--accent-light))', color: 'hsl(var(--accent))' }}
        >
          {address?.slice(2, 4).toUpperCase()}
        </div>
        {showBalance && balance ? (
          <span className="text-sm font-medium hidden sm:inline">
            {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)} {balance.symbol}
          </span>
        ) : (
          <span className="text-sm font-medium">{shortAddress}</span>
        )}
        <ChevronDown 
          className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`}
          style={{ color: 'hsl(var(--text-tertiary))' }} 
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {showMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-64 z-50"
            >
              <div 
                className="card overflow-hidden"
                style={{ 
                  boxShadow: '0 12px 40px hsl(var(--shadow-color) / 0.15)',
                  padding: 0 
                }}
              >
                {/* Account Header */}
                <div 
                  className="p-4"
                  style={{ 
                    background: 'linear-gradient(135deg, hsl(var(--accent-light)), hsl(var(--bg-primary)))',
                    borderBottom: '1px solid hsl(var(--border))'
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                      style={{ background: 'hsl(var(--accent))', color: 'white' }}
                    >
                      {address?.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{shortAddress}</div>
                      <div className="text-xs" style={{ color: 'hsl(var(--text-tertiary))' }}>
                        {connector?.name || 'Connected'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Balance */}
                  {balance && (
                    <div 
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: 'hsl(var(--bg-elevated))' }}
                    >
                      <Coins className="w-4 h-4" style={{ color: 'hsl(var(--accent))' }} />
                      <span className="font-medium">
                        {(Number(balance.value) / 10 ** balance.decimals).toFixed(4)}
                      </span>
                      <span style={{ color: 'hsl(var(--text-tertiary))' }}>
                        {balance.symbol}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleCopy}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all hover:bg-[hsl(var(--bg-tertiary))]"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" style={{ color: 'hsl(var(--success))' }} />
                    ) : (
                      <Copy className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
                    )}
                    <span>{copied ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      open({ view: 'Networks' });
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all hover:bg-[hsl(var(--bg-tertiary))]"
                  >
                    <Network className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
                    <span>Switch Network</span>
                  </button>
                  
                  <a
                    href={`https://basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all hover:bg-[hsl(var(--bg-tertiary))]"
                    onClick={() => setShowMenu(false)}
                  >
                    <ExternalLink className="w-4 h-4" style={{ color: 'hsl(var(--text-tertiary))' }} />
                    <span>View on Explorer</span>
                  </a>
                  
                  <div 
                    className="my-2 mx-3"
                    style={{ height: '1px', background: 'hsl(var(--border))' }}
                  />
                  
                  <button
                    onClick={() => {
                      disconnect();
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-sm transition-all hover:bg-[hsl(var(--danger-light))]"
                    style={{ color: 'hsl(var(--danger))' }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Disconnect</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
