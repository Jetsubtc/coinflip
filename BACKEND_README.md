# 🏠 Doggo Coin Flip Backend Server

This backend server handles automatic payouts for the Doggo Coin Flip game without requiring the house wallet to be connected to the browser.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup House Wallet
```bash
npm run setup
```

### 3. Fund House Wallet
- Copy the public key from the setup output
- Go to [Solana Devnet Faucet](https://faucet.solana.com/)
- Request SOL for the house wallet (at least 10 SOL for testing)

### 4. Set Environment Variable
```bash
export HOUSE_WALLET_PRIVATE_KEY="your_private_key_from_house_wallet.json"
```

### 5. Start the Game
```bash
npm start
```

This will start both the backend server (port 3001) and frontend (port 3000).

## 🏗️ Architecture

### Backend Server (Port 3001)
- **Express.js** server with CORS enabled
- **Solana Web3.js** for blockchain interactions
- **House wallet** for automatic payouts
- **Game state tracking** (in-memory, use database in production)

### Frontend (Port 3000)
- **Vanilla JavaScript** with Solana Web3.js CDN
- **Phantom Wallet** integration
- **Real-time balance updates**
- **Game statistics and history**

## 🔄 Transaction Flow

1. **User places bet**: Frontend sends SOL to house wallet
2. **Game result generated**: Frontend determines win/loss
3. **Backend processes payout**: Server automatically sends winnings if user won
4. **Balance updates**: Real-time balance updates in frontend

## 📡 API Endpoints

### GET `/api/house-wallet`
Get house wallet information
```json
{
  "publicKey": "house_wallet_public_key",
  "balance": 10.5
}
```

### POST `/api/process-game`
Process game result and handle payouts
```json
{
  "userPublicKey": "user_wallet_public_key",
  "betAmount": 0.5,
  "choice": 0,
  "result": 1,
  "userWon": false
}
```

### GET `/api/stats`
Get game statistics
```json
{
  "totalGames": 25,
  "totalVolume": 12.5,
  "houseBalance": 8.2
}
```

### POST `/api/fund-house`
Fund house wallet (for testing)
```json
{
  "amount": 5
}
```

### GET `/api/health`
Health check endpoint
```json
{
  "status": "healthy",
  "houseWallet": "house_wallet_public_key",
  "gameState": {...}
}
```

## 🔐 Security Features

- **Environment variables** for private keys
- **CORS protection** for API endpoints
- **Input validation** for all requests
- **Error handling** for failed transactions
- **Balance checks** before payouts

## 🛠️ Development

### Environment Variables
```bash
HOUSE_WALLET_PRIVATE_KEY=your_private_key_here
PORT=3001
```

### Running in Development
```bash
# Start backend only
npm run server

# Start frontend only
npm run dev

# Start both (recommended)
npm start
```

### Testing the Backend
```bash
# Test house wallet info
curl http://localhost:3001/api/house-wallet

# Test health check
curl http://localhost:3001/api/health

# Test game processing (example)
curl -X POST http://localhost:3001/api/process-game \
  -H "Content-Type: application/json" \
  -d '{
    "userPublicKey": "test_user_key",
    "betAmount": 0.1,
    "choice": 0,
    "result": 0,
    "userWon": true
  }'
```

## 🚨 Troubleshooting

### Common Issues

1. **"Insufficient house balance"**
   - Fund the house wallet with more SOL
   - Check house wallet balance: `curl http://localhost:3001/api/house-wallet`

2. **"Failed to process game"**
   - Check server logs for detailed error
   - Verify house wallet has sufficient SOL
   - Ensure environment variable is set correctly

3. **"Transaction failed"**
   - Check Solana network status
   - Verify house wallet private key is correct
   - Check for sufficient SOL for transaction fees

### Debug Commands
```bash
# Check house wallet balance
solana balance <house_wallet_public_key> --url devnet

# Check server status
curl http://localhost:3001/api/health

# View server logs
tail -f server.log
```

## 🔄 Production Deployment

### Security Checklist
- [ ] Use environment variables for all secrets
- [ ] Set up proper CORS configuration
- [ ] Use HTTPS in production
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Use a database for game state
- [ ] Set up monitoring and alerts

### Recommended Changes
1. **Database**: Replace in-memory game state with PostgreSQL/MongoDB
2. **Authentication**: Add API key authentication
3. **Rate Limiting**: Implement request rate limiting
4. **Logging**: Add structured logging
5. **Monitoring**: Set up health checks and monitoring
6. **Backup**: Regular backups of house wallet and game state

## 📊 Game Statistics

The backend tracks:
- **Total Games**: Number of games played
- **Total Volume**: Total SOL wagered
- **House Balance**: Current house wallet balance
- **Win/Loss Ratios**: Game outcome statistics

## 🎯 Features

- ✅ **Automatic Payouts**: No manual intervention needed
- ✅ **Real Transactions**: All SOL transfers are on-chain
- ✅ **Balance Tracking**: Real-time house wallet balance
- ✅ **Error Handling**: Comprehensive error management
- ✅ **Game Statistics**: Track all game data
- ✅ **Health Monitoring**: Server health checks

---

**⚠️ Important**: This is a demo implementation. For production use, implement proper security measures, use a database, and add comprehensive monitoring.
