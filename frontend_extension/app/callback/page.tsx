'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ZkLoginService } from '@/lib/zklogin';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '../brand';

function CallbackContent() {
  const router = useRouter();
  const { setAuthData, checkAuth } = useAuth();
  const [status, setStatus] = useState('Processing OAuth callback...');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasProcessedRef.current) {
      console.log('Callback already processed - skipping');
      return;
    }
    hasProcessedRef.current = true;

    const handleCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        console.log('📍 Current URL:', window.location.href);

        // Extract JWT from URL fragment (#id_token=...)
        const fragment = window.location.hash;
        console.log('🔍 Fragment found:', fragment.length > 0);

        const idTokenMatch = fragment.match(/id_token=([^&]+)/);
        if (!idTokenMatch) {
          console.error('❌ No id_token found in URL fragment');
          throw new Error('No id_token found. OAuth authentication may have failed.');
        }

        const jwtToken = decodeURIComponent(idTokenMatch[1]);
        console.log('✅ JWT token extracted');

        setStatus('Generating ZK proof (this takes 2-3 seconds)...');

        // Complete the entire zkLogin flow
        console.log('🔐 Starting zkLogin flow...');
        const result = await ZkLoginService.completeZkLoginFlow(jwtToken);

        console.log('✅ zkLogin flow completed!');
        console.log('📍 Address:', result.address);
        console.log(`👤 User type: ${result.isNewUser ? 'NEW' : 'EXISTING'}`);

        // Store auth data in React context
        console.log('💾 Setting auth data...');
        setAuthData({
          address: result.address,
          zkProof: result.zkProof,
          jwtToken: result.jwtToken,
          userSalt: result.userSalt,
          ephemeralPrivateKey: result.ephemeralPrivateKey,
          maxEpoch: result.maxEpoch,
          randomness: result.randomness,
        });

        checkAuth();

        setStatus('Authentication successful! Redirecting...');

        // Redirect to home after success
        setTimeout(() => {
          console.log('🚀 Redirecting to home...');
          router.replace('/');
        }, 1200);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('❌ Callback error:', errorMessage);
        console.error('❌ Full error:', err);

        setError(errorMessage);
        setStatus('Authentication failed');

        // Redirect back to home after error
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: colors.darkerNavy }}
    >
      <div className="max-w-md w-full mx-4 text-center">
        {/* Spinner */}
        <div className="mb-8">
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
            style={{ background: `${colors.primary}20` }}
          >
            {isProcessing ? (
              <svg
                className="w-8 h-8 animate-spin"
                style={{ color: colors.primary }}
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : error ? (
              <span className="text-3xl">❌</span>
            ) : (
              <span className="text-3xl">✅</span>
            )}
          </div>
        </div>

        {/* Status */}
        <h1
          className="text-2xl font-bold mb-3"
          style={{ color: colors.white }}
        >
          {error ? 'Authentication Failed' : 'Signing You In'}
        </h1>

        <p
          className="text-sm mb-6"
          style={{ color: error ? '#ef4444' : colors.lightBlue }}
        >
          {error || status}
        </p>

        {/* Error Details */}
        {error && (
          <div
            className="rounded-lg p-4 mb-6 text-left border"
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'rgba(239, 68, 68, 0.3)'
            }}
          >
            <p className="text-xs font-mono break-all text-red-400">{error}</p>
          </div>
        )}

        {/* Help Text */}
        <div style={{ color: colors.lightBlue }} className="text-xs space-y-2">
          <p>This page will redirect automatically.</p>
          {isProcessing && <p>Please keep this window open...</p>}
        </div>
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: colors.darkerNavy }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: colors.primary }}
        />
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
