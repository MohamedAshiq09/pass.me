import { config } from './env';

export const walrusConfig = {
  aggregatorUrl: config.WALRUS_AGGREGATOR_URL,
  publisherUrl: config.WALRUS_PUBLISHER_URL,
  epochs: config.WALRUS_EPOCHS,
  headers: {
    'Content-Type': 'application/octet-stream',
  },
};

export default walrusConfig;