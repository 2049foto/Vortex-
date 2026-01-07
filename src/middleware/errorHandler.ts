/**
 * Vortex Protocol - Error Handler Middleware
 * Centralized error handling for API
 */

import { Context } from 'elysia';
import { ZodError } from 'zod';
import { createLogger } from '../utils/logger';

const logger = createLogger('errorHandler');

export interface ApiError {
  error: string;
  message: string;
  details?: unknown;
  statusCode: number;
}

/**
 * Format Zod validation errors
 */
function formatZodError(error: ZodError): ApiError {
  const details = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    error: 'Validation Error',
    message: 'Request validation failed',
    details,
    statusCode: 400,
  };
}

/**
 * Format generic errors
 */
function formatError(error: Error | unknown): ApiError {
  if (error instanceof ZodError) {
    return formatZodError(error);
  }

  if (error instanceof Error) {
    // Map common errors to status codes
    const statusCode = getStatusCodeFromError(error);
    
    return {
      error: error.name || 'Error',
      message: error.message,
      statusCode,
    };
  }

  return {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    statusCode: 500,
  };
}

/**
 * Get HTTP status code from error
 */
function getStatusCodeFromError(error: Error): number {
  const message = error.message.toLowerCase();

  if (message.includes('not found')) return 404;
  if (message.includes('unauthorized') || message.includes('authentication')) return 401;
  if (message.includes('forbidden') || message.includes('permission')) return 403;
  if (message.includes('validation') || message.includes('invalid')) return 400;
  if (message.includes('timeout')) return 408;
  if (message.includes('too many')) return 429;
  if (message.includes('conflict')) return 409;
  
  return 500;
}

/**
 * Global error handler
 */
export function handleError(error: Error | unknown, context?: Context): ApiError {
  const apiError = formatError(error);

  // Log error
  if (apiError.statusCode >= 500) {
    logger.error(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        details: apiError.details,
      },
      'Internal server error'
    );
  } else if (apiError.statusCode >= 400) {
    logger.warn(
      {
        error: apiError.message,
        details: apiError.details,
      },
      'Client error'
    );
  }

  // Set response status if context provided
  if (context) {
    context.set.status = apiError.statusCode;
  }

  return apiError;
}

/**
 * Error handler middleware for Elysia
 */
export const errorHandlerPlugin = (app: any) => {
  app.onError(({ error, set }: { error: Error; set: any }) => {
    const apiError = handleError(error);
    set.status = apiError.statusCode;
    return apiError;
  });
  
  return app;
};

