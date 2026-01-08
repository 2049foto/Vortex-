'use client';

/**
 * Vortex Protocol - Mobile Bottom Navigation
 * Premium mobile-first navigation with haptic feel
 */

import React from 'react';
import { LayoutDashboard, ScanLine, Layers, Clock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/scan', label: 'Scan', icon: ScanLine, primary: true },
  { path: '/consolidate', label: 'Swap', icon: Layers },
  { path: '/history', label: 'History', icon: Clock },
];

export function BottomNav({ currentPath, onNavigate }: BottomNavProps) {
  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="fixed bottom-0 left-0 right-0 z-50 sm:hidden"
    >
      {/* Background with blur */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-slate-200/50 shadow-lg shadow-slate-900/5" />
      
      {/* Content */}
      <div className="relative flex items-center justify-around px-2 py-1.5 safe-bottom">
        {navItems.map((item, index) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          // Primary action (Scan) gets special treatment
          if (item.primary) {
            return (
              <motion.button
                key={item.path}
                onClick={() => onNavigate(item.path)}
                whileTap={{ scale: 0.9 }}
                className="relative -mt-6"
              >
                <motion.div
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                  className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                    isActive 
                      ? "bg-gradient-to-br from-indigo-600 to-violet-600 shadow-indigo-500/40" 
                      : "bg-slate-900 shadow-slate-900/30"
                  )}
                >
                  <Icon className="w-6 h-6 text-white" />
                </motion.div>
                <span className={cn(
                  "text-[10px] mt-1.5 font-semibold block text-center",
                  isActive ? "text-indigo-600" : "text-slate-600"
                )}>
                  {item.label}
                </span>
              </motion.button>
            );
          }
          
          return (
            <motion.button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center justify-center w-16 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-pill"
                  className="absolute inset-x-2 top-1 bottom-1 bg-indigo-50 rounded-xl"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <Icon className={cn(
                "w-5 h-5 relative z-10 transition-all duration-200",
                isActive ? "text-indigo-600 scale-110" : "text-slate-400"
              )} />
              <span className={cn(
                "text-[10px] mt-1 font-medium relative z-10 transition-colors",
                isActive ? "text-indigo-600 font-semibold" : "text-slate-400"
              )}>
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
}

export default BottomNav;