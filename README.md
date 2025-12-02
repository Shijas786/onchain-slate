# Onchain Slate

A web-based Drawing → NFT minting app built with Next.js and deployed on Base. Create digital art on an interactive canvas and mint it as an ERC721 NFT on the Base blockchain.

## Features

- **Drawing Canvas**: Responsive HTML5 canvas with brush size and color selection
- **NFT Minting**: Upload drawings to IPFS and mint as ERC721 NFTs on Base
- **Mobile-Friendly**: Touch support for drawing on mobile devices
- **Farcaster Integration**: Sign in with Farcaster when embedded in a Farcaster frame
- **Wallet Connect**: Connect with any wallet via Reown (WalletConnect)
- **Dual Authentication**: Seamlessly switch between Farcaster and traditional wallet connections

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Smart Contract**: Solidity, OpenZeppelin, Hardhat
- **Blockchain**: Base (Sepolia testnet / Mainnet)
- **Storage**: IPFS via Pinata
- **Wallet**: viem for server-side signing, Reown (WalletConnect) for client connections
- **Authentication**: Farcaster Mini App SDK, Reown AppKit

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A wallet with Base ETH for gas (or Farcaster account)
- Pinata API keys
- Reown (WalletConnect) Project ID

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
# Blockchain
PRIVATE_KEY=your_wallet_private_key
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org
DRAWING_NFT_CONTRACT_ADDRESS=deployed_contract_address

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_api_key
PINATA_SECRET_KEY=your_pinata_secret_key

# Wallet Connect (Reown)
NEXT_PUBLIC_PROJECT_ID=your_reown_project_id

# Optional
NEXT_PUBLIC_CHAIN=sepolia  # or 'mainnet'
BASESCAN_API_KEY=your_basescan_api_key
```

**Getting a Reown Project ID:**
1. Visit [cloud.reown.com](https://cloud.reown.com)
2. Create a new project
3. Copy your Project ID to `NEXT_PUBLIC_PROJECT_ID`

### Deploy Smart Contract

```bash
# Install Hardhat dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts dotenv

# Compile
npx hardhat compile

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Verify on Basescan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start drawing!

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── farcaster/
│   │   │       └── route.ts      # Farcaster auth verification
│   │   └── mint/
│   │       └── route.ts          # Mint API endpoint
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Main drawing page
│   └── globals.css               # Global styles
├── components/
│   ├── DrawingCanvas.tsx         # Canvas component
│   └── FarcasterProvider.tsx     # Farcaster SDK integration
├── config/
│   └── index.tsx                 # Reown/Wagmi configuration
├── context/
│   └── index.tsx                 # React context providers
├── contracts/
│   └── DrawingNFT.sol            # ERC721 contract
├── lib/
│   ├── api.ts                    # Frontend API helper
│   ├── chain.ts                  # viem client config
│   └── ipfs.ts                   # Pinata IPFS helpers
├── scripts/
│   └── deploy.js                 # Hardhat deploy script
└── hardhat.config.js             # Hardhat configuration
```

## Authentication

The app supports two authentication methods:

1. **Farcaster**: When embedded in a Farcaster frame, users can sign in with their Farcaster account. The app automatically detects if it's running in a frame and shows the appropriate sign-in option.

2. **Wallet Connect**: Users can connect any wallet via Reown (WalletConnect) when not in a Farcaster frame or as an additional option.

The app intelligently prioritizes Farcaster authentication when in a frame, falling back to wallet connections otherwise.

## License

MIT

