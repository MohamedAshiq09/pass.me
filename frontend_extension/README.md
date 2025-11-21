# Pass.me Frontend Extension

A decentralized password manager browser extension built with React, TypeScript, and Sui blockchain.

## 🚀 Quick Start (Development Mode)

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies:**
```bash
npm install
```

2. **Build the extension:**
```bash
npm run build:extension
```

3. **Load in Chrome:**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right toggle)
   - Click "Load unpacked"
   - Select the `dist/extension` folder

### Development

- **Watch mode:** `npm run watch:extension`
- **Development build:** `npm run dev:extension`
- **Next.js app:** `npm run dev` (for testing components)

## 📁 Project Structure

```
frontend_extension/
├── extension/              # Browser extension code
│   ├── popup/             # Extension popup UI
│   ├── background/        # Background service worker
│   ├── content/           # Content scripts
│   └── manifest.json      # Extension manifest
├── contexts/              # React contexts
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── types/                 # TypeScript types
└── config/                # Configuration
```

## 🔧 Current Status

**Development Mode Features:**
- ✅ Mock authentication (zkLogin commented out)
- ✅ Password vault management
- ✅ Password generator
- ✅ Auto-fill detection
- ✅ Security alerts UI
- ✅ Settings management

**Production Features (To Enable):**
- 🔄 zkLogin authentication
- 🔄 Sui blockchain integration
- 🔄 Walrus storage
- 🔄 End-to-end encryption

## 🛠️ Development Notes

### Authentication
Currently using mock authentication for development. To enable zkLogin:

1. Uncomment zkLogin code in `contexts/AuthContext.tsx`
2. Uncomment vault manager in `contexts/VaultContext.tsx`
3. Implement the missing crypto libraries

### Missing Libraries
The following libraries need to be implemented:
- `lib/crypto/encryption.ts`
- `lib/crypto/passwordGenerator.ts`
- `lib/crypto/masterKey.ts`
- `lib/walrus/client.ts`
- `lib/vault/vaultManager.ts`
- `lib/contracts/vaultContract.ts`

### Extension Testing

1. **Popup Testing:**
   - Click the extension icon
   - Test all pages and navigation

2. **Content Script Testing:**
   - Visit any website with login forms
   - Look for Pass.me buttons on password fields

3. **Background Script Testing:**
   - Check Chrome DevTools > Extensions > Pass.me > Background page

## 🎨 UI Components

- **LoginPage:** Mock authentication
- **VaultPage:** Password list and management
- **AddPasswordPage:** Add new passwords
- **ViewPasswordPage:** View/edit password details
- **GeneratorPage:** Password generator
- **SettingsPage:** Extension settings
- **AlertsPage:** Security alerts

## 🔐 Security Features

- Mock password storage (in-memory)
- Password strength calculation
- Form detection and auto-fill
- Security alerts simulation
- Auto-lock functionality

## 📦 Build Output

The build creates a `dist/extension/` folder with:
- `manifest.json` - Extension manifest
- `popup/` - Popup HTML, CSS, and JS
- `background/` - Background service worker
- `content/` - Content scripts and styles

## 🚀 Next Steps

1. **Enable zkLogin:** Uncomment and implement authentication
2. **Add Encryption:** Implement crypto libraries
3. **Sui Integration:** Connect to blockchain
4. **Walrus Storage:** Implement decentralized storage
5. **Testing:** Add comprehensive tests
6. **Icons:** Add extension icons to `extension/assets/icons/`

## 🐛 Troubleshooting

**Extension not loading:**
- Check Chrome DevTools for errors
- Verify manifest.json syntax
- Ensure all files are built correctly

**Popup not opening:**
- Check popup HTML and JS files exist
- Verify popup dimensions in CSS
- Check for JavaScript errors

**Content script not working:**
- Verify content script injection
- Check website permissions
- Look for CSP conflicts