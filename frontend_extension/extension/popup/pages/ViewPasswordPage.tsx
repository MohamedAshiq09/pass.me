import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  Star,
  Trash2,
  RefreshCw,
  Calendar,
  Hash,
  Tag,
  FileText,
  Globe,
  User,
  Key
} from 'lucide-react';

interface Props {
  entryId: string;
  onBack: () => void;
  onDelete: () => void;
}

export default function ViewPasswordPage({ entryId, onBack, onDelete }: Props) {
  const { getEntry, updateEntry, deleteEntry, recordUsage } = useVault();
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const entry = getEntry(entryId);

  if (!entry) {
    return (
      <div className="view-password-page">
        <div className="page-header">
          <button onClick={onBack} className="back-btn">
            <ArrowLeft size={20} strokeWidth={2} />
          </button>
          <h2>Entry Not Found</h2>
        </div>
        <div className="empty-state">
          <p>This password entry could not be found.</p>
        </div>
      </div>
    );
  }

  const handleCopy = async (text: string, fieldName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(null), 2000);

      await recordUsage(entryId);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy to clipboard');
    }
  };

  const handleAutoFill = async () => {
    try {
      console.log('🔄 Starting auto-fill for:', entry.domain);

      if (typeof chrome === 'undefined' || !chrome.tabs) {
        alert('Auto-fill only works in the browser extension');
        return;
      }

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
      await recordUsage(entryId);

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
      {/* Header */}
      <div className="page-header">
        <button onClick={onBack} className="back-btn" title="Back">
          <ArrowLeft size={20} strokeWidth={2} />
        </button>
        <div className="header-title">
          <Globe size={18} strokeWidth={2} />
          <h2>{entry.domain}</h2>
        </div>
        <button
          onClick={handleToggleFavorite}
          className={`icon-btn ${entry.favorite ? 'favorite-active' : ''}`}
          title={entry.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Star size={18} strokeWidth={2} fill={entry.favorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Password Details */}
      <div className="password-details">
        {/* Username */}
        <div className="detail-card">
          <div className="detail-header">
            <User size={16} strokeWidth={2} />
            <label>Username / Email</label>
          </div>
          <div className="detail-value">
            <span className="detail-text">{entry.username}</span>
            <button
              onClick={() => handleCopy(entry.username, 'username')}
              className="copy-btn"
              title="Copy username"
            >
              {copiedField === 'username' ? (
                <span className="copied-text">Copied!</span>
              ) : (
                <Copy size={16} strokeWidth={2} />
              )}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="detail-card">
          <div className="detail-header">
            <Key size={16} strokeWidth={2} />
            <label>Password</label>
          </div>
          <div className="detail-value">
            <span className="detail-text password-text">
              {showPassword ? entry.password || '••••••••' : '••••••••'}
            </span>
            <div className="button-group">
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="icon-btn-small"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
              <button
                onClick={() => handleCopy(entry.password || '', 'password')}
                className="copy-btn"
                title="Copy password"
              >
                {copiedField === 'password' ? (
                  <span className="copied-text">Copied!</span>
                ) : (
                  <Copy size={16} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="detail-card">
          <div className="detail-header">
            <Tag size={16} strokeWidth={2} />
            <label>Category</label>
          </div>
          <div className="detail-value">
            <span className="category-badge">{entry.category}</span>
          </div>
        </div>

        {/* Notes */}
        {entry.notes && (
          <div className="detail-card">
            <div className="detail-header">
              <FileText size={16} strokeWidth={2} />
              <label>Notes</label>
            </div>
            <div className="detail-value">
              <p className="notes-text">{entry.notes}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="metadata-section">
          <div className="metadata-item">
            <Calendar size={14} strokeWidth={2} />
            <span className="metadata-label">Created</span>
            <span className="metadata-value">{formatTimestamp(entry.createdAt)}</span>
          </div>

          <div className="metadata-item">
            <Calendar size={14} strokeWidth={2} />
            <span className="metadata-label">Last Used</span>
            <span className="metadata-value">{entry.lastUsed ? formatTimestamp(entry.lastUsed) : 'Never'}</span>
          </div>

          <div className="metadata-item">
            <Hash size={14} strokeWidth={2} />
            <span className="metadata-label">Usage Count</span>
            <span className="metadata-value">{entry.usageCount} times</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="actions">
        <button className="primary-btn" onClick={handleAutoFill}>
          <RefreshCw size={18} strokeWidth={2} />
          Auto-fill on Website
        </button>
        <button className="danger-btn" onClick={handleDelete}>
          <Trash2 size={18} strokeWidth={2} />
          Delete Password
        </button>
      </div>
    </div>
  );
}