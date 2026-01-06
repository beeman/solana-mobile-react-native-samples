import { clusterApiUrl } from '@solana/web3.js'

export type Cluster = {
  id: string
  name: string
  endpoint: string
}

export class AppConfig {
  static name = 'Cause Pots'
  static uri = 'https://example.com'

  // Blockchain configuration
  static programId = 'CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR'

  static clusters: Cluster[] = [
    {
      id: 'solana:devnet',
      name: 'Devnet',
      endpoint: clusterApiUrl('devnet'),
    },
    {
      id: 'solana:testnet',
      name: 'Testnet',
      endpoint: clusterApiUrl('testnet'),
    },
  ]
}
