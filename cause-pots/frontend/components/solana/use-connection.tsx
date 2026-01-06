import { useMemo } from 'react'
import { Connection } from '@solana/web3.js'
import { AppConfig } from '@/constants/app-config'

/**
 * Hook to get Solana Connection instance
 * Uses the default cluster from AppConfig
 */
export function useConnection(): Connection {
  const cluster = AppConfig.clusters[0]

  return useMemo(
    () => new Connection(cluster.endpoint, 'confirmed'),
    [cluster.endpoint]
  )
}
