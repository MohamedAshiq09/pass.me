// Background Service Worker for Pass.me Extension

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
    console.log('🔔 Background received message:', message.type, message.payload);

    switch (message.type) {
      case 'REQUEST_AUTO_FILL':
        await handleRequestAutoFill(message, sendResponse);
        break;

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

      case 'SAVE_PASSWORD':
        await handleSavePassword(message, sendResponse);
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

// Helper function to normalize domains
function normalizeDomain(domain: string): string {
  return domain
    .toLowerCase()
    .replace(/^(https?:\/\/)?(www\.)?/, '')
    .replace(/\/$/, '');
}

// Helper function to match domains
function domainsMatch(entryDomain: string, requestDomain: string): boolean {
  const normalizedEntry = normalizeDomain(entryDomain);
  const normalizedRequest = normalizeDomain(requestDomain);

  return normalizedEntry === normalizedRequest ||
    normalizedEntry.includes(normalizedRequest) ||
    normalizedRequest.includes(normalizedEntry);
}

async function handleRequestAutoFill(
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

  try {
    const { domain } = message.payload;
    console.log('🔍 Searching for passwords for domain:', domain);

    // Get vault data from localStorage
    const vaultData = localStorage.getItem('pass_me_vault_data');

    if (!vaultData) {
      console.log('❌ No vault data found');
      sendResponse({
        success: true,
        data: [],
        requestId: message.requestId,
      });
      return;
    }

    const parsed = JSON.parse(vaultData);
    const vault = parsed.vault;

    if (!vault || !Array.isArray(vault.entries)) {
      console.log('❌ Invalid vault structure');
      sendResponse({
        success: true,
        data: [],
        requestId: message.requestId,
      });
      return;
    }

    console.log('📚 Total entries in vault:', vault.entries.length);

    // Find matching entries
    const matchingEntries = vault.entries.filter((entry: any) => {
      const matches = domainsMatch(entry.domain, domain);
      console.log(`Comparing "${entry.domain}" with "${domain}": ${matches}`);
      return matches;
    });

    console.log(`✅ Found ${matchingEntries.length} matching entries for domain:`, domain);

    sendResponse({
      success: true,
      data: matchingEntries,
      requestId: message.requestId,
    });
  } catch (error) {
    console.error('Error in handleRequestAutoFill:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find passwords',
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

  sendResponse({
    success: true,
    data: { id: crypto.randomUUID() },
    requestId: message.requestId,
  });
}

async function handleSavePassword(
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

  try {
    const { domain, username, password } = message.payload;
    console.log('💾 Saving password for:', domain, username);

    // Get current vault data
    const vaultData = localStorage.getItem('pass_me_vault_data');
    let vault;

    if (vaultData) {
      const parsed = JSON.parse(vaultData);
      vault = parsed.vault;
    } else {
      // Create new vault
      vault = {
        id: 'vault-' + Date.now(),
        owner: '0x' + Math.random().toString(16).substr(2, 40),
        entries: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
        totalEntries: 0,
        isLocked: false,
      };
    }

    // Add new entry
    const newEntry = {
      id: 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
      domain: normalizeDomain(domain),
      username,
      password,
      passwordHash: await hashString(username + domain),
      category: 'Other',
      notes: '',
      favorite: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      usageCount: 0,
      deviceWhitelist: ['device1'],
    };

    vault.entries.push(newEntry);
    vault.totalEntries = vault.entries.length;
    vault.updatedAt = Date.now();

    // Save back to localStorage
    localStorage.setItem('pass_me_vault_data', JSON.stringify({
      vault,
      timestamp: Date.now(),
    }));

    console.log('✅ Password saved successfully');

    sendResponse({
      success: true,
      data: newEntry,
      requestId: message.requestId,
    });
  } catch (error) {
    console.error('Error saving password:', error);
    sendResponse({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save password',
      requestId: message.requestId,
    });
  }
}

async function hashString(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
      await handleLockVault(() => { });

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
    handleSyncVault(() => { });
  }
});

// Initialize
chrome.storage.local.get(['isLocked']).then(result => {
  isLocked = result.isLocked || false;

  if (!isLocked) {
    startAutoLockTimer();
  }
});

// Export for testing
export {
  handleMessage,
  startAutoLockTimer,
};