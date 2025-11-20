import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config } from './config/env';
import logger from './utils/logger';

// Import middleware
import { requestLogger } from './middleware/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// Import routes
import healthRoutes from './routes/health.routes';
import vaultRoutes from './routes/vault.routes';
import alertsRoutes from './routes/alerts.routes';
import activityRoutes from './routes/activity.routes';
import authRoutes from './routes/auth.routes';

// Import services
import websocketService from './services/notifications/websocket';
import eventListener from './services/sui/eventListener';

class Server {
  private app: express.Application;

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
    }));

    // Compression
    this.app.use(compression());

    // Rate limiting
    this.app.use(generalLimiter);

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging
    this.app.use(requestLogger);

    // Trust proxy (for rate limiting and IP detection)
    this.app.set('trust proxy', 1);
  }

  private setupRoutes() {
    // Health check
    this.app.use('/api/health', healthRoutes);

    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/vault', vaultRoutes);
    this.app.use('/api/alerts', alertsRoutes);
    this.app.use('/api/activity', activityRoutes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Pass.me Backend API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        endpoints: {
          health: '/api/health',
          auth: '/api/auth',
          vault: '/api/vault',
          alerts: '/api/alerts',
          activity: '/api/activity',
        },
      });
    });
  }

  private setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Error handler
    this.app.use(errorHandler);
  }

  public async start() {
    try {
      // Initialize WebSocket service
      websocketService.initialize();

      // Start Sui event listener
      await eventListener.start();

      // Start HTTP server
      this.app.listen(config.PORT, config.HOST, () => {
        logger.info(`🚀 Server started successfully`, {
          port: config.PORT,
          host: config.HOST,
          environment: config.NODE_ENV,
          websocketPort: config.WS_PORT,
        });

        logger.info('📡 Services initialized:', {
          suiNetwork: config.SUI_NETWORK,
          walrusAggregator: config.WALRUS_AGGREGATOR_URL,
          eventPolling: `${config.EVENT_POLL_INTERVAL}ms`,
        });
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown() {
    const shutdown = (signal: string) => {
      logger.info(`📴 Received ${signal}, shutting down gracefully...`);

      // Stop event listener
      eventListener.stop();

      // Close WebSocket server
      websocketService.close();

      // Exit process
      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }
}

// Start server
const server = new Server();
server.start();