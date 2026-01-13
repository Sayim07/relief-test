# ReliefToken Contract Deployment Information

## ✅ Deployment Successful!

### Contract Details
- **Contract Address**: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Network**: Localhost (Hardhat)
- **Chain ID**: 1337
- **Deployer**: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`
- **Deployment Time**: 2026-01-13T17:18:12.501Z

### Contract Information
- **Name**: Relief Token
- **Symbol**: RLT
- **Solidity Version**: 0.8.20
- **Optimizer**: Enabled (200 runs)

## 📋 Next Steps

### 1. Update Environment Variables
Add this to your `.env.local` file:
```env
NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_CHAIN_ID=1337
```

### 2. Connect MetaMask to Local Network
1. Open MetaMask
2. Go to Settings → Networks → Add Network
3. Add:
   - Network Name: Hardhat Local
   - RPC URL: http://127.0.0.1:8545
   - Chain ID: 1337
   - Currency Symbol: ETH

### 3. Import Test Account (Optional)
To test with the deployer account, import this private key in MetaMask:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
⚠️ **Warning**: This is a test account. Never use this on mainnet!

### 4. Test the Contract
- The contract is now deployed and ready to use
- You can interact with it through the frontend
- Make sure Hardhat node is running: `npx hardhat node`

## 🔧 Commands

### Start Hardhat Node
```bash
cd contracts
npx hardhat node
```

### Deploy to Local Network
```bash
cd contracts
npx hardhat run scripts/deploy.js --network localhost
```

### Compile Contracts
```bash
cd contracts
npx hardhat compile
```

### Run Tests
```bash
cd contracts
npx hardhat test
```

## 📝 Contract Features

✅ Beneficiary whitelisting
✅ Category-based spending limits
✅ Relief distribution
✅ Transaction recording
✅ Public audit trail

## 🚀 Deployment to Testnet

When ready to deploy to Sepolia testnet:

1. Get testnet ETH from a faucet
2. Update `.env.local` with:
   ```env
   SEPOLIA_RPC_URL=your_rpc_url
   PRIVATE_KEY=your_private_key
   ```
3. Deploy:
   ```bash
   npx hardhat run scripts/deploy.js --network sepolia
   ```
4. Update `NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS` with the new address
5. Update `NEXT_PUBLIC_CHAIN_ID` to `11155111` (Sepolia)
