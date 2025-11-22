"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ZkLoginService } from "@/lib/zklogin";
import { SessionManager } from "@/lib/session-manager";
import { colors } from "./brand";
import ZkLoginTransactionTest from "@/components/ZkLoginTransactionTest";
import { ArrowRight, Shield, Key, Lock, LogOut, Copy, Check } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading, address, logout } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLogin = async () => {
    try {
      setIsSigningIn(true);
      console.log("🔐 Starting zkLogin...");

      // Initialize session and get nonce
      const { nonce } = await ZkLoginService.initializeSession();
      console.log("✅ Session initialized, nonce:", nonce);

      // Get OAuth URL and redirect
      const loginUrl = ZkLoginService.getOAuthUrl(nonce);
      console.log("🌐 Redirecting to Google OAuth...");
      window.location.href = loginUrl;
    } catch (error) {
      console.error("Failed to initialize login:", error);
      setIsSigningIn(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleCopyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return "";
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: colors.darkerNavy }}
      >
        <div
          className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
          style={{ borderColor: colors.primary }}
        />
      </div>
    );
  }

  return (
    <main
      className="min-h-screen p-8"
      style={{ background: colors.darkerNavy, color: colors.white }}
    >
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div
            className="inline-flex p-4 rounded-2xl mb-4"
            style={{
              background: `linear-gradient(135deg, ${colors.primary}20, ${colors.primary}10)`,
            }}
          >
            <Shield className="w-12 h-12" style={{ color: colors.primary }} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Pass.me</h1>
          <p className="text-lg" style={{ color: colors.lightBlue }}>
            Decentralized Password Manager
          </p>
        </div>

        {isAuthenticated ? (
          <div className="space-y-6">
            {/* Authenticated State */}
            <div
              className="p-6 rounded-2xl border"
              style={{
                borderColor: `${colors.primary}30`,
                background: colors.darkNavy,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium">Authenticated</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-xs hover:opacity-80 transition-opacity"
                  style={{ color: colors.lightBlue }}
                >
                  <LogOut className="w-3 h-3" />
                  Sign Out
                </button>
              </div>

              {/* Address Display */}
              <div className="flex items-center gap-2">
                <p
                  className="text-sm font-mono flex-1"
                  style={{ color: colors.lightBlue }}
                >
                  {formatAddress(address || "")}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" style={{ color: colors.lightBlue }} />
                  )}
                </button>
              </div>

              {/* Session TTL */}
              <p
                className="text-xs mt-3"
                style={{ color: colors.lightBlue, opacity: 0.7 }}
              >
                Session: {SessionManager.getFormattedTTL()}
              </p>
            </div>

            {/* Transaction Test Component */}
            <ZkLoginTransactionTest />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <Key className="w-6 h-6 mb-2" style={{ color: colors.primary }} />
                <h3 className="font-semibold">Zero Knowledge</h3>
                <p className="text-xs text-gray-400">
                  Login with Google, no private keys needed
                </p>
              </div>
              <div className="p-4 rounded-xl border border-white/5 bg-white/5">
                <Lock className="w-6 h-6 mb-2" style={{ color: colors.secondary }} />
                <h3 className="font-semibold">Secure Vault</h3>
                <p className="text-xs text-gray-400">
                  Encrypted storage on Walrus
                </p>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              onClick={handleLogin}
              disabled={isSigningIn}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: colors.gradients.primary }}
            >
              {isSigningIn ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white" />
                  Connecting...
                </>
              ) : (
                <>
                  Sign in with Google
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>

            <p
              className="text-center text-xs"
              style={{ color: colors.lightBlue }}
            >
              Powered by Sui zkLogin & Walrus
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
