import { SuiEvent as SuiSdkEvent } from '@mysten/sui.js/client';
import suiService from './client';
import { config } from '../../config/env';
import logger from '../../utils/logger';
import { 
  LoginAttemptEvent, 
  SuspiciousActivityEvent, 
  PasswordBreachEvent, 
  UnauthorizedAccessEvent 
} from '../../types/sui';
import websocketService from '../notifications/websocket';
import alertsController from '../../controllers/alerts.controller';

class EventListenerService {
  private isListening: boolean = false;
  private lastProcessedCheckpoint: string | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  /**
   * Start listening to Sui events
   */
  public async start() {
    if (this.isListening) {
      logger.warn('Event listener already running');
      return;
    }

    this.isListening = true;
    logger.info('Starting Sui event listener...');

    // Poll for events
    this.pollInterval = setInterval(() => {
      this.pollEvents();
    }, config.EVENT_POLL_INTERVAL);

    // Initial poll
    await this.pollEvents();
  }

  /**
   * Stop listening
   */
  public stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isListening = false;
    logger.info('Event listener stopped');
  }

  /**
   * Poll for new events
   */
  private async pollEvents() {
    try {
      const client = suiService.getClient();

      // Query events from the vault package
      const events = await client.queryEvents({
        query: {
          MoveEventModule: {
            package: config.VAULT_PACKAGE_ID,
            module: 'alert_system',
          },
        },
        limit: 50,
        order: 'descending',
      });

      if (events.data.length === 0) {
        return;
      }

      // Process events in reverse order (oldest first)
      const eventsToProcess = events.data.reverse();

      for (const event of eventsToProcess) {
        await this.processEvent(event);
      }

      logger.info(`Processed ${eventsToProcess.length} events`);
    } catch (error) {
      logger.error('Error polling events:', error);
    }
  }

  /**
   * Process individual event
   */
  private async processEvent(event: SuiSdkEvent) {
    try {
      const eventType = this.getEventType(event.type);
      if (!eventType) {
        logger.debug(`Skipping unknown event type: ${event.type}`);
        return;
      }

      logger.info(`Processing ${eventType} event`, {
        txDigest: event.id.txDigest,
        eventSeq: event.id.eventSeq,
      });

      switch (eventType) {
        case 'LoginAttempt':
          await this.handleLoginAttempt(event.parsedJson as LoginAttemptEvent);
          break;
        case 'SuspiciousActivity':
          await this.handleSuspiciousActivity(event.parsedJson as SuspiciousActivityEvent);
          break;
        case 'PasswordBreach':
          await this.handlePasswordBreach(event.parsedJson as PasswordBreachEvent);
          break;
        case 'UnauthorizedAccess':
          await this.handleUnauthorizedAccess(event.parsedJson as UnauthorizedAccessEvent);
          break;
      }
    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }

  /**
   * Extract event type from full type string
   */
  private getEventType(fullType: string): string | null {
    const match = fullType.match(/::alert_system::(\w+)/);
    return match ? match[1] : null;
  }

  /**
   * Handle LoginAttempt event
   */
  private async handleLoginAttempt(event: LoginAttemptEvent) {
    logger.info('Login attempt detected', event);

    // Create alert
    const alert = await alertsController.createAlert({
      vault_id: event.vault_id,
      type: 'login_attempt',
      severity: event.success ? 'low' : 'medium',
      message: event.success ? 'Successful login detected' : 'Failed login attempt detected',
      metadata: event,
    });

    // Send real-time notification
    websocketService.sendToVault(event.vault_id, {
      type: 'login_attempt',
      data: alert,
    });
  }

  /**
   * Handle SuspiciousActivity event
   */
  private async handleSuspiciousActivity(event: SuspiciousActivityEvent) {
    logger.warn('Suspicious activity detected', event);

    const severityMap: { [key: number]: 'low' | 'medium' | 'high' | 'critical' } = {
      1: 'low',
      2: 'medium',
      3: 'high',
      4: 'critical',
    };

    const alert = await alertsController.createAlert({
      vault_id: event.vault_id,
      type: 'suspicious_activity',
      severity: severityMap[event.severity] || 'medium',
      message: `Suspicious activity: ${Buffer.from(event.reason).toString('utf-8')}`,
      metadata: event,
    });

    // Send urgent notification
    websocketService.sendToVault(event.vault_id, {
      type: 'suspicious_activity',
      data: alert,
      urgent: true,
    });
  }

  /**
   * Handle PasswordBreach event
   */
  private async handlePasswordBreach(event: PasswordBreachEvent) {
    logger.error('Password breach detected', event);

    const alert = await alertsController.createAlert({
      vault_id: event.vault_id,
      type: 'password_breach',
      severity: 'critical',
      message: 'Password found in breach database! Change immediately.',
      metadata: event,
    });

    websocketService.sendToVault(event.vault_id, {
      type: 'password_breach',
      data: alert,
      urgent: true,
    });
  }

  /**
   * Handle UnauthorizedAccess event
   */
  private async handleUnauthorizedAccess(event: UnauthorizedAccessEvent) {
    logger.error('Unauthorized access attempt', event);

    const alert = await alertsController.createAlert({
      vault_id: event.vault_id,
      type: 'unauthorized_access',
      severity: 'high',
      message: 'Unauthorized access attempt detected from unknown device',
      metadata: event,
    });

    websocketService.sendToVault(event.vault_id, {
      type: 'unauthorized_access',
      data: alert,
      urgent: true,
    });
  }

  /**
   * Get listener status
   */
  public getStatus() {
    return {
      isListening: this.isListening,
      lastProcessedCheckpoint: this.lastProcessedCheckpoint,
    };
  }
}

export default new EventListenerService();