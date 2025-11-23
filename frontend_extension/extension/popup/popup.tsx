import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VaultProvider } from '@/contexts/VaultContext';
import { ExtensionProvider } from '@/contexts/ExtensionContext';
import { SessionManager } from '@/lib/session-manager';
import LoginPage from './pages/LoginPage';
import VaultPage from './pages/VaultPage';
import AddPasswordPage from './pages/AddPasswordPage';
import ViewPasswordPage from './pages/ViewPasswordPage';
import GeneratorPage from './pages/GeneratorPage';
import SettingsPage from './pages/SettingsPage';
import AlertsPage from './pages/AlertsPage';
import './popup.css';

type Page = 'login' | 'vault' | 'add' | 'view' | 'generator' | 'settings' | 'alerts';

// Check if running in a tab (not popup)
const isRunningInTab = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth > 400 || window.location.search.includes('tab=true');
};

function PopupApp() {
  const { isAuthenticated, isLoading, address } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isInTab, setIsInTab] = useState(false);

  // Check if running in tab mode and apply body styles
  useEffect(() => {
    const inTab = isRunningInTab();
    setIsInTab(inTab);
    if (inTab) {
      document.body.classList.add('in-tab');
      document.body.style.width = '100%';
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Checking authentication...');
        await SessionManager.initialize();
        const isAuth = SessionManager.isAuthenticated();
        console.log('🔐 Is authenticated:', isAuth);

        if (isAuth) {
          setCurrentPage('vault');
        } else {
          setCurrentPage('login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setCurrentPage('login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Update page when auth state changes
  useEffect(() => {
    if (!isLoading && !isCheckingAuth) {
      if (isAuthenticated && address) {
        setCurrentPage('vault');
      }
    }
  }, [isAuthenticated, isLoading, address, isCheckingAuth]);

  const handleLogin = () => {
    console.log('✅ Login successful, navigating to vault');
    setCurrentPage('vault');
  };

  const handleLogout = () => {
    console.log('🔓 Logging out...');
    setCurrentPage('login');
  };

  const handleViewPassword = (entryId: string) => {
    setSelectedEntryId(entryId);
    setCurrentPage('view');
  };

  const handleBack = () => {
    setCurrentPage('vault');
    setSelectedEntryId(null);
  };

  // Show loading while checking auth
  if (isCheckingAuth || isLoading) {
    return (
      <div className="popup-container">
        <div className="loading-screen">
          <div className="logo">
            <div className="logo-icon">
              <div className="spinner-small"></div>
            </div>
          </div>
          <p className="tagline">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`popup-container ${isInTab ? 'in-tab' : ''}`}>
      {currentPage === 'login' && (
        <LoginPage onLogin={handleLogin} />
      )}

      {currentPage === 'vault' && (
        <VaultPage
          onAddPassword={() => setCurrentPage('add')}
          onViewPassword={handleViewPassword}
          onGeneratePassword={() => setCurrentPage('generator')}
          onSettings={() => setCurrentPage('settings')}
          onAlerts={() => setCurrentPage('alerts')}
          onLogout={handleLogout}
        />
      )}

      {currentPage === 'add' && (
        <AddPasswordPage onBack={handleBack} onSave={handleBack} />
      )}

      {currentPage === 'view' && selectedEntryId && (
        <ViewPasswordPage
          entryId={selectedEntryId}
          onBack={handleBack}
          onDelete={handleBack}
        />
      )}

      {currentPage === 'generator' && (
        <GeneratorPage onBack={handleBack} />
      )}

      {currentPage === 'settings' && (
        <SettingsPage onBack={handleBack} onLogout={handleLogout} />
      )}

      {currentPage === 'alerts' && (
        <AlertsPage onBack={handleBack} />
      )}
    </div>
  );
}

function App() {
  try {
    return (
      <AuthProvider>
        <VaultProvider>
          <ExtensionProvider>
            <PopupApp />
          </ExtensionProvider>
        </VaultProvider>
      </AuthProvider>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h2>🔐 Pass.me</h2>
        <p>Extension loaded successfully!</p>
        <p style={{ color: 'red', fontSize: '12px' }}>
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }
}

// Mount the app
console.log('Pass.me popup script loaded');

const container = document.getElementById('root');
if (container) {
  console.log('Root container found, mounting React app');
  const root = createRoot(container);
  root.render(<App />);
} else {
  console.error('Root container not found');
  // Fallback: create the container
  const fallbackContainer = document.createElement('div');
  fallbackContainer.id = 'root';
  fallbackContainer.style.cssText = 'width: 375px; min-height: 500px; background: #f5f5f5;';
  document.body.appendChild(fallbackContainer);

  const root = createRoot(fallbackContainer);
  root.render(<App />);
}
