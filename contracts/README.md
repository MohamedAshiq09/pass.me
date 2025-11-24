# Pass.me Backend

Decentralized password manager backend service bridging browser extension, Sui blockchain, and Walrus storage.

## Purpose

The backend serves three critical functions that can't be handled client-side:

1. **Walrus Storage Proxy** - Direct browser uploads fail due to ~2200 HTTP requests per blob; backend handles chunked uploads
2. **Real-time Alert System** - WebSocket server delivers instant breach notifications from Sui blockchain events
3. **Event Monitoring** - Polls Sui blockchain for password usage events and triggers anomaly detection

## Architecture

**Core Components:**
- Express.js REST API with WebSocket support
- Sui blockchain event listener (polls every 5s)
- Walrus storage client (testnet endpoints)
- Anomaly detection engine for suspicious login patterns
- In-memory storage (replace with database for production)

**Data Flow:**
```
Extension → Backend API → Walrus Storage → Sui Smart Contract
                ↓
        WebSocket Alerts ← Sui Events ← Blockchain Monitor
```

## How It Works

1. **Vault Storage**: Extension encrypts vault → Backend uploads to Walrus → Returns blob ID → Extension stores in Sui contract
2. **Real-time Alerts**: Sui emits events → Backend polls every 5s → Analyzes anomalies → Sends WebSocket notification → Extension displays alert
3. **Security**: All vault data arrives pre-encrypted from extension; backend only handles transport

## Setup
```bash
npm install
cp .env.example .env
# Edit .env with your Sui package ID
npm start  # Production
npm run dev  # Development with hot reload
```

**Required Environment Variables:**
```bash
VAULT_PACKAGE_ID=0x6d30e6996ab01fd91d80babc05d316800cff3a8c2d54d96452e6f75d4b127276
SUI_NETWORK=testnet
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
PORT=3001
WS_PORT=3002
```

## API Endpoints

**Vault Operations:**
- `POST /api/vault` - Create vault transaction
- `GET /api/vault/:vaultId` - Get vault from Sui
- `POST /api/vault/data/store` - Upload encrypted vault to Walrus
- `GET /api/vault/:vaultId/data` - Download vault from Walrus

**Alerts & Activity:**
- `GET /api/alerts?vault_id=X` - Get alerts with pagination
- `GET /api/activity/:vault_id` - Get activity history
- `GET /api/alerts/stats/:vault_id` - Alert statistics

**WebSocket:**
- Connect: `ws://localhost:3002`
- Subscribe: `{"type":"subscribe","vaultId":"0x..."}`
- Receives: Login attempts, suspicious activity, breach alerts

## Key Services

**Sui Event Listener** (`services/sui/eventListener.ts`):
- Polls blockchain every 5 seconds for alert_system events
- Processes: LoginAttempt, SuspiciousActivity, PasswordBreach, UnauthorizedAccess
- Creates alerts and triggers WebSocket notifications

**Anomaly Detection** (`services/analytics/anomalyDetection.ts`):
- Detects: Unknown devices, new IPs, unusual login times, rapid login attempts
- Severity scoring: low/medium/high/critical
- Confidence-based alerting (>50% triggers notification)

**Walrus Storage** (`services/walrus/storage.ts`):
- Uses testnet publisher endpoint (devnet unstable)
- Handles encrypted blob uploads/downloads
- 5 epoch storage duration

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js + WebSocket (ws)
- **Blockchain**: @mysten/sui.js for Sui integration
- **Storage**: Axios for Walrus HTTP API
- **Security**: Helmet, CORS, rate limiting (100 req/15min)
- **Logging**: Winston with configurable log levels

## Development
```bash
npm run dev     # Start with nodemon hot reload
npm run build   # Compile TypeScript to dist/
npm test        # Run test suite
npm run lint    # Check code quality
```

**Project Structure:**
```
src/
├── controllers/    # Request handlers
├── services/       # Business logic (Sui, Walrus, WebSocket)
├── middleware/     # Auth, rate limiting, logging
├── models/         # Data models (Alert, Activity, Vault)
├── routes/         # API route definitions
├── config/         # Environment & service configs
└── utils/          # Crypto, logging, validation
```

## Production Notes

- Replace in-memory storage with PostgreSQL/MongoDB
- Enable database for activity history and alert persistence
- Configure JWT authentication for API endpoints
- Set up Redis for WebSocket connection scaling
- Use PM2 or Docker for process management
- Monitor Sui RPC rate limits (consider paid tier)

## Error Handling

- `400` - Validation errors
- `404` - Vault/resource not found
- `429` - Rate limit exceeded
- `503` - Sui/Walrus service unavailable

Graceful shutdown on SIGTERM/SIGINT closes WebSocket connections and stops event listener.