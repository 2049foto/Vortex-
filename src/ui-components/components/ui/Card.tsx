/**
 * Card component for VORTEX PROTOCOL
 * Flexible card with header, content, footer sections
 * Variants: default, elevated, glass
 */

'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass';
  children: React.ReactNode;
}

export function Card({ variant = 'default', className, children, ...props }: CardProps) {
  const variants = {
    default: 'bg-card border border-border',
    elevated: 'bg-card border border-border shadow-lg shadow-black/5',
    glass: 'bg-card/50 backdrop-blur-xl border border-border/50',
  };

  return (
    <div
      className={cn('rounded-2xl', variants[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={cn('p-6 pb-0', className)} {...props}>
      {children}
    </div>
  );
}

interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <h3 className={cn('text-lg font-semibold text-foreground', className)} {...props}>
      {children}
    </h3>
  );
}

interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground mt-1', className)} {...props}>
      {children}
    </p>
  );
}

interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <div className={cn('p-6', className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('p-6 pt-0 flex items-center', className)} {...props}>
      {children}
    </div>
  );
}

export default Card;

