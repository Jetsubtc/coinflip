const { Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');
const fs = require('fs');

console.log('🏠 Doggo Coin Flip Setup');
console.log('========================');

// Generate a new house wallet if it doesn't exist
const HOUSE_WALLET_FILE = '.house-wallet.json';

if (!fs.existsSync(HOUSE_WALLET_FILE)) {
    console.log('🔑 Generating new house wallet...');
    const houseWallet = Keypair.generate();
    
    const walletData = {
        publicKey: houseWallet.publicKey.toString(),
        privateKey: bs58.encode(houseWallet.secretKey),
        createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(HOUSE_WALLET_FILE, JSON.stringify(walletData, null, 2));
    
    console.log('✅ House wallet generated and saved to .house-wallet.json');
    console.log('🏠 House wallet public key:', walletData.publicKey);
    console.log('🔐 Private key saved to .house-wallet.json');
    
} else {
    console.log('📁 House wallet already exists');
    const walletData = JSON.parse(fs.readFileSync(HOUSE_WALLET_FILE, 'utf8'));
    console.log('🏠 House wallet public key:', walletData.publicKey);
}

console.log('\n📋 Setup Instructions:');
console.log('1. Fund your house wallet with SOL (at least 10 SOL for testing)');
console.log('2. Set the environment variable:');
console.log('   export HOUSE_WALLET_PRIVATE_KEY="your_private_key_from_house_wallet.json"');
console.log('3. Start the server: npm run server');
console.log('4. Start the frontend: npm run dev');
console.log('5. Open http://localhost:3000 and start playing!');

console.log('\n💰 To fund your house wallet:');
console.log('1. Copy the public key above');
console.log('2. Go to Solana Devnet Faucet');
console.log('3. Request SOL for the house wallet');
console.log('4. Or transfer SOL from your main wallet');

console.log('\n🚀 Quick start:');
console.log('npm install');
console.log('export HOUSE_WALLET_PRIVATE_KEY="$(node -e "console.log(JSON.parse(require(\'fs\').readFileSync(\'.house-wallet.json\')).privateKey)")"');
console.log('npm start');
