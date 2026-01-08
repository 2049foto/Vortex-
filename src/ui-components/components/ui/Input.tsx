/**
 * Input component for VORTEX PROTOCOL
 * Form input with label, helper text, error states
 */

'use client';

import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export function Input({
  label,
  helperText,
  error,
  leftIcon,
  rightElement,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full h-12 px-4 rounded-xl border bg-card text-foreground',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            leftIcon && 'pl-12',
            rightElement && 'pr-12',
            error ? 'border-destructive focus:ring-destructive' : 'border-input',
            className
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      {(helperText || error) && (
        <p className={cn('text-sm', error ? 'text-destructive' : 'text-muted-foreground')}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}

export default Input;

