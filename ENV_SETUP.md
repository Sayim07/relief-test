# Environment Variables Setup Guide

This guide explains how to set up the required environment variables for the ReliefChain application.

## 📋 Required Environment Variables

### 1. Firebase Configuration

These should already be set up from Phase 1. If not, get them from [Firebase Console](https://console.firebase.google.com/):

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 2. Admin Wallet Address (NEW - Required for Donations)

This is the wallet address where donations will be sent. You have two options:

#### Option A: Use MetaMask to Create/Get Admin Wallet

1. **Open MetaMask** extension in your browser
2. **Create a new account** or use an existing one
3. **Copy the wallet address** (starts with `0x...`)
4. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xYourAdminWalletAddressHere
   ```

#### Option B: Use Hardhat Local Network Account

If you're using Hardhat local network, you can use the deployer account:

1. **Start Hardhat node**:
   ```bash
   cd contracts
   npx hardhat node
   ```

2. **Check the first account** (deployer) - it's usually:
   ```
   0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

3. **Add to `.env.local`**:
   ```env
   NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
   ```

⚠️ **Important**: 
- For **production**, create a dedicated admin wallet
- **Never share** your private keys
- Keep the admin wallet secure

### 3. Relief Token Contract Address (Optional - for Token Payments)

This is only needed if you want to accept donations in ReliefToken instead of ETH.

#### Step 1: Deploy ReliefToken Contract

```bash
cd contracts
npx hardhat node  # In one terminal
npx hardhat run scripts/deploy.js --network localhost  # In another terminal
```

#### Step 2: Copy the Contract Address

After deployment, you'll see output like:
```
✅ ReliefToken deployed successfully!
Contract address: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

#### Step 3: Add to `.env.local`

```env
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

## 📝 Complete `.env.local` Example

Create or update `.env.local` in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyClZereQt8SjYcGesg3c7VRDCFnLoUZeLo
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=relief-db4ce.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=relief-db4ce
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=relief-db4ce.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=188422841820
NEXT_PUBLIC_FIREBASE_APP_ID=1:188422841820:web:6e9b0e8381904fc1509b19

# Admin Wallet Address (where donations are sent)
NEXT_PUBLIC_ADMIN_WALLET_ADDRESS=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Relief Token Contract Address (optional - for token payments)
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

# Chain ID (optional - defaults to 1337 for localhost)
NEXT_PUBLIC_CHAIN_ID=1337
```

## 🔧 Quick Setup Steps

### For Local Development:

1. **Create `.env.local` file** in the project root:
   ```bash
   touch .env.local
   ```

2. **Add Firebase config** (you should already have this)

3. **Set Admin Wallet Address**:
   - Option 1: Use Hardhat deployer account (easiest for testing)
   - Option 2: Create new MetaMask account and copy address

4. **Deploy ReliefToken** (optional):
   ```bash
   cd contracts
   npx hardhat node
   # In another terminal:
   npx hardhat run scripts/deploy.js --network localhost
   ```

5. **Restart your Next.js dev server**:
   ```bash
   npm run dev
   ```

## ✅ Verification

After setting up, verify your configuration:

1. **Check environment variables are loaded**:
   - Open browser console
   - Check for any Firebase warnings
   - Try connecting wallet - should work

2. **Test donation flow**:
   - Go to `/donor` page
   - Connect MetaMask wallet
   - Try making a small donation
   - Check if transaction goes to admin wallet address

## 🚨 Troubleshooting

### Admin Wallet Address Not Working?

- Make sure the address starts with `0x`
- Verify the address is correct (no extra spaces)
- Restart Next.js dev server after adding variables
- Check browser console for errors

### ReliefToken Address Not Found?

- Make sure you deployed the contract first
- Copy the exact address from deployment output
- Contract must be deployed on the same network as MetaMask

### Environment Variables Not Loading?

- Make sure file is named exactly `.env.local` (not `.env.local.txt`)
- Restart Next.js dev server
- Clear browser cache
- Check that variables start with `NEXT_PUBLIC_` for client-side access

## 📚 Additional Resources

- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [MetaMask Documentation](https://docs.metamask.io/)
- [Hardhat Documentation](https://hardhat.org/docs)
