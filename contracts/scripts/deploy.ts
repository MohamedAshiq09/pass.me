import { getFullnodeUrl, SuiClient } from '@mysten/sui.js/client';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { fromB64 } from '@mysten/sui.js/utils';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const NETWORK = process.env.SUI_NETWORK || 'testnet';
const PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

if (!PRIVATE_KEY) {
    console.error('❌ ADMIN_PRIVATE_KEY environment variable is required');
    process.exit(1);
}

async function deployContracts() {
    console.log('🚀 Starting contract deployment...');
    
    // Initialize client and keypair
    const client = new SuiClient({ url: getFullnodeUrl(NETWORK) });
    const keypair = Ed25519Keypair.fromSecretKey(fromB64(PRIVATE_KEY));
    const address = keypair.getPublicKey().toSuiAddress();
    
    console.log(`📍 Deploying from address: ${address}`);
    console.log(`🌐 Network: ${NETWORK}`);
    
    try {
        // Check balance
        const balance = await client.getBalance({ owner: address });
        console.log(`💰 Balance: ${balance.totalBalance} MIST`);
        
        if (parseInt(balance.totalBalance) < 100000000) { // 0.1 SUI
            console.error('❌ Insufficient balance for deployment');
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
        
        // Publish package
        const [upgradeCap] = tx.publish({
            modules: getModules(contractsPath),
            dependencies: getDependencies(contractsPath),
        });
        
        // Transfer upgrade capability to deployer
        tx.transferObjects([upgradeCap], address);
        
        // Execute transaction
        console.log('📦 Publishing contracts...');
        const result = await client.signAndExecuteTransactionBlock({
            signer: keypair,
            transactionBlock: tx,
            options: {
                showEffects: true,
                showObjectChanges: true,
            },
        });
        
        console.log('✅ Deployment successful!');
        console.log(`📋 Transaction: ${result.digest}`);
        
        // Extract package ID
        const packageId = result.objectChanges?.find(
            (change) => change.type === 'published'
        )?.packageId;
        
        if (packageId) {
            console.log(`📦 Package ID: ${packageId}`);
            
            // Save to .env file
            updateEnvFile(packageId);
            
            console.log('\n🎯 Next steps:');
            console.log('1. Update your .env file with the package ID');
            console.log('2. Run initialization script: npm run initialize');
            console.log('3. Start building the frontend!');
        }
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
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
    const buildInfoPath = path.join(contractsPath, 'BuildInfo.yaml');
    
    if (!fs.existsSync(buildInfoPath)) {
        return ['0x1', '0x2']; // Default Sui framework dependencies
    }
    
    // Parse dependencies from BuildInfo.yaml
    // This is a simplified version - you might want to use a YAML parser
    return ['0x1', '0x2'];
}

function updateEnvFile(packageId: string) {
    const envPath = path.join(__dirname, '../../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
        envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    // Update or add package ID
    const lines = envContent.split('\n');
    let updated = false;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('VAULT_PACKAGE_ID=')) {
            lines[i] = `VAULT_PACKAGE_ID=${packageId}`;
            updated = true;
        }
        if (lines[i].startsWith('NEXT_PUBLIC_VAULT_PACKAGE_ID=')) {
            lines[i] = `NEXT_PUBLIC_VAULT_PACKAGE_ID=${packageId}`;
        }
    }
    
    if (!updated) {
        lines.push(`VAULT_PACKAGE_ID=${packageId}`);
        lines.push(`NEXT_PUBLIC_VAULT_PACKAGE_ID=${packageId}`);
    }
    
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log('📝 Updated .env file with package ID');
}

// Run deployment
deployContracts().catch(console.error);