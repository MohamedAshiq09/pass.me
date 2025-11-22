// Test Walrus endpoints to find which one works
const axios = require('axios');

const endpoints = [
    'https://publisher.walrus-testnet.walrus.space',
    'https://publisher-devnet.walrus.space',
    'https://walrus-testnet-publisher.nodes.guru',
    'https://wal-publisher-testnet.staketab.org',
    'https://walrus-testnet-publisher.bartestnet.com',
];

const testData = Buffer.from(JSON.stringify({ test: 'data', timestamp: Date.now() }));

async function testEndpoint(url) {
    console.log(`\n🧪 Testing: ${url}`);

    try {
        const fullUrl = `${url}/v1/store?epochs=1`;
        console.log(`   URL: ${fullUrl}`);

        const response = await axios.put(fullUrl, testData, {
            headers: {
                'Content-Type': 'application/octet-stream',
            },
            timeout: 10000,
        });

        console.log(`   ✅ SUCCESS! Status: ${response.status}`);
        console.log(`   Response:`, JSON.stringify(response.data, null, 2));

        // Extract blob ID
        if (response.data?.newlyCreated?.blobObject?.blobId) {
            const blobId = response.data.newlyCreated.blobObject.blobId;
            console.log(`   📦 Blob ID: ${blobId}`);
            return { url, success: true, blobId };
        } else if (response.data?.alreadyCertified?.blobId) {
            const blobId = response.data.alreadyCertified.blobId;
            console.log(`   📦 Blob ID (already exists): ${blobId}`);
            return { url, success: true, blobId };
        }

        return { url, success: true, data: response.data };
    } catch (error) {
        console.log(`   ❌ FAILED: ${error.message}`);
        if (error.response) {
            console.log(`   Status: ${error.response.status}`);
            console.log(`   Data: ${JSON.stringify(error.response.data)}`);
        }
        return { url, success: false, error: error.message };
    }
}

async function testAllEndpoints() {
    console.log('🔍 Testing Walrus Publisher Endpoints...\n');
    console.log('='.repeat(60));

    const results = [];

    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        results.push(result);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📊 RESULTS SUMMARY:\n');

    const working = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    if (working.length > 0) {
        console.log('✅ WORKING ENDPOINTS:');
        working.forEach(r => {
            console.log(`   - ${r.url}`);
            if (r.blobId) console.log(`     Blob ID: ${r.blobId}`);
        });
    }

    if (failed.length > 0) {
        console.log('\n❌ FAILED ENDPOINTS:');
        failed.forEach(r => {
            console.log(`   - ${r.url}`);
            console.log(`     Error: ${r.error}`);
        });
    }

    if (working.length > 0) {
        console.log('\n🎯 RECOMMENDED ENDPOINT:');
        console.log(`   ${working[0].url}`);
        console.log('\n💡 Update your backend config to use this URL!');
    } else {
        console.log('\n⚠️  No working endpoints found!');
        console.log('   Walrus testnet might be down or endpoints have changed.');
        console.log('   Check: https://docs.walrus.site for latest endpoints');
    }
}

testAllEndpoints().catch(console.error);
