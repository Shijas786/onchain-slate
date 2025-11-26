export const mintNFT = async (imageData: string) => {
  try {
    const response = await fetch('/api/mint', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: imageData }),
    });

    if (!response.ok) {
      throw new Error('Failed to mint NFT');
    }

    return await response.json();
  } catch (error) {
    console.error('Minting error:', error);
    throw error;
  }
};

