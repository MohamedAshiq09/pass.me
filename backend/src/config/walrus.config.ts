import { config } from './env';

export const walrusConfig = {
  aggregatorUrl: config.WALRUS_AGGREGATOR_URL || 'https://aggregator-devnet.walrus.space',
  publisherUrl: config.WALRUS_PUBLISHER_URL || 'https://publisher-devnet.walrus.space',
  epochs: config.WALRUS_EPOCHS || 5,
  headers: {
    'Content-Type': 'application/octet-stream',
  },
};

export default walrusConfig;