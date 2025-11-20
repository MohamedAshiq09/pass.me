import { Router, Request, Response } from 'express';
import suiService from '../services/sui/client';
import walrusClient from '../services/walrus/client';
import websocketService from '../services/notifications/websocket';
import eventListener from '../services/sui/eventListener';
import { HealthCheckResponse } from '../types/api';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const startTime = Date.now();

    // Check all services
    const [suiHealthy, walrusHealthy] = await Promise.all([
      suiService.healthCheck(),
      walrusClient.healthCheck(),
    ]);

    const wsStats = websocketService.getStats();
    const eventListenerStatus = eventListener.getStatus();

    const healthCheck: HealthCheckResponse = {
      status: suiHealthy && walrusHealthy ? 'ok' : 'error',
      timestamp: Date.now(),
      uptime: process.uptime(),
      services: {
        sui: suiHealthy,
        walrus: walrusHealthy,
        websocket: true, // WebSocket is always healthy if server is running
      },
    };

    const responseTime = Date.now() - startTime;

    res.json({
      ...healthCheck,
      responseTime: `${responseTime}ms`,
      websocket: {
        totalClients: wsStats.totalClients,
        totalSubscriptions: wsStats.totalVaultSubscriptions,
      },
      eventListener: eventListenerStatus,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: Date.now(),
      uptime: process.uptime(),
      services: {
        sui: false,
        walrus: false,
        websocket: false,
      },
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;