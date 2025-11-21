// Background Service Worker for Pass.me Extension

// import { EXTENSION_CONFIG } from '@/config/constants';
// import type { ExtensionMessage, ExtensionResponse, AlertEvent } from '@/types';

// Temporary constants and types for development
const EXTENSION_CONFIG = {
  AUTO_LOCK_TIMEOUT: 15 * 60 * 1000, // 15 minutes
};

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

// Global state
let isLocked = false;
let autoLockTimer: NodeJS.Timeout | null = null;
let alerts: AlertEvent[] = [];

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Pass.me extension installed');
  
  // Set up context menu
  chrome.contextMenus.create({
    id: 'pass-me-generate',
    title: 'Generate Password',
    contexts: ['editable'],
  });
  
  // Initialize storage
  chrome.storage.local.set({
    isLocked: false,
    alerts: [],
    autoLockTimeout: EXTENSION_CONFIG.AUTO_LOCK_TIMEOUT,
  });
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionResponse) => void
) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep message channel open for async response
});

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionResponse) => void
) {
  try {
    switch (message.type) {
      case 'GET_VAULT':
        await handleGetVault(message, sendResponse);
        break;
        
      case 'ADD_PASSWORD':
        await handleAddPassword(message, sendResponse);
        break;
        
      case 'AUTO_FILL':
        await handleAutoFill(message, sender, sendResponse);
        break;
        
      case 'GENERATE_PASSWORD':
        await handleGeneratePassword(message, sendResponse);
        break;
        
      case 'LOCK_VAULT':
        await handleLockVault(sendResponse);
        break;
        
      case 'UNLOCK_VAULT':
        await handleUnlockVault(sendResponse);
        break;
        
      case 'GET_ALERTS':
        await handleGetAlerts(sendResponse);
        break;
        
      case 'SYNC_VAULT':
        await handleSyncVault(sendResponse);
        break;
        
      default:
        sendResponse({
          success: false,
          error: 'Unknown message type',
          requestId: message.requestId,
        });
    }
  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      requestId: message.requestId,
    });
  }
}

async function handleGetVault(
  message: ExtensionMessage,
  sendResponse: (response: ExtensionResponse) => void
) {
  if (isLocked) {
    sendResponse({
      success: false,
      error: 'Vault is locked',
      requestId: message.requestId,
    });
    return;
  }

  // Get vault data from storage
  const result = await chrome.storage.local.get(['encryptedVault']);
  
  sendResponse({
    success: true,
    data: result.encryptedVault,
    requestId: message.requestId,
  });
}

async function handleAddPassword(
  message: ExtensionMessage,
  sendResponse: (response: ExtensionResponse) => void
) {
  if (isLocked) {
    sendResponse({
      success: false,
      error: 'Vault is locked',
      requestId: message.requestId,
    });
    return;
  }

  // This would integrate with the vault manager
  // For now, just acknowledge the request
  sendResponse({
    success: true,
    data: { id: crypto.randomUUID() },
    requestId: message.requestId,
  });
}

async function handleAutoFill(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: ExtensionResponse) => void
) {
  if (isLocked) {
    sendResponse({
      success: false,
      error: 'Vault is locked',
      requestId: message.requestId,
    });
    return;
  }

  if (!sender.tab?.id) {
    sendResponse({
      success: false,
      error: 'No active tab',
      requestId: message.requestId,
    });
    return;
  }

  try {
    // Send auto-fill data to content script
    await chrome.tabs.sendMessage(sender.tab.id, {
      type: 'FILL_FORM',
      payload: message.payload,
    });

    sendResponse({
      success: true,
      requestId: message.requestId,
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: 'Failed to auto-fill',
      requestId: message.requestId,
    });
  }
}

async function handleGeneratePassword(
  message: ExtensionMessage,
  sendResponse: (response: ExtensionResponse) => void
) {
  // Mock password generation for development
  const generateMockPassword = (length: number = 16) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };
  
  const password = generateMockPassword(message.payload?.options?.length || 16);
  
  sendResponse({
    success: true,
    data: { password },
    requestId: message.requestId,
  });
}

async function handleLockVault(sendResponse: (response: ExtensionResponse) => void) {
  isLocked = true;
  
  // Clear sensitive data from storage
  await chrome.storage.local.remove(['sessionToken', 'zkloginSession']);
  await chrome.storage.local.set({ isLocked: true });
  
  // Clear auto-lock timer
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
    autoLockTimer = null;
  }
  
  sendResponse({ success: true });
}

async function handleUnlockVault(sendResponse: (response: ExtensionResponse) => void) {
  isLocked = false;
  await chrome.storage.local.set({ isLocked: false });
  
  // Restart auto-lock timer
  startAutoLockTimer();
  
  sendResponse({ success: true });
}

async function handleGetAlerts(sendResponse: (response: ExtensionResponse) => void) {
  const result = await chrome.storage.local.get(['alerts']);
  alerts = result.alerts || [];
  
  sendResponse({
    success: true,
    data: alerts,
  });
}

async function handleSyncVault(sendResponse: (response: ExtensionResponse) => void) {
  try {
    // This would sync with Walrus storage
    // For now, just acknowledge
    sendResponse({ success: true });
  } catch (error) {
    sendResponse({
      success: false,
      error: 'Sync failed',
    });
  }
}

// Auto-lock functionality
function startAutoLockTimer() {
  if (autoLockTimer) {
    clearTimeout(autoLockTimer);
  }
  
  chrome.storage.local.get(['autoLockTimeout']).then(result => {
    const timeout = result.autoLockTimeout || EXTENSION_CONFIG.AUTO_LOCK_TIMEOUT;
    
    autoLockTimer = setTimeout(async () => {
      await handleLockVault(() => {});
      
      // Notify popup if open
      try {
        chrome.runtime.sendMessage({ type: 'VAULT_LOCKED' });
      } catch (error) {
        // Popup might not be open
      }
    }, timeout);
  });
}

// Reset auto-lock timer on user activity
chrome.tabs.onActivated.addListener(() => {
  if (!isLocked) {
    startAutoLockTimer();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete' && !isLocked) {
    startAutoLockTimer();
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'pass-me-generate' && tab?.id) {
    // Mock password generation
    const generateMockPassword = (length: number = 16) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
      let password = '';
      for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return password;
    };
    
    const password = generateMockPassword(16);
    
    // Send generated password to content script
    chrome.tabs.sendMessage(tab.id, {
      type: 'INSERT_PASSWORD',
      payload: { password },
    });
  }
});

// Alarm for periodic sync
chrome.alarms.create('sync-vault', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync-vault' && !isLocked) {
    // Sync vault with Walrus
    handleSyncVault(() => {});
  }
});

// Listen for Sui events (would be implemented with WebSocket)
async function listenForSuiEvents() {
  // This would connect to the backend WebSocket
  // and listen for vault-related events
  try {
    // Placeholder for WebSocket connection
    console.log('Listening for Sui events...');
  } catch (error) {
    console.error('Failed to connect to Sui events:', error);
  }
}

// Initialize
chrome.storage.local.get(['isLocked']).then(result => {
  isLocked = result.isLocked || false;
  
  if (!isLocked) {
    startAutoLockTimer();
  }
  
  listenForSuiEvents();
});

// Export for testing
export {
  handleMessage,
  startAutoLockTimer,
};