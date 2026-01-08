'use client';

import React from 'react';
import { LayoutDashboard, Scan, Layers, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface BottomNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/scan', label: 'Scan', icon: Scan },
  { path: '/consolidate', label: 'Consolidate', icon: Layers },
  { path: '/history', label: 'History', icon: Clock },
];

export function BottomNav({ currentPath, onNavigate }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:hidden bg-white/95 backdrop-blur-lg border-t border-slate-200 safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = currentPath === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => onNavigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all",
                isActive ? "text-indigo-600" : "text-slate-400"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  className="absolute inset-1 bg-indigo-50 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <Icon className={cn(
                "w-5 h-5 relative z-10 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] mt-1 font-medium relative z-10",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

