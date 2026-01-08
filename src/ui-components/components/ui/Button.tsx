/**
 * Button component for VORTEX PROTOCOL
 * Premium button with variants: primary, secondary, ghost, danger
 * Includes loading state, icons, and accessibility features
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles = `
    inline-flex items-center justify-center gap-2 font-semibold
    rounded-xl transition-all duration-200 ease-out
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none
    active:scale-[0.98]
  `;

  const variants = {
    primary: `
      bg-primary text-primary-foreground
      hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20
      focus-visible:ring-primary
    `,
    secondary: `
      bg-secondary text-secondary-foreground
      hover:bg-secondary/80
      focus-visible:ring-secondary
    `,
    ghost: `
      bg-transparent text-foreground
      hover:bg-muted
      focus-visible:ring-muted
    `,
    danger: `
      bg-destructive text-destructive-foreground
      hover:bg-destructive/90 hover:shadow-lg hover:shadow-destructive/20
      focus-visible:ring-destructive
    `,
    outline: `
      bg-transparent border-2 border-border text-foreground
      hover:bg-muted hover:border-muted-foreground/30
      focus-visible:ring-border
    `,
  };

  const sizes = {
    sm: 'h-9 px-4 text-sm min-w-[80px]',
    md: 'h-11 px-6 text-base min-w-[100px]',
    lg: 'h-14 px-8 text-lg min-w-[120px]',
  };

  // Filter out motion-conflicting props
  const {
    onDrag,
    onDragStart,
    onDragEnd,
    onAnimationStart,
    onAnimationEnd,
    ...filteredProps
  } = props as any;

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...filteredProps}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : leftIcon ? (
        leftIcon
      ) : null}
      {children}
      {!isLoading && rightIcon}
    </motion.button>
  );
}

export default Button;

