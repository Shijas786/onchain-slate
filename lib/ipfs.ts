import PinataClient from '@pinata/sdk';

// Get Pinata client instance (lazy initialization)
function getPinataClient(): PinataClient {
  const apiKey = process.env.PINATA_API_KEY;
  const secretKey = process.env.PINATA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('Pinata API keys not configured. Please set PINATA_API_KEY and PINATA_SECRET_KEY environment variables in Vercel.');
  }

  try {
    return new PinataClient({
      pinataApiKey: apiKey,
      pinataSecretApiKey: secretKey,
    });
  } catch (error) {
    throw new Error(`Failed to initialize Pinata client: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Upload an image buffer to IPFS via Pinata
 */
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const pinata = getPinataClient();
  const { Readable } = await import('stream');
  
  // Create a readable stream from buffer
  const stream = new Readable({
    read() {
      this.push(imageBuffer);
      this.push(null); // End the stream
    }
  });
  (stream as any).path = filename;

  try {
    const result = await pinata.pinFileToIPFS(stream, {
      pinataMetadata: {
        name: filename,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    });

    if (!result || !result.IpfsHash) {
      throw new Error('Pinata upload failed: No IPFS hash returned');
    }

    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload image to IPFS: ${errorMessage}`);
  }
}

/**
 * Upload NFT metadata JSON to IPFS via Pinata
 */
export async function uploadMetadataToIPFS(metadata: {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}): Promise<string> {
  const pinata = getPinataClient();

  try {
    const result = await pinata.pinJSONToIPFS(metadata, {
      pinataMetadata: {
        name: `${metadata.name}-metadata.json`,
      },
      pinataOptions: {
        cidVersion: 1,
      },
    });

    if (!result || !result.IpfsHash) {
      throw new Error('Pinata upload failed: No IPFS hash returned');
    }

    return `ipfs://${result.IpfsHash}`;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to upload metadata to IPFS: ${errorMessage}`);
  }
}

/**
 * Convert IPFS URI to HTTP gateway URL for preview
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '');
    return `https://gateway.pinata.cloud/ipfs/${cid}`;
  }
  return ipfsUri;
}

