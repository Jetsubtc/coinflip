// Solana Web3 Integration for Doggo Coin Flip
// Using CDN imports for better compatibility

// Game Configuration
const GAME_CONFIG = {
    NETWORK: 'devnet',
    MIN_BET: 0.1,
    MAX_BET: 1,
    BET_OPTIONS: [0.1, 0.2, 0.5, 1],
    HOUSE_SERVER: 'https://mute-caprice-jetsu-954fe388.koyeb.app', // Backend server URL - Keep this for now
    SOL_DECIMALS: 9, // 1 SOL = 1,000,000,000 lamports
    DEMO_MODE: false // Real transactions with backend payouts
};

// Wallet Configuration
const WALLET_CONFIG = {
    wallets: [
        { name: 'Phantom', icon: '👻', adapter: 'phantom' },
        { name: 'Solflare', icon: '🔥', adapter: 'solflare' },
        { name: 'Backpack', icon: '🎒', adapter: 'backpack' },
        { name: 'Slope', icon: '📱', adapter: 'slope' },
        { name: 'Glow', icon: '✨', adapter: 'glow' },
        { name: 'Coinbase Wallet', icon: '🪙', adapter: 'coinbase' },
        { name: 'Brave Wallet', icon: '🦁', adapter: 'brave' },
        { name: 'Exodus', icon: '📱', adapter: 'exodus' }
    ]
};

// Global Variables
let connection;
let wallet;
let userPublicKey;
let currentBalance = 0;
let isConnected = false;
let isFlipping = false;
let selectedBetAmount = null;
let selectedChoice = null;

// Initialize Solana Connection
function initializeSolana() {
    try {
        // Use the global solanaWeb3 object from CDN
        if (typeof solanaWeb3 === 'undefined') {
            console.error('❌ Solana Web3.js not loaded');
            return false;
        }
        
        connection = new solanaWeb3.Connection(solanaWeb3.clusterApiUrl(GAME_CONFIG.NETWORK), 'confirmed');
        console.log('✅ Solana connection established:', GAME_CONFIG.NETWORK);
        
        // Check for existing wallet connections
        checkExistingWalletConnection();
        
        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Solana connection:', error);
        return false;
    }
}

// Check for existing wallet connection
function checkExistingWalletConnection() {
    console.log('🔍 Checking for existing wallet connections...');
    
    // Check all supported wallets
    const wallets = [
        { name: 'phantom', provider: window.solana },
        { name: 'solflare', provider: window.solflare },
        { name: 'backpack', provider: window.backpack },
        { name: 'slope', provider: window.slope },
        { name: 'glow', provider: window.glow },
        { name: 'coinbase', provider: window.coinbaseSolana },
        { name: 'brave', provider: window.braveSolana },
        { name: 'exodus', provider: window.exodus }
    ];
    
    for (const wallet of wallets) {
        if (wallet.provider && wallet.provider.isConnected) {
            console.log(`✅ Found existing connection to ${wallet.name}`);
            wallet = wallet.provider;
            userPublicKey = new solanaWeb3.PublicKey(wallet.provider.publicKey.toString());
            isConnected = true;
            updateWalletUI();
            updateBalance();
            showMessage(`Connected to ${getWalletName(wallet.name)}`, 'success');
            return;
        }
    }
    
    console.log('ℹ️ No existing wallet connections found');
}

// Show Wallet Selection Modal
function showWalletSelection() {
    // Check which wallets are available
    const availableWallets = WALLET_CONFIG.wallets.filter(wallet => {
        switch (wallet.adapter) {
            case 'phantom':
                return window.solana && window.solana.isPhantom;
            case 'solflare':
                return window.solflare;
            case 'backpack':
                return window.backpack;
            case 'slope':
                return window.slope;
            case 'glow':
                return window.glow;
            case 'coinbase':
                return window.coinbaseSolana;
            case 'brave':
                return window.braveSolana;
            case 'exodus':
                return window.exodus;
            default:
                return false;
        }
    });
    
    console.log('Available wallets:', availableWallets.map(w => w.name));
    
    const modal = document.createElement('div');
    modal.className = 'wallet-modal';
    modal.innerHTML = `
        <div class="wallet-modal-content">
            <div class="wallet-modal-header">
                <h3>Connect Wallet</h3>
                <button class="wallet-modal-close" onclick="closeWalletModal()">×</button>
            </div>
            <div class="wallet-modal-body">
                <p>Choose your Solana wallet to connect:</p>
                <div class="wallet-list">
                    ${availableWallets.map(wallet => `
                        <button class="wallet-option" data-wallet="${wallet.adapter}" onclick="handleWalletClick('${wallet.adapter}')">
                            <span class="wallet-icon">${wallet.icon}</span>
                            <span class="wallet-name">${wallet.name}</span>
                        </button>
                    `).join('')}
                    ${availableWallets.length === 0 ? `
                        <div class="no-wallets-message">
                            <p>No Solana wallets detected. Please install a wallet extension:</p>
                            <div class="wallet-install-links">
                                <a href="https://phantom.app/" target="_blank" class="wallet-install-link">
                                    <span class="wallet-icon">👻</span>
                                    <span>Install Phantom</span>
                                </a>
                                <a href="https://solflare.com/" target="_blank" class="wallet-install-link">
                                    <span class="wallet-icon">🔥</span>
                                    <span>Install Solflare</span>
                                </a>
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeWalletModal();
        }
    });
    
    document.body.appendChild(modal);
}

// Handle wallet button click with loading state
async function handleWalletClick(walletType) {
    const button = document.querySelector(`[data-wallet="${walletType}"]`);
    if (!button || button.disabled) return;
    
    console.log(`🔄 Wallet button clicked: ${walletType}`);
    
    // Disable button and show loading
    button.disabled = true;
    button.innerHTML = `
        <span class="wallet-icon">⏳</span>
        <span class="wallet-name">Connecting...</span>
    `;
    
    try {
        const success = await connectSpecificWallet(walletType);
        if (!success) {
            // Re-enable button if connection failed
            button.disabled = false;
            button.innerHTML = `
                <span class="wallet-icon">${WALLET_CONFIG.wallets.find(w => w.adapter === walletType)?.icon || '❌'}</span>
                <span class="wallet-name">${getWalletName(walletType)}</span>
            `;
        } else {
            console.log(`✅ Successfully connected to ${walletType}`);
            // Keep button disabled on success - modal will close anyway
        }
    } catch (error) {
        console.error('Wallet connection error:', error);
        // Re-enable button on error
        button.disabled = false;
        button.innerHTML = `
            <span class="wallet-icon">${WALLET_CONFIG.wallets.find(w => w.adapter === walletType)?.icon || '❌'}</span>
            <span class="wallet-name">${getWalletName(walletType)}</span>
        `;
    }
}

// Close Wallet Modal
function closeWalletModal() {
    const modal = document.querySelector('.wallet-modal');
    if (modal) {
        modal.remove();
    }
}

// Connect Specific Wallet
async function connectSpecificWallet(walletType) {
    try {
        console.log('🔄 Attempting to connect wallet:', walletType);
        
        let walletProvider = null;
        
        switch (walletType) {
            case 'phantom':
                walletProvider = window.solana;
                break;
            case 'solflare':
                walletProvider = window.solflare;
                break;
            case 'backpack':
                walletProvider = window.backpack;
                break;
            case 'slope':
                walletProvider = window.slope;
                break;
            case 'glow':
                walletProvider = window.glow;
                break;
            case 'coinbase':
                walletProvider = window.coinbaseSolana;
                break;
            case 'brave':
                walletProvider = window.braveSolana;
                break;
            case 'exodus':
                walletProvider = window.exodus;
                break;
            default:
                throw new Error('Unsupported wallet type');
        }
        
        if (!walletProvider) {
            showMessage(`Please install ${getWalletName(walletType)} wallet`, 'error');
            return false;
        }
        
        // Check if already connected
        if (walletProvider.isConnected && walletProvider.publicKey) {
            console.log('✅ Wallet already connected, using existing connection');
            wallet = walletProvider;
            userPublicKey = new solanaWeb3.PublicKey(walletProvider.publicKey.toString());
        } else {
            console.log('🔄 Connecting to wallet...');
            const response = await walletProvider.connect();
            wallet = walletProvider;
            userPublicKey = new solanaWeb3.PublicKey(response.publicKey.toString());
        }
        
        console.log('✅ Wallet connected successfully:', userPublicKey.toString(), 'Type:', walletType);
        
        // Close modal first
        closeWalletModal();
        
        // Update UI immediately
        updateWalletUI();
        
        // Update balance
        await updateBalance();
        
        isConnected = true;
        
        // Show success message
        showConnectionSuccess(`Successfully connected to ${getWalletName(walletType)}!`);
        
        return true;
    } catch (error) {
        console.error('❌ Wallet connection failed:', error);
        
        // More specific error messages
        if (error.code === 4001) {
            showMessage('Connection was rejected by user', 'error');
        } else if (error.message.includes('User rejected')) {
            showMessage('Connection was cancelled', 'error');
        } else {
            showMessage(`Failed to connect ${getWalletName(walletType)} wallet: ${error.message}`, 'error');
        }
        
        return false;
    }
}

// Get Wallet Name
function getWalletName(walletType) {
    const wallet = WALLET_CONFIG.wallets.find(w => w.adapter === walletType);
    return wallet ? wallet.name : walletType;
}

// Wallet Connection - Always show modal for wallet selection
async function connectWallet() {
    console.log('🔄 Connect wallet button clicked');
    showWalletSelection();
}

// Disconnect Wallet
async function disconnectWallet() {
    try {
        if (wallet) {
            await wallet.disconnect();
        }
        
        wallet = null;
        userPublicKey = null;
        currentBalance = 0;
        isConnected = false;
        selectedBetAmount = null;
        selectedChoice = null;
        
        updateWalletUI();
        resetGameUI();
        console.log('✅ Wallet disconnected');
    } catch (error) {
        console.error('❌ Wallet disconnect failed:', error);
    }
}

// Update Balance
async function updateBalance() {
    try {
        if (!userPublicKey) return;
        
        const balance = await connection.getBalance(userPublicKey);
        currentBalance = balance / solanaWeb3.LAMPORTS_PER_SOL;
        
        updateBalanceUI();
        console.log('💰 Balance updated:', currentBalance, 'SOL');
        
        return currentBalance;
    } catch (error) {
        console.error('❌ Failed to update balance:', error);
        return 0;
    }
}

// Update Wallet UI
function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const balanceDisplay = document.getElementById('balanceDisplay');
    const walletAddress = document.getElementById('walletAddress');
    const demoIndicator = document.querySelector('.demo-mode-indicator');
    
    if (isConnected && userPublicKey) {
        connectBtn.textContent = 'Disconnect Wallet';
        connectBtn.onclick = disconnectWallet;
        
        const shortAddress = userPublicKey.toString().slice(0, 4) + '...' + userPublicKey.toString().slice(-4);
        walletAddress.textContent = shortAddress;
        balanceDisplay.style.display = 'block';
        
        // Show smart contract indicator
        if (demoIndicator) {
            demoIndicator.style.display = 'flex';
        }
        
        // Enable game interface
        enableGameInterface();
    } else {
        connectBtn.textContent = 'Connect Wallet';
        connectBtn.onclick = connectWallet;
        
        balanceDisplay.style.display = 'none';
        
        // Hide demo mode indicator
        if (demoIndicator) {
            demoIndicator.style.display = 'none';
        }
        
        // Disable game interface
        disableGameInterface();
    }
}

// Update Balance UI
function updateBalanceUI() {
    const balanceElement = document.getElementById('balanceAmount');
    if (balanceElement) {
        balanceElement.textContent = currentBalance.toFixed(4) + ' SOL';
    }
}

// Enable Game Interface
function enableGameInterface() {
    const flipBtn = document.getElementById('flipCoinBtn');
    if (flipBtn) {
        flipBtn.disabled = false;
    }
    
    // Enable bet options
    GAME_CONFIG.BET_OPTIONS.forEach(amount => {
        const betBtn = document.getElementById(`bet${amount}`);
        if (betBtn) {
            betBtn.disabled = false;
        }
    });
    
    // Enable coin selection
    const headsBtn = document.getElementById('heads-btn');
    const tailsBtn = document.getElementById('tails-btn');
    if (headsBtn) headsBtn.disabled = false;
    if (tailsBtn) tailsBtn.disabled = false;
}

// Disable Game Interface
function disableGameInterface() {
    const flipBtn = document.getElementById('flipCoinBtn');
    if (flipBtn) {
        flipBtn.disabled = true;
    }
    
    // Disable bet options
    GAME_CONFIG.BET_OPTIONS.forEach(amount => {
        const betBtn = document.getElementById(`bet${amount}`);
        if (betBtn) {
            betBtn.disabled = true;
            betBtn.classList.remove('selected');
        }
    });
    
    // Disable coin selection
    const headsBtn = document.getElementById('heads-btn');
    const tailsBtn = document.getElementById('tails-btn');
    if (headsBtn) {
        headsBtn.disabled = true;
        headsBtn.classList.remove('selected');
    }
    if (tailsBtn) {
        tailsBtn.disabled = true;
        tailsBtn.classList.remove('selected');
    }
}

// Reset Game UI
function resetGameUI() {
    selectedBetAmount = null;
    selectedChoice = null;
    
    // Reset bet options
    GAME_CONFIG.BET_OPTIONS.forEach(amount => {
        const betBtn = document.getElementById(`bet${amount}`);
        if (betBtn) {
            betBtn.classList.remove('selected');
        }
    });
    
    // Reset coin selection
    const headsBtn = document.getElementById('heads-btn');
    const tailsBtn = document.getElementById('tails-btn');
    if (headsBtn) headsBtn.classList.remove('selected');
    if (tailsBtn) tailsBtn.classList.remove('selected');
}

// Show Message
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

// Handle Bet Selection
function selectBet(amount) {
    if (!isConnected) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }
    
    if (amount > currentBalance) {
        showMessage('Insufficient balance', 'error');
        return;
    }
    
    // Update UI to show selected bet
    document.querySelectorAll('.bet-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    
    // Store selected bet
    selectedBetAmount = amount;
    
    console.log('🎯 Bet selected:', amount, 'SOL');
    
    // Reset coin to default state for new game
    resetCoin();
    
    // Enable flip button if choice is also selected
    updateFlipButtonState();
}

// Handle Coin Selection
function selectCoin(choice) {
    if (!isConnected) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }
    
    // Update UI to show selected choice
    document.querySelectorAll('.coin-option').forEach(btn => {
        btn.classList.remove('selected');
    });
    
    event.target.classList.add('selected');
    
    // Store selected choice
    selectedChoice = choice;
    
    console.log('🪙 Choice selected:', choice);
    
    // Reset coin to default state for new game
    resetCoin();
    
    // Enable flip button if bet is also selected
    updateFlipButtonState();
}

// Update Flip Button State
function updateFlipButtonState() {
    const flipBtn = document.getElementById('flipCoinBtn');
    if (flipBtn) {
        flipBtn.disabled = !(selectedBetAmount && selectedChoice);
    }
}

// Anchor IDL for the Doggo Coin Flip program
const DOGGO_COINFLIP_IDL = {
    "version": "0.1.0",
    "name": "coinflip",
    "instructions": [
        {
            "name": "initialize",
            "accounts": [
                {
                    "name": "gameState",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "authority",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        },
        {
            "name": "flipCoin",
            "accounts": [
                {
                    "name": "gameState",
                    "isMut": true,
                    "isSigner": false
                },
                {
                    "name": "user",
                    "isMut": true,
                    "isSigner": true
                },
                {
                    "name": "systemProgram",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": [
                {
                    "name": "betAmount",
                    "type": "u64"
                },
                {
                    "name": "choice",
                    "type": "u8"
                }
            ]
        },
        {
            "name": "getUserBalance",
            "accounts": [
                {
                    "name": "user",
                    "isMut": false,
                    "isSigner": false
                }
            ],
            "args": []
        }
    ],
    "accounts": [
        {
            "name": "GameState",
            "type": {
                "kind": "struct",
                "fields": [
                    {
                        "name": "authority",
                        "type": "publicKey"
                    },
                    {
                        "name": "totalGames",
                        "type": "u64"
                    },
                    {
                        "name": "totalVolume",
                        "type": "u64"
                    },
                    {
                        "name": "houseBalance",
                        "type": "u64"
                    }
                ]
            }
        }
    ],
    "errors": [
        {
            "code": 6000,
            "name": "InvalidBetAmount",
            "msg": "Invalid bet amount. Must be between 0.1-1 SOL"
        },
        {
            "code": 6001,
            "name": "InvalidChoice",
            "msg": "Invalid choice. Must be 0 (heads) or 1 (tails)"
        },
        {
            "code": 6002,
            "name": "InsufficientHouseBalance",
            "msg": "Insufficient house balance to pay winnings"
        }
    ]
};



// Get Game State PDA
function getGameStatePDA() {
    const programId = new solanaWeb3.PublicKey(GAME_CONFIG.PROGRAM_ID);
    return solanaWeb3.PublicKey.findProgramAddressSync(
        [Buffer.from("game_state")],
        programId
    );
}

// Convert SOL to lamports
function solToLamports(solAmount) {
    return solAmount * Math.pow(10, GAME_CONFIG.SOL_DECIMALS);
}

// Convert lamports to SOL
function lamportsToSol(lamports) {
    return lamports / Math.pow(10, GAME_CONFIG.SOL_DECIMALS);
}



// Flip Coin Function - FULLY SYNCHRONIZED WITH BLOCKCHAIN
async function flipCoin() {
    if (!isConnected) {
        showMessage('Please connect your wallet first', 'error');
        return;
    }
    
    if (!selectedBetAmount) {
        showMessage('Please select a bet amount', 'error');
        return;
    }
    
    if (!selectedChoice) {
        showMessage('Please select heads or tails', 'error');
        return;
    }
    
    if (selectedBetAmount > currentBalance) {
        showMessage('Insufficient balance', 'error');
        return;
    }
    
    if (isFlipping) {
        showMessage('Transaction in progress...', 'info');
        return;
    }
    
    isFlipping = true;
    showMessage('🔄 Starting blockchain transaction...', 'info');
    
    try {
        console.log('🎲 Starting FULLY SYNCHRONIZED coin flip...');
        
        // Step 1: User sends bet to house wallet
        const houseWalletResponse = await fetch(`${GAME_CONFIG.HOUSE_SERVER}/api/house-wallet`);
        const houseWalletData = await houseWalletResponse.json();
        const houseWallet = new solanaWeb3.PublicKey(houseWalletData.publicKey);
        
        // Create bet transaction
        const betTransaction = new solanaWeb3.Transaction();
        const betAmountLamports = solToLamports(selectedBetAmount);
        
        const transferInstruction = solanaWeb3.SystemProgram.transfer({
            fromPubkey: userPublicKey,
            toPubkey: houseWallet,
            lamports: betAmountLamports
        });
        
        betTransaction.add(transferInstruction);
        
        // Get recent blockhash
        const { blockhash } = await connection.getLatestBlockhash();
        betTransaction.recentBlockhash = blockhash;
        betTransaction.feePayer = userPublicKey;
        
        // Sign and send bet transaction
        const betSignature = await wallet.signAndSendTransaction(betTransaction);
        console.log('📤 Bet transaction sent:', betSignature);
        
        // Reset coin to default state before starting new game
        resetCoin();
        
        // Start coin flip animation immediately (spinning only - no result yet)
        triggerCoinFlipAnimation();
        
        // Show transaction in progress message
        showMessage('🔄 Transaction in progress... Waiting for blockchain confirmation', 'info');
        
        // Wait for bet transaction confirmation
        const betConfirmation = await connection.confirmTransaction(betSignature, 'confirmed');
        if (betConfirmation.value.err) {
            throw new Error('Bet transaction failed');
        }
        console.log('✅ Bet transaction confirmed');
        
        // Step 2: Prepare choice for backend (BLOCKCHAIN TRUTH)
        const choiceText = selectedChoice === 'heads' ? 'Heads' : 'Tails';
        const choiceValue = selectedChoice === 'heads' ? 0 : 1;
        
        console.log('🎲 Sending choice to backend (BLOCKCHAIN TRUTH):', {
            selectedChoice: selectedChoice,
            userChoice: choiceText,
            choiceValue: choiceValue
        });
        
        // Step 3: Get blockchain result from backend
        const gameResult = await fetch(`${GAME_CONFIG.HOUSE_SERVER}/api/process-game`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userPublicKey: userPublicKey.toString(),
                betAmount: selectedBetAmount,
                choice: choiceValue
            })
        });
        
        const payoutData = await gameResult.json();
        
        console.log('📊 BLOCKCHAIN RESPONSE:', payoutData);
        console.log('🔍 Payout amount:', payoutData.payout);
        console.log('🔍 Payout type:', typeof payoutData.payout);
        
        if (payoutData.success) {
            // Use the BLOCKCHAIN result as SINGLE SOURCE OF TRUTH
            const blockchainResult = payoutData.result;
            
            // Validate blockchain result
            if (blockchainResult === undefined || blockchainResult === null) {
                console.error('❌ BLOCKCHAIN returned invalid result:', payoutData);
                throw new Error('BLOCKCHAIN returned invalid result');
            }
            
            // Validate all required fields
            if (typeof blockchainResult !== 'number' || (blockchainResult !== 0 && blockchainResult !== 1)) {
                console.error('❌ BLOCKCHAIN returned invalid result type:', typeof blockchainResult, blockchainResult);
                throw new Error('BLOCKCHAIN returned invalid result type');
            }
            
            const blockchainResultText = blockchainResult === 0 ? 'Heads' : 'Tails';
            const blockchainWon = payoutData.payout > 0;
            
            console.log('🎯 BLOCKCHAIN TRUTH - Result and win/loss:', {
                blockchainResult: blockchainResult,
                blockchainResultText: blockchainResultText,
                payout: payoutData.payout,
                blockchainWon: blockchainWon,
                choice: choiceText
            });
            
            console.log(`🚨 FINAL BLOCKCHAIN TRUTH: blockchainWon = ${blockchainWon}. Blockchain result = ${blockchainResultText}. Choice = ${choiceText}`);
            
            // Show transaction success message based on BLOCKCHAIN TRUTH
            if (blockchainWon) {
                const winAmount = selectedBetAmount * 2;
                console.log('🎉 BLOCKCHAIN CONFIRMED WIN! Payout processed:', payoutData.message);
                showMessage(`🎉 BLOCKCHAIN CONFIRMED! You WON! Choice: ${choiceText}, Result: ${blockchainResultText}, Win Amount: ${winAmount} SOL`, 'success');
            } else {
                console.log('😔 BLOCKCHAIN CONFIRMED LOSS! Bet kept by house');
                showMessage(`😔 BLOCKCHAIN CONFIRMED! You LOST! Choice: ${choiceText}, Result: ${blockchainResultText}, Lost Amount: ${selectedBetAmount} SOL`, 'error');
            }
            
            // VALIDATE BLOCKCHAIN LOGIC (ensures correct win/loss determination)
            validateBlockchainLogic(choiceValue, blockchainResult, blockchainWon);
            
            // Update UI with BLOCKCHAIN TRUTH (SINGLE SOURCE OF TRUTH)
            console.log('🎯 UPDATING UI WITH BLOCKCHAIN TRUTH:', {
                blockchainWon: blockchainWon,
                blockchainResult: blockchainResult,
                blockchainResultText: blockchainResultText,
                choiceText: choiceText
            });
            
            addToGameHistory(blockchainWon, selectedBetAmount, choiceText, blockchainResultText);
            updateStatistics(blockchainWon, selectedBetAmount);
            showFinalResult(blockchainWon, blockchainResult);
        } else {
            throw new Error(payoutData.error || 'Failed to process payout');
        }
        
        // Update real balance
        await updateBalance();
        
    } catch (error) {
        console.error('❌ Coin flip failed:', error);
        
        // Stop the spinning animation on error
        const coin = document.querySelector('.coin');
        if (coin) {
            coin.classList.remove('flipping');
        }
        
        // Show specific error messages
        if (error.message.includes('User rejected')) {
            showMessage('Transaction cancelled by user', 'error');
        } else if (error.message.includes('insufficient funds')) {
            showMessage('Insufficient SOL balance for transaction', 'error');
        } else if (error.message.includes('network')) {
            showMessage('Network error - please try again', 'error');
        } else {
            showMessage('Transaction failed: ' + error.message, 'error');
        }
    } finally {
        isFlipping = false;
    }
}

// Add to Game History
function addToGameHistory(won, betAmount, choice, result) {
    const historyContainer = document.getElementById('game-history');
    if (!historyContainer) return;
    
    // Remove placeholder if exists
    const placeholder = historyContainer.querySelector('.history-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-icon ${won ? 'win' : 'lose'}">
            <i class="fas fa-${won ? 'trophy' : 'times'}"></i>
        </div>
        <div class="history-details">
            <div class="history-result">${won ? 'WIN' : 'LOSE'}</div>
            <div class="history-info">${choice} vs ${result} • ${betAmount} SOL</div>
        </div>
        <div class="history-amount ${won ? 'positive' : 'negative'}">
            ${won ? '+' : '-'}${won ? betAmount : betAmount} SOL
        </div>
    `;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    // Keep only last 10 games
    const items = historyContainer.querySelectorAll('.history-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

// Update Statistics
function updateStatistics(won, betAmount) {
    // Get current stats
    let totalGames = parseInt(document.getElementById('total-games').textContent) || 0;
    let winRate = parseFloat(document.getElementById('win-rate').textContent) || 0;
    let totalWinnings = parseFloat(document.getElementById('total-winnings').textContent) || 0;
    let currentStreak = parseInt(document.getElementById('current-streak').textContent) || 0;
    
    // Update stats
    totalGames++;
    
    if (won) {
        currentStreak = Math.max(0, currentStreak) + 1;
        totalWinnings += betAmount;
    } else {
        currentStreak = Math.min(0, currentStreak) - 1;
        totalWinnings -= betAmount;
    }
    
    winRate = ((totalGames - Math.abs(currentStreak)) / totalGames * 100).toFixed(1);
    
    // Update UI
    document.getElementById('total-games').textContent = totalGames;
    document.getElementById('win-rate').textContent = winRate + '%';
    document.getElementById('total-winnings').textContent = totalWinnings.toFixed(4) + ' SOL';
    document.getElementById('current-streak').textContent = currentStreak;
}

// Trigger Coin Flip Animation (Spinning Only - No Result Yet)
function triggerCoinFlipAnimation() {
    const coin = document.querySelector('.coin');
    const result = document.getElementById('result');
    
    console.log('🎬 Starting coin animation (spinning only - waiting for blockchain result)...');
    
    if (coin && result) {
        // Reset any previous animation
        coin.style.animation = 'none';
        coin.offsetHeight; // Trigger reflow
        
        // Set up coin sides for the flip animation
        const coinFront = coin.querySelector('.coin-front');
        const coinBack = coin.querySelector('.coin-back');
        
        // Make coin BLANK during spinning animation
        coinFront.innerHTML = '';
        coinBack.innerHTML = '';
        
        // Add enhanced flip animation
        coin.classList.add('flipping');
        console.log('🎬 Added flipping class to coin - spinning animation started!');
        
        // Hide any previous result
        result.style.display = 'none';
    } else {
        console.error('❌ Coin or result element not found:', { coin: !!coin, result: !!result });
    }
}

// Reset coin to default state
function resetCoin() {
    const coin = document.querySelector('.coin');
    if (coin) {
        const coinFront = coin.querySelector('.coin-front');
        const coinBack = coin.querySelector('.coin-back');
        
        // Reset to default state (Heads front, Tails back)
        coinFront.innerHTML = '<i class="fas fa-dog"></i>';
        coinBack.innerHTML = '<i class="fas fa-bone"></i>';
        
        // Remove any animation classes
        coin.classList.remove('flipping');
        coin.style.animation = 'none';
        
        console.log('🔄 Coin reset to default state (Heads front, Tails back)');
    }
}

// Validate blockchain logic (ensures correct win/loss determination)
function validateBlockchainLogic(choice, result, won) {
    const expectedWon = choice === result;
    const isCorrect = won === expectedWon;
    
    console.log('🔍 VALIDATING BLOCKCHAIN LOGIC:', {
        choice: choice,
        result: result,
        expectedWon: expectedWon,
        actualWon: won,
        isCorrect: isCorrect,
        logic: `${choice} === ${result} = ${expectedWon}`
    });
    
    if (!isCorrect) {
        console.error('❌ BLOCKCHAIN LOGIC ERROR! Expected:', expectedWon, 'Got:', won);
        throw new Error('Blockchain logic validation failed');
    }
    
    console.log('✅ BLOCKCHAIN LOGIC VALIDATED CORRECTLY');
    return true;
}

// Show Final Result After BLOCKCHAIN Confirmation
function showFinalResult(won, blockchainResult) {
    const coin = document.querySelector('.coin');
    const result = document.getElementById('result');
    
    console.log('🎯 CRITICAL DEBUG - showFinalResult called with:', { 
        won: won, 
        blockchainResult: blockchainResult,
        blockchainResultType: typeof blockchainResult,
        isZero: blockchainResult === 0,
        isOne: blockchainResult === 1
    });
    
    if (coin && result) {
        // Force stop the spinning animation immediately
        coin.classList.remove('flipping');
        coin.style.animation = 'none';
        coin.offsetHeight; // Force reflow
        
        // Set up coin sides for the final result
        const coinFront = coin.querySelector('.coin-front');
        const coinBack = coin.querySelector('.coin-back');
        
        console.log('🎯 COIN ELEMENTS FOUND:', {
            coinFront: coinFront,
            coinBack: coinBack,
            coinFrontExists: !!coinFront,
            coinBackExists: !!coinBack,
            coinFrontHTML: coinFront ? coinFront.innerHTML : 'NOT FOUND',
            coinBackHTML: coinBack ? coinBack.innerHTML : 'NOT FOUND'
        });
        
        // Clear any existing content
        coinFront.innerHTML = '';
        coinBack.innerHTML = '';
        
        // Show the BLOCKCHAIN TRUTH result
        console.log('🎯 DEBUGGING COIN DISPLAY:', {
            blockchainResult: blockchainResult,
            blockchainResultType: typeof blockchainResult,
            shouldShowDog: blockchainResult === 0,
            shouldShowBone: blockchainResult === 1
        });
        
        // 🔧 FINAL ATTEMPT: Let's see what's actually in the DOM
        console.log('🎯 FINAL ATTEMPT - Inspecting DOM:', {
            blockchainResult: blockchainResult,
            coinFrontElement: coinFront,
            coinBackElement: coinBack,
            coinFrontHTML: coinFront.innerHTML,
            coinBackHTML: coinBack.innerHTML,
            coinFrontClasses: coinFront.className,
            coinBackClasses: coinBack.className
        });
        
        // Let's try a different approach - set content and force visibility
        if (blockchainResult === 0) { // Heads - show dog
            coinFront.innerHTML = '<i class="fas fa-dog"></i>';
            coinBack.innerHTML = '<i class="fas fa-bone"></i>';
            coinFront.style.display = 'flex';
            coinBack.style.display = 'none';
            console.log('🎯 FINAL ATTEMPT: Heads - Dog should be visible, bone hidden');
        } else if (blockchainResult === 1) { // Tails - show bone
            coinFront.innerHTML = '<i class="fas fa-bone"></i>';
            coinBack.innerHTML = '<i class="fas fa-dog"></i>';
            coinFront.style.display = 'flex';
            coinBack.style.display = 'none';
            console.log('🎯 FINAL ATTEMPT: Tails - Bone should be visible, dog hidden');
        } else {
            console.error('❌ INVALID BLOCKCHAIN RESULT:', blockchainResult);
            coinFront.innerHTML = '<i class="fas fa-dog"></i>';
            coinBack.innerHTML = '<i class="fas fa-bone"></i>';
        }
        
        // DEBUG: Check what was actually set
        console.log('🎯 AFTER SETTING HTML:', {
            coinFrontHTML: coinFront.innerHTML,
            coinBackHTML: coinBack.innerHTML,
            coinFrontVisible: coinFront.style.display,
            coinBackVisible: coinBack.style.display
        });
        
        // 🔧 REMOVED CSS TRANSFORM MANIPULATION - it was causing issues
        
        console.log('🎯 Setting coin to BLOCKCHAIN TRUTH:', blockchainResult === 0 ? 'Heads (Dog)' : 'Tails (Bone)');
        
        // Force DOM update
        coinFront.offsetHeight;
        coinBack.offsetHeight;
        
        // Show the result message based on BLOCKCHAIN TRUTH
        if (won) {
            result.innerHTML = '<h3>🎉 WIN! 🎉</h3><div class="result-amount result-win">You won!</div>';
            playWinSound();
            triggerConfetti();
        } else {
            result.innerHTML = '<h3>😔 LOSE 😔</h3><div class="result-amount result-lose">Better luck next time!</div>';
            playLoseSound();
        }
        
        result.style.display = 'block';
        console.log('🎯 Showing final result:', won ? 'WIN' : 'LOSE', 'BLOCKCHAIN TRUTH:', blockchainResult === 0 ? 'Heads' : 'Tails');
        
        // Hide result after 3 seconds
        setTimeout(() => {
            result.style.display = 'none';
        }, 3000);
    } else {
        console.error('❌ Coin or result element not found for final result display');
    }
}

// Sound Effects
function playWinSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(e => console.log('Audio play failed:', e));
}

function playLoseSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.play().catch(e => console.log('Audio play failed:', e));
}

// Confetti Effect
function triggerConfetti() {
    const colors = ['#FFD700', '#FFA500', '#FF6347', '#FF69B4', '#00CED1'];
    
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.position = 'fixed';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.top = '-10px';
            confetti.style.width = '10px';
            confetti.style.height = '10px';
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.borderRadius = '50%';
            confetti.style.pointerEvents = 'none';
            confetti.style.zIndex = '9999';
            confetti.style.animation = 'confetti-fall 3s linear forwards';
            
            document.body.appendChild(confetti);
            
            setTimeout(() => {
                document.body.removeChild(confetti);
            }, 3000);
        }, i * 50);
    }
}

// Reset coin to default state
function resetCoin() {
    const coin = document.querySelector('.coin');
    if (coin) {
        const coinFront = coin.querySelector('.coin-front');
        const coinBack = coin.querySelector('.coin-back');
        
        // Reset to default: Heads on front, Tails on back
        coinFront.innerHTML = '<i class="fas fa-dog"></i>';
        coinBack.innerHTML = '<i class="fas fa-bone"></i>';
    }
}

// Initialize Game
async function initializeGame() {
    console.log('🚀 Initializing Doggo Coin Flip Game...');
    
    // Wait for Solana Web3 to load
    if (typeof solanaWeb3 === 'undefined') {
        console.log('⏳ Waiting for Solana Web3.js to load...');
        setTimeout(initializeGame, 100);
        return;
    }
    
    // Initialize Solana connection
    if (!initializeSolana()) {
        showMessage('Failed to connect to Solana network', 'error');
        return;
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Reset coin to default state
    resetCoin();
    
    // Test coin animation on load
    setTimeout(() => {
        console.log('🧪 Testing coin animation...');
        const coin = document.querySelector('.coin');
        if (coin) {
            coin.classList.add('flipping');
            setTimeout(() => {
                coin.classList.remove('flipping');
                resetCoin(); // Reset after test
                console.log('✅ Coin animation test complete');
            }, 3000);
        }
    }, 2000);
    
    // Check if Phantom is installed
    if (window.solana && window.solana.isPhantom) {
        console.log('✅ Phantom wallet detected');
    } else {
        console.log('⚠️ Phantom wallet not detected');
        showMessage('Please install Phantom Wallet for the best experience', 'info');
    }
    
    console.log('✅ Game initialized successfully');
}

// Setup Event Listeners
function setupEventListeners() {
    // Wallet connection
    const connectBtn = document.getElementById('connectWalletBtn');
    if (connectBtn) {
        connectBtn.onclick = connectWallet;
        console.log('✅ Connect wallet button listener added');
    } else {
        console.error('❌ Connect wallet button not found');
    }
    
    // Bet selection
    GAME_CONFIG.BET_OPTIONS.forEach(amount => {
        const betBtn = document.getElementById(`bet${amount}`);
        if (betBtn) {
            betBtn.onclick = () => selectBet(amount);
        }
    });
    
    // Coin selection
    const headsBtn = document.getElementById('heads-btn');
    const tailsBtn = document.getElementById('tails-btn');
    if (headsBtn) {
        headsBtn.onclick = () => selectCoin('heads');
    }
    if (tailsBtn) {
        tailsBtn.onclick = () => selectCoin('tails');
    }
    
    // Flip coin button
    const flipBtn = document.getElementById('flipCoinBtn');
    if (flipBtn) {
        flipBtn.onclick = flipCoin;
    }
    
    // Wallet account change listeners
    setupWalletEventListeners();
}

// Setup wallet event listeners
function setupWalletEventListeners() {
    // Phantom wallet events
    if (window.solana) {
        window.solana.on('accountChanged', async (publicKey) => {
            console.log('🔄 Phantom account changed:', publicKey?.toString());
            if (publicKey) {
                userPublicKey = new solanaWeb3.PublicKey(publicKey.toString());
                await updateBalance();
                updateWalletUI();
            } else {
                await disconnectWallet();
            }
        });
        
        window.solana.on('disconnect', () => {
            console.log('🔄 Phantom wallet disconnected');
            disconnectWallet();
        });
    }
    
    // Solflare wallet events
    if (window.solflare) {
        window.solflare.on('accountChanged', async (publicKey) => {
            console.log('🔄 Solflare account changed:', publicKey?.toString());
            if (publicKey) {
                userPublicKey = new solanaWeb3.PublicKey(publicKey.toString());
                await updateBalance();
                updateWalletUI();
            } else {
                await disconnectWallet();
            }
        });
        
        window.solflare.on('disconnect', () => {
            console.log('🔄 Solflare wallet disconnected');
            disconnectWallet();
        });
    }
    
    // Check for wallet changes periodically
    setInterval(checkWalletAccountChange, 3000);
}

// Check for wallet account changes
function checkWalletAccountChange() {
    if (!isConnected || !wallet) return;
    
    try {
        const currentPublicKey = wallet.publicKey?.toString();
        if (currentPublicKey && currentPublicKey !== userPublicKey?.toString()) {
            console.log('🔄 Wallet account changed detected');
            userPublicKey = new solanaWeb3.PublicKey(currentPublicKey);
            updateBalance();
            updateWalletUI();
        }
    } catch (error) {
        console.log('ℹ️ Wallet check completed');
    }
}

// Handle wallet disconnect
function handleWalletDisconnect() {
    disconnectWallet();
    showMessage('Wallet disconnected', 'info');
}

// Show connection success message in center of screen
function showConnectionSuccess(message) {
    // Remove any existing success message
    const existingSuccess = document.querySelector('.connection-success');
    if (existingSuccess) {
        existingSuccess.remove();
    }
    
    // Create success message element
    const successDiv = document.createElement('div');
    successDiv.className = 'connection-success';
    successDiv.innerHTML = `
        <div class="success-message">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to body for centered positioning
    document.body.appendChild(successDiv);
    
    // Auto-remove after 3 seconds with fade out
    setTimeout(() => {
        if (successDiv.parentNode) {
            successDiv.classList.add('fade-out');
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.remove();
                }
            }, 500);
        }
    }, 3000);
}

// Add CSS for animations
function addAnimations() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes flip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(180deg); }
            100% { transform: rotateY(360deg); }
        }
        
        @keyframes confetti-fall {
            0% { transform: translateY(-10px) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        
        .coin-option.selected {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            transform: scale(1.05);
            box-shadow: 0 8px 25px rgba(255, 215, 0, 0.4);
        }
        
        .result {
            font-size: 2rem;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            padding: 20px;
            border-radius: 15px;
            animation: pulse 1s ease-in-out;
        }
        
        .result.win {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
        }
        
        .result.lose {
            background: linear-gradient(135deg, #f44336, #da190b);
            color: white;
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
        }
        
        .history-item {
            display: flex;
            align-items: center;
            padding: 15px;
            background: linear-gradient(135deg, #2a2a2a, #1a1a1a);
            border-radius: 10px;
            margin-bottom: 10px;
            border: 1px solid #333;
        }
        
        .history-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
        }
        
        .history-icon.win {
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
        }
        
        .history-icon.lose {
            background: linear-gradient(135deg, #f44336, #da190b);
            color: white;
        }
        
        .history-details {
            flex: 1;
        }
        
        .history-result {
            font-weight: bold;
            color: #FFD700;
            margin-bottom: 5px;
        }
        
        .history-info {
            color: #888;
            font-size: 0.9rem;
        }
        
        .history-amount {
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        .history-amount.positive {
            color: #4CAF50;
        }
        
        .history-amount.negative {
            color: #f44336;
        }
    `;
    document.head.appendChild(style);
}

// Start the game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM loaded, initializing game...');
    addAnimations();
    initializeGame();
});

// Export functions for global access
window.connectWallet = connectWallet;
window.disconnectWallet = disconnectWallet;
window.flipCoin = flipCoin;
window.selectBet = selectBet;
window.selectCoin = selectCoin;

// Cache bust: Sat Aug 16 12:52:35 +0630 2025
// Cache bust: Sat Aug 16 13:01:48 +0630 2025
// Cache bust: Sat Aug 16 13:04:11 +0630 2025
// Cache bust: Sat Aug 16 13:08:51 +0630 2025
// Cache bust: Sat Aug 16 13:12:01 +0630 2025
// Cache bust: Sat Aug 16 13:14:49 +0630 2025
// Cache bust: Sat Aug 16 13:17:53 +0630 2025
// Cache bust: Sat Aug 16 13:20:40 +0630 2025
// Cache bust: Sat Aug 16 13:22:29 +0630 2025
// Cache bust: Sat Aug 16 13:24:42 +0630 2025
// Cache bust: Sat Aug 16 13:31:06 +0630 2025
// Cache bust: Sat Aug 16 13:34:25 +0630 2025
// Cache bust: Sat Aug 16 13:40:33 +0630 2025
// Cache bust: Sat Aug 16 13:42:42 +0630 2025
// Cache bust: Sat Aug 16 13:48:35 +0630 2025
// Cache bust: Sat Aug 16 13:52:51 +0630 2025
// Cache bust: Sat Aug 16 13:55:51 +0630 2025
// Cache bust: Sat Aug 16 13:57:39 +0630 2025
// Cache bust: Sat Aug 16 13:59:11 +0630 2025
// Cache bust: Sat Aug 16 14:00:39 +0630 2025
