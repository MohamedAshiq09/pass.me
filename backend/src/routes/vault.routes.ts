import { Router } from 'express';
import vaultController from '../controllers/vault.controller';
import { strictLimiter } from '../middleware/rateLimiter';

const router = Router();

// Create vault
router.post('/', strictLimiter, vaultController.createVault);

// Get vault by ID
router.get('/:vaultId', vaultController.getVault);

// Get vaults by owner
router.get('/owner/:owner', vaultController.getVaultsByOwner);

// Update vault
router.put('/:vaultId', strictLimiter, vaultController.updateVault);

// Lock vault
router.post('/:vaultId/lock', strictLimiter, vaultController.lockVault);

// Unlock vault
router.post('/:vaultId/unlock', strictLimiter, vaultController.unlockVault);

// Get vault data from Walrus
router.get('/:vaultId/data', vaultController.getVaultData);

// Store vault data on Walrus
router.post('/data/store', strictLimiter, vaultController.storeVaultData);

// Get password entries for vault
router.get('/:vaultId/entries', vaultController.getPasswordEntries);

export default router;