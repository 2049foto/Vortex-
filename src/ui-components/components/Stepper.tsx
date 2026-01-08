/**
 * Stepper component for VORTEX PROTOCOL
 * Progress indicator for multi-step processes
 */

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import { ConsolidationStep } from '../types';
import { cn } from '../utils/cn';

interface StepperProps {
  steps: ConsolidationStep[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="space-y-4">
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isComplete = step.status === 'complete';
        const isError = step.status === 'error';

        return (
          <div key={step.id} className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                  isComplete && 'bg-accent text-white',
                  isActive && 'bg-primary text-white',
                  isError && 'bg-destructive text-white',
                  !isComplete && !isActive && !isError && 'bg-muted text-muted-foreground'
                )}
              >
                {isComplete ? (
                  <Check className="w-4 h-4" />
                ) : isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    'w-0.5 h-8 mt-2 transition-colors',
                    isComplete ? 'bg-accent' : 'bg-muted'
                  )}
                />
              )}
            </div>
            <div className="flex-1 pt-1">
              <p
                className={cn(
                  'font-medium',
                  isActive && 'text-foreground',
                  isComplete && 'text-accent',
                  isError && 'text-destructive',
                  !isActive && !isComplete && !isError && 'text-muted-foreground'
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface StepperMiniProps {
  steps: ConsolidationStep[];
  currentStep: number;
}

export function StepperMini({ steps, currentStep }: StepperMiniProps) {
  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isComplete = step.status === 'complete';
        const isActive = index === currentStep;

        return (
          <React.Fragment key={step.id}>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: isActive ? 1.2 : 1 }}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                isComplete && 'bg-accent',
                isActive && 'bg-primary',
                !isComplete && !isActive && 'bg-muted'
              )}
            />
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 transition-colors',
                  isComplete ? 'bg-accent' : 'bg-muted'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default Stepper;

