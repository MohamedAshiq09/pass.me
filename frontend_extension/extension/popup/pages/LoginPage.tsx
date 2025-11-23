import React, { useState, useEffect } from 'react';
import { ZkLoginService } from '@/lib/zklogin';
import { SessionManager } from '@/lib/session-manager';
import { useAuth } from '@/contexts/AuthContext';
import { isExtensionContext } from '@/lib/extension-storage';

interface Props {
  onLogin: () => void;
}

// Check if running in a tab (not popup)
const isRunningInTab = (): boolean => {
  if (typeof window === 'undefined') return false;
  // If window dimensions are larger than typical popup, we're in a tab
  return window.innerWidth > 400 || window.location.search.includes('tab=true');
};

// Open extension in a new tab
const openInTab = () => {
  if (isExtensionContext() && chrome.runtime) {
    const url = chrome.runtime.getURL('popup/index.html?tab=true');
    chrome.tabs.create({ url });
    // Close the popup
    window.close();
  }
};

export default function LoginPage({ onLogin }: Props) {
  const { setAuthData } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isInTab, setIsInTab] = useState(false);

  useEffect(() => {
    setIsInTab(isRunningInTab());
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        await SessionManager.initialize();
        const isAuth = SessionManager.isAuthenticated();
        if (isAuth) {
          console.log('✅ Existing session found, auto-logging in');
          const cached = SessionManager.getCachedProof();
          if (cached && cached.address) {
            setAuthData({
              address: cached.address,
              zkProof: cached.zkProof,
              jwtToken: cached.jwtToken!,
              userSalt: cached.userSalt!,
              ephemeralPrivateKey: cached.ephemeralPrivateKey!,
              maxEpoch: cached.maxEpoch!,
              randomness: cached.randomness!,
            });
            onLogin();
          }
        }
      } catch (err) {
        console.error('Error checking session:', err);
      } finally {
        setIsCheckingSession(false);
      }
    };

    checkExistingSession();
  }, [onLogin, setAuthData]);

  const handleZkLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setStatus('Initializing...');

      // Check for existing cached session first
      const cachedProof = await SessionManager.getCachedProofAsync();
      if (cachedProof && cachedProof.address) {
        console.log('✅ Using cached session');
        setAuthData({
          address: cachedProof.address,
          zkProof: cachedProof.zkProof,
          jwtToken: cachedProof.jwtToken!,
          userSalt: cachedProof.userSalt!,
          ephemeralPrivateKey: cachedProof.ephemeralPrivateKey!,
          maxEpoch: cachedProof.maxEpoch!,
          randomness: cachedProof.randomness!,
        });
        onLogin();
        return;
      }

      // Check if we're in extension context
      if (isExtensionContext() && chrome.identity) {
        // Use chrome.identity flow for extension
        console.log('🔐 Using chrome.identity for OAuth...');
        setStatus('Opening Google login...');

        const result = await ZkLoginService.loginWithExtension();

        console.log('✅ zkLogin completed!');
        console.log('📍 Address:', result.address);

        setAuthData({
          address: result.address,
          zkProof: result.zkProof,
          jwtToken: result.jwtToken,
          userSalt: result.userSalt,
          ephemeralPrivateKey: result.ephemeralPrivateKey,
          maxEpoch: result.maxEpoch,
          randomness: result.randomness,
        });

        setStatus('Success!');
        onLogin();
      } else {
        // Fallback: Open in new tab (for web or when chrome.identity unavailable)
        console.log('🔐 Initializing zkLogin (web mode)...');
        setStatus('Preparing login...');

        const { nonce } = await ZkLoginService.initializeSession();
        console.log('✅ Session initialized');

        const loginUrl = ZkLoginService.getOAuthUrl(nonce);

        // Open login page in new tab
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.create({ url: loginUrl });
        } else {
          window.open(loginUrl, '_blank');
        }

        setStatus('Complete login in the new tab...');
        // Don't close popup - user needs to complete OAuth in tab
        // After callback processes, user can reopen extension
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to login. Please try again.';
      setError(errorMessage);
      setStatus('');
    } finally {
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
    <div className={`login-page ${isInTab ? 'in-tab' : ''}`}>
      {/* Expand to tab button - only show in popup mode */}
      {!isInTab && isExtensionContext() && (
        <button
          className="expand-btn"
          onClick={openInTab}
          title="Open in new tab"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h6v6"/>
            <path d="M10 14L21 3"/>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          </svg>
        </button>
      )}

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

        {status && !error && (
          <div className="status-message">
            <span>{status}</span>
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
              {status || 'Connecting...'}
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
