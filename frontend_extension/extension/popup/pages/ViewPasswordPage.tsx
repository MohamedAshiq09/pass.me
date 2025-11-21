import React, { useState } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useExtension } from '@/contexts/ExtensionContext';

interface Props {
  entryId: string;
  onBack: () => void;
  onDelete: () => void;
}

export default function ViewPasswordPage({ entryId, onBack, onDelete }: Props) {
  const { getEntry, updateEntry, deleteEntry, recordUsage } = useVault();
  const { fillPassword } = useExtension();
  const [showPassword, setShowPassword] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

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
      // Show temporary notification
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

  const handleAutoFill = async () => {
    try {
      if (entry.password) {
        await fillPassword(entry.domain, entry.username, entry.password);
        await recordUsage(entryId);
      }
    } catch (error) {
      console.error('Auto-fill failed:', error);
      alert('Auto-fill failed. Make sure you\'re on the correct website.');
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
        <button className="secondary-btn" onClick={() => setIsEditing(true)}>
          ✏️ Edit
        </button>
        <button className="danger-btn" onClick={handleDelete}>
          🗑️ Delete
        </button>
      </div>
    </div>
  );
}