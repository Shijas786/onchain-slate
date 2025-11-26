// context/index.tsx
'use client'

import React, { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState, type Config } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config, networks, projectId, wagmiAdapter } from '@/config'
import { baseSepolia } from '@reown/appkit/networks'

const queryClient = new QueryClient()

const metadata = {
  name: 'Onchain Slate',
  description: 'Draw and mint your artwork as NFTs on Base',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://onchain-slate.vercel.app',
  icons: ['/icon.png'],
}

// Initialize AppKit outside the component render cycle
if (projectId) {
  createAppKit({
    adapters: [wagmiAdapter],
    projectId: projectId!,
    networks: networks,
    defaultNetwork: baseSepolia,
    metadata,
    features: { 
      analytics: true,
      email: true,
      socials: ['google', 'x', 'github', 'discord', 'farcaster'],
    },
    themeMode: 'light',
    themeVariables: {
      '--w3m-accent': '#3B82F6',
      '--w3m-border-radius-master': '2px',
    },
  })
}

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const initialState = cookieToInitialState(config as Config, cookies)

  return (
    <WagmiProvider config={config as Config} initialState={initialState}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}

