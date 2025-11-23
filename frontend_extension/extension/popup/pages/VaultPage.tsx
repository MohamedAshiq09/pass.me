import React, { useState, useEffect } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExtension } from '@/contexts/ExtensionContext';
import { isExtensionContext } from '@/lib/extension-storage';

// Check if running in a tab (not popup)
const isRunningInTab = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 400 || window.location.search.includes('tab=true');
};

// Open extension in a new tab
const openInTab = () => {
  if (isExtensionContext() && chrome.runtime) {
    const url = chrome.runtime.getURL('popup/index.html?tab=true');
    chrome.tabs.create({ url });
    window.close();
  }
};

interface Props {
  onAddPassword: () => void;
  onViewPassword: (id: string) => void;
  onGeneratePassword: () => void;
  onSettings: () => void;
  onAlerts: () => void;
  onLogout?: () => void;
}

export default function VaultPage({
  onAddPassword,
  onViewPassword,
  onGeneratePassword,
  onSettings,
  onAlerts,
  onLogout,
}: Props) {
  const { entries, searchEntries, lockVault, vault, createVault, isLoading } = useVault();
  const { logout } = useAuth();
  const { alerts } = useExtension();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isInTab, setIsInTab] = useState(false);

  useEffect(() => {
    setIsInTab(isRunningInTab());
  }, []);

  const categories = ['All', 'Social Media', 'Banking', 'Email', 'Shopping', 'Entertainment', 'Work', 'Education', 'Other'];

  useEffect(() => {
    // If no vault exists, create one
    if (!vault && !isLoading) {
      createVault().catch(console.error);
    }
  }, [vault, isLoading, createVault]);

  const getDisplayEntries = () => {
    let filtered = entries;

    // Filter by search query
    if (searchQuery) {
      filtered = searchEntries(searchQuery);
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    return filtered;
  };

  const displayEntries = getDisplayEntries();
  const unreadAlerts = alerts.filter(alert => alert.severity === 'high' || alert.severity === 'critical').length;

  const handleLock = async () => {
    try {
      await lockVault();
      await logout();
      if (onLogout) {
        onLogout();
      }
    } catch (error) {
      console.error('Error locking vault:', error);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      'Social Media': '📱',
      'Banking': '🏦',
      'Email': '📧',
      'Shopping': '🛒',
      'Entertainment': '🎬',
      'Work': '💼',
      'Education': '🎓',
      'Other': '🌐',
    };
    return icons[category] || '🌐';
  };

  if (isLoading) {
    return (
      <div className="vault-page loading">
        <div className="spinner"></div>
        <p>Loading your vault...</p>
      </div>
    );
  }

  return (
    <div className="vault-page">
      <div className="vault-header">
        <div className="header-left">
          <h1>🔐 Pass.me</h1>
          <span className="entry-count">{entries.length} passwords</span>
        </div>
        <div className="header-actions">
          {!isInTab && isExtensionContext() && (
            <button
              onClick={openInTab}
              className="icon-btn"
              title="Open in new tab"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6"/>
                <path d="M10 14L21 3"/>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              </svg>
            </button>
          )}
          <button
            onClick={onAlerts}
            className={`icon-btn ${unreadAlerts > 0 ? 'has-alerts' : ''}`}
          >
            🔔
            {unreadAlerts > 0 && <span className="alert-badge">{unreadAlerts}</span>}
          </button>
          <button onClick={onSettings} className="icon-btn">⚙️</button>
          <button onClick={handleLock} className="icon-btn">🔒</button>
        </div>
      </div>

      <div className="search-section">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search passwords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <div className="category-filter">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(category => (
              <option key={category} value={category}>
                {category === 'All' ? 'All Categories' : category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="password-list">
        {displayEntries.length === 0 ? (
          <div className="empty-state">
            {entries.length === 0 ? (
              <>
                <div className="empty-icon">🔑</div>
                <h3>No passwords yet</h3>
                <p>Add your first password to get started</p>
                <button className="primary-btn" onClick={onAddPassword}>
                  Add Password
                </button>
              </>
            ) : (
              <>
                <div className="empty-icon">🔍</div>
                <h3>No matches found</h3>
                <p>Try adjusting your search or filter</p>
              </>
            )}
          </div>
        ) : (
          displayEntries.map((entry) => (
            <div
              key={entry.id}
              className="password-card"
              onClick={() => onViewPassword(entry.id)}
            >
              <div className="card-icon">
                {getCategoryIcon(entry.category)}
              </div>
              <div className="card-info">
                <h3>{entry.domain}</h3>
                <p>{entry.username}</p>
                <div className="card-meta">
                  <span className="category">{entry.category}</span>
                  {entry.lastUsed && (
                    <span className="last-used">
                      Used {new Date(entry.lastUsed).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="card-actions">
                {entry.favorite && <span className="favorite">⭐</span>}
                <span className="usage-count">{entry.usageCount}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="fab-container">
        <button 
          className="fab-secondary" 
          onClick={onGeneratePassword}
          title="Generate Password"
        >
          🎲
        </button>
        <button 
          className="fab" 
          onClick={onAddPassword}
          title="Add Password"
        >
          +
        </button>
      </div>
    </div>
  );
}