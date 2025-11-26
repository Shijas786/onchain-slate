export const mintNFT = async (imageData: string, recipientAddress?: string) => {
  try {
    const response = await fetch('/api/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        image: imageData,
        recipientAddress,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mint NFT');
    }

    return await response.json();
  } catch (error) {
    console.error('Minting error:', error);
    throw error;
  }
};
