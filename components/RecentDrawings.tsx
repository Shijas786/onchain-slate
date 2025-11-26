'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePublicClient } from 'wagmi';
import { getDrawingNftAddress } from '@/lib/chain';
import { ipfsToHttp } from '@/lib/ipfs';
import { parseAbiItem } from 'viem';
import Image from 'next/image';
import { Loader2, RefreshCcw } from 'lucide-react';

interface Drawing {
  tokenId: string;
  owner: string;
  imageUrl: string;
  name: string;
  blockNumber: bigint;
}

export default function RecentDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const publicClient = usePublicClient();

  const fetchDrawings = useCallback(async () => {
    if (!publicClient) return;

    try {
      setIsLoading(true);
      let contractAddress: `0x${string}`;
      try {
        contractAddress = getDrawingNftAddress();
      } catch {
        console.error('Contract address not configured');
        setIsLoading(false);
        return;
      }

      // Get the current block number to limit the search range if needed
      // For now, we'll fetch all events and take the last 10, 
      // but in production you might want to limit the block range.
      const logs = await publicClient.getLogs({
        address: contractAddress,
        event: parseAbiItem('event DrawingMinted(address indexed to, uint256 indexed tokenId, string tokenURI)'),
        fromBlock: 'earliest', 
      });

      // Process logs in reverse order (newest first)
      const recentLogs = logs.slice().reverse().slice(0, 10);

      const fetchedDrawings = await Promise.all(
        recentLogs.map(async (log) => {
          try {
            const { tokenId, to, tokenURI } = log.args;
            
            if (!tokenURI) return null;

            // Convert IPFS URI to HTTP
            const metadataUrl = ipfsToHttp(tokenURI);
            const response = await fetch(metadataUrl);
            const metadata = await response.json();
            
            const imageUrl = ipfsToHttp(metadata.image);

            return {
              tokenId: tokenId?.toString() || '0',
              owner: to || '',
              imageUrl,
              name: metadata.name || `Drawing #${tokenId}`,
              blockNumber: log.blockNumber ?? BigInt(0),
            };
          } catch (err) {
            console.error('Error fetching metadata for token', log.args.tokenId, err);
            return null;
          }
        })
      );

      // Filter out failed fetches
      setDrawings(fetchedDrawings.filter((d): d is Drawing => d !== null));
    } catch (error) {
      console.error('Error fetching recent drawings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient]);

  useEffect(() => {
    fetchDrawings();
  }, [fetchDrawings]);

  if (!publicClient) return null;

  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-xl border-2 border-dashed border-gray-300 h-full max-h-[800px] overflow-y-auto flex flex-col gap-4 transform rotate-1 hover:rotate-0 transition-transform duration-300">
      <div className="flex items-center justify-between sticky top-0 bg-white/90 p-2 rounded-lg z-10 border-b-2 border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 tracking-tight font-handwriting">
          Recent Masterpieces 🎨
        </h2>
        <button 
          onClick={fetchDrawings}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Refresh drawings"
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin text-blue-500' : 'text-gray-500'} />
        </button>
      </div>

      {isLoading && drawings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-2">
          <Loader2 size={32} className="animate-spin" />
          <span className="font-medium">Loading gallery...</span>
        </div>
      ) : drawings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 italic">
          No drawings yet. Be the first!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {drawings.map((drawing) => (
            <div 
              key={drawing.tokenId} 
              className="group bg-white rounded-xl p-3 shadow-sm border border-gray-200 hover:shadow-md hover:scale-[1.02] transition-all duration-200"
            >
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-50 mb-3 relative border border-gray-100">
                <Image
                  src={drawing.imageUrl}
                  alt={drawing.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-bold text-gray-800 truncate text-lg font-handwriting">
                  {drawing.name}
                </span>
                <div className="flex justify-between items-center text-xs text-gray-500 font-mono">
                  <span>#{drawing.tokenId}</span>
                  <span title={drawing.owner}>
                    by {drawing.owner.slice(0, 6)}...{drawing.owner.slice(-4)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
