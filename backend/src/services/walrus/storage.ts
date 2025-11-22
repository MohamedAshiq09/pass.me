import { walrusConfig } from '../../config/walrus.config';
import logger from '../../utils/logger';
import axios from 'axios';

class WalrusStorageService {
  /**
   * Store data on Walrus - FIXED with correct API endpoint
   */
  public async store(data: Buffer): Promise<string> {
    try {
      // ✅ FIXED: Use correct Walrus API endpoint /v1/blobs (NOT /v1/store)
      const publisherUrl = 'https://publisher.walrus-testnet.walrus.space';
      const url = `${publisherUrl}/v1/blobs?epochs=${walrusConfig.epochs}`;

      logger.info('Uploading to Walrus testnet:', {
        url,
        size: data.length,
        epochs: walrusConfig.epochs
      });

      const response = await axios.put(url, data, {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        timeout: 60000, // 60 second timeout
        maxContentLength: 50 * 1024 * 1024, // 50MB max
      });

      if (response.data?.newlyCreated?.blobObject?.blobId) {
        const blobId = response.data.newlyCreated.blobObject.blobId;
        logger.info('✅ Data stored on Walrus', { blobId, size: data.length });
        return blobId;
      } else if (response.data?.alreadyCertified?.blobId) {
        const blobId = response.data.alreadyCertified.blobId;
        logger.info('✅ Data already exists on Walrus', { blobId });
        return blobId;
      }

      throw new Error('Unexpected Walrus response format');
    } catch (error: any) {
      // Better error handling
      if (error.code === 'ECONNABORTED') {
        throw new Error('Walrus upload timeout - try smaller files or check network');
      }
      if (error.response?.status === 522) {
        throw new Error('Walrus publisher timeout - try again or use backend proxy');
      }

      logger.error('Walrus upload error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

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
   * Store encrypted vault data (receives encrypted data from frontend)
   */
  public async storeVaultData(vaultData: any): Promise<string> {
    try {
      logger.info('Storing vault data on Walrus', {
        dataType: typeof vaultData,
        hasEntries: !!vaultData.entries,
        hasCiphertext: !!vaultData.ciphertext,
      });

      // The vaultData is already encrypted by the frontend
      // It contains: { ciphertext, iv, salt }
      // We just need to store it as-is
      return await this.storeJSON(vaultData);
    } catch (error) {
      logger.error('Error storing vault data:', error);
      throw error;
    }
  }
}

export default new WalrusStorageService();