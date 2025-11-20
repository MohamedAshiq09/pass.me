import { TransactionBlock } from '@mysten/sui.js/transactions';
import suiService from './client';
import { config } from '../../config/env';
import logger from '../../utils/logger';

class ContractInteractionService {
  /**
   * Create vault transaction
   */
  public createVaultTransaction(walrusBlobId: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::vault::create_vault`,
      arguments: [
        tx.pure(Array.from(Buffer.from(walrusBlobId, 'utf-8'))),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Update vault transaction
   */
  public updateVaultTransaction(
    vaultId: string,
    vaultCapId: string,
    newWalrusBlobId: string
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::vault::update_vault`,
      arguments: [
        tx.object(vaultId),
        tx.object(vaultCapId),
        tx.pure(Array.from(Buffer.from(newWalrusBlobId, 'utf-8'))),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Create password entry transaction
   */
  public createPasswordEntryTransaction(
    vaultId: string,
    domainHash: string,
    passwordHash: string,
    deviceId: string
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::password_entry::create_entry`,
      arguments: [
        tx.pure(vaultId),
        tx.pure(Array.from(Buffer.from(domainHash, 'hex'))),
        tx.pure(Array.from(Buffer.from(passwordHash, 'hex'))),
        tx.pure(Array.from(Buffer.from(deviceId, 'utf-8'))),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Record password usage transaction
   */
  public recordUsageTransaction(
    entryId: string,
    deviceId: string
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::password_entry::record_usage`,
      arguments: [
        tx.object(entryId),
        tx.pure(Array.from(Buffer.from(deviceId, 'utf-8'))),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Lock vault transaction
   */
  public lockVaultTransaction(vaultId: string, vaultCapId: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::vault::lock_vault`,
      arguments: [
        tx.object(vaultId),
        tx.object(vaultCapId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Unlock vault transaction
   */
  public unlockVaultTransaction(vaultId: string, vaultCapId: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::vault::unlock_vault`,
      arguments: [
        tx.object(vaultId),
        tx.object(vaultCapId),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Register device transaction
   */
  public registerDeviceTransaction(
    registryId: string,
    deviceId: string,
    deviceName: string
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::access_control::register_device`,
      arguments: [
        tx.object(registryId),
        tx.pure(Array.from(Buffer.from(deviceId, 'utf-8'))),
        tx.pure(Array.from(Buffer.from(deviceName, 'utf-8'))),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Revoke device transaction
   */
  public revokeDeviceTransaction(
    registryId: string,
    deviceId: string
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::access_control::revoke_device`,
      arguments: [
        tx.object(registryId),
        tx.pure(Array.from(Buffer.from(deviceId, 'utf-8'))),
        tx.object('0x6'), // Clock object
      ],
    });

    return tx;
  }

  /**
   * Emit login attempt event
   */
  public emitLoginAttemptTransaction(
    vaultId: string,
    domainHash: string,
    deviceId: string,
    ipHash: string,
    timestamp: number,
    success: boolean
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::alert_system::emit_login_attempt`,
      arguments: [
        tx.pure(vaultId),
        tx.pure(Array.from(Buffer.from(domainHash, 'hex'))),
        tx.pure(Array.from(Buffer.from(deviceId, 'utf-8'))),
        tx.pure(Array.from(Buffer.from(ipHash, 'hex'))),
        tx.pure(timestamp),
        tx.pure(success),
      ],
    });

    return tx;
  }

  /**
   * Emit suspicious activity event
   */
  public emitSuspiciousActivityTransaction(
    vaultId: string,
    entryId: string,
    domainHash: string,
    deviceId: string,
    reason: string,
    timestamp: number,
    severity: number
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::alert_system::emit_suspicious_activity`,
      arguments: [
        tx.pure(vaultId),
        tx.pure(entryId),
        tx.pure(Array.from(Buffer.from(domainHash, 'hex'))),
        tx.pure(Array.from(Buffer.from(deviceId, 'utf-8'))),
        tx.pure(Array.from(Buffer.from(reason, 'utf-8'))),
        tx.pure(timestamp),
        tx.pure(severity),
      ],
    });

    return tx;
  }

  /**
   * Create device registry transaction
   */
  public createDeviceRegistryTransaction(vaultId: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${config.VAULT_PACKAGE_ID}::access_control::create_registry`,
      arguments: [
        tx.pure(vaultId),
      ],
    });

    return tx;
  }
}

export default new ContractInteractionService();