import { NextResponse } from 'next/server';
import { uploadImageToIPFS, uploadMetadataToIPFS, ipfsToHttp } from '@/lib/ipfs';
import { 
  publicClient, 
  getWalletClient, 
  getContractAddress, 
  getSignerAccount,
  drawingNFTAbi 
} from '@/lib/chain';

// Validation helpers
function isValidBase64PNG(data: string): boolean {
  // Check for data URI format
  if (data.startsWith('data:image/png;base64,')) {
    return true;
  }
  // Check for raw base64 (must be valid base64 characters)
  const base64Regex = /^[A-Za-z0-9+/]+=*$/;
  return base64Regex.test(data);
}

function isCanvasEmpty(buffer: Buffer): boolean {
  // PNG header is 8 bytes, check if file is suspiciously small
  // A completely white 500x500 canvas is still ~2KB compressed
  // An empty/minimal canvas would be much smaller
  if (buffer.length < 1000) {
    return true;
  }
  return false;
}

function extractBase64Data(data: string): string {
  if (data.startsWith('data:image/png;base64,')) {
    return data.split(',')[1];
  }
  return data;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, recipientAddress } = body;

    // Validation: Check if image is provided
    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Validation: Check if image is valid base64 PNG
    if (!isValidBase64PNG(image)) {
      return NextResponse.json(
        { error: 'Invalid image format. Must be base64 PNG.' },
        { status: 400 }
      );
    }

    // Extract pure base64 data
    const base64Data = extractBase64Data(image);
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');

    // Validation: Check if canvas is empty
    if (isCanvasEmpty(imageBuffer)) {
      return NextResponse.json(
        { error: 'Canvas appears to be empty. Please draw something first.' },
        { status: 400 }
      );
    }

    console.log('Processing mint request...');
    console.log('Image buffer size:', imageBuffer.length, 'bytes');

    // Step 1: Upload image to IPFS
    const timestamp = Date.now();
    const imageFilename = `drawing-${timestamp}.png`;
    
    console.log('Uploading image to IPFS...');
    const imageIpfsUri = await uploadImageToIPFS(imageBuffer, imageFilename);
    console.log('Image uploaded:', imageIpfsUri);

    // Step 2: Create and upload metadata
    const metadata = {
      name: `Drawing #${timestamp}`,
      description: 'A unique hand-drawn NFT created on Onchain Slate',
      image: imageIpfsUri,
      attributes: [
        { trait_type: 'Created', value: new Date().toISOString() },
        { trait_type: 'Platform', value: 'Onchain Slate' },
      ],
    };

    console.log('Uploading metadata to IPFS...');
    const metadataIpfsUri = await uploadMetadataToIPFS(metadata);
    console.log('Metadata uploaded:', metadataIpfsUri);

    // Step 3: Mint NFT on-chain
    const walletClient = getWalletClient();
    const account = getSignerAccount();
    const contractAddress = getContractAddress();

    // Use recipient address if provided, otherwise mint to the backend wallet
    // In production, you'd want to get this from the user's connected wallet
    const mintTo = recipientAddress 
      ? recipientAddress as `0x${string}`
      : account.address;

    console.log('Minting NFT to:', mintTo);
    console.log('Contract address:', contractAddress);

    // Simulate the transaction first to catch any errors
    const { request: simulateRequest } = await publicClient.simulateContract({
      address: contractAddress,
      abi: drawingNFTAbi,
      functionName: 'mint',
      args: [mintTo, metadataIpfsUri],
      account,
    });

    // Execute the mint transaction
    const txHash = await walletClient.writeContract(simulateRequest);
    console.log('Transaction submitted:', txHash);

    // Wait for transaction confirmation
    const receipt = await publicClient.waitForTransactionReceipt({ 
      hash: txHash,
      confirmations: 1,
    });
    console.log('Transaction confirmed in block:', receipt.blockNumber);

    // Get the token ID from the event logs
    let tokenId: bigint | undefined;
    for (const log of receipt.logs) {
      try {
        // DrawingMinted event topic
        if (log.topics[0] === '0x8a0e37b73a0d9c82e205f6c6a4a9b8c0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4') {
          tokenId = BigInt(log.topics[2] || '0');
          break;
        }
      } catch {
        // Skip logs that don't match
      }
    }

    return NextResponse.json({
      success: true,
      txHash,
      tokenURI: metadataIpfsUri,
      tokenURIHttp: ipfsToHttp(metadataIpfsUri),
      imageURI: imageIpfsUri,
      imageURIHttp: ipfsToHttp(imageIpfsUri),
      tokenId: tokenId?.toString(),
      mintedTo: mintTo,
      blockNumber: receipt.blockNumber.toString(),
    });

  } catch (error) {
    console.error('Mint API error:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('PRIVATE_KEY')) {
        return NextResponse.json(
          { error: 'Server configuration error: Missing private key' },
          { status: 500 }
        );
      }
      if (error.message.includes('CONTRACT_ADDRESS')) {
        return NextResponse.json(
          { error: 'Server configuration error: Missing contract address' },
          { status: 500 }
        );
      }
      if (error.message.includes('insufficient funds')) {
        return NextResponse.json(
          { error: 'Server wallet has insufficient funds for gas' },
          { status: 500 }
        );
      }
      if (error.message.includes('Ownable')) {
        return NextResponse.json(
          { error: 'Server wallet is not the contract owner' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: `Minting failed: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
