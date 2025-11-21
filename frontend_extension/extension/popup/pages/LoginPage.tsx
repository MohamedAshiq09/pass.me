import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMockLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Mock zkLogin session for development
      const mockZkSession = {
        jwt: 'mock-jwt-token',
        salt: 'mock-salt-123',
        maxEpoch: 1000,
        randomness: 'mock-randomness',
        ephemeralKeyPair: {
          publicKey: 'mock-public-key',
          privateKey: 'mock-private-key',
        },
        userAddress: '0x1234567890abcdef1234567890abcdef12345678',
      };

      await login(mockZkSession);
      onLogin();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  /* 
  // Original zkLogin implementation - commented out for development
  const handleZkLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if zkLogin session exists in sessionStorage
      const savedSession = sessionStorage.getItem('zklogin_session');
      if (savedSession) {
        const zkSession = JSON.parse(savedSession);
        await login(zkSession);
        onLogin();
        return;
      }

      // Redirect to main app for zkLogin
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({
          url: chrome.runtime.getURL('app/index.html'),
        });
      } else {
        // Fallback for development
        window.open('http://localhost:3000', '_blank');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  */

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="logo">
          <div className="logo-icon">🔐</div>
          <h1>Pass.me</h1>
        </div>
        <p className="tagline">Decentralized Password Manager</p>
      </div>

      <div className="login-content">
        <div className="features">
          <div className="feature">
            <span className="feature-icon">🔒</span>
            <span>End-to-end encrypted</span>
          </div>
          <div className="feature">
            <span className="feature-icon">🌐</span>
            <span>Decentralized storage</span>
          </div>
          <div className="feature">
            <span className="feature-icon">⚡</span>
            <span>Zero-knowledge login</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
          </div>
        )}

        <button 
          className="login-btn"
          onClick={handleMockLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner-small"></div>
              Connecting...
            </>
          ) : (
            <>
              <span>🔑</span>
              Demo Login (Development)
            </>
          )}
        </button>

        <div className="login-help">
          <p>Development mode - Mock authentication</p>
          <p>zkLogin will be enabled in production</p>
        </div>
      </div>
    </div>
  );
}