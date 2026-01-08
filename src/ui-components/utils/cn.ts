/**
 * Utility function for merging class names
 * Uses clsx + tailwind-merge for optimal class merging
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

