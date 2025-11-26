// context/index.tsx
'use client'

import React, { ReactNode, useEffect, useMemo, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, cookieToInitialState, createConfig, http, type Config } from 'wagmi'
import { createAppKit } from '@reown/appkit/react'
import { config as appKitWagmiConfig, networks, projectId, wagmiAdapter } from '@/config'
import { baseSepolia } from '@reown/appkit/networks'
import { FarcasterProvider } from '@/components/FarcasterProvider'
import { base as wagmiBase, baseSepolia as wagmiBaseSepolia } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import sdk from '@farcaster/miniapp-sdk'

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

const farcasterConnector = injected({
  target: {
    id: 'farcaster-miniapp',
    name: 'Farcaster Mini App',
    provider: async () => {
      try {
        return await sdk.wallet.getEthereumProvider()
      } catch {
        return undefined
      }
    },
  },
  shimDisconnect: true,
})

const miniAppWagmiConfig = createConfig({
  autoConnect: true,
  chains: [wagmiBaseSepolia, wagmiBase],
  transports: {
    [wagmiBaseSepolia.id]: http(),
    [wagmiBase.id]: http(),
  },
  connectors: [farcasterConnector],
  ssr: true,
})

export default function ContextProvider({
  children,
  cookies,
}: {
  children: ReactNode
  cookies: string | null
}) {
  const defaultInitialState = useMemo(
    () => cookieToInitialState(appKitWagmiConfig as Config, cookies),
    [cookies]
  )

  const [activeConfig, setActiveConfig] = useState<Config>(appKitWagmiConfig as Config)
  const [initialState, setInitialState] = useState(defaultInitialState)

  useEffect(() => {
    setInitialState(defaultInitialState)
  }, [defaultInitialState])

  useEffect(() => {
    let cancelled = false

    const detectMiniApp = async () => {
      try {
        await sdk.context
        if (cancelled) return
        setActiveConfig(miniAppWagmiConfig as Config)
        setInitialState(undefined)
      } catch {
        if (cancelled) return
        setActiveConfig(appKitWagmiConfig as Config)
        setInitialState(defaultInitialState)
      }
    }

    detectMiniApp()

    return () => {
      cancelled = true
    }
  }, [defaultInitialState])

  return (
    <WagmiProvider config={activeConfig} initialState={initialState}>
      <QueryClientProvider client={queryClient}>
        <FarcasterProvider>
          {children}
        </FarcasterProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
