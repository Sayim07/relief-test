# Emergency & Disaster Relief Stablecoin System

A blockchain-based relief distribution system using stablecoins with beneficiary whitelisting, category-based spending limits, and public audit trails.

## Features

- ✅ **Beneficiary Whitelisting**: Admin-controlled beneficiary management
- ✅ **Category-Based Spending Limits**: Control how funds can be spent (food, shelter, medical, etc.)
- ✅ **Public Audit Trail**: Transparent transaction history on the blockchain
- ✅ **MetaMask Integration**: Secure wallet connection for all transactions
- ✅ **Firebase Integration**: Fast data queries and metadata storage

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **Blockchain**: Solidity Smart Contracts + Hardhat
- **Web3**: ethers.js v6 + MetaMask
- **Database**: Firebase (Firestore)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- MetaMask browser extension
- Firebase account (for database)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd rc_cursor2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase credentials and contract address.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
rc_cursor2/
├── app/                    # Next.js app router pages
│   ├── admin/             # Admin dashboard
│   ├── beneficiary/       # Beneficiary dashboard
│   ├── audit/             # Public audit trail
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── WalletConnect.tsx
│   ├── AdminDashboard.tsx
│   ├── BeneficiaryDashboard.tsx
│   └── Navbar.tsx
├── contracts/             # Solidity smart contracts
│   ├── ReliefToken.sol
│   └── hardhat.config.ts
├── hooks/                 # Custom React hooks
│   └── useWallet.ts
├── lib/                   # Utilities and services
│   ├── contracts/        # Contract interaction
│   ├── firebase/         # Firebase config and services
│   └── web3/             # Web3 provider utilities
└── public/               # Static assets
```

## Smart Contract Development

### Compile Contracts

```bash
cd contracts
npx hardhat compile
```

### Deploy Contracts

```bash
# Start local blockchain
npx hardhat node

# Deploy to local network
npx hardhat run scripts/deploy.ts --network localhost
```

### Contract Address

After deployment, update `NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS` in `.env.local` with the deployed contract address.

## Environment Variables

Required environment variables (see `.env.local.example`):

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_RELIEF_TOKEN_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`

## Usage

### For Admins

1. Connect MetaMask wallet
2. Navigate to Admin Dashboard
3. Whitelist beneficiaries with category limits
4. Distribute relief funds to beneficiaries

### For Beneficiaries

1. Connect MetaMask wallet
2. Navigate to Beneficiary Dashboard
3. View balance and spending limits
4. Make category-based transfers

### Public Audit Trail

Anyone can view all transactions on the Audit Trail page without connecting a wallet.

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
