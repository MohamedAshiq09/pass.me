# Pass.me Smart Contracts

Decentralized password manager contracts built on Sui blockchain.

## 🏗️ Architecture

### Core Contracts

1. **vault.move** - Main vault container for user's password data
2. **password_entry.move** - Metadata tracking for each password
3. **alert_system.move** - Real-time security alerts and monitoring
4. **access_control.move** - Device whitelist and access management
5. **recovery.move** - Multi-sig recovery system for lost keys
6. **zklogin_integration.move** - Google/Apple login integration

## 🚀 Quick Start

### Prerequisites

```bash
# Install Sui CLI
curl -fLJO https://github.com/MystenLabs/sui/releases/download/testnet-v1.14.0/sui-testnet-v1.14.0-ubuntu-x86_64.tgz
tar -xf sui-testnet-v1.14.0-ubuntu-x86_64.tgz
sudo mv sui-testnet-v1.14.0-ubuntu-x86_64/sui /usr/local/bin/

# Verify installation
sui --version
```

### Setup Wallet

```bash
# Create new wallet
sui client new-address ed25519

# Switch to testnet
sui client switch --env testnet

# Get testnet tokens
curl --location --request POST 'https://faucet.testnet.sui.io/gas' \
--header 'Content-Type: application/json' \
--data-raw '{"FixedAmountRequest": {"recipient": "YOUR_SUI_ADDRESS_HERE"}}'

# Check balance
sui client gas
```

### Build & Deploy

```bash
# Build contracts
cd contracts
sui move build

# Run tests
sui move test

# Deploy to testnet
sui client publish --gas-budget 100000000

# Save the package ID from output!
```

## 📋 Contract Responsibilities

### 🔐 Vault Contract
- Creates vault object for each user
- Stores Walrus blob ID (encrypted data)
- Tracks total password entries
- Emergency lock/unlock functionality
- zkLogin integration

### 🔑 Password Entry Contract
- Tracks metadata for each website/domain
- Stores domain hash (privacy-preserving)
- Maintains device whitelist
- Records usage statistics
- **Note**: Never stores actual passwords!

### 🚨 Alert System Contract
- Emits real-time security events
- Login attempt notifications
- Suspicious activity alerts
- Password breach detection
- Unauthorized access warnings

### 🛡️ Access Control Contract
- Device registry management
- Trust/revoke device access
- Last seen tracking
- Multi-device support

### 🔄 Recovery Contract
- Guardian-based recovery system
- Multi-signature approvals
- Vault ownership transfer
- Lost key recovery

## 🧪 Testing

```bash
# Run all tests
sui move test

# Run specific test module
sui move test --filter vault_tests

# Run with coverage
sui move test --coverage
```

## 📊 Data Flow

```
PRIVATE KEY (local, never uploaded)
     ↓
GENERATE PASSWORD (browser, using Seal)
     ↓
USE PASSWORD (on facebook.com)
     ↓
RECORD USAGE (password_entry.move)
     ↓
EMIT EVENT (alert_system.move)
     ↓
BACKEND LISTENS (Sui event listener)
     ↓
SEND NOTIFICATION (push/email/websocket)
     ↓
USER GETS ALERT ✅
```

## 🔧 Environment Variables

Create `.env` file in project root:

```bash
# Sui Network
SUI_NETWORK=testnet
SUI_RPC_URL=https://fullnode.testnet.sui.io:443

# Contract Addresses (fill after deployment)
VAULT_PACKAGE_ID=
PASSWORD_ENTRY_PACKAGE_ID=
ALERT_SYSTEM_PACKAGE_ID=

# Walrus Configuration
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# Admin Wallet (KEEP SECRET!)
ADMIN_PRIVATE_KEY=
ADMIN_ADDRESS=

# Frontend
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_VAULT_PACKAGE_ID=
```

## 🎯 Key Features

✅ **Zero-Knowledge Passwords** - Generated on-the-fly, never stored
✅ **Real-Time Alerts** - Instant notifications for any password usage
✅ **Device Whitelisting** - Only authorized devices can access passwords
✅ **Decentralized Storage** - Encrypted data stored on Walrus
✅ **Multi-Sig Recovery** - Guardian-based account recovery
✅ **zkLogin Support** - Google/Apple login integration

## 🔒 Security Model

- **Private keys never leave the device**
- **Passwords are deterministically generated**
- **Only metadata stored on-chain**
- **End-to-end encryption with Seal**
- **Real-time breach detection**
- **Multi-device access control**

## 📚 Next Steps

1. ✅ **Contracts** - Complete and tested
2. ⏭️ **Frontend** - zkLogin integration
3. ⏭️ **Backend** - Sui event listener
4. ⏭️ **Extension** - Browser password manager

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details