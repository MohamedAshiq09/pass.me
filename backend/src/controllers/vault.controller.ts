import { Request, Response } from 'express';
import suiService from '../services/sui/client';
import contractInteraction from '../services/sui/contractInteraction';
import walrusStorage from '../services/walrus/storage';
import walrusRetrieval from '../services/walrus/retrieval';
import { ApiResponse } from '../types/api';
import { validate, schemas } from '../utils/validators';
import logger from '../utils/logger';

class VaultController {
  /**
   * Create a new vault
   */
  public async createVault(req: Request, res: Response) {
    try {
      const { walrus_blob_id } = validate(schemas.createVault, req.body);

      // Create transaction
      const tx = contractInteraction.createVaultTransaction(walrus_blob_id);

      logger.info('Creating vault', {
        walrusBlobId: walrus_blob_id,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          transaction: tx.serialize(),
          message: 'Vault creation transaction prepared. Sign and execute on client.',
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error creating vault:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to create vault',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get vault by ID
   */
  public async getVault(req: Request, res: Response) {
    try {
      const { vaultId } = req.params;

      const vault = await suiService.getVault(vaultId);

      if (!vault) {
        return res.status(404).json({
          success: false,
          error: 'Vault not found',
        });
      }

      const response: ApiResponse = {
        success: true,
        data: vault,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting vault:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get vault',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get vaults by owner
   */
  public async getVaultsByOwner(req: Request, res: Response) {
    try {
      const { owner } = req.params;

      const vaults = await suiService.getVaultsByOwner(owner);

      const response: ApiResponse = {
        success: true,
        data: vaults,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting vaults by owner:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get vaults',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update vault
   */
  public async updateVault(req: Request, res: Response) {
    try {
      const { vault_id, walrus_blob_id } = validate(schemas.updateVault, req.body);
      const { vaultCapId } = req.body; // Vault capability ID

      if (!vaultCapId) {
        return res.status(400).json({
          success: false,
          error: 'Vault capability ID is required',
        });
      }

      // Create transaction
      const tx = contractInteraction.updateVaultTransaction(
        vault_id,
        vaultCapId,
        walrus_blob_id
      );

      logger.info('Updating vault', {
        vaultId: vault_id,
        walrusBlobId: walrus_blob_id,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          transaction: tx.serialize(),
          message: 'Vault update transaction prepared. Sign and execute on client.',
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error updating vault:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to update vault',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Lock vault
   */
  public async lockVault(req: Request, res: Response) {
    try {
      const { vaultId } = req.params;
      const { vaultCapId } = req.body;

      if (!vaultCapId) {
        return res.status(400).json({
          success: false,
          error: 'Vault capability ID is required',
        });
      }

      // Create transaction
      const tx = contractInteraction.lockVaultTransaction(vaultId, vaultCapId);

      logger.info('Locking vault', { vaultId });

      const response: ApiResponse = {
        success: true,
        data: {
          transaction: tx.serialize(),
          message: 'Vault lock transaction prepared. Sign and execute on client.',
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error locking vault:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to lock vault',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Unlock vault
   */
  public async unlockVault(req: Request, res: Response) {
    try {
      const { vaultId } = req.params;
      const { vaultCapId } = req.body;

      if (!vaultCapId) {
        return res.status(400).json({
          success: false,
          error: 'Vault capability ID is required',
        });
      }

      // Create transaction
      const tx = contractInteraction.unlockVaultTransaction(vaultId, vaultCapId);

      logger.info('Unlocking vault', { vaultId });

      const response: ApiResponse = {
        success: true,
        data: {
          transaction: tx.serialize(),
          message: 'Vault unlock transaction prepared. Sign and execute on client.',
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error unlocking vault:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to unlock vault',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get vault data from Walrus
   */
  public async getVaultData(req: Request, res: Response) {
    try {
      const { vaultId } = req.params;

      // Get vault from Sui
      const vault = await suiService.getVault(vaultId);
      if (!vault) {
        return res.status(404).json({
          success: false,
          error: 'Vault not found',
        });
      }

      // Retrieve data from Walrus
      const walrusBlobId = (vault as any).walrus_blob_id;
      if (!walrusBlobId) {
        return res.status(400).json({
          success: false,
          error: 'Vault does not have Walrus blob ID',
        });
      }
      const vaultData = await walrusRetrieval.retrieveVaultData(walrusBlobId);

      const response: ApiResponse = {
        success: true,
        data: vaultData,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting vault data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get vault data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Store vault data on Walrus
   */
  public async storeVaultData(req: Request, res: Response) {
    try {
      const { vaultData } = req.body;

      if (!vaultData) {
        return res.status(400).json({
          success: false,
          error: 'Vault data is required',
        });
      }

      // Store on Walrus
      const blobId = await walrusStorage.storeVaultData(vaultData);

      logger.info('Vault data stored on Walrus', {
        blobId,
        entriesCount: vaultData.entries?.length || 0,
      });

      const response: ApiResponse = {
        success: true,
        data: {
          blobId,
          message: 'Vault data stored successfully on Walrus',
        },
      };

      res.json(response);
    } catch (error) {
      logger.error('Error storing vault data:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to store vault data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get password entries for a vault
   */
  public async getPasswordEntries(req: Request, res: Response) {
    try {
      const { vaultId } = req.params;

      const entries = await suiService.getPasswordEntriesByVault(vaultId);

      const response: ApiResponse = {
        success: true,
        data: entries,
      };

      res.json(response);
    } catch (error) {
      logger.error('Error getting password entries:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get password entries',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new VaultController();