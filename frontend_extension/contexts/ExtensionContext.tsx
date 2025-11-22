'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import type { ExtensionMessage, ExtensionResponse, AlertEvent } from '@/types';

// Declare chrome global for TypeScript
declare const chrome: typeof globalThis.chrome | undefined;

// Temporary types for development
interface ExtensionMessage {
  type: string;
  payload?: any;
  requestId?: string;
}

interface ExtensionResponse {
  success: boolean;
  data?: any;
  error?: string;
  requestId?: string;
}

interface AlertEvent {
  type: 'LoginAttempt' | 'SuspiciousActivity' | 'PasswordBreach' | 'UnauthorizedAccess';
  vaultId: string;
  domain?: string;
  deviceId?: string;
  ipHash?: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ExtensionContextType {
  isExtensionEnvironment: boolean;
  alerts: AlertEvent[];
  
  // Extension communication
  sendMessage: (message: ExtensionMessage) => Promise<ExtensionResponse>;
  
  // Alert management
  getAlerts: () => Promise<AlertEvent[]>;
  clearAlerts: () => void;
  
  // Auto-fill functionality
  fillPassword: (domain: string, username: string, password: string) => Promise<void>;
  
  // Extension state
  isLocked: boolean;
  autoLockTimeout: number;
  setAutoLockTimeout: (timeout: number) => void;
}

export const ExtensionContext = createContext<ExtensionContextType | undefined>(undefined);

export function ExtensionProvider({ children }: { children: ReactNode }) {
  const [isExtensionEnvironment, setIsExtensionEnvironment] = useState(false);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [autoLockTimeout, setAutoLockTimeoutState] = useState(15 * 60 * 1000); // 15 minutes

  useEffect(() => {
    // Check if running in extension environment
    const isExtension = typeof chrome !== 'undefined' && chrome.runtime && !!chrome.runtime.id;
    setIsExtensionEnvironment(isExtension);

    if (isExtension) {
      // Listen for messages from background script
      chrome.runtime.onMessage.addListener(handleExtensionMessage);
      
      // Load saved settings
      loadExtensionSettings();
    }

    return () => {
      if (isExtension) {
        chrome.runtime.onMessage.removeListener(handleExtensionMessage);
      }
    };
  }, []);

  const handleExtensionMessage = (
    message: ExtensionMessage,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sender: any,
    sendResponse: (response: ExtensionResponse) => void
  ) => {
    switch (message.type) {
      case 'GET_ALERTS':
        sendResponse({
          success: true,
          data: alerts,
          requestId: message.requestId,
        });
        break;
        
      case 'LOCK_VAULT':
        setIsLocked(true);
        sendResponse({
          success: true,
          requestId: message.requestId,
        });
        break;
        
      default:
        sendResponse({
          success: false,
          error: 'Unknown message type',
          requestId: message.requestId,
        });
    }
  };

  const loadExtensionSettings = async () => {
    try {
      const result = await chrome.storage.local.get(['autoLockTimeout', 'alerts']);
      
      if (result.autoLockTimeout) {
        setAutoLockTimeoutState(result.autoLockTimeout);
      }
      
      if (result.alerts) {
        setAlerts(result.alerts);
      }
    } catch (error) {
      console.error('Error loading extension settings:', error);
    }
  };

  const sendMessage = async (message: ExtensionMessage): Promise<ExtensionResponse> => {
    if (!isExtensionEnvironment) {
      throw new Error('Not running in extension environment');
    }

    return new Promise((resolve) => {
      const messageWithId = {
        ...message,
        requestId: crypto.randomUUID(),
      };

      chrome.runtime.sendMessage(messageWithId, (response: ExtensionResponse) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: chrome.runtime.lastError.message,
            requestId: messageWithId.requestId,
          });
        } else {
          resolve(response);
        }
      });
    });
  };

  const getAlerts = async (): Promise<AlertEvent[]> => {
    if (isExtensionEnvironment) {
      const response = await sendMessage({ type: 'GET_ALERTS' });
      if (response.success && response.data) {
        setAlerts(response.data);
        return response.data;
      }
    }
    return alerts;
  };

  const clearAlerts = async () => {
    setAlerts([]);
    
    if (isExtensionEnvironment) {
      try {
        await chrome.storage.local.set({ alerts: [] });
      } catch (error) {
        console.error('Error clearing alerts:', error);
      }
    }
  };

  const fillPassword = async (domain: string, username: string, password: string) => {
    if (!isExtensionEnvironment) {
      throw new Error('Auto-fill only available in extension');
    }

    const response = await sendMessage({
      type: 'AUTO_FILL',
      payload: { domain, username, password },
    });

    if (!response.success) {
      throw new Error(response.error || 'Failed to auto-fill password');
    }
  };

  const setAutoLockTimeout = async (timeout: number) => {
    setAutoLockTimeoutState(timeout);
    
    if (isExtensionEnvironment) {
      try {
        await chrome.storage.local.set({ autoLockTimeout: timeout });
        
        // Notify background script of timeout change
        await sendMessage({
          type: 'UPDATE_AUTO_LOCK_TIMEOUT',
          payload: { timeout },
        });
      } catch (error) {
        console.error('Error setting auto-lock timeout:', error);
      }
    }
  };

  const value: ExtensionContextType = {
    isExtensionEnvironment,
    alerts,
    sendMessage,
    getAlerts,
    clearAlerts,
    fillPassword,
    isLocked,
    autoLockTimeout,
    setAutoLockTimeout,
  };

  return <ExtensionContext.Provider value={value}>{children}</ExtensionContext.Provider>;
}

export function useExtension() {
  const context = useContext(ExtensionContext);
  if (context === undefined) {
    throw new Error('useExtension must be used within an ExtensionProvider');
  }
  return context;
}