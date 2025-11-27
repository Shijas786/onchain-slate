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
    <div className="bg-[#24283b] p-6 border-4 border-black shadow-[8px_8px_0px_0px_#000] h-full max-h-[800px] overflow-y-auto flex flex-col gap-6 scrollbar-thin scrollbar-thumb-[#4CC9F0] scrollbar-track-[#1e293b]">
      <div className="flex items-center justify-between sticky top-0 bg-[#24283b] p-2 z-10 border-b-4 border-black pb-4">
        <h2 className="text-2xl font-black text-white tracking-tight uppercase drop-shadow-[2px_2px_0_#000]">
          Gallery 🎨
        </h2>
        <button
          onClick={fetchDrawings}
          className="p-2 bg-white border-2 border-black shadow-[2px_2px_0px_0px_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          title="Refresh drawings"
        >
          <RefreshCcw size={20} className={`text-black ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {isLoading && drawings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400 gap-4">
          <Loader2 size={40} className="animate-spin text-[#FFD028]" />
          <span className="font-bold uppercase tracking-widest">Loading...</span>
        </div>
      ) : drawings.length === 0 ? (
        <div className="text-center py-12 text-gray-500 font-bold uppercase">
          No drawings yet.<br />Be the first!
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {drawings.map((drawing) => (
            <div
              key={drawing.tokenId}
              className="group bg-white p-3 border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[2px_2px_0px_0px_#000] hover:translate-x-[4px] hover:translate-y-[4px] transition-all duration-200"
            >
              <div className="aspect-square w-full overflow-hidden border-2 border-black bg-gray-100 mb-3 relative">
                <Image
                  src={drawing.imageUrl}
                  alt={drawing.name}
                  fill
                  className="object-contain p-2"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  unoptimized
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-black text-black truncate text-lg uppercase">
                  {drawing.name}
                </span>
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span className="bg-black text-white px-2 py-0.5">#{drawing.tokenId}</span>
                  <span title={drawing.owner} className="text-gray-600">
                    {drawing.owner.slice(0, 6)}...{drawing.owner.slice(-4)}
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
