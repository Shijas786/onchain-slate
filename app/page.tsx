'use client';

import React, { useState, useRef } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from '@/components/DrawingCanvas';
import { mintNFT } from '@/lib/api';
import { Eraser, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { useAccount } from 'wagmi';

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

  // Get connected wallet address
  const { address, isConnected } = useAccount();

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  const handleMint = async () => {
    if (!isConnected || !address) {
      setStatus({ type: 'error', message: 'Please connect your wallet first' });
      setTimeout(() => setStatus({ type: null, message: '' }), 3000);
      return;
    }

    const image = canvasRef.current?.getImage();
    if (!image) return;

    setIsMinting(true);
    setStatus({ type: null, message: '' });

    try {
      // Strip prefix if needed, but usually API handles data URI
      // const base64 = image.split(',')[1]; 
      const result = await mintNFT(image, address);
      setStatus({ type: 'success', message: `NFT Minted! TX: ${result.txHash?.slice(0, 10)}...` });
    } catch (error) {
      setStatus({ type: 'error', message: 'Failed to mint NFT. Try again.' });
    } finally {
      setIsMinting(false);
      // Clear status after 5 seconds
      setTimeout(() => setStatus({ type: null, message: '' }), 5000);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <Sparkles className="w-8 h-8 text-blue-500" />
              Onchain Slate
            </h1>
            <p className="text-gray-500 text-sm md:text-base">Draw your masterpiece and mint it as an NFT on Base</p>
          </div>
          
          {/* Wallet Connect Button */}
          <div className="flex items-center gap-2">
            <appkit-network-button />
            <appkit-button />
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
                className={`w-8 h-8 rounded-full border-2 transition-all shrink-0 ${
                  color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
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
                className={`p-2 rounded-lg transition-colors ${
                  brushSize === size ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
                }`}
                aria-label={`Select brush size ${size}`}
              >
                <div 
                  className="bg-current rounded-full" 
                  style={{ width: Math.max(4, size/2 + 4), height: Math.max(4, size/2 + 4) }} 
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
            
            <button
              onClick={handleMint}
              disabled={isMinting || !isConnected}
              className={`flex-1 md:flex-none px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] shadow-lg shadow-blue-500/25`}
            >
              {isMinting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Minting...
                </>
              ) : !isConnected ? (
                <>Connect Wallet</>
              ) : (
                <>
                  <Sparkles size={18} />
                  Mint as NFT
                </>
              )}
            </button>
          </div>
        </div>

        {/* Connected Address Display */}
        {isConnected && address && (
          <div className="text-center text-sm text-gray-500">
            Connected: <span className="font-mono text-gray-700">{address.slice(0, 6)}...{address.slice(-4)}</span>
          </div>
        )}

        {/* Status Message */}
        {status.message && (
          <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 z-50 ${
            status.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {status.type === 'success' && <CheckCircle2 size={18} />}
            <span className="text-sm font-medium">{status.message}</span>
          </div>
        )}
      </div>
    </main>
  );
}
