'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import sdk from '@farcaster/miniapp-sdk';

interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
  custody?: string;
  verifications?: string[];
}

// Define context type based on SDK
type FrameContextType = Awaited<typeof sdk.context>;

interface FarcasterContextType {
  isSDKLoaded: boolean;
  isInFrame: boolean;
  context: FrameContextType | null;
  user: FarcasterUser | null;
  isSignedIn: boolean;
  isSigningIn: boolean;
  signIn: () => Promise<void>;
  signOut: () => void;
  error: string | null;
  walletAddress: string | null;
}

const FarcasterContext = createContext<FarcasterContextType | null>(null);

export function useFarcaster() {
  const context = useContext(FarcasterContext);
  if (!context) {
    throw new Error('useFarcaster must be used within a FarcasterProvider');
  }
  return context;
}

interface FarcasterProviderProps {
  children: ReactNode;
}

declare global {
  interface Window {
    appkitReady?: boolean;
  }
}

export function FarcasterProvider({ children }: FarcasterProviderProps) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isInFrame, setIsInFrame] = useState(false);
  const [context, setContext] = useState<FrameContextType | null>(null);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Initialize SDK
  useEffect(() => {
    const initSDK = async () => {
      try {
        // Get frame context
        const frameContext = await sdk.context;
        
        if (frameContext) {
          setContext(frameContext);
          setIsInFrame(true);
          
          // Extract user info from context
          if (frameContext.user) {
            setUser({
              fid: frameContext.user.fid,
              username: frameContext.user.username,
              displayName: frameContext.user.displayName,
              pfpUrl: frameContext.user.pfpUrl,
            });
          }
        }
        
        if (typeof window !== 'undefined') {
          window.appkitReady = true;
        }
        await sdk.actions.ready();
        setIsSDKLoaded(true);
      } catch (err) {
        console.log('Not running in a Farcaster frame');
        setIsSDKLoaded(true);
        setIsInFrame(false);
        try {
          if (typeof window !== 'undefined') {
            window.appkitReady = true;
          }
          await sdk.actions.ready();
        } catch {
          // ignore if not available
        }
      }
    };

    initSDK();
  }, []);

  const generateNonce = () => {
    const randomPart = Math.random().toString(36).slice(2, 10);
    const timePart = Date.now().toString(36);
    return `${randomPart}${timePart}`;
  };

  // Sign In with Farcaster
  const signIn = useCallback(async () => {
    if (!isInFrame) {
      setError('Sign in with Farcaster is only available within a Farcaster frame');
      return;
    }

    setIsSigningIn(true);
    setError(null);

    try {
      // Generate a random nonce (alphanumeric, >= 8 chars)
      const nonce = generateNonce();
      
      // Request sign in
      const result = await sdk.actions.signIn({
        nonce,
        acceptAuthAddress: true,
      });

      if (result) {
        setIsSignedIn(true);
        
        // If we got an auth address, use it as wallet address
        const authAddr = (result as any).authAddress;
        if (authAddr && typeof authAddr === 'string') {
          setWalletAddress(authAddr);
        }
        
        // Verify the signature on the backend
        const verifyResponse = await fetch('/api/auth/farcaster', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: result.message,
            signature: result.signature,
            nonce,
          }),
        });

        if (!verifyResponse.ok) {
          throw new Error('Failed to verify Farcaster signature');
        }

        const verifyData = await verifyResponse.json();
        if (verifyData.address) {
          setWalletAddress(verifyData.address);
        }
      }
    } catch (err: any) {
      if (err?.message?.includes('RejectedByUser')) {
        setError('Sign in was cancelled');
      } else {
        setError(err?.message || 'Failed to sign in with Farcaster');
      }
      console.error('Farcaster sign in error:', err);
    } finally {
      setIsSigningIn(false);
    }
  }, [isInFrame]);

  const signOut = useCallback(() => {
    setIsSignedIn(false);
    setWalletAddress(null);
    setError(null);
  }, []);

  return (
    <FarcasterContext.Provider
      value={{
        isSDKLoaded,
        isInFrame,
        context,
        user,
        isSignedIn,
        isSigningIn,
        signIn,
        signOut,
        error,
        walletAddress,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

