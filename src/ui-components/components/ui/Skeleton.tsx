/**
 * Skeleton loading components for VORTEX PROTOCOL
 * Provides shimmer animation for loading states
 */

'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-muted via-muted/70 to-muted bg-[length:200%_100%]',
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-border">
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-16" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-24" /></td>
      <td className="py-4 px-4"><Skeleton className="h-4 w-20" /></td>
    </tr>
  );
}

export function SkeletonAssetCard() {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
    </div>
  );
}

export default Skeleton;

