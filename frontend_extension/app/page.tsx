"use client";

import { useEffect, useState } from "react";
import { SessionManager } from "@/lib/session-manager";
// import { ZkLoginService } from "@/lib/zklogin"; // Commented out for development
import { colors } from "./brand";
import ZkLoginTransactionTest from "@/components/ZkLoginTransactionTest";
import { ArrowRight, Shield, Key, Lock } from "lucide-react";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const isAuth = SessionManager.isAuthenticated();
      setIsAuthenticated(isAuth);
      setIsLoading(false);

      // Handle OAuth redirect if present
      const hash = window.location.hash;
      if (hash && hash.includes("id_token")) {
        try {
          const params = new URLSearchParams(hash.substring(1));
          const idToken = params.get("id_token");
          
          if (idToken) {
            setIsLoading(true);
            // await ZkLoginService.completeZkLoginFlow(idToken); // Commented out for development
            setIsAuthenticated(true);
            // Clear hash
            window.history.replaceState(null, "", window.location.pathname);
          }
        } catch (error) {
          console.error("Login failed:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    checkSession();
  }, []);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      // const { nonce } = await ZkLoginService.initializeSession();
      // const loginUrl = ZkLoginService.getOAuthUrl(nonce);
      const loginUrl = '#'; // Mock for development
      window.location.href = loginUrl;
    } catch (error) {
      console.error("Failed to initialize login:", error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    SessionManager.clearSession();
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: colors.darkerNavy }}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2" style={{ borderColor: colors.primary }}></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen p-8" style={{ background: colors.darkerNavy, color: colors.white }}>
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-2xl mb-4" style={{ background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)` }}>
            <Shield className="w-12 h-12" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Pass.me</h1>
          <p className="text-lg" style={{ color: colors.lightBlue }}>
            Decentralized Password Manager
          </p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl border" style={{ borderColor: `${colors.primary}30`, background: colors.darkNavy }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="font-medium">Authenticated</span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-xs hover:underline"
                  style={{ color: colors.lightBlue }}
                >
                  Sign Out
                </button>
              </div>
              <p className="text-sm font-mono break-all" style={{ color: colors.lightBlue }}>
                {SessionManager.getCachedAddress()}
              </p>
            </div>

            <ZkLoginTransactionTest />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <Key className="w-6 h-6 mb-2" style={{ color: colors.primary }} />
                <h3 className="font-semibold">Zero Knowledge</h3>
                <p className="text-xs text-gray-400">Login with Google, no private keys needed</p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <Lock className="w-6 h-6 mb-2" style={{ color: colors.secondary }} />
                <h3 className="font-semibold">Secure Vault</h3>
                <p className="text-xs text-gray-400">Encrypted storage on Walrus</p>
              </div>
            </div>

            <button
              onClick={handleLogin}
              className="w-full py-4 rounded-xl font-bold text-lg transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
              style={{ background: colors.gradients.primary }}
            >
              Sign in with Google
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <p className="text-center text-xs" style={{ color: colors.lightBlue }}>
              Powered by Sui zkLogin & Walrus
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
