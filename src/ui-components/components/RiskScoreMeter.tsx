/**
 * RiskScoreMeter component for VORTEX PROTOCOL
 * Visual meter displaying risk score 0-100 with color gradient
 * Includes confidence indicator and explanation
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Info } from 'lucide-react';
import { cn } from '../utils/cn';

interface RiskScoreMeterProps {
  score: number;
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(score: number): string {
  if (score < 30) return 'text-accent';
  if (score < 60) return 'text-amber-500';
  return 'text-destructive';
}

function getScoreGradient(score: number): string {
  if (score < 30) return 'from-accent to-accent';
  if (score < 60) return 'from-amber-400 to-amber-500';
  return 'from-destructive to-red-600';
}

function getScoreLabel(score: number): string {
  if (score < 30) return 'Low Risk';
  if (score < 60) return 'Medium Risk';
  if (score < 80) return 'High Risk';
  return 'Critical Risk';
}

export function RiskScoreMeter({ score, confidence, showLabel = true, size = 'md' }: RiskScoreMeterProps) {
  const sizes = {
    sm: { height: 'h-1.5', text: 'text-xs', icon: 'w-3 h-3' },
    md: { height: 'h-2', text: 'text-sm', icon: 'w-4 h-4' },
    lg: { height: 'h-3', text: 'text-base', icon: 'w-5 h-5' },
  };

  const s = sizes[size];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className={cn(s.icon, getScoreColor(score))} />
          <span className={cn('font-semibold', s.text, getScoreColor(score))}>
            {score}/100
          </span>
          {showLabel && (
            <span className={cn(s.text, 'text-muted-foreground')}>
              {getScoreLabel(score)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Info className={s.icon} />
          <span className={cn(s.text)}>{confidence}% confidence</span>
        </div>
      </div>
      <div className={cn('w-full bg-muted rounded-full overflow-hidden', s.height)}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={cn('h-full rounded-full bg-gradient-to-r', getScoreGradient(score))}
        />
      </div>
    </div>
  );
}

export default RiskScoreMeter;

