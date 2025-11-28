/**
 * IPFS upload using Lighthouse Storage
 * 
 * Setup:
 * Add LIGHTHOUSE_API_KEY to your .env.local and Vercel environment variables
 */

/**
 * Upload an image buffer to IPFS via Lighthouse
 */
export async function uploadImageToIPFS(
  imageBuffer: Buffer,
  filename: string
): Promise<string> {
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'LIGHTHOUSE_API_KEY not configured. ' +
      'Please set it in .env.local or Vercel environment variables.'
    );
  }

  try {
    // Use native Node.js approach that works in Next.js/Vercel
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: image/png\r\n\r\n`),
      imageBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await fetch('https://upload.lighthouse.storage/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.Hash) {
      return `ipfs://${result.Hash}`;
    }
    
    throw new Error('No Hash in response');
  } catch (error: any) {
    console.error('Lighthouse upload error:', error);
    throw new Error(`Failed to upload image to IPFS: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Upload NFT metadata JSON to IPFS via Lighthouse
 */
export async function uploadMetadataToIPFS(metadata: {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string | number }>;
}): Promise<string> {
  const apiKey = process.env.LIGHTHOUSE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'LIGHTHOUSE_API_KEY not configured. ' +
      'Please set it in .env.local or Vercel environment variables.'
    );
  }

  try {
    const metadataJson = JSON.stringify(metadata, null, 2);
    const metadataBuffer = Buffer.from(metadataJson, 'utf-8');
    const filename = `${metadata.name.replace(/[^a-zA-Z0-9]/g, '-')}-metadata.json`;
    
    // Use native Node.js approach
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
    
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\n`),
      Buffer.from(`Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`),
      Buffer.from(`Content-Type: application/json\r\n\r\n`),
      metadataBuffer,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await fetch('https://upload.lighthouse.storage/api/v0/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    if (result.Hash) {
      return `ipfs://${result.Hash}`;
    }
    
    throw new Error('No Hash in response');
  } catch (error: any) {
    console.error('Lighthouse metadata upload error:', error);
    throw new Error(`Failed to upload metadata to IPFS: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Convert IPFS URI to HTTP gateway URL for preview
 */
export function ipfsToHttp(ipfsUri: string): string {
  if (ipfsUri.startsWith('ipfs://')) {
    const cid = ipfsUri.replace('ipfs://', '');
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
  }
  return ipfsUri;
}
