/**
 * Vortex Protocol - Main API Server
 * Bun + Elysia.ts
 */

import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { env } from './config/env';
import { createLogger } from './utils/logger';

// Routes
import { scanRoute } from './routes/scan';
import { swapRoute } from './routes/swap';
import { statusRoute } from './routes/status';
import { userRoute } from './routes/user';
import { analyticsRoute } from './routes/analytics';
import { frameRoute } from './routes/frame';

const logger = createLogger('server');

const PORT = env.PORT || 3001;
const IS_PRODUCTION = env.NODE_ENV === 'production';

const app = new Elysia()
  // Global plugins
  .use(
    cors({
      origin: IS_PRODUCTION
        ? [env.NEXT_PUBLIC_APP_URL, 'https://warpcast.com']
        : true,
      credentials: true,
    })
  )
  .use(
    swagger({
      path: '/docs',
      documentation: {
        info: {
          title: 'Vortex Protocol API',
          version: '1.0.0',
          description: 'Premium Portfolio Hygiene Engine - Gasless consolidator optimized for Base',
        },
        tags: [
          { name: 'Portfolio', description: 'Wallet scanning and token analysis' },
          { name: 'Consolidation', description: 'Gasless token consolidation' },
          { name: 'Analytics', description: 'Platform metrics and insights' },
          { name: 'Farcaster', description: 'Farcaster Frame integration' },
        ],
      },
    })
  )
  
  // Health check
  .get('/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
  }))

  // Public routes
  .use(frameRoute)
  .use(analyticsRoute)

  // API routes (rate limiting handled per route)
  .group('/api/v1', (app) =>
    app
      .use(scanRoute)
      .use(swapRoute)
      .use(statusRoute)
      .use(userRoute)
  )

  // Error handling
  .onError(({ error, set }) => {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error({ error: errorMessage, stack: errorStack }, 'Unhandled error');

    if (errorMessage.includes('Not Found')) {
      set.status = 404;
      return {
        success: false,
        error: 'Route not found',
      };
    }

    if (errorMessage.includes('Validation')) {
      set.status = 400;
      return {
        success: false,
        error: 'Validation error',
        message: errorMessage,
      };
    }

    set.status = 500;
    return {
      success: false,
      error: 'Internal server error',
      message: IS_PRODUCTION ? undefined : errorMessage,
    };
  })

  // Start server
  .listen(PORT);

logger.info(
  {
    port: PORT,
    env: env.NODE_ENV,
    docs: `http://localhost:${PORT}/docs`,
  },
  '🚀 Vortex Protocol API started'
);

console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🌀 VORTEX PROTOCOL API                                 ║
║                                                           ║
║   🔗 API:      http://localhost:${PORT}                     ║
║   📚 Docs:     http://localhost:${PORT}/docs                ║
║   🏥 Health:   http://localhost:${PORT}/health              ║
║                                                           ║
║   Environment: ${env.NODE_ENV.toUpperCase().padEnd(9, ' ')}                              ║
║   Runtime:     Bun ${Bun.version.padEnd(35, ' ')}║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`);

export default app;
export type App = typeof app;

