# Environment Variables Setup

This document explains all environment variables needed for the ReliefChain project.

## Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

### Firebase Configuration

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

**How to get these values:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon ⚙️ → Project settings
4. Scroll to "Your apps" section
5. Click the Web icon `</>` or find your web app
6. Copy the `firebaseConfig` values

### Smart Contract Configuration

```env
# Smart Contract Configuration
# For local Hardhat network
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=1337
```

**For Testnet (Sepolia):**
```env
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0xYourDeployedContractAddress
NEXT_PUBLIC_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
PRIVATE_KEY=your_private_key_here
```

## Complete .env.local Template

```env
# ============================================
# Firebase Configuration
# ============================================
# Get these from Firebase Console → Project Settings → Your apps
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# ============================================
# Smart Contract Configuration
# ============================================
# Local Hardhat Network (Development)
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=1337

# For Testnet Deployment (Uncomment when ready)
# NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0xYourDeployedContractAddress
# NEXT_PUBLIC_CHAIN_ID=11155111
# SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_KEY
# PRIVATE_KEY=your_private_key_here
```

## Environment Variable Naming

- **NEXT_PUBLIC_*** prefix: Required for variables used in client-side code
- Variables without this prefix are only available on the server

## Security Notes

⚠️ **Important Security Guidelines:**

1. **Never commit `.env.local` to Git**
   - It's already in `.gitignore`
   - Contains sensitive information

2. **Use different values for different environments**
   - Development: Local Hardhat network
   - Staging: Testnet (Sepolia)
   - Production: Mainnet

3. **Protect your private keys**
   - Never share private keys
   - Use environment variables, never hardcode
   - Use hardware wallets for production

4. **Firebase API Keys**
   - API keys are safe to expose in client-side code
   - Security is handled by Firestore security rules
   - Still, don't commit them unnecessarily

## Verification

After setting up your `.env.local`:

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Check the browser console for errors

3. Verify Firebase connection:
   - Navigate to Admin Dashboard
   - Check if categories load
   - Check browser console for Firebase errors

4. Verify Contract connection:
   - Connect MetaMask
   - Check if contract address is set
   - Try to interact with the contract

## Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Check that all `NEXT_PUBLIC_FIREBASE_*` variables are set
- Restart the dev server after adding variables
- Check for typos in variable names

### "Contract address not configured"
- Make sure `NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS` is set
- Verify the address is correct (starts with `0x`)
- Check that `NEXT_PUBLIC_CHAIN_ID` matches your network

### Variables not loading
- Make sure file is named exactly `.env.local` (not `.env.local.txt`)
- Restart the dev server
- Clear Next.js cache: `rm -rf .next`

## Production Deployment

For production (Vercel, Netlify, etc.):

1. Add environment variables in your hosting platform's dashboard
2. Use the same variable names
3. Set production values (testnet/mainnet addresses)
4. Never commit production keys to Git

### Vercel Example:
1. Go to Project Settings → Environment Variables
2. Add each variable
3. Select environment (Production, Preview, Development)
4. Redeploy

### Netlify Example:
1. Go to Site Settings → Build & Deploy → Environment
2. Add each variable
3. Save and redeploy
