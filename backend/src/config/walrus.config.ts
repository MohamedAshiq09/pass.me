import { config } from './env';

export const walrusConfig = {
  // ✅ FIXED: Use testnet URLs
  aggregatorUrl: config.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space',
  publisherUrl: config.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space',
  uploadRelayUrl: 'https://upload-relay.testnet.walrus.space',
  epochs: config.WALRUS_EPOCHS || 5,
  headers: {
    'Content-Type': 'application/octet-stream',
  },
  timeout: 60000, // 60 seconds
};

export default walrusConfig;