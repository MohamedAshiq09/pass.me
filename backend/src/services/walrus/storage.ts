import walrusClient from './client';
import { walrusConfig } from '../../config/walrus.config';
import logger from '../../utils/logger';

class WalrusStorageService {
  /**
   * Store data on Walrus
   */
  public async store(data: Buffer): Promise<string> {
    try {
      const response = await walrusClient.getPublisher().put(
        `/v1/store?epochs=${walrusConfig.epochs}`,
        data,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        }
      );

      if (response.data?.newlyCreated?.blobObject?.blobId) {
        const blobId = response.data.newlyCreated.blobObject.blobId;
        logger.info('Data stored on Walrus', {
          blobId,
          size: data.length,
        });
        return blobId;
      } else if (response.data?.alreadyCertified?.blobId) {
        const blobId = response.data.alreadyCertified.blobId;
        logger.info('Data already exists on Walrus', {
          blobId,
          size: data.length,
        });
        return blobId;
      }

      throw new Error('Unexpected response format from Walrus');
    } catch (error: any) {
      logger.error('Error storing data on Walrus:', error);
      throw new Error(`Failed to store on Walrus: ${error.message}`);
    }
  }

  /**
   * Store JSON data
   */
  public async storeJSON(data: any): Promise<string> {
    try {
      const jsonString = JSON.stringify(data);
      const buffer = Buffer.from(jsonString, 'utf-8');
      return await this.store(buffer);
    } catch (error) {
      logger.error('Error storing JSON on Walrus:', error);
      throw error;
    }
  }

  /**
   * Store text data
   */
  public async storeText(text: string): Promise<string> {
    try {
      const buffer = Buffer.from(text, 'utf-8');
      return await this.store(buffer);
    } catch (error) {
      logger.error('Error storing text on Walrus:', error);
      throw error;
    }
  }

  /**
   * Store encrypted vault data
   */
  public async storeVaultData(vaultData: {
    entries: any[];
    metadata: any;
    timestamp: number;
  }): Promise<string> {
    try {
      logger.info('Storing vault data on Walrus', {
        entriesCount: vaultData.entries.length,
      });

      return await this.storeJSON(vaultData);
    } catch (error) {
      logger.error('Error storing vault data:', error);
      throw error;
    }
  }
}

export default new WalrusStorageService();