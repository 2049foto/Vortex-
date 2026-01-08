/**
 * Achievements Panel Component
 * Display user achievements with progress tracking
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Lock, CheckCircle2, ChevronRight, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  ACHIEVEMENTS, 
  Achievement, 
  getUnlockedAchievements, 
  getAchievementProgress,
  getRarityColor,
  getRarityGradient
} from '@/lib/gamification';

interface AchievementsPanelProps {
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
  };
  compact?: boolean;
  onClose?: () => void;
}

type CategoryFilter = 'all' | 'scan' | 'consolidate' | 'streak' | 'social' | 'special';

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All',
  scan: 'Scanning',
  consolidate: 'Consolidation',
  streak: 'Streaks',
  social: 'Social',
  special: 'Special',
};

export function AchievementsPanel({ stats, compact = false, onClose }: AchievementsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  const unlockedAchievements = useMemo(() => 
    getUnlockedAchievements(stats), 
    [stats]
  );

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') return ACHIEVEMENTS;
    return ACHIEVEMENTS.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  const totalXpFromAchievements = useMemo(() => 
    unlockedAchievements.reduce((sum, a) => sum + a.xpReward, 0),
    [unlockedAchievements]
  );

  if (compact) {
    // Compact view for sidebar
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Achievements</h3>
          <span className="text-sm text-slate-500">
            {unlockedAchievements.length}/{ACHIEVEMENTS.length}
          </span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {unlockedAchievements.slice(0, 6).map(achievement => (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center text-xl cursor-pointer hover:scale-110 transition-transform",
                `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}`
              )}
              title={achievement.name}
            >
              {achievement.icon}
            </motion.div>
          ))}
          {unlockedAchievements.length > 6 && (
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-medium text-slate-600">
              +{unlockedAchievements.length - 6}
            </div>
          )}
        </div>

        {unlockedAchievements.length === 0 && (
          <p className="text-sm text-slate-500 text-center py-4">
            Complete actions to unlock achievements!
          </p>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Achievements
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {unlockedAchievements.length} of {ACHIEVEMENTS.length} unlocked • {totalXpFromAchievements.toLocaleString()} XP earned
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all",
              selectedCategory === category
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {CATEGORY_LABELS[category]}
          </button>
        ))}
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filteredAchievements.map((achievement, i) => {
          const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
          const progress = getAchievementProgress(achievement, stats);
          
          return (
            <motion.button
              key={achievement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setSelectedAchievement(achievement)}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all",
                isUnlocked
                  ? `${getRarityColor(achievement.rarity)} shadow-sm hover:shadow-md`
                  : "bg-slate-50 border-slate-200 opacity-60 hover:opacity-80"
              )}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0",
                  isUnlocked
                    ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)}`
                    : "bg-slate-200"
                )}>
                  {isUnlocked ? achievement.icon : <Lock className="w-5 h-5 text-slate-400" />}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-semibold truncate",
                      isUnlocked ? "text-slate-900" : "text-slate-500"
                    )}>
                      {achievement.name}
                    </span>
                    {isUnlocked && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                    {achievement.description}
                  </p>
                  
                  {/* Progress bar (if not unlocked) */}
                  {!isUnlocked && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-slate-400 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {Math.round(progress)}% complete
                      </span>
                    </div>
                  )}
                </div>

                {/* XP Reward */}
                <div className="text-right flex-shrink-0">
                  <span className={cn(
                    "text-xs font-semibold",
                    isUnlocked ? "text-amber-600" : "text-slate-400"
                  )}>
                    +{achievement.xpReward} XP
                  </span>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Achievement Detail Modal */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedAchievement(null)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            >
              {(() => {
                const isUnlocked = unlockedAchievements.some(a => a.id === selectedAchievement.id);
                const progress = getAchievementProgress(selectedAchievement, stats);
                
                return (
                  <>
                    {/* Achievement Icon */}
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className={cn(
                          "w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mx-auto shadow-lg",
                          isUnlocked
                            ? `bg-gradient-to-br ${getRarityGradient(selectedAchievement.rarity)}`
                            : "bg-slate-200"
                        )}
                      >
                        {isUnlocked ? selectedAchievement.icon : <Lock className="w-10 h-10 text-slate-400" />}
                      </motion.div>
                      
                      {/* Sparkles animation for unlocked */}
                      {isUnlocked && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute top-20 left-1/2 -translate-x-1/2"
                        >
                          <Sparkles className="w-6 h-6 text-amber-400" />
                        </motion.div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="text-xl font-bold text-slate-900">
                          {selectedAchievement.name}
                        </h3>
                        {isUnlocked && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-slate-500 mb-4">
                        {selectedAchievement.description}
                      </p>
                      
                      {/* Rarity Badge */}
                      <div className={cn(
                        "inline-block px-3 py-1 rounded-full text-xs font-bold uppercase mb-4",
                        getRarityColor(selectedAchievement.rarity)
                      )}>
                        {selectedAchievement.rarity}
                      </div>
                      
                      {/* XP Reward */}
                      <div className="p-4 rounded-2xl bg-amber-50 mb-4">
                        <span className="text-amber-700 font-bold text-lg">
                          +{selectedAchievement.xpReward} XP
                        </span>
                        <span className="text-amber-600 text-sm block">
                          {isUnlocked ? 'Earned' : 'Reward on unlock'}
                        </span>
                      </div>
                      
                      {/* Progress (if not unlocked) */}
                      {!isUnlocked && (
                        <div className="mb-4">
                          <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className="h-full bg-indigo-500 rounded-full"
                            />
                          </div>
                          <span className="text-sm text-slate-500">
                            {Math.round(progress)}% complete
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Close Button */}
                    <button
                      onClick={() => setSelectedAchievement(null)}
                      className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-medium text-slate-700 transition-colors"
                    >
                      Close
                    </button>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AchievementsPanel;
