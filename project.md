# 🔐 PASS.ME - Decentralized Password Manager

<div align="center">

![Pass.me Logo](docs/logo.png)

**A revolutionary password manager powered by Sui blockchain, Walrus storage, and Seal encryption**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Sui](https://img.shields.io/badge/Sui-Testnet-blue)](https://sui.io)
[![Walrus](https://img.shields.io/badge/Walrus-Storage-green)](https://walrus.xyz)

[Demo](https://pass.me) • [Documentation](docs/) • [Report Bug](issues/) • [Request Feature](issues/)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [The Problem](#the-problem)
- [Our Solution](#our-solution)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [User Flow](#user-flow)
- [Smart Contracts](#smart-contracts)
- [Security Model](#security-model)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Overview

**Pass.me** is a decentralized, browser-based password manager that generates cryptographically secure passwords on-demand and provides **real-time breach alerts** through blockchain technology. Unlike traditional password managers, Pass.me never stores your actual passwords—it generates them deterministically when needed.

### Why Pass.me?

- 🔒 **Zero-Knowledge Architecture** - Passwords never stored, always generated
- ⚡ **Real-Time Alerts** - Instant notifications via Sui blockchain events
- 🌐 **Works Everywhere** - Compatible with any website (Facebook, Twitter, etc.)
- 🔗 **Decentralized Storage** - Encrypted metadata on Walrus
- 🛡️ **Device Whitelisting** - Only authorized devices can access passwords
- 🔑 **Social Recovery** - Guardian-based account recovery
- 🚀 **zkLogin Support** - Login with Google/Apple/Email

---

## 🚨 The Problem

### Current Password Management Issues:

#### 1. **Password Reuse Crisis**
- 📊 **52% of users** reuse passwords across multiple sites (Google Study 2019)
- 🎯 One breach = All accounts compromised
- 📄 **Research**: "The Tangled Web of Password Reuse" (NDSS 2014)

#### 2. **Centralized Password Managers = Single Point of Failure**
- 💥 **LastPass Breach (2022)**: Encrypted vaults stolen
- 🎯 If master password compromised → All passwords exposed
- 📄 **Research**: "Security Analysis of Password Managers" (IEEE S&P 2014)

#### 3. **Delayed Breach Notification**
- ⏰ Users discover breaches **weeks or months** later
- 📧 haveibeenpwned notifies AFTER damage is done
- 🚫 No real-time alerts when password is used

#### 4. **Legacy Sites Don't Support Modern Auth**
- 🔐 Most websites still use username/password
- 🚫 No FIDO2, WebAuthn, or passwordless support
- 💔 Users stuck with traditional auth

#### 5. **Device Loss = Password Loss**
- 📱 Lost phone = Lost access to password manager
- 🔑 Master password forgotten = Permanent lockout
- 📄 **Problem**: No decentralized recovery mechanism

---

## ✅ Our Solution

### Pass.me solves these problems with:

### 1. **Deterministic Password Generation**
```
Password = PBKDF2(Private_Key + Domain + Timestamp)
```
- ✅ Passwords **never stored** anywhere
- ✅ Generated on-the-fly when needed
- ✅ Same private key always produces same password for a domain

### 2. **Decentralized Storage (Walrus)**
- ✅ Encrypted vault metadata stored on Walrus (NOT passwords!)
- ✅ Censorship-resistant
- ✅ No single point of failure

### 3. **Real-Time Blockchain Alerts (Sui)**
- ✅ **Instant notifications** when password is used
- ✅ Detects suspicious activity immediately
- ✅ Alerts for unknown devices/locations

### 4. **Works on ANY Website**
- ✅ Browser extension auto-fills passwords
- ✅ No website integration needed
- ✅ Works on legacy platforms (Facebook, Twitter, etc.)

### 5. **Guardian Recovery System**
- ✅ Trusted friends/family can help recover access
- ✅ Multi-sig approval required
- ✅ Never lose access to your vault

---

## 🔄 How It Works

### **High-Level Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                     1. USER SETUP                            │
│                                                              │
│  User installs extension → Generates private key             │
│  Private key encrypted with biometric/PIN                    │
│  Encrypted backup stored on Walrus (optional)                │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              2. CREATE PASSWORD FOR FACEBOOK                 │
│                                                              │
│  Extension generates: PBKDF2(private_key + "facebook.com")   │
│  Password: "aB3$xZ9@kL2..."                                 │
│  Metadata stored on Sui blockchain:                          │
│    - Domain hash (NOT "facebook.com" - for privacy)          │
│    - Password hash (for breach detection)                    │
│    - Device whitelist                                        │
│  Encrypted details stored on Walrus                          │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              3. LOGIN TO FACEBOOK LATER                      │
│                                                              │
│  Extension unlocked (biometric/PIN)                          │
│  Regenerates same password: PBKDF2(key + "facebook.com")     │
│  Auto-fills password → User logs in                          │
│  Extension records usage on Sui blockchain                   │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│            4. REAL-TIME ALERT SYSTEM                         │
│                                                              │
│  Sui smart contract emits "LoginAttempt" event               │
│  Backend listening to blockchain 24/7                        │
│  If unknown device detected → ALERT!                         │
│  User gets instant notification:                             │
│    📱 Browser notification                                   │
│    📧 Email alert                                            │
│    🔔 Push notification                                      │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│         5. SUSPICIOUS ACTIVITY DETECTED                      │
│                                                              │
│  Attacker tries to use password from new device/location     │
│  Smart contract checks device whitelist → NOT AUTHORIZED    │
│  Emits "SuspiciousActivity" event (severity: HIGH)           │
│  Backend processes event → Sends URGENT alert                │
│  User can immediately:                                       │
│    1. Lock vault                                            │
│    2. Revoke device access                                  │
│    3. Generate new password                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Architecture

### **System Architecture Diagram:**
```
┌────────────────────────────────────────────────────────────────┐
│                         USER LAYER                             │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Browser    │  │   Mobile     │  │   Desktop    │        │
│  │  Extension   │  │     App      │  │     App      │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                  │                  │                │
└─────────┼──────────────────┼──────────────────┼────────────────┘
          │                  │                  │
          └──────────────────┴──────────────────┘
                             │
          ┌──────────────────┴──────────────────┐
          │                                      │
          ▼                                      ▼
┌─────────────────────────┐          ┌─────────────────────────┐
│   FRONTEND (Next.js)    │          │   BACKEND (Node.js)     │
│                         │          │                         │
│  • zkLogin Auth         │◄────────►│  • Event Listener       │
│  • Vault Management     │   HTTP   │  • WebSocket Server     │
│  • Alert Dashboard      │   REST   │  • Anomaly Detection    │
│  • Activity Timeline    │          │  • Push Notifications   │
└───────┬─────────────────┘          └─────────┬───────────────┘
        │                                      │
        │                                      │
        └──────────────┬───────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────────────┐
        │      BLOCKCHAIN LAYER (SUI)          │
        ├──────────────────────────────────────┤
        │                                      │
        │  ┌──────────┐  ┌──────────┐        │
        │  │  Vault   │  │ Password │        │
        │  │ Contract │  │  Entry   │        │
        │  └──────────┘  └──────────┘        │
        │                                      │
        │  ┌──────────┐  ┌──────────┐        │
        │  │  Alert   │  │  Access  │        │
        │  │  System  │  │ Control  │        │
        │  └──────────┘  └──────────┘        │
        │                                      │
        │  ┌──────────┐                       │
        │  │ Recovery │                       │
        │  └──────────┘                       │
        └──────────┬───────────────────────────┘
                   │
                   ▼
        ┌──────────────────────────────────────┐
        │   STORAGE LAYER (WALRUS)             │
        ├──────────────────────────────────────┤
        │                                      │
        │  📦 Encrypted Vault Metadata         │
        │  📦 Login History Logs               │
        │  📦 Device Information               │
        │  📦 Encrypted Backups                │
        │                                      │
        └──────────────────────────────────────┘
```

---

## ⚙️ How Components Work Together

### **Frontend → Backend → Blockchain → Storage**

#### **Scenario: User Creates Password for Facebook**

**Step 1: Frontend (Browser Extension)**
```typescript
// User clicks "Generate Password" for facebook.com
const privateKey = await seal.getPrivateKey(); // Local, encrypted
const domain = "facebook.com";
const timestamp = Math.floor(Date.now() / 86400000); // Daily rotation

// Generate password deterministically
const password = await PBKDF2({
  password: privateKey,
  salt: domain + timestamp,
  iterations: 100000,
  keyLength: 32
});

// Result: "aB3$xZ9@kL2mN4pQ5r..."
```

**Step 2: Extension → Backend API**
```typescript
// Extension sends metadata (NOT password!) to backend
POST /api/vault/entry
{
  vault_id: "0xabc...",
  domain_hash: sha256("facebook.com"),
  password_hash: sha256(password),
  device_id: "device_fingerprint_123"
}
```

**Step 3: Backend → Sui Blockchain**
```typescript
// Backend calls smart contract
const tx = createPasswordEntryTransaction({
  vault_id: "0xabc...",
  domain_hash: sha256("facebook.com"),
  password_hash: sha256(password),
  device_id: "device_123"
});

await suiClient.signAndExecuteTransactionBlock({ tx });

// Smart contract emits event:
event::emit(PasswordEntryCreated {
  vault_id: "0xabc...",
  domain_hash: [18, 52, 86, ...],
  created_at: 1699564800
});
```

**Step 4: Backend → Walrus Storage**
```typescript
// Backend stores encrypted metadata
const vaultData = {
  entries: [{
    domain: "facebook.com", // Encrypted before upload
    password_hash: "sha256_hash",
    created_at: 1699564800,
    device_whitelist: ["device_123"],
    login_history: []
  }]
};

const encrypted = encrypt(JSON.stringify(vaultData), userKey);
const blobId = await walrus.store(encrypted);

// Update Sui contract with new Walrus blob ID
await updateVaultTransaction(vaultId, blobId);
```

---

#### **Scenario: Attacker Tries to Use Password**

**Step 1: Attacker Logs In**
```
Attacker somehow gets password (phishing, keylogger, etc.)
Attacker tries to login to facebook.com from unknown device
```

**Step 2: Smart Contract Detects**
```move
// password_entry.move
public entry fun record_usage(
  entry: &mut PasswordEntry,
  device_id: vector<u8>,
  clock: &Clock
) {
  // Check if device is whitelisted
  if (!is_device_whitelisted(entry, &device_id)) {
    // EMIT ALERT!
    alert_system::emit_suspicious_activity(
      entry.vault_id,
      device_id,
      b"UNKNOWN_DEVICE",
      4 // CRITICAL severity
    );
  }
}
```

**Step 3: Backend Event Listener**
```typescript
// Backend listening 24/7
eventListener.on('SuspiciousActivity', async (event) => {
  console.log('🚨 ALERT: Suspicious activity detected!');
  
  // Send WebSocket notification
  websocket.sendToUser(event.vault_id, {
    type: 'CRITICAL_ALERT',
    message: 'Unknown device tried to access your Facebook password!',
    device_id: event.device_id,
    timestamp: event.timestamp
  });
  
  // Send push notification
  pushService.send(event.vault_id, {
    title: '🚨 Security Alert',
    body: 'Unauthorized access attempt detected'
  });
  
  // Send email
  emailService.send({
    to: user.email,
    subject: 'URGENT: Suspicious Activity',
    body: 'Someone tried to use your password from an unknown device'
  });
});
```

**Step 4: User Gets Instant Alert**
```
📱 Browser Notification: "Suspicious login detected!"
📧 Email: "URGENT: Unknown device accessed your password"
🔔 Mobile Push: "Security Alert - Check your Pass.me dashboard"
```

**Step 5: User Takes Action**
```typescript
// User clicks "Lock Vault" button
await lockVaultTransaction(vaultId);

// Or revoke device access
await revokeDeviceAccess(deviceId);

// Or generate new password
const newPassword = await regeneratePassword("facebook.com");
```

---

## 🎯 Key Features

### 1. **Deterministic Password Generation**
- ✅ Passwords never stored anywhere
- ✅ Generated using `PBKDF2(private_key + domain + timestamp)`
- ✅ Same input always produces same output
- ✅ Private key encrypted locally with Seal

### 2. **Real-Time Breach Alerts**
- ✅ Sui blockchain emits events when passwords used
- ✅ Backend listens 24/7 and sends instant notifications
- ✅ WebSocket, Email, and Push notifications
- ✅ Know within **seconds** if something suspicious happens

### 3. **Device Whitelisting**
- ✅ Only authorized devices can access passwords
- ✅ New device detected → Instant alert
- ✅ User can revoke device access anytime

### 4. **Decentralized Storage**
- ✅ Encrypted vault metadata stored on Walrus
- ✅ Censorship-resistant
- ✅ No single company controls your data

### 5. **Social Recovery**
- ✅ Add trusted guardians (friends/family)
- ✅ If private key lost → Guardians approve recovery
- ✅ Multi-sig approval required (e.g., 2-of-3)
- ✅ Vault ownership transferred to new address

### 6. **zkLogin Authentication**
- ✅ Login with Google, Apple, or Email
- ✅ No need to manage private keys manually
- ✅ Zero-knowledge proofs ensure privacy

### 7. **Works Everywhere**
- ✅ Browser extension for Chrome/Firefox
- ✅ Auto-detects login forms
- ✅ Auto-fills passwords
- ✅ No website integration needed

### 8. **Anomaly Detection**
- ✅ Detects unusual login times
- ✅ Flags new IP addresses
- ✅ Alerts on geographic anomalies
- ✅ Machine learning-based risk scoring

---

## 🛠️ Technology Stack

### **Frontend**
- ⚛️ **Next.js 14** - React framework with App Router
- 🎨 **Tailwind CSS** - Styling
- 🔷 **TypeScript** - Type safety
- 🔗 **@mysten/sui.js** - Sui blockchain SDK
- 🔑 **@mysten/zklogin** - zkLogin authentication
- 📦 **Zustand** - State management

### **Backend**
- 🟢 **Node.js** - Runtime
- ⚡ **Express.js** - Web framework
- 🔷 **TypeScript** - Type safety
- 🔗 **@mysten/sui.js** - Sui SDK
- 📡 **WebSocket (ws)** - Real-time communication
- 📝 **Winston** - Logging
- ⏰ **node-cron** - Scheduled tasks

### **Smart Contracts**
- 🟣 **Sui Move** - Smart contract language
- ⛓️ **Sui Blockchain** - Layer 1 blockchain
- 📦 **Sui Framework** - Standard library

### **Storage**
- 🦭 **Walrus** - Decentralized storage network
- 🔐 **Seal** - Local encryption

### **Browser Extension**
- 🔌 **Chrome Extension API** - Browser integration
- ⚛️ **React** - UI framework
- 📦 **Webpack** - Bundler

---

## 📂 Project Structure
```
pass.me/
├── frontend/                    # Next.js Web Application
│   ├── app/                     # App Router
│   │   ├── page.tsx             # Landing page
│   │   ├── dashboard/           # Dashboard
│   │   ├── vault/               # Vault management
│   │   └── alerts/              # Alerts page
│   ├── components/              # React components
│   ├── lib/                     # Utilities
│   │   ├── sui/                 # Sui integration
│   │   ├── walrus/              # Walrus integration
│   │   └── seal/                # Seal encryption
│   └── hooks/                   # Custom hooks
│
├── backend/                     # Node.js Backend
│   ├── src/
│   │   ├── index.ts             # Entry point
│   │   ├── routes/              # API routes
│   │   ├── controllers/         # Business logic
│   │   ├── services/            # Core services
│   │   │   ├── sui/             # Sui integration
│   │   │   ├── walrus/          # Walrus integration
│   │   │   └── notifications/   # Alert system
│   │   ├── middleware/          # Express middleware
│   │   └── config/              # Configuration
│   └── tests/                   # Unit/integration tests
│
├── contracts/                   # Sui Smart Contracts
│   ├── sources/
│   │   ├── vault.move           # Vault contract
│   │   ├── password_entry.move  # Password entry
│   │   ├── alert_system.move    # Alert system
│   │   ├── access_control.move  # Device management
│   │   └── recovery.move        # Social recovery
│   └── tests/                   # Contract tests
│
├── extension/                   # Browser Extension
│   ├── background/              # Service worker
│   ├── content/                 # Content scripts
│   ├── popup/                   # Extension popup
│   ├── lib/                     # Utilities
│   └── manifest.json            # Extension config
│
├── shared/                      # Shared code
│   ├── types/                   # TypeScript types
│   └── utils/                   # Shared utilities
│
├── docs/                        # Documentation
├── .env.example                 # Environment template
└── README.md                    # This file
```

---

## 🚀 Getting Started

### **Prerequisites**

- Node.js v18+ and npm/pnpm
- Sui CLI
- Git

### **Installation**

#### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/pass.me.git
cd pass.me
```

#### **2. Install Dependencies**
```bash
# Install all dependencies (monorepo)
pnpm install

# Or install individually
cd frontend && npm install
cd ../backend && npm install
cd ../extension && npm install
```

#### **3. Configure Environment**
```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Required Environment Variables:**
```env
# Sui Network
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443
VAULT_PACKAGE_ID=0x6d30e6996ab01fd91d80babc05d316800cff3a8c2d54d96452e6f75d4b127276

# Walrus
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# Your wallet
ADMIN_WALLET_ADDRESS=0xYOUR_ADDRESS
```

#### **4. Deploy Smart Contracts**
```bash
cd contracts
sui client switch --env testnet
sui client publish --gas-budget 100000000

# Save the package ID to .env
```

#### **5. Run Backend**
```bash
cd backend
npm run dev

# Backend runs on http://localhost:3001
```

#### **6. Run Frontend**
```bash
cd frontend
npm run dev

# Frontend runs on http://localhost:3000
```

#### **7. Build Extension**
```bash
cd extension
npm run build

# Load unpacked extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select extension/dist folder
```

---

## 👤 User Flow

### **Complete User Journey:**

#### **1. Installation & Setup (2 minutes)**
```
User installs browser extension
    ↓
Extension generates Ed25519 keypair
    ↓
Private key encrypted with:
  - Biometric (fingerprint/face)
  - OR PIN code
    ↓
Encrypted key backed up to Walrus (optional)
    ↓
Sui smart contract creates Vault object
    ↓
User setup complete! ✅
```

#### **2. Create Password for Facebook**
```
User visits facebook.com/signup
    ↓
Clicks "Sign Up"
    ↓
Extension detects password field
    ↓
Shows "Generate Password" button
    ↓
User clicks button
    ↓
Extension:
  1. Unlocks (biometric/PIN)
  2. Generates: PBKDF2(key + "facebook.com" + today)
  3. Result: "aB3$xZ9@kL2mN4pQ5r..."
  4. Auto-fills password field
    ↓
User completes signup
    ↓
Extension:
  1. Creates PasswordEntry on Sui
  2. Stores metadata on Walrus
  3. Adds current device to whitelist
    ↓
Password saved! ✅
```

#### **3. Login to Facebook Later**
```
User visits facebook.com/login
    ↓
Extension detects login form
    ↓
User clicks password field
    ↓
Extension:
  1. Unlocks (if locked)
  2. Regenerates same password
  3. Auto-fills
    ↓
User clicks "Log In"
    ↓
Facebook logs in successfully
    ↓
Extension calls Sui contract:
  record_usage(entry_id, device_id)
    ↓
Smart contract emits LoginAttempt event
    ↓
Backend processes event
    ↓
User gets notification:
  "✅ Login detected from Chrome on MacBook"
```

#### **4. Suspicious Activity Detected**
```
Attacker gets password somehow
    ↓
Attacker tries to login from new device
    ↓
Smart contract checks device whitelist
    ↓
Device NOT whitelisted!
    ↓
Contract emits SuspiciousActivity event
    ↓
Backend processes:
  1. Logs to database
  2. Sends WebSocket alert
  3. Sends push notification
  4. Sends email
    ↓
User gets URGENT alert:
  "🚨 Unknown device in Russia tried to access Facebook!"
    ↓
User clicks "Lock Vault" immediately
    ↓
Vault locked - attacker can't access anything
    ↓
User changes Facebook password manually
    ↓
Crisis averted! ✅
```

#### **5. Device Lost/Stolen**
```
User loses phone
    ↓
Logs into pass.me from laptop
    ↓
Goes to Settings → Devices
    ↓
Sees list:
  ✅ MacBook Pro (trusted)
  ✅ iPhone 15 (trusted)
  ⚠️  Unknown Device (suspicious)
    ↓
User clicks "Revoke Access" on lost phone
    ↓
Smart contract updates device whitelist
    ↓
Lost phone can no longer access passwords
    ↓
All passwords still accessible from laptop ✅
```

#### **6. Private Key Lost - Recovery**
```
User loses private key (forgot PIN, device wiped, etc.)
    ↓
Initiates recovery process
    ↓
Generates new keypair on new device
    ↓
Requests recovery from guardians:
  - Mom
  - Dad
  - Best Friend
    ↓
Pass.me sends recovery request to guardians
    ↓
Guardians approve (2-of-3 required)
    ↓
Smart contract transfers vault ownership
    ↓
User regains access with new key
    ↓
All passwords accessible again! ✅
```

---

## 🔐 Smart Contracts

### **Contract Overview:**

#### **1. Vault Contract (`vault.move`)**
**Purpose:** Main container for user's password vault

**Functions:**
- `create_vault()` - Create new vault
- `update_vault()` - Update Walrus blob ID
- `lock_vault()` - Emergency lock
- `unlock_vault()` - Unlock vault
- `enable_zklogin()` - Enable zkLogin

**Objects:**
```move
struct Vault {
    id: UID,
    owner: address,
    walrus_blob_id: String,
    created_at: u64,
    total_entries: u64,
    is_locked: bool,
}
```

#### **2. Password Entry Contract (`password_entry.move`)**
**Purpose:** Track metadata for each password

**Functions:**
- `create_entry()` - Create password entry
- `record_usage()` - Log password usage
- `add_device()` - Add device to whitelist

**Objects:**
```move
struct PasswordEntry {
    id: UID,
    vault_id: ID,
    domain_hash: vector<u8>,
    password_hash: vector<u8>,
    device_whitelist: vector<vector<u8>>,
    usage_count: u64,
}
```

#### **3. Alert System (`alert_system.move`)**
**Purpose:** Emit real-time security events

**Events:**
- `LoginAttempt` - Login detected
- `SuspiciousActivity` - Unusual behavior
- `PasswordBreach` - Password in breach database
- `UnauthorizedAccess` - Unknown device

#### **4. Access Control (`access_control.move`)**
**Purpose:** Manage device permissions

**Functions:**
- `register_device()` - Add new device
- `revoke_device()` - Remove device
- `is_device_trusted()` - Check if device authorized

#### **5. Recovery Contract (`recovery.move`)**
**Purpose:** Social recovery system

**Functions:**
- `create_recovery_config()` - Set up guardians
- `initiate_recovery()` - Start recovery process
- `approve_recovery()` - Guardian approval
- `complete_recovery()` - Transfer ownership

---

## 🛡️ Security Model

### **Security Principles:**

#### **1. Zero-Knowledge Architecture**
```
❌ Traditional: Password → Encrypt → Store
✅ Pass.me:    Private Key → Generate → Use → Forget
```

#### **2. Defense in Depth**

| Layer | Protection |
|-------|------------|
| **Layer 1: Private Key** | Encrypted locally with Seal, never leaves device |
| **Layer 2: Device Whitelist** | Only authorized devices can access |
| **Layer 3: Biometric Lock** | Fingerprint/face required to unlock |
| **Layer 4: Real-Time Alerts** | Instant notification on suspicious activity |
| **Layer 5: Blockchain Immutability** | All events recorded on-chain |

#### **3. What We Store vs. What We Don't**

**✅ What We Store (Encrypted on Walrus):**
- Domain name ("facebook.com")
- Password hash (for breach detection)
- Device whitelist
- Login history timestamps
- User preferences

**❌ What We NEVER Store:**
- Actual passwords
- Private keys (user-side only)
- Unencrypted personal data

#### **4. Attack Scenarios & Mitigations**

| Attack | Mitigation |
|--------|------------|
| **Keylogger steals password** | Real-time alert when used from unknown device |
| **Phishing site** | Domain hash doesn't match → Extension won't auto-fill |
| **Server breach** | No servers to breach! Walrus is decentralized |
| **Device stolen** | Biometric required + remote device revocation |
| **Private key lost** | Guardian recovery system |
| **Password reuse across sites** | Impossible - each site gets unique password |

---

## 📡 API Documentation

### **REST API Endpoints:**

#### **Authentication**
```
POST /api/auth/zklogin
GET  /api/auth/verify
POST /api/auth/logout
```

#### **Vault Management**
```
GET    /api/vault/:address        # Get user's vault
POST   /api/vault/create          # Create new vault
PUT    /api/vault/update          # Update vault
POST   /api/vault/lock            # Lock vault
POST   /api/vault/unlock          # Unlock vault
```

#### **Password Entries**
```
GET    /api/vault/:vaultId/entries     # List all entries
POST   /api/vault/:vaultId/entries     # Create entry
DELETE /api/vault/:vaultId/entries/:id # Delete entry
POST   /api/vault/entry/usage          # Record usage
```

#### **Alerts**
```
GET /api/alerts/:vaultId         # Get alerts
GET /api/alerts/:vaultId/unread  # Unread alerts
PUT /api/alerts/:id/read         # Mark as read
```

#### **Activity**
```
GET /api/activity/:vaultId       # Get activity log
GET /api/activity/:vaultId/stats # Get statistics
```

#### **Devices**
```
GET    /api/devices/:vaultId     # List devices
POST   /api/devices/register     # Register device
DELETE /api/devices/:id          # Revoke device
```

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### **Development Workflow:**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

- **Sui Foundation** - Blockchain infrastructure
- **Mysten Labs** - Walrus storage network
- **Seal** - Local encryption SDK
- **OpenZeppelin** - Security best practices

---

## 📞 Contact

- **Website**: [pass.me](https://pass.me)
- **Email**: support@pass.me
- **Twitter**: [@passme_official](https://twitter.com/passme_official)
- **Discord**: [Join our community](https://discord.gg/passme)

---

<div align="center">

**Made with ❤️ for Walrus Haulout Hackathon**

[⬆ Back to Top](#-passme---decentralized-password-manager)

</div>