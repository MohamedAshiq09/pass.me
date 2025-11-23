/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SessionManager } from '@/lib/session-manager';
import { ZkLoginService } from '@/lib/zklogin';

export interface AuthContextType {
  address: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  zkProof: any;
  jwtToken: string | null;
  userSalt: string | null;
  ephemeralPrivateKey: string | null;
  maxEpoch: number | null;
  randomness: string | null;
  userEmail: string | null;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  setAuthData: (data: {
    address: string;
    zkProof: any;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [zkProof, setZkProof] = useState<any>(null);
  const [jwtToken, setJwtToken] = useState<string | null>(null);
  const [userSalt, setUserSalt] = useState<string | null>(null);
  const [ephemeralPrivateKey, setEphemeralPrivateKey] = useState<string | null>(null);
  const [maxEpoch, setMaxEpoch] = useState<number | null>(null);
  const [randomness, setRandomness] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check for existing cached authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    console.log('🔍 Checking authentication status...');
    setIsLoading(true);

    try {
      // Initialize session manager (loads from chrome.storage)
      await SessionManager.initialize();

      const isAuth = SessionManager.isAuthenticated();
      console.log('🔐 SessionManager.isAuthenticated():', isAuth);

      if (isAuth) {
        const cachedProof = SessionManager.getCachedProof();
        console.log('📋 Cached proof found');

        if (cachedProof && cachedProof.address) {
          console.log('✅ User is authenticated');
          console.log('📍 Address:', cachedProof.address);

          // Restore address from cache
          setAddress(cachedProof.address);

          // Also restore proof data for transactions
          if (cachedProof.zkProof) setZkProof(cachedProof.zkProof);
          if (cachedProof.jwtToken) {
            setJwtToken(cachedProof.jwtToken);
            // Extract email from JWT
            try {
              const decoded = ZkLoginService.decodeJWT(cachedProof.jwtToken);
              setUserEmail(decoded.email);
            } catch (e) {
              console.error('Error decoding JWT:', e);
            }
          }
          if (cachedProof.userSalt) setUserSalt(cachedProof.userSalt);
          if (cachedProof.ephemeralPrivateKey) setEphemeralPrivateKey(cachedProof.ephemeralPrivateKey);
          if (cachedProof.maxEpoch) setMaxEpoch(cachedProof.maxEpoch);
          if (cachedProof.randomness) setRandomness(cachedProof.randomness);

          setIsAuthenticated(true);
          console.log(`⏰ Session valid for: ${SessionManager.getFormattedTTL()}`);
        }
      } else {
        console.log('❌ User is not authenticated');
        clearAuthState();
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearAuthState = () => {
    setAddress(null);
    setZkProof(null);
    setJwtToken(null);
    setUserSalt(null);
    setEphemeralPrivateKey(null);
    setMaxEpoch(null);
    setRandomness(null);
    setUserEmail(null);
    setIsAuthenticated(false);
  };

  const setAuthData = (data: {
    address: string;
    zkProof: any;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }) => {
    console.log('💾 Setting auth data in context...');
    setAddress(data.address);
    setZkProof(data.zkProof);
    setJwtToken(data.jwtToken);
    setUserSalt(data.userSalt);
    setEphemeralPrivateKey(data.ephemeralPrivateKey);
    setMaxEpoch(data.maxEpoch);
    setRandomness(data.randomness);
    setIsAuthenticated(true);

    // Extract email from JWT
    try {
      const decoded = ZkLoginService.decodeJWT(data.jwtToken);
      setUserEmail(decoded.email);
    } catch (e) {
      console.error('Error decoding JWT:', e);
    }

    console.log('✅ Auth data set successfully');
  };

  const logout = async () => {
    console.log('🔓 Logging out...');
    try {
      await ZkLoginService.clearSession();
      await SessionManager.clearSession();
      clearAuthState();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    address,
    isAuthenticated,
    isLoading,
    zkProof,
    jwtToken,
    userSalt,
    ephemeralPrivateKey,
    maxEpoch,
    randomness,
    userEmail,
    logout,
    checkAuth,
    setAuthData,
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

export default AuthProvider;
