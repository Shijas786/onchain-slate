'use client';

import React, { useState, useRef, useMemo, useEffect } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import { prepareMint } from '@/lib/api';
import { drawingNFTAbi, getDrawingNftAddress } from '@/lib/chain';
import { Eraser, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAccount, useConnect, usePublicClient, useWalletClient } from 'wagmi';
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
  const { connect, connectors, status: connectStatus } = useConnect();
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

  useEffect(() => {
    if (!isInFrame) return;
    if (isWagmiConnected || connectStatus === 'pending') return;
    const farcasterConnector = connectors.find((c) => c.id === 'farcaster-miniapp');
    if (farcasterConnector) {
      try {
        connect({ connector: farcasterConnector });
      } catch {
        /* ignore auto-connect failures */
      }
    }
  }, [isInFrame, isWagmiConnected, connectStatus, connectors, connect]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col p-4 font-sans">
      <div className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        {/* Left Panel - Drawing Area */}
        <div className="flex-1 flex flex-col gap-6 max-w-3xl mx-auto w-full">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Logo className="w-10 h-10" />
                Onchain Slate
              </h1>
              <p className="text-gray-500 text-sm md:text-base">Draw your masterpiece and mint it as an NFT on Base</p>
            </div>

            {/* Auth Section */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Farcaster User Badge (when in frame) */}
              {isInFrame && farcasterUser && (
                <div className="flex items-center gap-2 bg-purple-100 text-purple-800 px-3 py-1.5 rounded-full text-sm">
                  {farcasterUser.pfpUrl && (
                    <Image
                      src={farcasterUser.pfpUrl}
                      alt={farcasterUser.displayName || farcasterUser.username || 'User'}
                      width={20}
                      height={20}
                      className="rounded-full"
                      unoptimized
                    />
                  )}
                  <span className="font-medium">
                    {farcasterUser.displayName || `@${farcasterUser.username}` || `FID: ${farcasterUser.fid}`}
                  </span>
                </div>
              )}

              {/* Farcaster Sign In Button (when in frame but not signed in) */}
              {isInFrame && !isFarcasterSignedIn && (
                <button
                  onClick={handleFarcasterSignIn}
                  disabled={isFarcasterSigningIn}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {isFarcasterSigningIn ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" viewBox="0 0 1000 1000" fill="currentColor">
                        <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z" />
                        <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z" />
                        <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.444H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z" />
                      </svg>
                      Sign in with Farcaster
                    </>
                  )}
                </button>
              )}

            {/* Wallet Connect Buttons (when not in frame or as additional option) */}
            {!isInFrame && (
              <div className="flex items-center gap-2 flex-wrap">
                <appkit-network-button />
                <appkit-button />
              </div>
            )}
            </div>
          </div>

          {/* Canvas Container */}
          <div className="aspect-square w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200/50 ring-1 ring-black/5">
            <DrawingCanvas
              ref={canvasRef}
              color={color}
              brushSize={brushSize}
            />
          </div>

          {/* Toolbar */}
          <div className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">

            {/* Colors */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 md:pb-0 px-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                    }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                />
              ))}
            </div>

            <div className="h-px w-full md:w-px md:h-8 bg-gray-700" />

            {/* Brush Size */}
            <div className="flex items-center gap-3">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setBrushSize(size)}
                  className={`p-2 rounded-lg transition-colors ${brushSize === size ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
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

            <div className="h-px w-full md:w-px md:h-8 bg-gray-700" />

            {/* Actions */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
              <button
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                title="Clear Canvas"
              >
                <Eraser size={20} />
              </button>

              {!canSignTransaction || !mintRecipient ? (
                <button
                  onClick={isInFrame ? handleFarcasterSignIn : connect}
                  disabled={isMinting}
                  className="flex-1 md:flex-none px-6 py-2.5 bg-gray-700 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 min-w-[160px]"
                >
                  {isInFrame ? 'Sign in with Farcaster' : 'Connect Wallet'}
                </button>
              ) : (
                <button
                  onClick={handleMint}
                  disabled={isMinting}
                  className={`flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 min-w-[160px] shadow-lg shadow-blue-500/25`}
                >
                  {isMinting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Minting...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Mint as NFT
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Connected Address Display */}
          {(mintRecipient || (isWagmiConnected && wagmiAddress)) && (
            <div className="text-center text-sm text-gray-500 space-y-1">
              {mintRecipient && (
                <div>
                  Minting to:{' '}
                  <span className={`font-mono ${isInFrame && isFarcasterSignedIn ? 'text-purple-700' : 'text-gray-700'}`}>
                    {mintRecipient.slice(0, 6)}...{mintRecipient.slice(-4)}
                  </span>
                </div>
              )}
              {isWagmiConnected && wagmiAddress && (
                <div>
                  Signing wallet:{' '}
                  <span className="font-mono text-gray-700">
                    {wagmiAddress.slice(0, 6)}...{wagmiAddress.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Status Message */}
          {status.message && (
            <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-50 ${status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
              {status.type === 'success' && <CheckCircle2 size={18} />}
              <span className="text-sm font-medium">{status.message}</span>
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
