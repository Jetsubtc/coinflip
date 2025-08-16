# 🚀 Doggo Coin Flip - Deployment Guide

## 📋 Overview

This guide will help you deploy both the frontend and backend of your Doggo Coin Flip game so users can play from anywhere!

## 🌐 Frontend Deployment (GitHub Pages)

### ✅ Already Done!
Your frontend is already deployed on GitHub Pages at: `https://jetsubtc.github.io/coinflip/`

## 🔧 Backend Deployment (Cloud Server)

### Option 1: Render (Recommended - Free)

1. **Sign up** at [render.com](https://render.com)
2. **Create New Web Service**
3. **Connect your GitHub repository**
4. **Configure settings:**
   - **Name**: `doggo-coinflip-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Add Environment Variables:**
   ```
   HOUSE_WALLET_PRIVATE_KEY=your_private_key_here
   PORT=3001
   ```

6. **Deploy!**

### Option 2: Railway (Alternative - Free)

1. **Sign up** at [railway.app](https://railway.app)
2. **Deploy from GitHub**
3. **Add environment variables**
4. **Deploy!**

### Option 3: Heroku (Alternative)

1. **Sign up** at [heroku.com](https://heroku.com)
2. **Create new app**
3. **Deploy from GitHub**
4. **Add environment variables**
5. **Deploy!**

## 🔄 Update Frontend Configuration

After deploying your backend, update the frontend to use the new URL:

### 1. Update `script.js`:

```javascript
const GAME_CONFIG = {
    NETWORK: 'devnet',
    MIN_BET: 0.1,
    MAX_BET: 1,
    BET_OPTIONS: [0.1, 0.2, 0.5, 1],
    HOUSE_SERVER: 'https://your-backend-url.onrender.com', // Update this!
    SOL_DECIMALS: 9,
    DEMO_MODE: false
};
```

### 2. Update CORS in `server.js`:

```javascript
app.use(cors({
    origin: ['https://jetsubtc.github.io', 'http://localhost:3000'],
    credentials: true
}));
```

## 🔑 Environment Variables

Make sure to set these in your cloud deployment:

```bash
HOUSE_WALLET_PRIVATE_KEY=your_private_key_from_setup.js
PORT=3001
NODE_ENV=production
```

## 🧪 Testing

1. **Deploy backend** to cloud service
2. **Update frontend** with new backend URL
3. **Push changes** to GitHub
4. **Test the game** at your GitHub Pages URL

## 📱 Final Result

Users will be able to:
- ✅ **Access your game** from anywhere
- ✅ **Connect their wallets** (Phantom, Solflare, etc.)
- ✅ **Place real SOL bets** on Solana Devnet
- ✅ **Receive automatic payouts** via your cloud backend

## 🆘 Troubleshooting

### "Failed to fetch" Error
- ✅ Backend deployed and running
- ✅ Frontend URL updated correctly
- ✅ CORS configured properly
- ✅ Environment variables set

### Connection Issues
- ✅ Check backend logs in cloud dashboard
- ✅ Verify environment variables
- ✅ Test backend endpoints manually

## 🎉 Success!

Once deployed, your Doggo Coin Flip game will be fully functional for users worldwide! 🐕✨
