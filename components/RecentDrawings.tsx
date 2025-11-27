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
    <div className="bg-white border-2 border-t-black border-l-black border-b-white border-r-white h-full max-h-[600px] overflow-y-auto p-1">
      <div className="flex items-center justify-between bg-[#c0c0c0] mb-2 p-1 border border-gray-400">
        <h2 className="text-xs font-bold text-black uppercase tracking-wider">
          Recent Files
        </h2>
        <button
          onClick={fetchDrawings}
          className="w-5 h-5 bg-[#c0c0c0] border border-t-white border-l-white border-b-black border-r-black flex items-center justify-center active:border-t-black active:border-l-black active:border-b-white active:border-r-white"
          title="Refresh"
        >
          <RefreshCcw size={12} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {isLoading && drawings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-gray-500 gap-2">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-xs font-mono">Loading...</span>
        </div>
      ) : drawings.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-xs font-mono">
          No files found.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {drawings.map((drawing) => (
            <div
              key={drawing.tokenId}
              className="group bg-[#c0c0c0] p-1 border border-t-white border-l-white border-b-black border-r-black hover:bg-[#000080] hover:text-white cursor-pointer"
            >
              <div className="flex gap-2 items-start">
                <div className="w-12 h-12 shrink-0 bg-white border border-gray-500 relative">
                  <Image
                    src={drawing.imageUrl}
                    alt={drawing.name}
                    fill
                    className="object-contain"
                    sizes="48px"
                    unoptimized
                  />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-xs truncate font-mono group-hover:text-white">
                    {drawing.name}
                  </span>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-300 font-mono">
                    ID: {drawing.tokenId}
                  </span>
                  <span className="text-[10px] text-gray-600 group-hover:text-gray-300 font-mono truncate">
                    By: {drawing.owner.slice(0, 6)}
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
