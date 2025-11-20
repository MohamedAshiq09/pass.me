import axios, { AxiosInstance } from 'axios';
import { walrusConfig } from '../../config/walrus.config';
import logger from '../../utils/logger';

class WalrusClient {
  private publisherClient: AxiosInstance;
  private aggregatorClient: AxiosInstance;

  constructor() {
    this.publisherClient = axios.create({
      baseURL: walrusConfig.publisherUrl,
      headers: walrusConfig.headers,
      timeout: 30000,
    });

    this.aggregatorClient = axios.create({
      baseURL: walrusConfig.aggregatorUrl,
      timeout: 30000,
    });

    logger.info('Walrus client initialized');
  }

  /**
   * Get publisher client
   */
  public getPublisher(): AxiosInstance {
    return this.publisherClient;
  }

  /**
   * Get aggregator client
   */
  public getAggregator(): AxiosInstance {
    return this.aggregatorClient;
  }

  /**
   * Health check
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.aggregatorClient.get('/');
      return true;
    } catch (error) {
      logger.error('Walrus health check failed:', error);
      return false;
    }
  }
}

export default new WalrusClient();