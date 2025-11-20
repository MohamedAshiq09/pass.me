import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';

// Configuration
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const PACKAGE_ID = process.env.VAULT_PACKAGE_ID;

if (!PRIVATE_KEY || !PACKAGE_ID) {
    console.error('❌ ADMIN_PRIVATE_KEY and VAULT_PACKAGE_ID environment variables are required');
    process.exit(1);
}

async function initializeContracts() {
    console.log('🔧 Initializing contracts...');
    
    // Initialize client and keypair
    const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`📍 Initializing from address: ${address}`);
    console.log(`📦 Package ID: ${PACKAGE_ID}`);
    
    try {
        // Create a test vault to verify deployment
        const tx = new TransactionBlock();
        
        // Get current timestamp
        const clock = tx.sharedObjectRef({
            objectId: '0x6',
            initialSharedVersion: 1,
            mutable: false,
        });
        
        // Create test vault
        tx.moveCall({
            target: `${PACKAGE_ID}::vault::create_vault`,
            arguments: [
                tx.pure('test_initialization_blob'),
                clock,
            ],
        });
        
        // Execute transaction
        console.log('🧪 Creating test vault...');
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
        
        console.log('✅ Initialization successful!');
        console.log(`📋 Transaction: ${result.digest}`);
        
        // Extract created objects
        const createdObjects = result.objectChanges?.filter(
            (change) => change.type === 'created'
        );
        
        if (createdObjects && createdObjects.length > 0) {
            console.log('\n📦 Created objects:');
            createdObjects.forEach((obj, index) => {
                if ('objectId' in obj) {
                    console.log(`${index + 1}. ${obj.objectType}: ${obj.objectId}`);
                }
            });
        }
        
        console.log('\n🎯 Contracts are ready!');
        console.log('Next steps:');
        console.log('1. Build the frontend with zkLogin integration');
        console.log('2. Set up the backend event listener');
        console.log('3. Create the browser extension');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
}

// Run initialization
initializeContracts().catch(console.error);