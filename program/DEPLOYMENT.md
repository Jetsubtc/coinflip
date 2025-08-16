# 🚀 Doggo Coin Flip Smart Contract Deployment Guide

## Prerequisites

1. **Solana CLI** installed and configured
2. **Anchor CLI** installed
3. **Rust** toolchain installed
4. **Node.js** and npm installed

## Step 1: Environment Setup

### Install Solana CLI
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### Install Anchor CLI
```bash
npm install -g @coral-xyz/anchor-cli
```

### Configure Solana for Devnet
```bash
solana config set --url devnet
solana config get
```

## Step 2: Build the Program

```bash
cd program
anchor build
```

**Expected Output:**
```
Built successfully!
Program Id: HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh
```

## Step 3: Deploy to Devnet

### Deploy the Program
```bash
anchor deploy --provider.cluster devnet
```

**Expected Output:**
```
Deploying program: HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh
Program Id: HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh
Deploy success
```

### Verify Deployment
```bash
solana program show HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh --url devnet
```

## Step 4: Update Program ID

After deployment, update the program ID in these files:

### 1. Anchor.toml
```toml
[programs.devnet]
coinflip = "HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh"
```

### 2. lib.rs
```rust
declare_id!("HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh");
```

### 3. Frontend (script.js)
```javascript
const GAME_CONFIG = {
    PROGRAM_ID: 'HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh',
    // ... other config
};
```

## Step 5: Fund House Wallet

### Create House Wallet (if needed)
```bash
solana-keygen new --outfile house-wallet.json --no-bip39-passphrase
```

### Get House Wallet Public Key
```bash
solana-keygen pubkey house-wallet.json
```

### Fund House Wallet
```bash
solana airdrop 10 <HOUSE_WALLET_PUBKEY> --url devnet
```

## Step 6: Initialize Game State

### Option 1: Using Frontend
1. Start the frontend: `npm run dev`
2. Connect wallet
3. The game state will be initialized automatically

### Option 2: Using CLI
```bash
# Create a script to initialize game state
anchor run initialize-game-state
```

## Step 7: Test the Deployment

### Run Tests
```bash
anchor test --provider.cluster devnet
```

### Manual Testing
1. Open frontend in browser
2. Connect Phantom wallet
3. Place a small test bet (1 DOGGO)
4. Verify transaction success
5. Check balance updates

## Troubleshooting

### Common Issues

#### 1. Build Errors
```bash
# Clean and rebuild
anchor clean
anchor build
```

#### 2. Deployment Errors
```bash
# Check Solana balance
solana balance --url devnet

# Get more SOL if needed
solana airdrop 2 --url devnet
```

#### 3. Program ID Mismatch
```bash
# Verify program ID in all files
grep -r "HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh" .
```

#### 4. Network Issues
```bash
# Check Solana cluster status
solana cluster-version --url devnet

# Switch to different RPC if needed
solana config set --url https://api.devnet.solana.com
```

## Production Deployment

### Mainnet Deployment
1. Change cluster to mainnet-beta
2. Update program ID
3. Deploy with real SOL
4. Fund house wallet with sufficient DOGGO
5. Test thoroughly

### Security Checklist
- [ ] Program ID updated in all files
- [ ] House wallet funded
- [ ] Game state initialized
- [ ] Tests passing
- [ ] Frontend integration working
- [ ] Error handling tested
- [ ] Balance updates verified

## Monitoring

### Check Program Status
```bash
solana program show HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh --url devnet
```

### Monitor Transactions
```bash
solana logs HWpAveiQGMm8o9NeD1NncQ9dBMd1CtxuKbVe9cGKQZFh --url devnet
```

### Check House Balance
```bash
solana balance <HOUSE_WALLET_PUBKEY> --url devnet
```

## Support

For deployment issues:
1. Check Solana cluster status
2. Verify program ID consistency
3. Ensure sufficient SOL for deployment
4. Review error logs
5. Test with smaller programs first

---

**Note**: This deployment guide is for educational purposes. Production deployments require additional security measures and testing.
