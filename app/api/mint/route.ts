import { NextResponse } from 'next/server';
import { uploadImageToIPFS, uploadMetadataToIPFS, ipfsToHttp } from '@/lib/ipfs';

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
    const { image } = body;

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

    // Step 3: Return IPFS locations so the client can mint
    return NextResponse.json({
      success: true,
      metadataIpfsUri,
      metadataGatewayUrl: ipfsToHttp(metadataIpfsUri),
      imageIpfsUri,
      imageGatewayUrl: ipfsToHttp(imageIpfsUri),
      suggestedName: metadata.name,
      timestamp,
    });

  } catch (error) {
    console.error('Mint API error:', error);
    
    const message =
      error instanceof Error
        ? `Preparation failed: ${error.message}`
        : 'Internal server error';

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
