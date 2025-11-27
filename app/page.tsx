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
    <main className="min-h-screen bg-[#008080] p-4 font-sans flex flex-col items-center justify-center selection:bg-[#000080] selection:text-white">

      {/* Main "Paint" Window */}
      <div className="w-full max-w-6xl bg-[#c0c0c0] border-[3px] border-t-white border-l-white border-b-black border-r-black shadow-xl flex flex-col">

        {/* Title Bar */}
        <div className="bg-[#000080] px-2 py-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-4 h-4" />
            <h1 className="text-white font-bold text-sm tracking-wide">Onchain Paint - Untitled</h1>
          </div>
          <div className="flex gap-1">
            <button className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
              <div className="w-2 h-0.5 bg-black"></div>
            </button>
            <button className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white">
              <div className="w-2 h-2 border border-black border-t-2"></div>
            </button>
            <button className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-[10px] font-bold leading-none pb-1">
              x
            </button>
          </div>
        </div>

        {/* Menu Bar (Visual Only) */}
        <div className="flex gap-4 px-2 py-1 text-sm border-b border-gray-400 shadow-[0_1px_0_white]">
          <span className="underline decoration-1 underline-offset-2">F</span>ile
          <span className="underline decoration-1 underline-offset-2">E</span>dit
          <span className="underline decoration-1 underline-offset-2">V</span>iew
          <span className="underline decoration-1 underline-offset-2">I</span>mage
          <span className="underline decoration-1 underline-offset-2">O</span>ptions
          <span className="underline decoration-1 underline-offset-2">H</span>elp
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row p-1 gap-1 h-full">

          {/* Left Toolbar (Tools & Colors) */}
          <div className="w-full lg:w-64 flex flex-col gap-2 shrink-0">

            {/* Tools Panel */}
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-500 border-r-gray-500 p-1">
              <div className="grid grid-cols-2 gap-1 mb-2">
                <button
                  onClick={handleClear}
                  className="h-8 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white flex items-center justify-center"
                  title="Clear Canvas"
                >
                  <Eraser size={16} />
                </button>
                <button className="h-8 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white flex items-center justify-center">
                  <Sparkles size={16} />
                </button>
              </div>

              {/* Brush Sizes */}
              <div className="bg-white border-2 border-t-black border-l-black border-b-white border-r-white p-2 mb-2">
                <div className="flex flex-col gap-2">
                  {BRUSH_SIZES.map((size) => (
                    <button
                      key={size}
                      onClick={() => setBrushSize(size)}
                      className={`flex items-center gap-2 px-2 py-1 hover:bg-[#000080] hover:text-white group ${brushSize === size ? 'bg-[#000080] text-white' : ''}`}
                    >
                      <div className={`bg-current rounded-full`} style={{ width: size, height: size }} />
                      <span className="text-xs">{size}px</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Box */}
              <div className="border-2 border-t-white border-l-white border-b-gray-500 border-r-gray-500 p-1">
                <div className="grid grid-cols-4 gap-1">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 border-2 ${color === c ? 'border-black border-dashed' : 'border-t-gray-500 border-l-gray-500 border-b-white border-r-white'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="w-8 h-8 border-2 border-t-gray-500 border-l-gray-500 border-b-white border-r-white" style={{ backgroundColor: color }} />
                  <span className="text-xs">Selected</span>
                </div>
              </div>
            </div>

            {/* Auth / Mint Panel */}
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-500 border-r-gray-500 p-2 flex flex-col gap-2">
              {isInFrame && !isFarcasterSignedIn ? (
                <button
                  onClick={handleFarcasterSignIn}
                  disabled={isFarcasterSigningIn}
                  className="w-full py-1 px-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  {isFarcasterSigningIn ? <Loader2 size={12} className="animate-spin" /> : 'Sign In'}
                </button>
              ) : null}

              {!isInFrame && (
                <div className="scale-75 origin-left">
                  <appkit-button />
                </div>
              )}

              <button
                onClick={handleMint}
                disabled={isMinting || !canSignTransaction || !mintRecipient}
                className="w-full py-2 px-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black active:border-t-black active:border-l-black active:border-b-white active:border-r-white text-sm font-bold flex items-center justify-center gap-2 disabled:text-gray-500"
              >
                {isMinting ? 'Minting...' : 'MINT NFT'}
              </button>
            </div>

            {/* Status Bar */}
            {status.message && (
              <div className={`p-1 text-xs border border-gray-500 ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {status.message}
              </div>
            )}
          </div>

          {/* Canvas Area */}
          <div className="flex-1 bg-[#808080] p-4 overflow-auto border-2 border-t-black border-l-black border-b-white border-r-white shadow-inner">
            <div className="bg-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]">
              <DrawingCanvas
                ref={canvasRef}
                color={color}
                brushSize={brushSize}
              />
            </div>
          </div>

          {/* Right Panel - Recent Drawings (Now integrated as a sidebar) */}
          <div className="w-full lg:w-72 shrink-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-500 border-r-gray-500 p-1 flex flex-col">
            <div className="bg-[#000080] text-white px-1 py-0.5 text-xs font-bold mb-1">Gallery.exe</div>
            <RecentDrawings />
          </div>

        </div>

        {/* Footer Status Bar */}
        <div className="border-t border-gray-400 p-1 flex gap-2 text-xs text-gray-600 shadow-[0_1px_0_white_inset]">
          <div className="flex-1 border border-gray-400 px-1 shadow-[1px_1px_0_white]">
            {mintRecipient ? `Minting to: ${mintRecipient.slice(0, 6)}...` : 'Ready'}
          </div>
          <div className="w-24 border border-gray-400 px-1 shadow-[1px_1px_0_white]">
            {brushSize}px
          </div>
        </div>
      </div>
    </main>
  );
}
