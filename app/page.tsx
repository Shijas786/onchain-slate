'use client';

import React, { useState, useRef, useMemo } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import { prepareMint } from '@/lib/api';
import { drawingNFTAbi, getDrawingNftAddress } from '@/lib/chain';
import { Eraser, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { useFarcaster } from '@/components/FarcasterProvider';
import { isAddress } from 'viem';
import Image from 'next/image';
import RecentDrawings from '@/components/RecentDrawings';
import { Logo } from '@/components/Logo';

const COLORS = [
  '#000000', // Black
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#EC4899', // Pink
];

const BRUSH_SIZES = [4, 8, 16];

export default function Home() {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const [color, setColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);
  const [isMinting, setIsMinting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Get connected wallet address from Wagmi
  const { address: wagmiAddress, isConnected: isWagmiConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  // Get Farcaster context
  const {
    isInFrame,
    user: farcasterUser,
    isSignedIn: isFarcasterSignedIn,
    isSigningIn: isFarcasterSigningIn,
    signIn: farcasterSignIn,
    walletAddress: farcasterWalletAddress,
    error: farcasterError,
  } = useFarcaster();

  // Determine the active wallet address (prioritize Farcaster in frame, otherwise Wagmi)
  const mintRecipient = useMemo(() => {
    if (isInFrame && farcasterWalletAddress) {
      return farcasterWalletAddress;
    }
    return wagmiAddress ?? null;
  }, [isInFrame, farcasterWalletAddress, wagmiAddress]);

  const canSignTransaction = Boolean(isWagmiConnected && walletClient && wagmiAddress);

  const drawingNftAddress = useMemo(() => {
    try {
      return getDrawingNftAddress();
    } catch {
      return null;
    }
  }, []);

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleMint = async () => {
    if (!drawingNftAddress) {
      setStatus({ type: 'error', message: 'Contract address not configured' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    if (!canSignTransaction || !walletClient || !wagmiAddress) {
      setStatus({ type: 'error', message: 'Connect your wallet before minting' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    if (!mintRecipient) {
      setStatus({ type: 'error', message: 'Recipient address is missing' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    if (!isAddress(mintRecipient)) {
      setStatus({ type: 'error', message: 'Recipient address is invalid' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    const image = canvasRef.current?.getImage();
    if (!image) return;

    setIsMinting(true);
    setStatus({ type: null, message: '' });

    try {
      const preparation = await prepareMint(image);

      const txHash = await walletClient.writeContract({
        address: drawingNftAddress,
        abi: drawingNFTAbi,
        functionName: 'mint',
        args: [mintRecipient as `0x${string}`, preparation.metadataIpfsUri],
      });

      if (publicClient) {
        await publicClient.waitForTransactionReceipt({
          hash: txHash,
          confirmations: 1,
        });
      }

      setStatus({ type: 'success', message: `NFT Minted! TX: ${txHash.slice(0, 10)}...` });
    } catch (error) {
      console.error('Mint failed', error);
      let message = 'Failed to mint NFT. Try again.';

      if (error instanceof Error) {
        if (/user rejected/i.test(error.message)) {
          message = 'Transaction rejected by wallet.';
        } else if (error.message) {
          message = error.message;
        }
      }

      setStatus({ type: 'error', message });
    } finally {
      setIsMinting(false);
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    }
  };

  const handleFarcasterSignIn = async () => {
    await farcasterSignIn();
    if (farcasterError) {
      setStatus({ type: 'error', message: farcasterError });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[#1a1b26] text-white flex flex-col p-6 font-sans selection:bg-[#FFD028] selection:text-black">
      {/* Isometric Grid Background Pattern */}
      <div className="fixed inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(to right, #334155 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-10 relative z-10">
        {/* Left Panel - Drawing Area */}
        <div className="flex-1 flex flex-col gap-8 max-w-3xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-4 text-white drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                <div className="relative bg-[#FFD028] p-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Logo className="w-10 h-10" />
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFD028] to-[#FF6B6B] stroke-black stroke-2">
                  Onchain Slate
                </span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base font-bold tracking-wide uppercase">
                Draw <span className="text-[#FF6B6B]">Masterpieces</span> • Mint on <span className="text-[#4CC9F0]">Base</span>
              </p>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Farcaster User Badge */}
              {isInFrame && farcasterUser && (
                <div className="flex items-center gap-3 bg-[#7C3AED] border-4 border-black text-white px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  {farcasterUser.pfpUrl && (
                    <Image
                      src={farcasterUser.pfpUrl}
                      alt={farcasterUser.displayName || farcasterUser.username || 'User'}
                      width={24}
                      height={24}
                      className="rounded-none border-2 border-black"
                      unoptimized
                    />
                  )}
                  <span>
                    {farcasterUser.displayName || `@${farcasterUser.username}`}
                  </span>
                </div>
              )}

              {/* Farcaster Sign In Button */}
              {isInFrame && !isFarcasterSignedIn && (
                <button
                  onClick={handleFarcasterSignIn}
                  disabled={isFarcasterSigningIn}
                  className="flex items-center gap-2 bg-[#855DCD] hover:bg-[#9F7AEA] text-white px-6 py-3 font-bold border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFarcasterSigningIn ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 1000 1000" fill="currentColor">
                        <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
                        <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" />
                        <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.444H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z" />
                      </svg>
                      Sign in
                    </>
                  )}
                </button>
              )}

              {/* Wallet Connect Buttons */}
              {!isInFrame && (
                <div className="flex gap-3 [&_button]:!border-4 [&_button]:!border-black [&_button]:!shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <appkit-network-button />
                  <appkit-button />
                </div>
              )}
            </div>
          </div>

          {/* Canvas Container - Isometric Block */}
          <div className="relative group">
            <div className="relative aspect-square w-full bg-white border-4 border-black shadow-[12px_12px_0px_0px_#334155] overflow-hidden">
              <DrawingCanvas
                ref={canvasRef}
                color={color}
                brushSize={brushSize}
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-[#24283b] border-4 border-black p-4 shadow-[8px_8px_0px_0px_#000] flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Colors */}
            <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-2 md:pb-0 px-2 scrollbar-hide">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 border-4 transition-all shrink-0 ${color === c
                      ? 'border-white scale-110 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)]'
                      : 'border-black hover:scale-105'
                    }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            <div className="h-1 w-full md:w-1 md:h-12 bg-black" />

            {/* Brush Size */}
            <div className="flex items-center gap-3 bg-black p-2 border-2 border-gray-700">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`p-2 transition-all border-2 ${brushSize === size
                      ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#4CC9F0]'
                      : 'text-gray-400 border-transparent hover:text-white'
                    }`}
                  aria-label={`Select brush size ${size}`}
                >
                  <div
                    className="bg-current"
                    style={{ width: Math.max(6, size / 2 + 6), height: Math.max(6, size / 2 + 6) }}
                  />
                </button>
              ))}
            </div>

            <div className="h-1 w-full md:w-1 md:h-12 bg-black" />

            {/* Actions */}
            <div className="flex items-center gap-4 w-full md:w-auto justify-end">
              <button
                onClick={handleClear}
                className="p-3 bg-[#FF6B6B] text-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                title="Clear Canvas"
              >
                <Eraser size={24} />
              </button>

              <button
                onClick={handleMint}
                disabled={isMinting || !canSignTransaction || !mintRecipient}
                className={`flex-1 md:flex-none px-8 py-3 bg-[#4CC9F0] text-black font-black text-lg border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[4px] hover:translate-y-[4px] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed min-w-[200px]`}
              >
                {isMinting ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    MINTING...
                  </>
                ) : !canSignTransaction ? (
                  <>CONNECT WALLET</>
                ) : !mintRecipient ? (
                  <>SET RECIPIENT</>
                ) : (
                  <>
                    <Sparkles size={24} />
                    MINT NFT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connected Address Display */}
          {(mintRecipient || (isWagmiConnected && wagmiAddress)) && (
            <div className="text-center text-sm font-bold font-mono tracking-wider">
              {mintRecipient && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-400 uppercase">Minting to:</span>
                  <span className={`px-3 py-1 bg-[#1e293b] border-2 border-black text-[#4CC9F0]`}>
                    {mintRecipient.slice(0, 6)}...{mintRecipient.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {status.message && (
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 z-50 ${status.type === 'success'
                ? 'bg-[#10B981] text-white'
                : 'bg-[#EF4444] text-white'
              }`}>
              {status.type === 'success' && <CheckCircle2 size={28} />}
              <span className="font-black text-xl uppercase tracking-wide">{status.message}</span>
            </div>
          )}
        </div>

        {/* Right Panel - Recent Drawings */}
        <div className="w-full lg:w-96 shrink-0">
          <RecentDrawings />
        </div>
      </div>
    </main>
  );
}
