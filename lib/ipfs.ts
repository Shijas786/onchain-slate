import PinataClient from '@pinata/sdk';

const pinata = new PinataClient({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY!,
});

/**
 * Upload an image buffer to IPFS via Pinata
 */
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const { Readable } = await import('stream');
  
  // Create a readable stream from buffer
  const stream = new Readable({
    read() {
      this.push(imageBuffer);
      this.push(null); // End the stream
    }
  });
  (stream as any).path = filename;

  const result = await pinata.pinFileToIPFS(stream, {
    pinataMetadata: {
      name: filename,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  });

  return `ipfs://${result.IpfsHash}`;
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
  const result = await pinata.pinJSONToIPFS(metadata, {
    pinataMetadata: {
      name: `${metadata.name}-metadata.json`,
    },
    pinataOptions: {
      cidVersion: 1,
    },
  });

  return `ipfs://${result.IpfsHash}`;
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

