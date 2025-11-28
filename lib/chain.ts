import { baseSepolia, base } from 'viem/chains';

// Select chain based on environment (default to mainnet)
const isSepolia = process.env.NEXT_PUBLIC_CHAIN === 'sepolia';
export const chain = isSepolia ? baseSepolia : base;

// Public contract address (used on both client & server)
export const getDrawingNftAddress = (): `0x${string}` => {
  const address = process.env.NEXT_PUBLIC_DRAWING_NFT_CONTRACT_ADDRESS;

  if (!address) {
    throw new Error('NEXT_PUBLIC_DRAWING_NFT_CONTRACT_ADDRESS is not set');
  }

  return address as `0x${string}`;
};

// DrawingNFT Contract ABI (only the functions we need)
export const drawingNFTAbi = [
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'uri', type: 'string' },
    ],
    name: 'mint',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getCurrentTokenId',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'to', type: 'address' },
      { indexed: true, name: 'tokenId', type: 'uint256' },
      { indexed: false, name: 'tokenURI', type: 'string' },
    ],
    name: 'DrawingMinted',
    type: 'event',
  },
] as const;

