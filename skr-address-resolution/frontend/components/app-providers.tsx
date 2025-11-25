import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { MobileWalletAdapterProvider } from '@wallet-ui/react-native-web3js'
import { AppTheme } from '@/components/app-theme'
import { AppConfig } from '@/constants/app-config'

const queryClient = new QueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  const mainnetCluster = AppConfig.clusters[0]

  return (
    <AppTheme>
      <QueryClientProvider client={queryClient}>
        <MobileWalletAdapterProvider
          clusterId={mainnetCluster.id}
          endpoint={mainnetCluster.endpoint}
          identity={{ name: AppConfig.name }}
        >
          {children}
        </MobileWalletAdapterProvider>
      </QueryClientProvider>
    </AppTheme>
  )
}
