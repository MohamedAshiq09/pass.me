import React, { useState, useEffect } from 'react';
import { useVault } from '@/contexts/VaultContext';
import { useAuth } from '@/contexts/AuthContext';
import { useExtension } from '@/contexts/ExtensionContext';
import { AuroraBackground } from '@/components/AuroraBackground';
import {
  Search,
  Bell,
  Settings,
  Lock,
  Plus,
  Zap,
  X
} from 'lucide-react';

interface Props {
  onAddPassword: () => void;
  onViewPassword: (id: string) => void;
  onGeneratePassword: () => void;
  onSettings: () => void;
  onAlerts: () => void;
}

export default function VaultPage({
  onAddPassword,
  onViewPassword,
  onGeneratePassword,
  onSettings,
  onAlerts,
}: Props) {
  const { entries, searchEntries, lockVault, vault, createVault, isLoading } = useVault();
  const { logout } = useAuth();
  const { alerts } = useExtension();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Social Media', 'Banking', 'Email', 'Shopping', 'Entertainment', 'Work', 'Education', 'Other'];

  useEffect(() => {
    if (!vault && !isLoading) {
      createVault().catch(console.error);
    }
  }, [vault, isLoading, createVault]);

  const getDisplayEntries = () => {
    let filtered = entries;

    if (searchQuery) {
      filtered = searchEntries(searchQuery);
    }

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
    } catch (error) {
      console.error('Error locking vault:', error);
    }
  };

  const getCategoryCounts = () => {
    const counts: Record<string, number> = {
      'All': entries.length,
    };

    categories.forEach(cat => {
      if (cat !== 'All') {
        counts[cat] = entries.filter(e => e.category === cat).length;
      }
    });

    return counts;
  };

  const categoryCounts = getCategoryCounts();

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
      {/* Aurora Background - Only for vault content, not header */}
      <AuroraBackground showRadialGradient={true}>
        {/* Header - No Background */}
        <div className="vault-header">
          <div className="header-content">
            <div className="header-title">
              <h1>Pass.me</h1>
            </div>
            <div className="header-actions">
              <button
                onClick={onAlerts}
                className={`icon-btn ${unreadAlerts > 0 ? 'has-alerts' : ''}`}
                title="Alerts"
              >
                <Bell size={18} strokeWidth={2} />
                {unreadAlerts > 0 && <span className="alert-badge">{unreadAlerts}</span>}
              </button>
              <button onClick={onSettings} className="icon-btn" title="Settings">
                <Settings size={18} strokeWidth={2} />
              </button>
              <button onClick={handleLock} className="icon-btn" title="Lock Vault">
                <Lock size={18} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-bar">
            <Search className="search-icon" size={16} strokeWidth={2} />
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
                <X size={16} strokeWidth={2} />
              </button>
            )}
          </div>

          {/* Category Filter with Counts */}
          <div className="category-filter">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'All' ? `All Categories (${categoryCounts[category]})` : `${category} (${categoryCounts[category] || 0})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Password List */}
        <div className="password-list">
          {displayEntries.length === 0 ? (
            <div className="empty-state">
              {entries.length === 0 ? (
                <>
                  <div className="empty-icon">
                    <Lock size={48} strokeWidth={1.5} />
                  </div>
                  <h3>No passwords yet</h3>
                  <p>Add your first password to get started</p>
                  <button className="primary-btn" onClick={onAddPassword}>
                    <Plus size={18} strokeWidth={2} />
                    Add Password
                  </button>
                </>
              ) : (
                <>
                  <div className="empty-icon">
                    <Search size={48} strokeWidth={1.5} />
                  </div>
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
                  {entry.favorite && <span className="favorite">★</span>}
                  <span className="usage-count">{entry.usageCount}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FAB Container */}
        <div className="fab-container">
          <button
            className="fab-secondary"
            onClick={onGeneratePassword}
            title="Generate Password"
          >
            <Zap size={20} strokeWidth={2} />
          </button>
          <button
            className="fab"
            onClick={onAddPassword}
            title="Add Password"
          >
            <Plus size={24} strokeWidth={2.5} />
          </button>
        </div>
      </AuroraBackground>
    </div>
  );
}