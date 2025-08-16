# 🐕 Doggo Coin Flip - Solana Smart Contract Game

A fully decentralized coin flip game built on Solana Devnet with automatic escrow and payout system.

## 🎯 Features

- **Smart Contract Escrow**: All house funds held securely in program escrow
- **Single Transaction**: Bet and payout happen in one atomic transaction
- **Automatic Payouts**: Winners receive 2x their bet automatically
- **Phantom Wallet Integration**: Seamless Web3 experience
- **Real-time Balance Updates**: Live balance tracking
- **Provably Fair**: On-chain randomness using Solana clock

## 🏗️ Architecture

### Smart Contract (Anchor Program)
- **Program ID**: `HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh`
- **Escrow Account**: PDA-based game state holds all house funds
- **Functions**:
  - `initialize()`: Setup game state
  - `flipCoin(betAmount, choice)`: Main game logic
  - `getUserBalance(userPublicKey)`: Query player balance

### Frontend (Web3.js)
- **Network**: Solana Devnet
- **Wallet**: Phantom Wallet integration
- **Framework**: Vanilla JavaScript with Web3.js
- **UI**: Black & gold theme with animations

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Solana CLI
- Anchor CLI
- Phantom Wallet

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Smart Contract
```bash
cd program
anchor build
```

### 3. Deploy to Devnet
```bash
anchor deploy --provider.cluster devnet
```

### 4. Update Program ID
After deployment, update the program ID in:
- `program/Anchor.toml`
- `program/programs/coinflip/src/lib.rs`
- `script.js` (GAME_CONFIG.PROGRAM_ID)

### 5. Initialize Game State
```bash
# Fund the house wallet
solana airdrop 10 <HOUSE_WALLET_ADDRESS> --url devnet

# Initialize the game state (run from frontend)
```

### 6. Start Frontend
```bash
npm run dev
```

## 🎮 How to Play

1. **Connect Wallet**: Click "Connect Wallet" and approve in Phantom
2. **Select Bet**: Choose bet amount (0.1, 0.2, 0.5, or 1 SOL)
3. **Choose Side**: Pick Heads or Tails
4. **Flip Coin**: Click "Flip Coin" and approve transaction
5. **Get Results**: Win 2x your bet or lose your bet

## 💰 Betting System

- **Minimum Bet**: 0.1 SOL
- **Maximum Bet**: 1 SOL
- **Payout**: 2x bet amount on win
- **House Edge**: 0% (50/50 odds)

## 🔧 Technical Details

### Smart Contract Functions

#### `flipCoin(betAmount, choice)`
```rust
pub fn flip_coin(
    ctx: Context<FlipCoin>,
    bet_amount: u64,  // In lamports (1 SOL = 1,000,000,000 lamports)
    choice: u8,       // 0 = heads, 1 = tails
) -> Result<()>
```

**Process:**
1. Validate bet amount (0.1-1 SOL)
2. Transfer bet from user to program escrow
3. Generate random result using Solana clock
4. If user wins: transfer 2x bet from escrow to user
5. Update game statistics

#### `getUserBalance(userPublicKey)`
```rust
pub fn get_user_balance(ctx: Context<GetBalance>) -> Result<u64>
```

### Frontend Integration

#### Key Functions
- `createProgram()`: Initialize Anchor program instance
- `getGameStatePDA()`: Get program derived address for escrow
- `solToLamports()`: Convert SOL to lamports
- `flipCoin()`: Main game function

#### Transaction Flow
1. User selects bet and choice
2. Frontend calls `flipCoin` instruction
3. Smart contract processes bet and result
4. Automatic payout if user wins
5. UI updates with new balance

## 🛡️ Security Features

- **Escrow Protection**: All funds held in program-controlled account
- **Atomic Transactions**: Bet and payout in single transaction
- **Input Validation**: Bet amounts and choices validated on-chain
- **Randomness**: Uses Solana clock for provably fair results
- **No House Wallet**: No external wallet needed for payouts

## 📁 Project Structure

```
CoinFlip/
├── program/                    # Anchor smart contract
│   ├── programs/coinflip/
│   │   ├── src/lib.rs         # Main program logic
│   │   └── Cargo.toml         # Dependencies
│   ├── Anchor.toml            # Anchor configuration
│   └── tests/                 # Program tests
├── index.html                 # Frontend HTML
├── script.js                  # Frontend JavaScript
├── style.css                  # Frontend styling
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🔍 Testing

### Smart Contract Tests
```bash
cd program
anchor test
```

### Frontend Testing
1. Open browser console
2. Connect wallet
3. Place test bets
4. Verify balance updates
5. Check transaction logs

## 🚨 Error Handling

### Common Errors
- **Insufficient Balance**: User doesn't have enough DOGGO
- **Invalid Bet Amount**: Bet outside 1-10 DOGGO range
- **Invalid Choice**: Choice not 0 (heads) or 1 (tails)
- **Insufficient House Balance**: Escrow doesn't have enough funds

### Debugging
- Check browser console for detailed logs
- Verify program ID matches deployment
- Ensure wallet is connected to Devnet
- Check transaction status in Solana Explorer

## 🌐 Deployment

### Devnet Deployment
1. Build program: `anchor build`
2. Deploy: `anchor deploy --provider.cluster devnet`
3. Update program ID in all files
4. Initialize game state
5. Test with small bets

### Mainnet Deployment
1. Change cluster to mainnet-beta
2. Deploy with real SOL
3. Fund house wallet with sufficient DOGGO
4. Test thoroughly before going live

## 📊 Game Statistics

The smart contract tracks:
- **Total Games**: Number of games played
- **Total Volume**: Total SOL wagered
- **House Balance**: Current escrow balance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review transaction logs
3. Verify smart contract deployment
4. Open an issue on GitHub

---

**⚠️ Disclaimer**: This is a demo project for educational purposes. Use at your own risk in production environments.
