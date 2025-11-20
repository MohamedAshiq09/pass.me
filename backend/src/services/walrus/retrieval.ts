import walrusClient from './client';
import logger from '../../utils/logger';

class WalrusRetrievalService {
  /**
   * Retrieve data from Walrus by blob ID
   */
  public async retrieve(blobId: string): Promise<Buffer> {
    try {
      const response = await walrusClient.getAggregator().get(`/v1/${blobId}`, {
        responseType: 'arraybuffer',
      });

      logger.info('Data retrieved from Walrus', {
        blobId,
        size: response.data.length,
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      logger.error('Error retrieving data from Walrus:', error);
      throw new Error(`Failed to retrieve from Walrus: ${error.message}`);
    }
  }

  /**
   * Retrieve and parse JSON
   */
  public async retrieveJSON(blobId: string): Promise<any> {
    try {
      const data = await this.retrieve(blobId);
      return JSON.parse(data.toString('utf-8'));
    } catch (error) {
      logger.error('Error retrieving JSON from Walrus:', error);
      throw error;
    }
  }

  /**
   * Retrieve text
   */
  public async retrieveText(blobId: string): Promise<string> {
    try {
      const data = await this.retrieve(blobId);
      return data.toString('utf-8');
    } catch (error) {
      logger.error('Error retrieving text from Walrus:', error);
      throw error;
    }
  }

  /**
   * Retrieve vault data
   */
  public async retrieveVaultData(blobId: string): Promise<{
    entries: any[];
    metadata: any;
    timestamp: number;
  }> {
    try {
      logger.info('Retrieving vault data from Walrus', { blobId });
      
      const vaultData = await this.retrieveJSON(blobId);
      
      logger.info('Vault data retrieved successfully', {
        blobId,
        entriesCount: vaultData.entries?.length || 0,
      });

      return vaultData;
    } catch (error) {
      logger.error('Error retrieving vault data:', error);
      throw error;
    }
  }
}

export default new WalrusRetrievalService();