import WebSocket from 'ws';
import { config } from '../../config/env';
import logger from '../../utils/logger';

interface WebSocketClient {
  ws: WebSocket;
  vaultId?: string;
  userId?: string;
  lastPing: number;
}

interface NotificationMessage {
  type: string;
  data: any;
  urgent?: boolean;
  timestamp?: number;
}

class WebSocketService {
  private wss: WebSocket.Server | null = null;
  private clients: Map<string, WebSocketClient> = new Map();
  private vaultSubscriptions: Map<string, Set<string>> = new Map();

  /**
   * Initialize WebSocket server
   */
  public initialize() {
    this.wss = new WebSocket.Server({
      port: config.WS_PORT,
      perMessageDeflate: false,
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      
      logger.info('WebSocket client connected', {
        clientId,
        ip: req.socket.remoteAddress,
      });

      const client: WebSocketClient = {
        ws,
        lastPing: Date.now(),
      };

      this.clients.set(clientId, client);

      // Handle messages
      ws.on('message', (message) => {
        this.handleMessage(clientId, message);
      });

      // Handle disconnect
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.handleDisconnect(clientId);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        data: { clientId },
      });
    });

    // Start ping interval
    this.startPingInterval();

    logger.info(`WebSocket server started on port ${config.WS_PORT}`);
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(clientId: string, message: WebSocket.Data) {
    try {
      const data = JSON.parse(message.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, data.vaultId);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, data.vaultId);
          break;
        case 'ping':
          client.lastPing = Date.now();
          this.sendToClient(clientId, { type: 'pong', data: {} });
          break;
        default:
          logger.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      logger.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Handle vault subscription
   */
  private handleSubscribe(clientId: string, vaultId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.vaultId = vaultId;

    // Add to vault subscriptions
    if (!this.vaultSubscriptions.has(vaultId)) {
      this.vaultSubscriptions.set(vaultId, new Set());
    }
    this.vaultSubscriptions.get(vaultId)!.add(clientId);

    logger.info('Client subscribed to vault', { clientId, vaultId });

    this.sendToClient(clientId, {
      type: 'subscribed',
      data: { vaultId },
    });
  }

  /**
   * Handle vault unsubscription
   */
  private handleUnsubscribe(clientId: string, vaultId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from vault subscriptions
    const subscribers = this.vaultSubscriptions.get(vaultId);
    if (subscribers) {
      subscribers.delete(clientId);
      if (subscribers.size === 0) {
        this.vaultSubscriptions.delete(vaultId);
      }
    }

    client.vaultId = undefined;

    logger.info('Client unsubscribed from vault', { clientId, vaultId });

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      data: { vaultId },
    });
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from vault subscriptions
    if (client.vaultId) {
      this.handleUnsubscribe(clientId, client.vaultId);
    }

    this.clients.delete(clientId);

    logger.info('WebSocket client disconnected', { clientId });
  }

  /**
   * Send message to specific client
   */
  public sendToClient(clientId: string, message: NotificationMessage) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      const payload = {
        ...message,
        timestamp: message.timestamp || Date.now(),
      };

      client.ws.send(JSON.stringify(payload));
      return true;
    } catch (error) {
      logger.error('Error sending WebSocket message:', error);
      return false;
    }
  }

  /**
   * Send message to all clients subscribed to a vault
   */
  public sendToVault(vaultId: string, message: NotificationMessage) {
    const subscribers = this.vaultSubscriptions.get(vaultId);
    if (!subscribers || subscribers.size === 0) {
      logger.debug('No subscribers for vault', { vaultId });
      return 0;
    }

    let sentCount = 0;
    for (const clientId of subscribers) {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    logger.info('Notification sent to vault subscribers', {
      vaultId,
      subscriberCount: subscribers.size,
      sentCount,
      messageType: message.type,
    });

    return sentCount;
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcast(message: NotificationMessage) {
    let sentCount = 0;
    for (const clientId of this.clients.keys()) {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    logger.info('Broadcast message sent', {
      totalClients: this.clients.size,
      sentCount,
      messageType: message.type,
    });

    return sentCount;
  }

  /**
   * Start ping interval to keep connections alive
   */
  private startPingInterval() {
    setInterval(() => {
      const now = Date.now();
      const timeout = 60000; // 1 minute

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastPing > timeout) {
          logger.info('Closing inactive WebSocket connection', { clientId });
          client.ws.terminate();
          this.handleDisconnect(clientId);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connection statistics
   */
  public getStats() {
    return {
      totalClients: this.clients.size,
      totalVaultSubscriptions: this.vaultSubscriptions.size,
      subscriptions: Array.from(this.vaultSubscriptions.entries()).map(([vaultId, clients]) => ({
        vaultId,
        subscriberCount: clients.size,
      })),
    };
  }

  /**
   * Close WebSocket server
   */
  public close() {
    if (this.wss) {
      this.wss.close();
      logger.info('WebSocket server closed');
    }
  }
}

export default new WebSocketService();