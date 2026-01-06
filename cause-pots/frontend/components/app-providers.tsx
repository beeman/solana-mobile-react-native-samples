import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PropsWithChildren } from 'react'
import { MobileWalletProvider } from '@wallet-ui/react-native-web3js'
import { AppTheme } from '@/components/app-theme'
import { AuthProvider } from '@/components/auth/auth-provider'
import { ToastProvider } from '@/components/toast/toast-provider'
import { AppConfig } from '@/constants/app-config'

const queryClient = new QueryClient()

export function AppProviders({ children }: PropsWithChildren) {
  // Use first cluster from config (devnet by default)
  const defaultCluster = AppConfig.clusters[0]

  return (
    <AppTheme>
      <QueryClientProvider client={queryClient}>
        <MobileWalletProvider
          chain={defaultCluster.id}
          endpoint={defaultCluster.endpoint}
          identity={{ name: AppConfig.name }}
        >
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </MobileWalletProvider>
      </QueryClientProvider>
    </AppTheme>
  )
}
