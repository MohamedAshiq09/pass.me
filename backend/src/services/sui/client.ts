import { SuiClient } from '@mysten/sui.js/client';
import { createSuiClient } from '../../config/sui.config';
import logger from '../../utils/logger';

class SuiService {
  private client: SuiClient;
  private static instance: SuiService;

  private constructor() {
    this.client = createSuiClient();
    logger.info('Sui client initialized');
  }

  public static getInstance(): SuiService {
    if (!SuiService.instance) {
      SuiService.instance = new SuiService();
    }
    return SuiService.instance;
  }

  public getClient(): SuiClient {
    return this.client;
  }

  /**
   * Get vault object by ID
   */
  public async getVault(vaultId: string) {
    try {
      const object = await this.client.getObject({
        id: vaultId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (object.data?.content?.dataType === 'moveObject') {
        return object.data.content.fields;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching vault:', error);
      throw error;
    }
  }

  /**
   * Get password entry by ID
   */
  public async getPasswordEntry(entryId: string) {
    try {
      const object = await this.client.getObject({
        id: entryId,
        options: {
          showContent: true,
          showOwner: true,
        },
      });

      if (object.data?.content?.dataType === 'moveObject') {
        return object.data.content.fields;
      }
      return null;
    } catch (error) {
      logger.error('Error fetching password entry:', error);
      throw error;
    }
  }

  /**
   * Get all vaults owned by an address
   */
  public async getVaultsByOwner(owner: string) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner,
        filter: {
          StructType: `${process.env.VAULT_PACKAGE_ID}::vault::Vault`,
        },
        options: {
          showContent: true,
        },
      });

      return objects.data;
    } catch (error) {
      logger.error('Error fetching vaults by owner:', error);
      throw error;
    }
  }

  /**
   * Get password entries for a vault
   */
  public async getPasswordEntriesByVault(vaultId: string) {
    try {
      // Query for password entries with matching vault_id
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${process.env.VAULT_PACKAGE_ID}::password_entry::PasswordEntryCreated`,
        },
        limit: 100,
        order: 'descending',
      });

      const entries = [];
      for (const event of events.data) {
        const parsedJson = event.parsedJson as any;
        if (parsedJson?.vault_id === vaultId) {
          const entryId = parsedJson?.entry_id;
          if (entryId) {
            const entry = await this.getPasswordEntry(entryId);
            if (entry) {
              entries.push({ id: entryId, ...entry });
            }
          }
        }
      }

      return entries;
    } catch (error) {
      logger.error('Error fetching password entries by vault:', error);
      throw error;
    }
  }

  /**
   * Get transaction details
   */
  public async getTransaction(digest: string) {
    try {
      return await this.client.getTransactionBlock({
        digest,
        options: {
          showEffects: true,
          showEvents: true,
          showInput: true,
          showObjectChanges: true,
        },
      });
    } catch (error) {
      logger.error('Error fetching transaction:', error);
      throw error;
    }
  }

  /**
   * Check if client is healthy
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.client.getLatestSuiSystemState();
      return true;
    } catch (error) {
      logger.error('Sui health check failed:', error);
      return false;
    }
  }

  /**
   * Get latest checkpoint
   */
  public async getLatestCheckpoint() {
    try {
      return await this.client.getLatestCheckpointSequenceNumber();
    } catch (error) {
      logger.error('Error getting latest checkpoint:', error);
      throw error;
    }
  }

  /**
   * Query events by type
   */
  public async queryEventsByType(eventType: string, limit: number = 50) {
    try {
      return await this.client.queryEvents({
        query: {
          MoveEventType: eventType,
        },
        limit,
        order: 'descending',
      });
    } catch (error) {
      logger.error('Error querying events:', error);
      throw error;
    }
  }
}

export default SuiService.getInstance();