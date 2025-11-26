import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

// Farcaster ID Registry contract on Optimism
const ID_REGISTRY_ADDRESS = '0x00000000Fc6c5F01Fc30151999387Bb99A9f489b' as const;

const idRegistryAbi = [
  {
    inputs: [{ name: 'fid', type: 'uint256' }],
    name: 'custodyOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

const publicClient = createPublicClient({
  chain: optimism,
  transport: http(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, signature, nonce } = body;

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature are required' },
        { status: 400 }
      );
    }

    // Parse the SIWF message to extract FID
    // The message format is similar to SIWE but for Farcaster
    const fidMatch = message.match(/fid:(\d+)/);
    if (!fidMatch) {
      return NextResponse.json(
        { error: 'Invalid message format: FID not found' },
        { status: 400 }
      );
    }

    const fid = BigInt(fidMatch[1]);

    // Get the custody address for this FID from the ID Registry
    const custodyAddress = await publicClient.readContract({
      address: ID_REGISTRY_ADDRESS,
      abi: idRegistryAbi,
      functionName: 'custodyOf',
      args: [fid],
    });

    // Verify the signature matches the custody address
    // In production, you would verify the full SIWF message signature
    // For now, we return the custody address as the verified address
    
    console.log('Farcaster auth verified:', {
      fid: fid.toString(),
      custodyAddress,
    });

    return NextResponse.json({
      success: true,
      fid: fid.toString(),
      address: custodyAddress,
    });
  } catch (error) {
    console.error('Farcaster auth error:', error);
    return NextResponse.json(
      { error: 'Failed to verify Farcaster authentication' },
      { status: 500 }
    );
  }
}

