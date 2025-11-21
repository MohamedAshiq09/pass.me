import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useVault } from '@/contexts/VaultContext';
import { useExtension } from '@/contexts/ExtensionContext';

interface Props {
  onBack: () => void;
}

export default function SettingsPage({ onBack }: Props) {
  const { logout } = useAuth();
  const { getVaultInfo, vault } = useVault();
  const { autoLockTimeout, setAutoLockTimeout } = useExtension();
  
  const [settings, setSettings] = useState({
    autoLockTimeout: autoLockTimeout,
    notifications: true,
    autoFill: true,
    passwordGenerator: {
      length: 16,
      includeSymbols: true,
      includeNumbers: true,
    },
  });

  const vaultInfo = getVaultInfo();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          'notifications',
          'autoFill',
          'passwordGenerator',
        ]);
        
        setSettings(prev => ({
          ...prev,
          notifications: result.notifications ?? true,
          autoFill: result.autoFill ?? true,
          passwordGenerator: result.passwordGenerator ?? prev.passwordGenerator,
        }));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: typeof settings) => {
    try {
      setSettings(newSettings);
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          notifications: newSettings.notifications,
          autoFill: newSettings.autoFill,
          passwordGenerator: newSettings.passwordGenerator,
        });
      }
      
      if (newSettings.autoLockTimeout !== autoLockTimeout) {
        await setAutoLockTimeout(newSettings.autoLockTimeout);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleAutoLockChange = (minutes: number) => {
    const timeout = minutes * 60 * 1000; // Convert to milliseconds
    saveSettings({ ...settings, autoLockTimeout: timeout });
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout? This will lock your vault.')) {
      await logout();
    }
  };

  const exportVault = async () => {
    try {
      // This would export encrypted vault data
      alert('Export functionality coming soon!');
    } catch (error) {
      console.error('Error exporting vault:', error);
      alert('Failed to export vault');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="settings-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h2>Settings</h2>
      </div>

      <div className="settings-content">
        {/* Vault Information */}
        <div className="settings-section">
          <h3>Vault Information</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Total Passwords</label>
              <span>{vaultInfo?.totalEntries || 0}</span>
            </div>
            <div className="info-item">
              <label>Last Updated</label>
              <span>
                {vaultInfo?.lastUpdated 
                  ? new Date(vaultInfo.lastUpdated).toLocaleDateString()
                  : 'Never'
                }
              </span>
            </div>
            <div className="info-item">
              <label>Vault ID</label>
              <span className="vault-id">
                {vault?.id ? `${vault.id.slice(0, 8)}...${vault.id.slice(-8)}` : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="settings-section">
          <h3>Security</h3>
          
          <div className="setting-item">
            <label>Auto-lock timeout</label>
            <select 
              value={Math.floor(settings.autoLockTimeout / (60 * 1000))}
              onChange={(e) => handleAutoLockChange(parseInt(e.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={240}>4 hours</option>
            </select>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => saveSettings({ ...settings, notifications: e.target.checked })}
              />
              Security notifications
            </label>
            <p className="setting-description">
              Get notified about suspicious login attempts
            </p>
          </div>
        </div>

        {/* Extension Settings */}
        <div className="settings-section">
          <h3>Extension</h3>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoFill}
                onChange={(e) => saveSettings({ ...settings, autoFill: e.target.checked })}
              />
              Auto-fill passwords
            </label>
            <p className="setting-description">
              Automatically fill login forms on websites
            </p>
          </div>
        </div>

        {/* Password Generator */}
        <div className="settings-section">
          <h3>Password Generator</h3>
          
          <div className="setting-item">
            <label>Default length</label>
            <input
              type="range"
              min="8"
              max="128"
              value={settings.passwordGenerator.length}
              onChange={(e) => saveSettings({
                ...settings,
                passwordGenerator: {
                  ...settings.passwordGenerator,
                  length: parseInt(e.target.value)
                }
              })}
            />
            <span>{settings.passwordGenerator.length} characters</span>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.passwordGenerator.includeSymbols}
                onChange={(e) => saveSettings({
                  ...settings,
                  passwordGenerator: {
                    ...settings.passwordGenerator,
                    includeSymbols: e.target.checked
                  }
                })}
              />
              Include symbols (!@#$)
            </label>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.passwordGenerator.includeNumbers}
                onChange={(e) => saveSettings({
                  ...settings,
                  passwordGenerator: {
                    ...settings.passwordGenerator,
                    includeNumbers: e.target.checked
                  }
                })}
              />
              Include numbers (0-9)
            </label>
          </div>
        </div>

        {/* Data Management */}
        <div className="settings-section">
          <h3>Data Management</h3>
          
          <button className="secondary-btn" onClick={exportVault}>
            📤 Export Vault
          </button>
          
          <p className="setting-description">
            Export your encrypted vault for backup
          </p>
        </div>

        {/* Account */}
        <div className="settings-section">
          <h3>Account</h3>
          
          <button className="danger-btn" onClick={handleLogout}>
            🚪 Logout
          </button>
          
          <p className="setting-description">
            This will lock your vault and require re-authentication
          </p>
        </div>

        {/* About */}
        <div className="settings-section">
          <h3>About</h3>
          <div className="about-info">
            <p><strong>Pass.me</strong> v1.0.0</p>
            <p>Decentralized password manager</p>
            <p>Built on Sui blockchain with Walrus storage</p>
          </div>
        </div>
      </div>
    </div>
  );
}