import { Request, Response } from 'express';
import { Alert, AlertData } from '../models/Alert';
import { ApiResponse, PaginatedResponse } from '../types/api';
import { validate, schemas } from '../utils/validators';
import logger from '../utils/logger';

// In-memory storage for alerts (replace with database in production)
const alertsStorage: Map<string, Alert[]> = new Map();

class AlertsController {
  /**
   * Create a new alert
   */
  public async createAlert(alertData: AlertData): Promise<Alert> {
    try {
      const alert = new Alert(alertData);
      
      // Store alert
      if (!alertsStorage.has(alert.vault_id)) {
        alertsStorage.set(alert.vault_id, []);
      }
      alertsStorage.get(alert.vault_id)!.push(alert);

      logger.info('Alert created', {
        alertId: alert.id,
        vaultId: alert.vault_id,
        type: alert.type,
        severity: alert.severity,
      });

      return alert;
    } catch (error) {
      logger.error('Error creating alert:', error);
      throw error;
    }
  }

  /**
   * Get alerts for a vault
   */
  public async getAlerts(req: Request, res: Response) {
    try {
      const query = validate(schemas.getAlerts, req.query);
      
      const { vault_id, page = 1, limit = 20, type, severity } = query;

      // Get alerts for vault
      const vaultAlerts = alertsStorage.get(vault_id) || [];

      // Filter alerts
      let filteredAlerts = vaultAlerts;
      
      if (type) {
        filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
      }
      
      if (severity) {
        filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
      }

      // Sort by created_at (newest first)
      filteredAlerts.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
          data: paginatedAlerts.map(alert => alert.toJSON()),
          pagination: {
            page,
            limit,
            total: filteredAlerts.length,
            totalPages: Math.ceil(filteredAlerts.length / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting alerts:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to get alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Mark alert as read
   */
  public async markAsRead(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const { vault_id } = req.body;

      const vaultAlerts = alertsStorage.get(vault_id) || [];
      const alert = vaultAlerts.find(a => a.id === alertId);

      if (!alert) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
      }

      alert.markAsRead();

      logger.info('Alert marked as read', {
        alertId,
        vaultId: vault_id,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: alert.toJSON(),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error marking alert as read:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to mark alert as read',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get alert statistics
   */
  public async getAlertStats(req: Request, res: Response) {
    try {
      const { vault_id } = req.params;

      const vaultAlerts = alertsStorage.get(vault_id) || [];

      const stats = {
        total: vaultAlerts.length,
        unread: vaultAlerts.filter(a => !a.read).length,
        byType: {
          login_attempt: vaultAlerts.filter(a => a.type === 'login_attempt').length,
          suspicious_activity: vaultAlerts.filter(a => a.type === 'suspicious_activity').length,
          password_breach: vaultAlerts.filter(a => a.type === 'password_breach').length,
          unauthorized_access: vaultAlerts.filter(a => a.type === 'unauthorized_access').length,
        },
        bySeverity: {
          low: vaultAlerts.filter(a => a.severity === 'low').length,
          medium: vaultAlerts.filter(a => a.severity === 'medium').length,
          high: vaultAlerts.filter(a => a.severity === 'high').length,
          critical: vaultAlerts.filter(a => a.severity === 'critical').length,
        },
      };

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting alert stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get alert statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete alert
   */
  public async deleteAlert(req: Request, res: Response) {
    try {
      const { alertId } = req.params;
      const { vault_id } = req.body;

      const vaultAlerts = alertsStorage.get(vault_id) || [];
      const alertIndex = vaultAlerts.findIndex(a => a.id === alertId);

      if (alertIndex === -1) {
        return res.status(404).json({
          success: false,
          error: 'Alert not found',
        });
      }

      vaultAlerts.splice(alertIndex, 1);

      logger.info('Alert deleted', {
        alertId,
        vaultId: vault_id,
      });

      const response: ApiResponse = {
        success: true,
        message: 'Alert deleted successfully',
      };

      res.json(response);
    } catch (error) {
      logger.error('Error deleting alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete alert',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AlertsController();