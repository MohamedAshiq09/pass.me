# Pass.me Browser Extension

Decentralized password manager browser extension with zero-knowledge architecture, Sui blockchain integration, and Walrus storage.

## Purpose

The browser extension provides:

1. **Auto-fill & Password Detection** - Automatically detects login forms and fills credentials
2. **Zero-Knowledge Password Generation** - Generates passwords deterministically using PBKDF2(private_key + domain + timestamp)
3. **Real-time Security Alerts** - WebSocket notifications for breach alerts and suspicious activity
4. **Encrypted Local Vault** - Chrome storage with AES-256-GCM encryption

## Architecture

**Core Components:**
- React frontend (375px popup interface)
- Content script for form detection and auto-fill
- Background service worker for vault management
- zkLogin authentication via Sui
- Chrome storage API for encrypted vault persistence

**Data Flow:**
```
User Action → Extension Popup → Background Worker → Chrome Storage
                                      ↓
                            Sync to Walrus + Sui
                                      ↓
                         WebSocket ← Backend ← Blockchain Events
```

## How It Works

1. **Authentication**: User signs in with Google via zkLogin (24h session cache)
2. **Vault Sync**: Extension syncs encrypted vault between chrome.storage and Walrus/Sui
3. **Auto-fill**: Content script detects forms → Background checks vault → Fills credentials
4. **Password Generation**: Deterministic or random generation with strength scoring
5. **Security**: All passwords encrypted with AES-256-GCM before storage

## Project Structure
```
frontend_extension/
├── components/            # Reusable UI components
├── contexts/             # React contexts (Auth, Vault, Extension)
├── extension/            # Browser extension files
│   ├── background/       # Service worker (vault operations)
│   ├── content/          # Content script (form detection)
│   ├── popup/            # React popup pages
│   │   └── pages/        # Login, Vault, Settings, etc.
│   └── manifest.json     # Extension manifest v3
├── hooks/                # Custom React hooks
├── lib/                  # Core libraries
│   ├── api/             # Backend API client
│   ├── crypto/          # Encryption & password generation
│   ├── walrus/          # Walrus storage client
│   └── zklogin.ts       # zkLogin integration
└── config/              # Constants and configuration
```

## Setup & Build
```bash
# Install dependencies
npm install

# Development build (with hot reload)
npm run dev:extension

# Production build
npm run build:extension
```

**Output:** `dist/extension/` folder ready to load in Chrome

## Loading in Browser

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `dist/extension/` folder
5. Pin extension to toolbar

## Key Features

**Popup Interface** (375px × 500px):
- Vault page with search and category filters
- Add/edit password with auto-generation
- Password strength meter
- Settings: auto-lock timeout, notifications
- Security alerts dashboard

**Content Script** (Runs on all pages):
- Detects login forms automatically
- Adds "🔐 Pass.me" button to password fields
- Auto-fills on button click
- Offers to save new passwords after form submission

**Background Worker**:
- Manages vault state in chrome.storage.local
- Syncs to Walrus/Sui blockchain
- Handles auto-lock timer (default 15min)
- WebSocket connection for real-time alerts

## Configuration

**Environment Variables** (hardcoded in `config/constants.ts`):
```typescript
SUI_NETWORK=testnet
VAULT_PACKAGE_ID=0x6d30e...
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
```

**Extension Settings**:
- Auto-lock timeout: 5/15/30/60 mins
- Security notifications: on/off
- Auto-fill: on/off
- Password generator defaults: length, character types

## Storage Architecture

**Chrome Storage** (primary):
- `pass_me_vault_data` - Encrypted vault with all passwords
- `zkLoginSession` - 24h cached authentication
- `pass_me_device_id` - Unique device identifier

**Why chrome.storage.local?**
- Persists across browser sessions
- Survives extension updates
- No quota issues with small vaults (<5MB)
- Direct access from background worker

## Security Features

**Zero-Knowledge Architecture**:
- Passwords never stored in plaintext
- Master password never leaves device
- Deterministic generation: same inputs = same password

**Encryption**:
- AES-256-GCM with PBKDF2 key derivation
- 100,000 iterations for brute-force resistance
- Unique salt and IV per vault

**Auto-lock**:
- Configurable timeout (default 15min)
- Triggers on inactivity
- Clears sensitive data from memory

## Domain Matching Logic

**Normalization**:
```javascript
domain.toLowerCase()
  .replace(/^(https?:\/\/)?(www\.)?/, '')
  .replace(/\/$/, '')
```

**Matching Rules**:
- Exact match: `facebook.com` = `facebook.com`
- Subdomain match: `m.facebook.com` includes `facebook.com`
- Protocol agnostic: `https://` and `http://` treated equally

## Development Notes

**Hot Reload**:
```bash
npm run dev:extension
# Edit files → Refresh extension in chrome://extensions/
```

**Debugging**:
- Popup: Right-click extension icon → "Inspect popup"
- Background: chrome://extensions/ → "Service worker" → "Inspect"
- Content script: Browser DevTools → Console tab

**Common Issues**:
1. **"Error: Extension context invalidated"** → Reload extension
2. **Vault not syncing** → Check Walrus testnet status
3. **Auto-fill not working** → Check content script injection

## Browser Compatibility

**Supported**:
- Chrome 88+
- Edge 88+
- Brave (Chromium-based)

**Manifest v3**:
- Service worker instead of background page
- chrome.storage.local instead of localStorage
- Declarative content scripts

## Production Checklist

- [ ] Replace hardcoded package IDs with production contracts
- [ ] Enable backend proxy for Walrus uploads (avoid 522 errors)
- [ ] Implement rate limiting for API calls
- [ ] Add crash reporting (Sentry)
- [ ] Create extension store assets (screenshots, descriptions)
- [ ] Submit to Chrome Web Store

## API Integration

**Backend Endpoints**:
- `POST /api/vault/data/store` - Upload encrypted vault
- `GET /api/vault/:id/data` - Download vault
- `WebSocket /ws` - Real-time alerts

**zkLogin Flow**:
1. Extension → Enoki API (nonce)
2. User → Google OAuth
3. Extension → Enoki API (ZK proof)
4. Result: 24h session cached locally

## Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: Custom CSS (no Tailwind due to extension constraints)
- **Authentication**: Sui zkLogin (Google OAuth)
- **Storage**: Chrome Storage API
- **Crypto**: Web Crypto API (AES-256-GCM)
- **Build**: Vite with custom extension config

## Contributing

1. Keep popup lightweight (<375px width)
2. Test on real websites for auto-fill
3. Ensure chrome.storage persistence
4. Follow domain normalization rules
5. Add error boundaries for stability

## License

MIT License - see LICENSE file