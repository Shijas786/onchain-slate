# Farcaster Mini App Setup Guide

## Prerequisites

1. ✅ App deployed to public URL (Vercel: https://onchain-slate.vercel.app)
2. ✅ Contract deployed: `0x4C44F4a9226905578a43e49813f0a1855a6aF5D0`
3. ✅ Environment variables configured in Vercel

## Steps to Make Live on Farcaster

### 1. Verify Deployment

Ensure your Vercel deployment is live and accessible:
- Visit: https://onchain-slate.vercel.app
- Verify the app loads correctly
- Check that `.well-known/farcaster.json` is accessible:
  - https://onchain-slate.vercel.app/.well-known/farcaster.json

### 2. Create App Icon

Create a square icon (at least 512x512px) and save it as:
- `public/icon.png`

This will be used for the Mini App icon in Warpcast.

### 3. Register with Farcaster

1. **Go to Farcaster Mini Apps Directory:**
   - Visit: https://warpcast.com/~/developers/miniapps
   - Or navigate through Warpcast settings → Developers → Mini Apps

2. **Submit Your Mini App:**
   - **Name:** Onchain Slate
   - **Description:** Draw and mint your artwork as NFTs on Base
   - **Home URL:** https://onchain-slate.vercel.app
   - **Icon URL:** https://onchain-slate.vercel.app/icon.png
   - **Splash Image:** https://onchain-slate.vercel.app/icon.png (optional)

3. **Wait for Approval:**
   - Farcaster team will review your submission
   - This can take a few days

### 4. Test in Warpcast

Once approved:
1. Open Warpcast app
2. Navigate to Mini Apps section
3. Find "Onchain Slate"
4. Open it and test:
   - Drawing on canvas
   - Connecting Farcaster wallet
   - Minting an NFT

### 5. Share Your Mini App

After approval, users can:
- Access via Warpcast Mini Apps directory
- Share direct links to your Mini App
- Embed in Frames (if you add Frame support later)

## Troubleshooting

### Manifest Not Found
- Ensure `.well-known/farcaster.json` is in `public/` folder
- Vercel should serve it automatically at `/.well-known/farcaster.json`

### Wallet Not Connecting
- Verify `NEXT_PUBLIC_DRAWING_NFT_CONTRACT_ADDRESS` is set in Vercel env vars
- Check browser console for errors
- Ensure contract is deployed on the correct network (Base Sepolia or Base Mainnet)

### Contract Address
Make sure your Vercel environment variables include:
```
NEXT_PUBLIC_DRAWING_NFT_CONTRACT_ADDRESS=0x4C44F4a9226905578a43e49813f0a1855a6aF5D0
NEXT_PUBLIC_CHAIN=sepolia  # or 'mainnet'
NEXT_PUBLIC_PROJECT_ID=your_walletconnect_project_id
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret
```

## Next Steps

- [ ] Create and upload `public/icon.png` (512x512px recommended)
- [ ] Submit to Farcaster Mini Apps directory
- [ ] Test minting flow in Warpcast
- [ ] Share with community!

