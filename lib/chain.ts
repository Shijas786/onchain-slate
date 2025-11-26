import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia, base } from 'viem/chains';

// Select chain based on environment
const isMainnet = process.env.NEXT_PUBLIC_CHAIN === 'mainnet';
export const chain = isMainnet ? base : baseSepolia;

// RPC URL
const rpcUrl = isMainnet
  ? process.env.BASE_MAINNET_RPC_URL || 'https://mainnet.base.org'
  : process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org';

// Public client for reading from the blockchain
export const publicClient = createPublicClient({
  chain,
  transport: http(rpcUrl),
});

// Create wallet client with private key (server-side only)
export const getWalletClient = () => {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is not set');
  }

  // Ensure private key has 0x prefix
  const formattedKey = privateKey.startsWith('0x') 
    ? privateKey as `0x${string}` 
    : `0x${privateKey}` as `0x${string}`;

  const account = privateKeyToAccount(formattedKey);

  return createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });
};

// Get the signer account
export const getSignerAccount = () => {
  const privateKey = process.env.PRIVATE_KEY;
  
  if (!privateKey) {
    throw new Error('PRIVATE_KEY environment variable is not set');
  }

  const formattedKey = privateKey.startsWith('0x') 
    ? privateKey as `0x${string}` 
    : `0x${privateKey}` as `0x${string}`;

  return privateKeyToAccount(formattedKey);
};

// Contract address
export const getContractAddress = (): `0x${string}` => {
  const address = process.env.DRAWING_NFT_CONTRACT_ADDRESS;
  
  if (!address) {
    throw new Error('DRAWING_NFT_CONTRACT_ADDRESS environment variable is not set');
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

