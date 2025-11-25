import { clusterApiUrl } from '@solana/web3.js'

export class AppConfig {
  static name = '.skr address resolution'
  static uri = 'https://skrdemo.app'
  static clusters = [
    {
      id: 'solana:mainnet',
      name: 'Mainnet Beta',
      endpoint: clusterApiUrl('mainnet-beta'),
    },
  ]
}
