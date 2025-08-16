const express = require('express');
const cors = require('cors');
const { Connection, PublicKey, Transaction, SystemProgram, Keypair } = require('@solana/web3.js');
const bs58 = require('bs58');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: [
        'https://jetsubtc.github.io',
        'https://coinflip.doggogorb.xyz',
        'http://localhost:3000',
        'http://localhost:5000',
        'https://coinflip.jetsubtc.vercel.app'
    ],
    credentials: true
}));
app.use(express.json());

// Solana connection
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

// House wallet (you should load this from environment variables in production)
let HOUSE_WALLET_PRIVATE_KEY = process.env.HOUSE_WALLET_PRIVATE_KEY;

// If no environment variable, try to load from file
if (!HOUSE_WALLET_PRIVATE_KEY) {
    try {
        const walletData = JSON.parse(require('fs').readFileSync('.house-wallet.json', 'utf8'));
        HOUSE_WALLET_PRIVATE_KEY = walletData.privateKey;
        console.log('📁 Loaded house wallet from .house-wallet.json');
    } catch (error) {
        console.error('❌ No house wallet found. Please run: npm run setup');
        process.exit(1);
    }
}

const houseWallet = Keypair.fromSecretKey(bs58.decode(HOUSE_WALLET_PRIVATE_KEY));

console.log('🏠 House wallet public key:', houseWallet.publicKey.toString());

// Game state (in production, use a database)
let gameState = {
    totalGames: 0,
    totalVolume: 0,
    houseBalance: 0
};

// Endpoint to get house wallet public key
app.get('/api/house-wallet', (req, res) => {
    res.json({
        publicKey: houseWallet.publicKey.toString(),
        balance: gameState.houseBalance
    });
});

// Endpoint to process game result and payout
app.post('/api/process-game', async (req, res) => {
    try {
        const { userPublicKey, betAmount, choice } = req.body;
        
        // Generate the result on the backend to prevent frontend manipulation
        const result = Math.floor(Math.random() * 2);
        
        // Calculate win/loss on the backend
        const userWon = choice === result;
        
        console.log('🎲 Backend calculation:', {
            choice: choice,
            result: result,
            userWon: userWon,
            comparison: `${choice} === ${result} = ${userWon}`
        });
        
        console.log('🎲 Processing game:', {
            user: userPublicKey,
            betAmount,
            choice,
            result,
            userWon
        });

        if (userWon) {
            // User won - send payout from house wallet
            const winAmount = betAmount * 2;
            
            // Check house balance
            const houseBalance = await connection.getBalance(houseWallet.publicKey);
            if (houseBalance < winAmount) {
                return res.status(400).json({
                    error: 'Insufficient house balance',
                    houseBalance: houseBalance / 1e9,
                    required: winAmount / 1e9
                });
            }

            // Create payout transaction
            const transaction = new Transaction();
            
            const transferInstruction = SystemProgram.transfer({
                fromPubkey: houseWallet.publicKey,
                toPubkey: new PublicKey(userPublicKey),
                lamports: winAmount * 1e9 // Convert SOL to lamports
            });
            
            transaction.add(transferInstruction);
            
            // Get recent blockhash
            const { blockhash } = await connection.getLatestBlockhash();
            transaction.recentBlockhash = blockhash;
            transaction.feePayer = houseWallet.publicKey;
            
            // Sign and send transaction
            const signature = await connection.sendTransaction(transaction, [houseWallet]);
            
            // Wait for confirmation
            await connection.confirmTransaction(signature, 'confirmed');
            
            console.log('💰 Payout sent:', {
                user: userPublicKey,
                amount: winAmount,
                signature
            });
            
            // Update game state
            gameState.totalGames++;
            gameState.totalVolume += betAmount;
            gameState.houseBalance -= betAmount; // House loses the bet amount
            
            res.json({
                success: true,
                payout: winAmount,
                signature,
                result: result, // Send the result back to frontend
                message: `🎉 Payout of ${winAmount} SOL sent to ${userPublicKey.slice(0, 8)}...`
            });
            
        } else {
            // User lost - house keeps the bet
            gameState.totalGames++;
            gameState.totalVolume += betAmount;
            gameState.houseBalance += betAmount; // House gains the bet amount
            
            console.log('😔 User lost, house keeps bet:', betAmount);
            
            res.json({
                success: true,
                payout: 0,
                result: result, // Send the result back to frontend
                message: '😔 Better luck next time!'
            });
        }
        
    } catch (error) {
        console.error('❌ Error processing game:', error);
        res.status(500).json({
            error: 'Failed to process game',
            details: error.message
        });
    }
});

// Endpoint to get game statistics
app.get('/api/stats', (req, res) => {
    res.json(gameState);
});

// Endpoint to fund house wallet (for testing)
app.post('/api/fund-house', async (req, res) => {
    try {
        const { amount } = req.body;
        const lamports = amount * 1e9;
        
        // Create funding transaction
        const transaction = new Transaction();
        
        const transferInstruction = SystemProgram.transfer({
            fromPubkey: houseWallet.publicKey,
            toPubkey: houseWallet.publicKey, // Self-transfer to add funds
            lamports: lamports
        });
        
        transaction.add(transferInstruction);
        
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = houseWallet.publicKey;
        
        // Sign and send transaction
        const signature = await connection.sendTransaction(transaction, [houseWallet]);
        
        // Wait for confirmation
        await connection.confirmTransaction(signature, 'confirmed');
        
        gameState.houseBalance += amount;
        
        res.json({
            success: true,
            amount,
            signature,
            newBalance: gameState.houseBalance
        });
        
    } catch (error) {
        console.error('❌ Error funding house:', error);
        res.status(500).json({
            error: 'Failed to fund house wallet',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        houseWallet: houseWallet.publicKey.toString(),
        gameState
    });
});

// Root endpoint for Koyeb health check
app.get('/', (req, res) => {
    res.json({
        status: 'Doggo Coin Flip Backend is running!',
        houseWallet: houseWallet.publicKey.toString(),
        endpoints: {
            health: '/api/health',
            houseWallet: '/api/house-wallet',
            processGame: '/api/process-game',
            stats: '/api/stats'
        }
    });
});

app.listen(PORT, () => {
    console.log(`🏠 House server running on port ${PORT}`);
    console.log(`🏠 House wallet: ${houseWallet.publicKey.toString()}`);
    console.log(`🌐 API endpoints:`);
    console.log(`   GET  /api/house-wallet - Get house wallet info`);
    console.log(`   POST /api/process-game - Process game result and payout`);
    console.log(`   GET  /api/stats - Get game statistics`);
    console.log(`   POST /api/fund-house - Fund house wallet (testing)`);
    console.log(`   GET  /api/health - Health check`);
});
