import React, { useState, useEffect } from 'react';
import { ZkLoginService } from '@/lib/zklogin';
import { SessionManager } from '@/lib/session-manager';

interface Props {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = () => {
      try {
        const isAuth = SessionManager.isAuthenticated();
        if (isAuth) {
          console.log('✅ Existing session found, auto-logging in');
          onLogin();
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [onLogin]);

  const handleZkLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check for existing cached session
      const cachedProof = SessionManager.getCachedProof();
      if (cachedProof && cachedProof.address) {
        console.log('✅ Using cached session');
        onLogin();
        return;
      }

      // Initialize new zkLogin session
      console.log('🔐 Initializing zkLogin...');
      const { nonce } = await ZkLoginService.initializeSession();
      console.log('✅ Session initialized');

      // Get OAuth URL
      const loginUrl = ZkLoginService.getOAuthUrl(nonce);

      // Open login page in new tab (extensions can't redirect)
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        chrome.tabs.create({ url: loginUrl });
      } else {
        // Fallback for development
        window.open(loginUrl, '_blank');
      }

      // Close the popup - user will complete login in browser
      window.close();
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Failed to login. Please try again.');
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="login-page">
        <div className="login-header">
          <div className="logo">
            <div className="logo-icon">
              <div className="spinner-small"></div>
            </div>
          </div>
          <p className="tagline">Checking session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-header">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>Pass.me</h1>
        </div>
        <p className="tagline">Decentralized Password Manager</p>
      </div>

      <div className="login-content">
        <div className="features">
          <div className="feature">
            <span className="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <span>End-to-end encrypted</span>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </span>
            <span>Decentralized storage</span>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </span>
            <span>Zero-knowledge login</span>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
          </div>
        )}

        <button
          className="login-btn"
          onClick={handleZkLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner-small"></div>
              Connecting...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <div className="login-help">
          <p>Powered by Sui zkLogin</p>
          <p className="text-xs opacity-70">Your credentials stay encrypted</p>
        </div>
      </div>
    </div>
  );
}
