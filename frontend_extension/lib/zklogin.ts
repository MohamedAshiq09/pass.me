/* eslint-disable @typescript-eslint/no-explicit-any */

import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import {
  generateNonce,
  getZkLoginSignature,
  genAddressSeed,
  computeZkLoginAddressFromSeed,
  jwtToAddress,
} from "@mysten/sui/zklogin";
import { jwtDecode } from "jwt-decode";
import { SessionManager } from "./session-manager";
import { getStorageItem, setStorageItem, removeStorageItem, isExtensionContext } from "./extension-storage";

// Environment variables (injected by webpack)
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
const REDIRECT_URL = process.env.NEXT_PUBLIC_REDIRECT_URL || 'http://localhost:3000/callback';
const OAUTH_URL = process.env.NEXT_PUBLIC_OAUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
const ENOKI_NONCE_URL = process.env.NEXT_PUBLIC_ENOKI_NONCE_URL || 'https://api.enoki.mystenlabs.com/v1/zklogin/nonce';
const ENOKI_ZKP_URL = process.env.NEXT_PUBLIC_ENOKI_ZKP_URL || 'https://api.enoki.mystenlabs.com/v1/zklogin/zkp';
const ENOKI_API_KEY = process.env.NEXT_PUBLIC_ENOKI_API_KEY || '';

export interface ZkLoginSession {
  ephemeralPrivateKey: string;
  ephemeralPublicKey: string;
  randomness: string;
  maxEpoch: string;
  userSalt: string;
  nonce?: string;
}

export interface DecodedJWT {
  iss: string;
  azp: string;
  aud: string;
  sub: string;
  email: string;
  email_verified: boolean;
  nonce: string;
  name: string;
  picture: string;
  given_name: string;
  family_name: string;
  iat: number;
  exp: number;
}

const STORAGE_KEY = "zkLoginSession";
const USER_SALT_KEY = "userSalt";

export class ZkLoginService {
  /**
   * Initialize a new zkLogin session
   * Uses Enoki API for nonce generation on testnet
   */
  static async initializeSession(): Promise<{
    ephemeralKeyPair: Ed25519Keypair;
    nonce: string;
    randomness: string;
    maxEpoch: number;
    userSalt: string;
  }> {
    console.log("🔄 Initializing new zkLogin session...");

    // Generate ephemeral key pair
    const ephemeralKeyPair = new Ed25519Keypair();

    // Generate a temporary user salt (will be finalized with JWT email later)
    let userSalt = await getStorageItem<string>(USER_SALT_KEY);
    if (!userSalt) {
      // Generate random salt
      const randomBytes = new Uint8Array(16);
      crypto.getRandomValues(randomBytes);
      userSalt = Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      await setStorageItem(USER_SALT_KEY, userSalt);
    }

    // Get serialized public key for Enoki API
    const ephemeralPublicKeyBase64 = ephemeralKeyPair
      .getPublicKey()
      .toSuiPublicKey();

    console.log("🌐 Requesting nonce from Enoki API...");
    const nonceResponse = await fetch(ENOKI_NONCE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENOKI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        network: "testnet",
        ephemeralPublicKey: ephemeralPublicKeyBase64,
        additionalEpochs: 2,
      }),
    });

    if (!nonceResponse.ok) {
      const errorText = await nonceResponse.text();
      console.error("Enoki nonce API error:", errorText);
      throw new Error(
        `Failed to get nonce from Enoki: ${nonceResponse.status}`
      );
    }

    const nonceData = await nonceResponse.json();
    const { nonce, randomness, maxEpoch } = nonceData.data;

    console.log("✅ Session initialized:");
    console.log("  - Nonce:", nonce);
    console.log("  - Max epoch:", maxEpoch);

    // Get the secret key as Bech32 string
    const secretKey = ephemeralKeyPair.getSecretKey();

    // Store session data (include public key for background script)
    const sessionData: ZkLoginSession = {
      ephemeralPrivateKey: secretKey,
      ephemeralPublicKey: ephemeralPublicKeyBase64,
      randomness,
      maxEpoch: maxEpoch.toString(),
      userSalt,
      nonce,
    };

    await setStorageItem(STORAGE_KEY, sessionData);
    console.log("✅ Session stored successfully");

    return {
      ephemeralKeyPair,
      nonce,
      randomness,
      maxEpoch,
      userSalt,
    };
  }

  /**
   * Get OAuth login URL for Google
   */
  static getOAuthUrl(nonce: string): string {
    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: REDIRECT_URL,
      response_type: "id_token",
      scope: "openid email profile",
      nonce: nonce,
      state: "random_state_" + Date.now(),
    });

    return `${OAUTH_URL}?${params.toString()}`;
  }

  /**
   * Launch OAuth flow using chrome.identity (for extensions)
   * Returns the JWT token directly
   */
  static async launchExtensionOAuth(nonce: string): Promise<string> {
    if (!isExtensionContext() || !chrome.identity) {
      throw new Error("chrome.identity not available");
    }

    const redirectUrl = chrome.identity.getRedirectURL();
    console.log("🔐 Extension redirect URL:", redirectUrl);

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      redirect_uri: redirectUrl,
      response_type: "id_token",
      scope: "openid email profile",
      nonce: nonce,
      state: "random_state_" + Date.now(),
    });

    const authUrl = `${OAUTH_URL}?${params.toString()}`;
    console.log("🌐 Launching OAuth flow...");

    return new Promise((resolve, reject) => {
      chrome.identity.launchWebAuthFlow(
        {
          url: authUrl,
          interactive: true,
        },
        (responseUrl) => {
          if (chrome.runtime.lastError) {
            console.error("OAuth error:", chrome.runtime.lastError);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (!responseUrl) {
            reject(new Error("No response URL from OAuth"));
            return;
          }

          console.log("✅ OAuth response received");

          // Extract JWT from URL fragment
          const url = new URL(responseUrl);
          const fragment = url.hash;
          const idTokenMatch = fragment.match(/id_token=([^&]+)/);

          if (!idTokenMatch) {
            reject(new Error("No id_token in OAuth response"));
            return;
          }

          const jwtToken = decodeURIComponent(idTokenMatch[1]);
          console.log("✅ JWT token extracted");
          resolve(jwtToken);
        }
      );
    });
  }

  /**
   * Load session from storage
   */
  static async loadSession(): Promise<ZkLoginSession | null> {
    const session = await getStorageItem<ZkLoginSession>(STORAGE_KEY);
    if (session) {
      console.log("📦 Session loaded from storage");
    }
    return session;
  }

  /**
   * Compute zkLogin address from JWT
   */
  static computeAddress(jwtToken: string, userSalt: string): string {
    try {
      const address = jwtToAddress(jwtToken, userSalt);
      console.log("🏠 Computed zkLogin address:", address);
      return address;
    } catch (error) {
      console.error("❌ Failed to compute address:", error);
      throw error;
    }
  }

  /**
   * Decode JWT token
   */
  static decodeJWT(jwtToken: string): DecodedJWT {
    return jwtDecode<DecodedJWT>(jwtToken);
  }

  /**
   * Recreate ephemeral key pair from stored Bech32 secret key
   */
  static recreateKeyPair(secretKeyBech32: string): Ed25519Keypair {
    console.log("🔑 Recreating KeyPair from stored secret...");
    const keypair = Ed25519Keypair.fromSecretKey(secretKeyBech32);
    console.log("✅ KeyPair recreated successfully");
    return keypair;
  }

  /**
   * Generate ZK Proof via Enoki API
   */
  static async generateZkProof(params: {
    jwtToken: string;
    ephemeralKeyPair: Ed25519Keypair;
    randomness: string;
    maxEpoch: number;
    userSalt: string;
  }): Promise<any> {
    const { jwtToken, ephemeralKeyPair, randomness, maxEpoch } = params;

    console.log("🔐 Generating ZK Proof via Enoki API...");

    // Get serialized ephemeral public key
    const ephemeralPublicKeyBase64 = ephemeralKeyPair
      .getPublicKey()
      .toSuiPublicKey();

    // Decode JWT to verify nonce
    const decodedJWT = this.decodeJWT(jwtToken);

    // Verify the nonce matches what we expect
    const expectedNonce = generateNonce(
      ephemeralKeyPair.getPublicKey(),
      maxEpoch,
      randomness
    );

    console.log("🔍 Verifying nonce...");
    console.log("  Expected:", expectedNonce);
    console.log("  JWT nonce:", decodedJWT.nonce);

    if (expectedNonce !== decodedJWT.nonce) {
      console.error("❌ NONCE MISMATCH!");
      throw new Error(
        `Nonce mismatch! Expected: ${expectedNonce}, Got: ${decodedJWT.nonce}. ` +
          `Please restart the login flow.`
      );
    }

    console.log("✅ Nonce verification passed!");

    // Call Enoki ZKP service
    const response = await fetch(ENOKI_ZKP_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ENOKI_API_KEY}`,
        "Content-Type": "application/json",
        "zklogin-jwt": jwtToken,
      },
      body: JSON.stringify({
        network: "testnet",
        ephemeralPublicKey: ephemeralPublicKeyBase64,
        maxEpoch: maxEpoch,
        randomness: randomness,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Enoki ZKP API error:", errorText);
      throw new Error(
        `Enoki ZKP service error: ${response.status} - ${errorText}`
      );
    }

    const zkpData = await response.json();
    console.log("✅ ZK Proof received from Enoki");

    return zkpData.data || zkpData;
  }

  /**
   * Create zkLogin signature for transaction
   */
  static createSignature(params: {
    zkProof: any;
    maxEpoch: number;
    ephemeralSignature: string | Uint8Array;
    jwtToken: string;
    userSalt: string;
  }): string {
    console.log("🔏 Creating zkLogin Signature...");

    try {
      const decodedJWT = this.decodeJWT(params.jwtToken);

      // Handle aud field - can be string or array
      const aud = Array.isArray(decodedJWT.aud)
        ? decodedJWT.aud[0]
        : decodedJWT.aud;

      // Extract proof components
      const partialZkProof = {
        proofPoints: params.zkProof.proofPoints,
        issBase64Details: params.zkProof.issBase64Details,
        headerBase64: params.zkProof.headerBase64,
      };

      // Compute addressSeed from JWT and salt
      const ourAddressSeed = genAddressSeed(
        BigInt(params.userSalt),
        "sub",
        decodedJWT.sub,
        aud
      ).toString();

      // CRITICAL: Use Enoki's addressSeed if present (proof is tied to it)
      const finalAddressSeed = params.zkProof.addressSeed || ourAddressSeed;

      if (params.zkProof.addressSeed && params.zkProof.addressSeed !== ourAddressSeed) {
        console.log("ℹ️ Using Enoki's addressSeed (expected)");
      }

      const completeZkProof = {
        ...partialZkProof,
        addressSeed: finalAddressSeed,
      };

      const signature = getZkLoginSignature({
        inputs: completeZkProof,
        maxEpoch: params.maxEpoch,
        userSignature: params.ephemeralSignature,
      });

      console.log("✅ zkLogin signature created");
      return signature;
    } catch (error) {
      console.error("❌ Failed to create zkLogin signature:", error);
      throw error;
    }
  }

  /**
   * Clear session data
   */
  static async clearSession(): Promise<void> {
    await removeStorageItem(STORAGE_KEY);
    await removeStorageItem(USER_SALT_KEY);
    await SessionManager.clearSession();
    console.log("🗑️ zkLogin session cleared");
  }

  /**
   * Derive deterministic salt from JWT email
   */
  static deriveSaltFromJWT(jwtToken: string): string {
    const decodedJWT = this.decodeJWT(jwtToken);
    console.log("📧 Deriving salt from email:", decodedJWT.email);

    const emailBytes = new TextEncoder().encode(decodedJWT.email);

    let hash = 0;
    for (let i = 0; i < emailBytes.length; i++) {
      hash = (hash << 5) - hash + emailBytes[i];
      hash = hash & hash;
    }

    const salt = Math.abs(hash).toString();
    console.log("✅ Deterministic salt created");
    return salt;
  }

  /**
   * Complete zkLogin flow - handles initialization + proof generation
   */
  static async completeZkLoginFlow(jwtToken: string): Promise<{
    address: string;
    zkProof: any;
    session: ZkLoginSession;
    isNewUser: boolean;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }> {
    console.log("=== Starting zkLogin Flow ===");

    // Decode JWT to get email
    const decodedJWT = this.decodeJWT(jwtToken);
    console.log("📧 Email:", decodedJWT.email);

    // Derive salt from email (deterministic across devices)
    const userSalt = this.deriveSaltFromJWT(jwtToken);

    // Check if user already has cached proof
    const cachedProof = await SessionManager.getCachedProofAsync();
    if (
      cachedProof &&
      cachedProof.userSalt === userSalt &&
      cachedProof.ephemeralPrivateKey &&
      cachedProof.randomness
    ) {
      console.log("👤 EXISTING USER - Using cached data");
      console.log("✅ Cached proof valid (" + SessionManager.getFormattedTTL() + ")");

      // Derive ephemeral public key from private key
      const ephemeralKeyPair = this.recreateKeyPair(cachedProof.ephemeralPrivateKey);
      const ephemeralPublicKey = ephemeralKeyPair.getPublicKey().toSuiPublicKey();

      return {
        address: cachedProof.address!,
        zkProof: cachedProof.zkProof,
        session: {
          ephemeralPrivateKey: cachedProof.ephemeralPrivateKey,
          ephemeralPublicKey,
          randomness: cachedProof.randomness,
          maxEpoch: (cachedProof.maxEpoch ?? 0).toString(),
          userSalt: cachedProof.userSalt,
        },
        isNewUser: false,
        jwtToken,
        userSalt: cachedProof.userSalt,
        ephemeralPrivateKey: cachedProof.ephemeralPrivateKey,
        maxEpoch: cachedProof.maxEpoch!,
        randomness: cachedProof.randomness,
      };
    }

    console.log("🆕 NEW USER - Generating fresh proof");

    // Load or create session
    let session = await this.loadSession();
    if (!session) {
      console.log("📦 Creating new session...");
      const initResult = await this.initializeSession();
      session = {
        ephemeralPrivateKey: initResult.ephemeralKeyPair.getSecretKey(),
        ephemeralPublicKey: initResult.ephemeralKeyPair.getPublicKey().toSuiPublicKey(),
        randomness: initResult.randomness,
        maxEpoch: initResult.maxEpoch.toString(),
        userSalt: userSalt,
        nonce: initResult.nonce,
      };
      await SessionManager.saveSession(session);
    } else {
      session.userSalt = userSalt;
      await SessionManager.saveSession(session);
    }

    // Recreate ephemeral key pair
    const ephemeralKeyPair = this.recreateKeyPair(session.ephemeralPrivateKey);

    // Generate ZK Proof
    console.log("🔐 Generating ZK proof...");
    const zkProof = await this.generateZkProof({
      jwtToken,
      ephemeralKeyPair,
      randomness: session.randomness,
      maxEpoch: parseInt(session.maxEpoch),
      userSalt: session.userSalt,
    });

    console.log("✅ ZK Proof generated");

    // Compute address from Enoki's addressSeed
    let address: string;
    if (zkProof.addressSeed) {
      console.log("🔑 Computing address from Enoki's addressSeed...");
      address = computeZkLoginAddressFromSeed(
        BigInt(zkProof.addressSeed),
        decodedJWT.iss!
      );
      console.log("✅ Address:", address);
    } else {
      console.log("⚠️ No addressSeed in proof, using local salt");
      address = this.computeAddress(jwtToken, session.userSalt);
    }

    // Cache the proof for 24h
    await SessionManager.cacheProof({
      zkProof,
      jwtToken,
      address,
      userSalt: session.userSalt,
      maxEpoch: parseInt(session.maxEpoch),
      randomness: session.randomness,
      ephemeralPrivateKey: session.ephemeralPrivateKey,
    });

    console.log("✅ NEW USER REGISTERED");
    console.log("📧 Email:", decodedJWT.email);
    console.log("💾 Address:", address);

    return {
      address,
      zkProof,
      session,
      isNewUser: true,
      jwtToken,
      userSalt: session.userSalt,
      ephemeralPrivateKey: session.ephemeralPrivateKey,
      maxEpoch: parseInt(session.maxEpoch),
      randomness: session.randomness,
    };
  }

  /**
   * Full extension login flow
   * Initializes session, launches OAuth, completes zkLogin
   */
  static async loginWithExtension(): Promise<{
    address: string;
    zkProof: any;
    jwtToken: string;
    userSalt: string;
    ephemeralPrivateKey: string;
    maxEpoch: number;
    randomness: string;
  }> {
    console.log("🚀 Starting extension login flow...");

    // Step 1: Initialize session
    const { nonce } = await this.initializeSession();

    // Step 2: Launch OAuth and get JWT
    const jwtToken = await this.launchExtensionOAuth(nonce);

    // Step 3: Complete zkLogin flow
    const result = await this.completeZkLoginFlow(jwtToken);

    return {
      address: result.address,
      zkProof: result.zkProof,
      jwtToken: result.jwtToken,
      userSalt: result.userSalt,
      ephemeralPrivateKey: result.ephemeralPrivateKey,
      maxEpoch: result.maxEpoch,
      randomness: result.randomness,
    };
  }

  /**
   * Get signature for transaction using cached proof
   */
  static getTransactionSignature(params: {
    zkProof?: any;
    maxEpoch?: number;
    ephemeralSignature: string | Uint8Array;
    jwtToken?: string;
    userSalt?: string;
    useCache?: boolean;
  }): string {
    if (params.useCache) {
      const cached = SessionManager.getCachedProof();
      if (!cached || !cached.jwtToken || !cached.userSalt) {
        throw new Error("No cached proof available");
      }
      return this.createSignature({
        zkProof: cached.zkProof,
        maxEpoch: cached.maxEpoch!,
        ephemeralSignature: params.ephemeralSignature,
        jwtToken: cached.jwtToken,
        userSalt: cached.userSalt,
      });
    }

    if (!params.zkProof || !params.maxEpoch || !params.jwtToken || !params.userSalt) {
      throw new Error("Missing required parameters for signature creation");
    }

    return this.createSignature({
      zkProof: params.zkProof,
      maxEpoch: params.maxEpoch,
      ephemeralSignature: params.ephemeralSignature,
      jwtToken: params.jwtToken,
      userSalt: params.userSalt,
    });
  }
}
