# Sepolia Testnet Setup

## ✅ Configuration Complete!

Your project is now configured for Sepolia testnet.

## 📝 Update Your `.env.local` File

Add or update these lines in your `.env.local` file:

```env
# Sepolia Network Configuration
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43

# Relief Token Contract (deploy to Sepolia first)
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=YOUR_SEPOLIA_CONTRACT_ADDRESS
```

## 🚀 Steps to Use Sepolia

### 1. Get Sepolia ETH

You need test ETH to make transactions:

**Option A: Sepolia Faucet (Recommended)**
- Go to: https://sepoliafaucet.com/
- Or: https://faucet.quicknode.com/ethereum/sepolia
- Enter your address: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- Request test ETH (usually 0.5-1 ETH)

**Option B: Alchemy Faucet**
- Go to: https://sepoliafaucet.com/
- Connect with Alchemy account
- Request ETH

### 2. Connect MetaMask to Sepolia

The app will automatically prompt you to switch to Sepolia, or:

1. Open MetaMask
2. Click network dropdown (top)
3. Select "Sepolia test network"
4. If not listed, click "Add Network" and use:
   - Network Name: Sepolia
   - RPC URL: https://rpc.sepolia.org
   - Chain ID: 11155111
   - Currency Symbol: ETH
   - Block Explorer: https://sepolia.etherscan.io

### 3. Deploy Contract to Sepolia (Optional)

If you want to use the ReliefToken contract:

```bash
cd contracts

# Add to .env.local in contracts folder:
# SEPOLIA_RPC_URL=https://rpc.sepolia.org
# PRIVATE_KEY=your_private_key_here

# Deploy:
npx hardhat run scripts/deploy.js --network sepolia
```

Copy the deployed contract address and update `NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS` in your main `.env.local`.

### 4. Restart Your App

```bash
# Stop current server (Ctrl+C)
npm run dev
```

## ✅ What's Working Now

- ✅ Automatic network detection
- ✅ Prompt to switch to Sepolia if on wrong network
- ✅ Admin wallet set to your Sepolia address
- ✅ Network switching component in donor dashboard

## 🧪 Testing

1. Go to `/donor` page
2. Connect MetaMask (should auto-switch to Sepolia)
3. Make a small donation (e.g., 0.001 ETH)
4. Check transaction on Sepolia Etherscan

## 📊 View Your Transactions

- Sepolia Explorer: https://sepolia.etherscan.io/address/0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43

## ⚠️ Important Notes

- Sepolia ETH has no real value - it's for testing only
- You need Sepolia ETH to pay for gas fees
- Contract address needs to be deployed to Sepolia if using tokens
- All transactions are public on Sepolia explorer
