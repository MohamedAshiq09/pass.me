import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const PACKAGE_ID = process.env.VAULT_PACKAGE_ID;
const UPGRADE_CAP_ID = process.env.UPGRADE_CAP_ID; // You'll need to set this after deployment

if (!PRIVATE_KEY || !PACKAGE_ID || !UPGRADE_CAP_ID) {
    console.error('❌ ADMIN_PRIVATE_KEY, VAULT_PACKAGE_ID, and UPGRADE_CAP_ID environment variables are required');
    process.exit(1);
}

async function upgradeContracts() {
    console.log('🔄 Starting contract upgrade...');
    
    // Initialize client and keypair
    const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`📍 Upgrading from address: ${address}`);
    console.log(`📦 Package ID: ${PACKAGE_ID}`);
    console.log(`🔑 Upgrade Cap ID: ${UPGRADE_CAP_ID}`);
    
    try {
        // Check if upgrade cap exists
        const upgradeCap = await client.getObject({
            id: UPGRADE_CAP_ID,
            options: { showContent: true, showOwner: true }
        });
        
        if (!upgradeCap.data) {
            console.error('❌ Upgrade capability not found');
            process.exit(1);
        }
        
        // Read compiled modules
        const contractsPath = path.join(__dirname, '../build/pass_me');
        
        if (!fs.existsSync(contractsPath)) {
            console.error('❌ Contracts not built. Run "sui move build" first');
            process.exit(1);
        }
        
        // Create transaction block
        const tx = new TransactionBlock();
        
        // Authorize upgrade
        const ticket = tx.moveCall({
            target: '0x2::package::authorize_upgrade',
            arguments: [
                tx.object(UPGRADE_CAP_ID),
                tx.pure(1), // Policy (0 = compatible, 1 = additive, 2 = dep_only)
                tx.pure(Array.from(getPackageDigest(contractsPath))),
            ],
        });
        
        // Commit upgrade
        const receipt = tx.upgrade({
            modules: getModules(contractsPath),
            dependencies: getDependencies(contractsPath),
            packageId: PACKAGE_ID,
            ticket,
        });
        
        // Commit the upgrade
        tx.moveCall({
            target: '0x2::package::commit_upgrade',
            arguments: [tx.object(UPGRADE_CAP_ID), receipt],
        });
        
        // Execute transaction
        console.log('📦 Upgrading contracts...');
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
        
        console.log('✅ Upgrade successful!');
        console.log(`📋 Transaction: ${result.digest}`);
        
        console.log('\n🎯 Contracts upgraded successfully!');
        console.log('The new version is now live on the network.');
        
    } catch (error) {
        console.error('❌ Upgrade failed:', error);
        process.exit(1);
    }
}

function getModules(contractsPath: string): number[][] {
    const modulesPath = path.join(contractsPath, 'bytecode_modules');
    const modules: number[][] = [];
    
    const files = fs.readdirSync(modulesPath);
    for (const file of files) {
        if (file.endsWith('.mv')) {
            const moduleBytes = fs.readFileSync(path.join(modulesPath, file));
            modules.push(Array.from(moduleBytes));
        }
    }
    
    return modules;
}

function getDependencies(contractsPath: string): string[] {
    // Parse dependencies from BuildInfo.yaml
    return ['0x1', '0x2'];
}

function getPackageDigest(contractsPath: string): Uint8Array {
    // This should return the package digest
    // For now, return a placeholder - you'll need to implement proper digest calculation
    return new Uint8Array(32);
}

// Run upgrade
upgradeContracts().catch(console.error);