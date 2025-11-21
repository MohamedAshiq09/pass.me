import React, { useState, useEffect } from 'react';
import { useExtension } from '@/contexts/ExtensionContext';
// import type { AlertEvent } from '@/types';

// Temporary type for development
interface AlertEvent {
  type: 'LoginAttempt' | 'SuspiciousActivity' | 'PasswordBreach' | 'UnauthorizedAccess';
  vaultId: string;
  domain?: string;
  deviceId?: string;
  ipHash?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface Props {
  onBack: () => void;
}

export default function AlertsPage({ onBack }: Props) {
  const { alerts, getAlerts, clearAlerts } = useExtension();
  const [filteredAlerts, setFilteredAlerts] = useState<AlertEvent[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'critical'>('all');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    filterAlerts();
  }, [alerts, filter]);

  const loadAlerts = async () => {
    try {
      setIsLoading(true);
      await getAlerts();
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAlerts = () => {
    let filtered = alerts;
    
    if (filter === 'high') {
      filtered = alerts.filter(alert => alert.severity === 'high');
    } else if (filter === 'critical') {
      filtered = alerts.filter(alert => alert.severity === 'critical');
    }
    
    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);
    
    setFilteredAlerts(filtered);
  };

  const handleClearAlerts = async () => {
    if (confirm('Are you sure you want to clear all alerts?')) {
      await clearAlerts();
    }
  };

  const getAlertIcon = (type: AlertEvent['type']) => {
    const icons: Record<string, string> = {
      'LoginAttempt': '🔑',
      'SuspiciousActivity': '⚠️',
      'PasswordBreach': '🚨',
      'UnauthorizedAccess': '🔒',
    };
    return icons[type] || '📢';
  };

  const getAlertColor = (severity: AlertEvent['severity']) => {
    const colors: Record<string, string> = {
      'low': '#22c55e',
      'medium': '#eab308',
      'high': '#f97316',
      'critical': '#ef4444',
    };
    return colors[severity];
  };

  const getAlertTitle = (alert: AlertEvent) => {
    const titles: Record<string, string> = {
      'LoginAttempt': 'Login Attempt',
      'SuspiciousActivity': 'Suspicious Activity',
      'PasswordBreach': 'Password Breach Detected',
      'UnauthorizedAccess': 'Unauthorized Access',
    };
    return titles[alert.type];
  };

  const getAlertDescription = (alert: AlertEvent) => {
    const descriptions: Record<string, string> = {
      'LoginAttempt': 'Someone attempted to access your vault',
      'SuspiciousActivity': 'Unusual activity detected on your account',
      'PasswordBreach': 'One of your passwords may have been compromised',
      'UnauthorizedAccess': 'Unauthorized access attempt detected',
    };
    return descriptions[alert.type];
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="alerts-page loading">
        <div className="page-header">
          <button onClick={onBack} className="back-btn">←</button>
          <h2>Security Alerts</h2>
        </div>
        <div className="spinner"></div>
        <p>Loading alerts...</p>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h2>Security Alerts</h2>
        {alerts.length > 0 && (
          <button onClick={handleClearAlerts} className="clear-btn">
            Clear All
          </button>
        )}
      </div>

      <div className="alerts-filters">
        <button 
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({alerts.length})
        </button>
        <button 
          className={filter === 'high' ? 'active' : ''}
          onClick={() => setFilter('high')}
        >
          High ({alerts.filter(a => a.severity === 'high').length})
        </button>
        <button 
          className={filter === 'critical' ? 'active' : ''}
          onClick={() => setFilter('critical')}
        >
          Critical ({alerts.filter(a => a.severity === 'critical').length})
        </button>
      </div>

      <div className="alerts-list">
        {filteredAlerts.length === 0 ? (
          <div className="empty-state">
            {alerts.length === 0 ? (
              <>
                <div className="empty-icon">🛡️</div>
                <h3>No security alerts</h3>
                <p>Your vault is secure. We'll notify you of any suspicious activity.</p>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No alerts match your filter</h3>
                <p>Try selecting a different severity level.</p>
              </>
            )}
          </div>
        ) : (
          filteredAlerts.map((alert, index) => (
            <div 
              key={`${alert.vaultId}-${alert.timestamp}-${index}`}
              className="alert-card"
            >
              <div className="alert-header">
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-info">
                  <h3>{getAlertTitle(alert)}</h3>
                  <p>{getAlertDescription(alert)}</p>
                </div>
                <div 
                  className="alert-severity"
                  style={{ backgroundColor: getAlertColor(alert.severity) }}
                >
                  {alert.severity.toUpperCase()}
                </div>
              </div>
              
              <div className="alert-details">
                <div className="alert-meta">
                  <span className="alert-time">
                    {formatTimestamp(alert.timestamp)}
                  </span>
                  {alert.domain && (
                    <span className="alert-domain">
                      Domain: {alert.domain}
                    </span>
                  )}
                </div>
                
                {alert.type === 'SuspiciousActivity' && (
                  <div className="alert-actions">
                    <button className="alert-action-btn">
                      Review Activity
                    </button>
                    <button className="alert-action-btn secondary">
                      Mark as Safe
                    </button>
                  </div>
                )}
                
                {alert.type === 'PasswordBreach' && (
                  <div className="alert-actions">
                    <button className="alert-action-btn">
                      Change Password
                    </button>
                    <button className="alert-action-btn secondary">
                      View Details
                    </button>
                  </div>
                )}
                
                {alert.type === 'UnauthorizedAccess' && (
                  <div className="alert-actions">
                    <button className="alert-action-btn">
                      Secure Account
                    </button>
                    <button className="alert-action-btn secondary">
                      Review Devices
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filteredAlerts.length > 0 && (
        <div className="alerts-summary">
          <div className="summary-stats">
            <div className="stat">
              <span className="stat-number">{alerts.filter(a => a.severity === 'critical').length}</span>
              <span className="stat-label">Critical</span>
            </div>
            <div className="stat">
              <span className="stat-number">{alerts.filter(a => a.severity === 'high').length}</span>
              <span className="stat-label">High</span>
            </div>
            <div className="stat">
              <span className="stat-number">{alerts.filter(a => a.severity === 'medium').length}</span>
              <span className="stat-label">Medium</span>
            </div>
            <div className="stat">
              <span className="stat-number">{alerts.filter(a => a.severity === 'low').length}</span>
              <span className="stat-label">Low</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}