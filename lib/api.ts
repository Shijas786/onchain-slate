export interface MintPreparationResult {
  metadataIpfsUri: string;
  metadataGatewayUrl: string;
  imageIpfsUri: string;
  imageGatewayUrl: string;
  suggestedName: string;
  timestamp: number;
}

export const prepareMint = async (imageData: string): Promise<MintPreparationResult> => {
  try {
    const response = await fetch('/api/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image: imageData,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mint NFT');
    }

    return await response.json();
  } catch (error) {
    console.error('Mint preparation error:', error);
    throw error;
  }
};
