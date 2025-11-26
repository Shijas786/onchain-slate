# Onchain Slate

A web-based Drawing → NFT minting app built with Next.js and deployed on Base.

## Features

- **Drawing Canvas**: Responsive HTML5 canvas with brush size and color selection
- **NFT Minting**: Upload drawings to IPFS and mint as ERC721 NFTs on Base
- **Mobile-Friendly**: Touch support for drawing on mobile devices

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Smart Contract**: Solidity, OpenZeppelin, Hardhat
- **Blockchain**: Base (Sepolia testnet / Mainnet)
- **Storage**: IPFS via Pinata
- **Wallet**: viem for server-side signing

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A wallet with Base ETH for gas
- Pinata API keys

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

# Optional
NEXT_PUBLIC_CHAIN=sepolia  # or 'mainnet'
BASESCAN_API_KEY=your_basescan_api_key
```

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
│   ├── api/mint/route.ts    # Mint API endpoint
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main drawing page
├── components/
│   └── DrawingCanvas.tsx    # Canvas component
├── contracts/
│   └── DrawingNFT.sol       # ERC721 contract
├── lib/
│   ├── api.ts               # Frontend API helper
│   ├── chain.ts             # viem client config
│   └── ipfs.ts              # Pinata IPFS helpers
├── scripts/
│   └── deploy.js            # Hardhat deploy script
└── hardhat.config.js        # Hardhat configuration
```

## License

MIT

