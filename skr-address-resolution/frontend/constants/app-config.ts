import { clusterApiUrl } from '@solana/web3.js'
import { Cluster } from '@/components/cluster/cluster'
import { ClusterNetwork } from '@/components/cluster/cluster-network'

export class AppConfig {
  static name = '.skr address resolution'
  static uri = 'https://skrdemo.app'
  static clusters: Cluster[] = [
    {
      id: 'solana:mainnet',
      name: 'Mainnet Beta',
      endpoint: clusterApiUrl('mainnet-beta'),
      network: ClusterNetwork.Mainnet,
    },
  ]
}
