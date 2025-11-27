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
    <main className="min-h-screen bg-[#0f172a] text-white flex flex-col p-4 font-sans selection:bg-pink-500 selection:text-white">
      {/* Background Glow Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Left Panel - Drawing Area */}
        <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-4xl md:text-5xl font-black tracking-tight flex items-center gap-3">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-black rounded-xl p-1">
                    <Logo className="w-12 h-12" />
                  </div>
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 drop-shadow-sm">
                  Onchain Slate
                </span>
              </h1>
              <p className="text-gray-400 text-sm md:text-base font-medium pl-1">
                Draw your <span className="text-pink-400">masterpiece</span> and mint it on <span className="text-blue-400">Base</span>
              </p>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Farcaster User Badge (when in frame) */}
              {isInFrame && farcasterUser && (
                <div className="flex items-center gap-2 bg-purple-900/50 border border-purple-500/30 text-purple-200 px-4 py-2 rounded-full text-sm backdrop-blur-md shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  {farcasterUser.pfpUrl && (
                    <Image
                      src={farcasterUser.pfpUrl}
                      alt={farcasterUser.displayName || farcasterUser.username || 'User'}
                      width={24}
                      height={24}
                      className="rounded-full ring-2 ring-purple-500/50"
                      unoptimized
                    />
                  )}
                  <span className="font-bold">
                    {farcasterUser.displayName || `@${farcasterUser.username}` || `FID: ${farcasterUser.fid}`}
                  </span>
                </div>
              )}

              {/* Farcaster Sign In Button (when in frame but not signed in) */}
              {isInFrame && !isFarcasterSignedIn && (
                <button
                  onClick={handleFarcasterSignIn}
                  disabled={isFarcasterSigningIn}
                  className="flex items-center gap-2 bg-[#855DCD] hover:bg-[#7C51C6] text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_4px_0_rgb(100,60,180)] hover:shadow-[0_2px_0_rgb(100,60,180)] translate-y-[-2px] hover:translate-y-[0px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFarcasterSigningIn ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
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

              {/* Wallet Connect Buttons (when not in frame or as additional option) */}
              {!isInFrame && (
                <div className="flex gap-2">
                  <appkit-network-button />
                  <appkit-button />
                </div>
              )}
            </div>
          </div>

          {/* Canvas Container - The "Tablet" Look */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 rounded-[20px] opacity-75 blur group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative aspect-square w-full bg-[#1a1b26] rounded-[18px] shadow-2xl overflow-hidden border-[8px] border-[#0f172a]">
              <DrawingCanvas
                ref={canvasRef}
                color={color}
                brushSize={brushSize}
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="bg-[#1e293b]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Colors */}
            <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-2 md:pb-0 px-2 scrollbar-hide">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-full border-[3px] transition-all shrink-0 ${color === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent hover:scale-110'
                    }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            <div className="h-px w-full md:w-px md:h-10 bg-white/10" />

            {/* Brush Size */}
            <div className="flex items-center gap-3 bg-black/20 p-1.5 rounded-xl">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`p-2 rounded-lg transition-all ${brushSize === size ? 'bg-white/20 text-white shadow-sm' : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  aria-label={`Select brush size ${size}`}
                >
                  <div
                    className="bg-current rounded-full"
                    style={{ width: Math.max(4, size / 2 + 4), height: Math.max(4, size / 2 + 4) }}
                  />
                </button>
              ))}
            </div>

            <div className="h-px w-full md:w-px md:h-10 bg-white/10" />

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleClear}
                className="p-3 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                title="Clear Canvas"
              >
                <Eraser size={22} />
              </button>

              <button
                onClick={handleMint}
                disabled={isMinting || !canSignTransaction || !mintRecipient}
                className={`flex-1 md:flex-none px-8 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-400 hover:via-purple-400 hover:to-cyan-400 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[180px] shadow-[0_4px_0_rgb(160,30,160)] hover:shadow-[0_2px_0_rgb(160,30,160)] translate-y-[-2px] hover:translate-y-[0px] active:translate-y-[2px] active:shadow-none`}
              >
                {isMinting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Minting...
                  </>
                ) : !canSignTransaction ? (
                  <>Connect Wallet</>
                ) : !mintRecipient ? (
                  <>Set Recipient</>
                ) : (
                  <>
                    <Sparkles size={20} className="text-yellow-300" />
                    Mint NFT
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Connected Address Display */}
          {(mintRecipient || (isWagmiConnected && wagmiAddress)) && (
            <div className="text-center text-sm text-gray-500 space-y-1 font-mono">
              {mintRecipient && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-gray-400">Minting to:</span>
                  <span className={`px-2 py-0.5 rounded bg-white/5 ${isInFrame && isFarcasterSignedIn ? 'text-purple-400 border border-purple-500/30' : 'text-cyan-400 border border-cyan-500/30'}`}>
                    {mintRecipient.slice(0, 6)}...{mintRecipient.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {status.message && (
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 z-50 border backdrop-blur-md ${status.type === 'success'
                ? 'bg-green-500/20 text-green-200 border-green-500/50'
                : 'bg-red-500/20 text-red-200 border-red-500/50'
              }`}>
              {status.type === 'success' && <CheckCircle2 size={24} className="text-green-400" />}
              <span className="font-bold text-lg">{status.message}</span>
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
