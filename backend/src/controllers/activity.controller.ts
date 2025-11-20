import { Request, Response } from 'express';
import { Activity, ActivityData } from '../models/Activity';
import { ApiResponse, PaginatedResponse } from '../types/api';
import logger from '../utils/logger';
import { hashIP } from '../utils/crypto';

// In-memory storage for activities (replace with database in production)
const activitiesStorage: Map<string, Activity[]> = new Map();

class ActivityController {
  /**
   * Record new activity
   */
  public async recordActivity(activityData: ActivityData): Promise<Activity> {
    try {
      const activity = new Activity(activityData);
      
      // Store activity
      if (!activitiesStorage.has(activity.vault_id)) {
        activitiesStorage.set(activity.vault_id, []);
      }
      activitiesStorage.get(activity.vault_id)!.push(activity);

      logger.info('Activity recorded', {
        activityId: activity.id,
        vaultId: activity.vault_id,
        action: activity.action,
      });

      return activity;
    } catch (error) {
      logger.error('Error recording activity:', error);
      throw error;
    }
  }

  /**
   * Get activities for a vault
   */
  public async getActivities(req: Request, res: Response) {
    try {
      const { vault_id } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const action = req.query.action as string;

      // Get activities for vault
      const vaultActivities = activitiesStorage.get(vault_id) || [];

      // Filter by action if specified
      let filteredActivities = vaultActivities;
      if (action) {
        filteredActivities = filteredActivities.filter(activity => 
          activity.action.toLowerCase().includes(action.toLowerCase())
        );
      }

      // Sort by timestamp (newest first)
      filteredActivities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Paginate
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

      const response: ApiResponse<PaginatedResponse<any>> = {
        success: true,
        data: {
          data: paginatedActivities.map(activity => activity.toJSON()),
          pagination: {
            page,
            limit,
            total: filteredActivities.length,
            totalPages: Math.ceil(filteredActivities.length / limit),
          },
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting activities:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get activities',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Record login activity
   */
  public async recordLogin(req: Request, res: Response) {
    try {
      const { vault_id, entry_id, device_id, success } = req.body;
      const ip = req.ip || 'unknown';

      const activity = await this.recordActivity({
        vault_id,
        entry_id,
        action: success ? 'login_success' : 'login_failed',
        device_id,
        ip_hash: hashIP(ip),
        metadata: {
          ip: hashIP(ip),
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
        },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: activity.toJSON(),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error recording login activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record login activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Record password generation activity
   */
  public async recordPasswordGeneration(req: Request, res: Response) {
    try {
      const { vault_id, entry_id, device_id, domain } = req.body;
      const ip = req.ip || 'unknown';

      const activity = await this.recordActivity({
        vault_id,
        entry_id,
        action: 'password_generated',
        device_id,
        ip_hash: hashIP(ip),
        metadata: {
          domain: domain ? hashIP(domain) : undefined, // Hash domain for privacy
          ip: hashIP(ip),
          userAgent: req.get('User-Agent'),
          timestamp: new Date(),
        },
      });

      const response: ApiResponse<any> = {
        success: true,
        data: activity.toJSON(),
      };

      res.json(response);
    } catch (error) {
      logger.error('Error recording password generation activity:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to record password generation activity',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get activity statistics
   */
  public async getActivityStats(req: Request, res: Response) {
    try {
      const { vault_id } = req.params;
      const days = parseInt(req.query.days as string) || 7;

      const vaultActivities = activitiesStorage.get(vault_id) || [];
      
      // Filter activities by date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      const recentActivities = vaultActivities.filter(
        activity => activity.timestamp >= cutoffDate
      );

      const stats = {
        total: recentActivities.length,
        byAction: {} as Record<string, number>,
        byDay: {} as Record<string, number>,
        uniqueDevices: new Set(recentActivities.map(a => a.device_id)).size,
      };

      // Count by action
      recentActivities.forEach(activity => {
        stats.byAction[activity.action] = (stats.byAction[activity.action] || 0) + 1;
      });

      // Count by day
      recentActivities.forEach(activity => {
        const day = activity.timestamp.toISOString().split('T')[0];
        stats.byDay[day] = (stats.byDay[day] || 0) + 1;
      });

      const response: ApiResponse<typeof stats> = {
        success: true,
        data: stats,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting activity stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get activity statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new ActivityController();