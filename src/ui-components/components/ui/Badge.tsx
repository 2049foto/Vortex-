/**
 * Badge component for VORTEX PROTOCOL
 * Small status indicators with variants
 */

'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'muted';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Badge({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-primary/10 text-primary border-primary/20',
    success: 'bg-accent/10 text-accent border-accent/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-destructive/10 text-destructive border-destructive/20',
    muted: 'bg-muted text-muted-foreground border-border',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;

