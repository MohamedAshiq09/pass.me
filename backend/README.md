# Pass.me Backend Service

Backend service for the Pass.me decentralized password manager. Handles Sui blockchain events, Walrus storage, and real-time notifications.

## 🏗️ Architecture

### Core Responsibilities
- **🎧 Event Listening** - Monitor Sui blockchain for password usage events
- **🚨 Real-time Alerts** - Send instant notifications via WebSocket
- **🔍 Anomaly Detection** - Detect suspicious login patterns
- **📊 Analytics** - Track usage statistics and generate reports
- **🔗 Bridge Services** - Connect extension with blockchain and storage

### Tech Stack
- **Node.js + TypeScript** - Runtime and language
- **Express.js** - Web framework
- **WebSocket** - Real-time communication
- **Sui SDK** - Blockchain interaction
- **Axios** - HTTP client for Walrus
- **Winston** - Logging

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js 18+
node --version

# npm or yarn
npm --version
```

### Installation
```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Environment Variables
```bash
# Required
SUI_NETWORK=testnet
VAULT_PACKAGE_ID=0x...
WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space

# Optional
PORT=3001
WS_PORT=3002
LOG_LEVEL=info
```

### Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### Health Check
```bash
GET /api/health
```

### Vault Management
```bash
POST /api/vault                    # Create vault
GET /api/vault/:vaultId            # Get vault
GET /api/vault/owner/:owner        # Get vaults by owner
PUT /api/vault/:vaultId            # Update vault
POST /api/vault/:vaultId/lock      # Lock vault
POST /api/vault/:vaultId/unlock    # Unlock vault
GET /api/vault/:vaultId/data       # Get vault data from Walrus
POST /api/vault/data/store         # Store vault data on Walrus
```

### Alerts
```bash
GET /api/alerts?vault_id=...       # Get alerts
PATCH /api/alerts/:alertId/read    # Mark as read
GET /api/alerts/stats/:vault_id    # Get statistics
DELETE /api/alerts/:alertId        # Delete alert
```

### Activity Tracking
```bash
GET /api/activity/:vault_id        # Get activities
POST /api/activity/login           # Record login
POST /api/activity/password-generation  # Record password generation
GET /api/activity/:vault_id/stats  # Get statistics
```

## 🔌 WebSocket Events

### Client → Server
```javascript
// Subscribe to vault events
{
  "type": "subscribe",
  "vaultId": "0x..."
}

// Unsubscribe
{
  "type": "unsubscribe", 
  "vaultId": "0x..."
}

// Ping
{
  "type": "ping"
}
```

### Server → Client
```javascript
// Login attempt detected
{
  "type": "login_attempt",
  "data": {
    "id": "alert_id",
    "severity": "medium",
    "message": "Login attempt detected",
    "metadata": {...}
  },
  "timestamp": 1234567890
}

// Suspicious activity
{
  "type": "suspicious_activity",
  "data": {...},
  "urgent": true
}
```

## 🔍 Event Processing Flow

```
1. Sui Event Emitted
   ↓
2. Event Listener Detects
   ↓
3. Process Event Type
   ↓
4. Create Alert
   ↓
5. Send WebSocket Notification
   ↓
6. Log Activity
```

## 🛡️ Security Features

### Rate Limiting
- **General**: 100 requests/15min
- **Strict**: 10 requests/15min (sensitive operations)
- **Auth**: 5 requests/15min (authentication)

### Anomaly Detection
- **New Device Detection** - Flags unknown devices
- **Location Analysis** - Detects unusual IP addresses
- **Time Pattern Analysis** - Identifies off-hours activity
- **Rapid Login Detection** - Catches brute force attempts

### Data Privacy
- **IP Hashing** - Store hashed IPs, not raw addresses
- **Domain Hashing** - Hash domain names for privacy
- **No Password Storage** - Never store actual passwords

## 📊 Monitoring & Logging

### Health Monitoring
```bash
curl http://localhost:3001/api/health
```

Response includes:
- Sui blockchain connectivity
- Walrus storage availability
- WebSocket connection count
- Event listener status
- Memory usage

### Logging Levels
- **error** - Critical errors
- **warn** - Warnings and suspicious activity
- **info** - General information
- **debug** - Detailed debugging

## 🔧 Configuration

### Event Polling
```bash
EVENT_POLL_INTERVAL=5000  # Poll every 5 seconds
```

### Alert Thresholds
```bash
MAX_LOGIN_ATTEMPTS=5
SUSPICIOUS_LOGIN_THRESHOLD=3
```

### WebSocket Settings
```bash
WS_PORT=3002
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- --grep "vault"
```

## 📈 Performance

### Optimizations
- **Connection Pooling** - Reuse HTTP connections
- **Event Batching** - Process multiple events together
- **Memory Management** - Efficient data structures
- **Compression** - Gzip response compression

### Scaling Considerations
- **Horizontal Scaling** - Multiple backend instances
- **Database Integration** - Replace in-memory storage
- **Redis Caching** - Cache frequently accessed data
- **Load Balancing** - Distribute WebSocket connections

## 🔄 Integration with Contracts

### Supported Events
- `LoginAttempt` - Password usage detection
- `SuspiciousActivity` - Anomaly alerts
- `PasswordBreach` - Breach notifications
- `UnauthorizedAccess` - Security violations

### Contract Interaction
```typescript
// Create vault transaction
const tx = contractInteraction.createVaultTransaction(walrusBlobId);

// Emit login attempt
const tx = contractInteraction.emitLoginAttemptTransaction(
  vaultId, domainHash, deviceId, ipHash, timestamp, success
);
```

## 🚨 Error Handling

### Error Types
- **Validation Errors** - 400 Bad Request
- **Sui Errors** - 503 Service Unavailable
- **Walrus Errors** - 503 Service Unavailable
- **Rate Limit** - 429 Too Many Requests

### Graceful Shutdown
- Stop event listener
- Close WebSocket connections
- Complete pending requests
- Exit cleanly

## 📝 Development Notes

### Adding New Features
1. Create controller in `src/controllers/`
2. Add routes in `src/routes/`
3. Update types in `src/types/`
4. Add tests in `tests/`

### Database Integration
Replace in-memory storage with:
- **MongoDB** - Document storage
- **PostgreSQL** - Relational data
- **Redis** - Caching layer

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Add tests
4. Update documentation
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details