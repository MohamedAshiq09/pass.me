import logger from '../../utils/logger';
import { Activity } from '../../models/Activity';
import { hashIP } from '../../utils/crypto';

interface AnomalyResult {
  isAnomalous: boolean;
  reasons: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

class AnomalyDetectionService {
  private readonly UNUSUAL_HOUR_THRESHOLD = 0.1; // 10% of normal activity
  private readonly NEW_LOCATION_THRESHOLD = 0.05; // 5% of activity from new locations
  private readonly RAPID_LOGIN_THRESHOLD = 5; // 5 logins in 10 minutes

  /**
   * Detect anomalies in login activity
   */
  public async detectLoginAnomaly(
    vaultId: string,
    deviceId: string,
    ipAddress: string,
    userAgent: string,
    historicalActivities: Activity[]
  ): Promise<AnomalyResult> {
    const reasons: string[] = [];
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let confidence = 0;

    try {
      // Check for new device
      const isNewDevice = this.isNewDevice(deviceId, historicalActivities);
      if (isNewDevice) {
        reasons.push('UNKNOWN_DEVICE');
        severity = 'medium';
        confidence += 0.3;
      }

      // Check for new location (IP-based)
      const isNewLocation = this.isNewLocation(ipAddress, historicalActivities);
      if (isNewLocation) {
        reasons.push('NEW_LOCATION');
        severity = severity === 'low' ? 'medium' : 'high';
        confidence += 0.4;
      }

      // Check for unusual time
      const isUnusualTime = this.isUnusualTime(new Date(), historicalActivities);
      if (isUnusualTime) {
        reasons.push('UNUSUAL_TIME');
        confidence += 0.2;
      }

      // Check for rapid successive logins
      const isRapidLogin = this.isRapidLogin(deviceId, historicalActivities);
      if (isRapidLogin) {
        reasons.push('RAPID_LOGIN_ATTEMPTS');
        severity = 'high';
        confidence += 0.5;
      }

      // Check for suspicious user agent
      const isSuspiciousUserAgent = this.isSuspiciousUserAgent(userAgent, historicalActivities);
      if (isSuspiciousUserAgent) {
        reasons.push('SUSPICIOUS_USER_AGENT');
        confidence += 0.3;
      }

      // Determine if anomalous
      const isAnomalous = confidence > 0.5 || reasons.length >= 2;

      // Adjust severity based on confidence
      if (confidence > 0.8) {
        severity = 'critical';
      } else if (confidence > 0.6) {
        severity = 'high';
      } else if (confidence > 0.3) {
        severity = 'medium';
      }

      logger.info('Anomaly detection completed', {
        vaultId,
        deviceId,
        isAnomalous,
        reasons,
        severity,
        confidence,
      });

      return {
        isAnomalous,
        reasons,
        severity,
        confidence,
      };

    } catch (error) {
      logger.error('Error in anomaly detection:', error);
      return {
        isAnomalous: false,
        reasons: [],
        severity: 'low',
        confidence: 0,
      };
    }
  }

  /**
   * Check if device is new
   */
  private isNewDevice(deviceId: string, activities: Activity[]): boolean {
    return !activities.some(activity => activity.device_id === deviceId);
  }

  /**
   * Check if location (IP) is new
   */
  private isNewLocation(ipAddress: string, activities: Activity[]): boolean {
    const ipHash = hashIP(ipAddress);
    const uniqueIPs = new Set(activities.map(activity => activity.ip_hash));
    
    // If we have very few historical IPs, be less strict
    if (uniqueIPs.size < 3) {
      return false;
    }

    return !uniqueIPs.has(ipHash);
  }

  /**
   * Check if login time is unusual
   */
  private isUnusualTime(loginTime: Date, activities: Activity[]): boolean {
    if (activities.length < 10) {
      return false; // Not enough data
    }

    const loginHour = loginTime.getHours();
    const historicalHours = activities.map(activity => activity.timestamp.getHours());
    
    // Count activities in the same hour
    const sameHourCount = historicalHours.filter(hour => hour === loginHour).length;
    const totalActivities = activities.length;
    
    const hourFrequency = sameHourCount / totalActivities;
    
    return hourFrequency < this.UNUSUAL_HOUR_THRESHOLD;
  }

  /**
   * Check for rapid login attempts
   */
  private isRapidLogin(deviceId: string, activities: Activity[]): boolean {
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    
    const recentLogins = activities.filter(activity => 
      activity.device_id === deviceId &&
      activity.action.includes('login') &&
      activity.timestamp >= tenMinutesAgo
    );

    return recentLogins.length >= this.RAPID_LOGIN_THRESHOLD;
  }

  /**
   * Check for suspicious user agent
   */
  private isSuspiciousUserAgent(userAgent: string, activities: Activity[]): boolean {
    if (!userAgent || activities.length < 5) {
      return false;
    }

    // Extract user agents from historical activities
    const historicalUserAgents = activities
      .map(activity => activity.metadata?.userAgent)
      .filter(ua => ua);

    if (historicalUserAgents.length === 0) {
      return false;
    }

    // Check if current user agent is significantly different
    const isSimilar = historicalUserAgents.some(historicalUA => 
      this.calculateUserAgentSimilarity(userAgent, historicalUA) > 0.7
    );

    return !isSimilar;
  }

  /**
   * Calculate similarity between user agents
   */
  private calculateUserAgentSimilarity(ua1: string, ua2: string): number {
    if (!ua1 || !ua2) return 0;

    // Simple similarity based on common tokens
    const tokens1 = ua1.toLowerCase().split(/[\s\/\(\)]+/);
    const tokens2 = ua2.toLowerCase().split(/[\s\/\(\)]+/);

    const commonTokens = tokens1.filter(token => tokens2.includes(token));
    const totalTokens = new Set([...tokens1, ...tokens2]).size;

    return commonTokens.length / totalTokens;
  }

  /**
   * Analyze password usage patterns
   */
  public async analyzePasswordUsagePattern(
    vaultId: string,
    entryId: string,
    activities: Activity[]
  ): Promise<{
    isUnusual: boolean;
    reasons: string[];
  }> {
    const reasons: string[] = [];

    try {
      // Filter activities for this password entry
      const entryActivities = activities.filter(
        activity => activity.entry_id === entryId
      );

      if (entryActivities.length < 2) {
        return { isUnusual: false, reasons: [] };
      }

      // Check for unusual frequency
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const recentUsage = entryActivities.filter(
        activity => activity.timestamp >= oneDayAgo
      );

      // Calculate average daily usage
      const totalDays = Math.max(1, 
        (now.getTime() - entryActivities[0].timestamp.getTime()) / (24 * 60 * 60 * 1000)
      );
      const averageDailyUsage = entryActivities.length / totalDays;

      if (recentUsage.length > averageDailyUsage * 3) {
        reasons.push('UNUSUAL_FREQUENCY');
      }

      // Check for usage from multiple devices simultaneously
      const recentDevices = new Set(recentUsage.map(activity => activity.device_id));
      if (recentDevices.size > 2) {
        reasons.push('MULTIPLE_DEVICES');
      }

      return {
        isUnusual: reasons.length > 0,
        reasons,
      };

    } catch (error) {
      logger.error('Error analyzing password usage pattern:', error);
      return { isUnusual: false, reasons: [] };
    }
  }
}

export default new AnomalyDetectionService();