'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import type { ZkLoginSession, SessionData } from '@/types';
// import { STORAGE_KEYS, EXTENSION_CONFIG } from '@/config/constants';

// Temporary types for development without zkLogin
interface SessionData {
  userId: string;
  deviceId: string;
  expiresAt: number;
  ephemeralKeyPair?: string;
}

interface ZkLoginSession {
  jwt: string;
  salt: string;
  maxEpoch: number;
  randomness: string;
  ephemeralKeyPair: {
    publicKey: string;
    privateKey: string;
  };
  userAddress: string;
}

interface AuthContextType {
  session: SessionData | null;
  zkLoginSession: ZkLoginSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (zkSession: ZkLoginSession) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [zkLoginSession, setZkLoginSession] = useState<ZkLoginSession | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Changed to false for development

  useEffect(() => {
    // Comment out zkLogin loading for now
    // loadSession();
    
    // For development, create a mock session
    const mockSession: SessionData = {
      userId: 'mock-user-123',
      deviceId: 'mock-device-456',
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };
    
    const mockZkSession: ZkLoginSession = {
      jwt: 'mock-jwt',
      salt: 'mock-salt',
      maxEpoch: 1000,
      randomness: 'mock-randomness',
      ephemeralKeyPair: {
        publicKey: 'mock-public-key',
        privateKey: 'mock-private-key',
      },
      userAddress: '0x1234567890abcdef',
    };
    
    setSession(mockSession);
    setZkLoginSession(mockZkSession);
  }, []);

  /* 
  // Original zkLogin implementation - commented out for development
  const loadSession = async () => {
    try {
      const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION_TOKEN);
      if (savedSession) {
        const parsedSession: SessionData = JSON.parse(savedSession);
        // Check if session is expired
        if (parsedSession.expiresAt > Date.now()) {
          setSession(parsedSession);
          // Try to load zkLogin session
          const zkSession = sessionStorage.getItem('zklogin_session');
          if (zkSession) {
            setZkLoginSession(JSON.parse(zkSession));
          }
        } else {
          // Session expired
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setIsLoading(false);
    }
  };
  */

  const login = async (zkSession: ZkLoginSession) => {
    try {
      const sessionData: SessionData = {
        userId: zkSession.userAddress,
        deviceId: await generateDeviceId(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      };

      setSession(sessionData);
      setZkLoginSession(zkSession);

      // Save to storage
      localStorage.setItem('pass_me_session', JSON.stringify(sessionData));
      sessionStorage.setItem('zklogin_session', JSON.stringify(zkSession));

      // Notify extension
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'USER_LOGGED_IN',
          payload: { userId: zkSession.userAddress },
        });
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setSession(null);
      setZkLoginSession(null);

      // Clear storage
      localStorage.removeItem('pass_me_session');
      sessionStorage.removeItem('zklogin_session');
      localStorage.removeItem('pass_me_encrypted_vault');

      // Notify extension
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'USER_LOGGED_OUT',
        });
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const refreshSession = async () => {
    if (!session) return;

    const newExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    const updatedSession = { ...session, expiresAt: newExpiresAt };
    setSession(updatedSession);
    localStorage.setItem('pass_me_session', JSON.stringify(updatedSession));
  };

  const value: AuthContextType = {
    session,
    zkLoginSession,
    isAuthenticated: !!session && !!zkLoginSession,
    isLoading,
    login,
    logout,
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

async function generateDeviceId(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    screen.width,
    screen.height,
  ];
  const fingerprint = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(fingerprint);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}