import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { VaultProvider, useVault } from '@/contexts/VaultContext';
import { ExtensionProvider } from '@/contexts/ExtensionContext';
import LoginPage from './pages/LoginPage';
import VaultPage from './pages/VaultPage';
import AddPasswordPage from './pages/AddPasswordPage';
import ViewPasswordPage from './pages/ViewPasswordPage';
import GeneratorPage from './pages/GeneratorPage';
import SettingsPage from './pages/SettingsPage';
import AlertsPage from './pages/AlertsPage';
import './popup.css';

type Page = 'login' | 'vault' | 'add' | 'view' | 'generator' | 'settings' | 'alerts';

function PopupApp() {
  const [currentPage, setCurrentPage] = useState<Page>('vault'); // Start directly on vault page
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const handleViewPassword = (entryId: string) => {
    setSelectedEntryId(entryId);
    setCurrentPage('view');
  };

  const handleBack = () => {
    setCurrentPage('vault');
    setSelectedEntryId(null);
  };

  // Remove loading states - just show the vault directly

  return (
    <div className="popup-container">
      {/* Removed login page - go directly to vault */}
      
      {currentPage === 'vault' && (
        <VaultPage
          onAddPassword={() => setCurrentPage('add')}
          onViewPassword={handleViewPassword}
          onGeneratePassword={() => setCurrentPage('generator')}
          onSettings={() => setCurrentPage('settings')}
          onAlerts={() => setCurrentPage('alerts')}
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
        <SettingsPage onBack={handleBack} />
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