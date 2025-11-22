import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';

interface Props {
  entryId: string;
  onBack: () => void;
  onDelete: () => void;
}

export default function ViewPasswordPage({ entryId, onBack, onDelete }: Props) {
  const { getEntry, updateEntry, deleteEntry, recordUsage } = useVault();
  const [showPassword, setShowPassword] = useState(false);

  const entry = getEntry(entryId);

  if (!entry) {
    return (
      <div className="view-password-page">
        <div className="page-header">
          <button onClick={onBack} className="back-btn">←</button>
          <h2>Entry Not Found</h2>
        </div>
        <div className="empty-state">
          <p>This password entry could not be found.</p>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);

      const notification = document.createElement('div');
      notification.textContent = `${type} copied!`;
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        z-index: 10000;
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);

      await recordUsage(entryId);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  // ✅ FIXED AUTO-FILL FUNCTION
  const handleAutoFill = async () => {
    try {
      console.log('🔄 Starting auto-fill for:', entry.domain);

      // Check if we're in extension environment
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        alert('Auto-fill only works in the browser extension');
        return;
      }

      // Get active tab
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      console.log('📋 Active tabs:', tabs);

      if (!tabs[0]?.id) {
        alert('No active tab found. Please open a website first.');
        return;
      }

      const activeTab = tabs[0];
      console.log('✅ Active tab:', {
        id: activeTab.id,
        url: activeTab.url,
        title: activeTab.title
      });

      // Send message to content script
      console.log('📤 Sending auto-fill message to tab:', activeTab.id);
      await chrome.tabs.sendMessage(activeTab.id, {
        type: 'FILL_FORM',
        payload: {
          domain: entry.domain,
          username: entry.username,
          password: entry.password,
        },
      });

      console.log('✅ Auto-fill message sent successfully');

      // Record usage
      await recordUsage(entryId);

      // Show success notification
      const notification = document.createElement('div');
      notification.textContent = '✅ Password auto-filled!';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #22c55e;
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 2000);

    } catch (error: any) {
      console.error('❌ Auto-fill error:', error);

      let errorMessage = 'Failed to auto-fill password. ';

      if (error.message?.includes('Could not establish connection')) {
        errorMessage += 'Please refresh the page and try again.';
      } else if (error.message?.includes('No tab with id')) {
        errorMessage += 'Tab not found. Please try again.';
      } else {
        errorMessage += 'Make sure you\'re on the correct website.';
      }

      alert(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this password?')) {
      try {
        await deleteEntry(entryId);
        onDelete();
      } catch (error) {
        console.error('Delete failed:', error);
        alert('Failed to delete password');
      }
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await updateEntry(entryId, { favorite: !entry.favorite });
    } catch (error) {
      console.error('Failed to update favorite:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="view-password-page">
      <div className="page-header">
        <button onClick={onBack} className="back-btn">←</button>
        <h2>{entry.domain}</h2>
        <button onClick={handleToggleFavorite} className="icon-btn">
          {entry.favorite ? '⭐' : '☆'}
        </button>
      </div>

      <div className="password-details">
        <div className="detail-row">
          <label>Username</label>
          <div className="detail-value">
            <span>{entry.username}</span>
            <button onClick={() => handleCopy(entry.username, 'Username')}>
              📋
            </button>
          </div>
        </div>

        <div className="detail-row">
          <label>Password</label>
          <div className="detail-value">
            <span>{showPassword ? entry.password || '••••••••' : '••••••••'}</span>
            <button onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈' : '👁️'}
            </button>
            <button onClick={() => handleCopy(entry.password || '', 'Password')}>
              📋
            </button>
          </div>
        </div>

        <div className="detail-row">
          <label>Category</label>
          <span>{entry.category}</span>
        </div>

        {entry.notes && (
          <div className="detail-row">
            <label>Notes</label>
            <p>{entry.notes}</p>
          </div>
        )}

        <div className="detail-row">
          <label>Created</label>
          <span>{formatTimestamp(entry.createdAt)}</span>
        </div>

        <div className="detail-row">
          <label>Last Used</label>
          <span>{entry.lastUsed ? formatTimestamp(entry.lastUsed) : 'Never'}</span>
        </div>

        <div className="detail-row">
          <label>Usage Count</label>
          <span>{entry.usageCount} times</span>
        </div>
      </div>

      <div className="actions">
        <button className="primary-btn" onClick={handleAutoFill}>
          🔄 Auto-fill
        </button>
        <button className="danger-btn" onClick={handleDelete}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}