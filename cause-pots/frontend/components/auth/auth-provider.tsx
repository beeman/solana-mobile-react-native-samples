import React, { createContext, PropsWithChildren, useContext, useState, useCallback, useEffect } from 'react'
import { useMobileWalletAdapter } from '@wallet-ui/react-native-web3js'
import { useWalletAuth } from '@/hooks/useWalletAuth'
import { useAppStore } from '@/store/app-store'
import type { User } from '@/api/types'

export interface AuthProviderState {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthProviderState>({} as AuthProviderState)

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(false)
  const { account, connect, disconnect } = useMobileWalletAdapter()
  const { user, authenticate, restoreUser, logout } = useWalletAuth()
  const { clearAll } = useAppStore()

  // Disabled: Don't auto-restore user session - always show login page
  // useEffect(() => {
  //   restoreUser()
  // }, [restoreUser])

  // Clear store when not authenticated
  useEffect(() => {
    if (!account && !user) {
      clearAll()
    }
  }, [account, user, clearAll])

  // Authenticate with backend when wallet connects
  useEffect(() => {
    if (account?.publicKey) {
      const authenticateUser = async () => {
        try {
          await authenticate({
            pubkey: account.publicKey.toString(),
            address: account.publicKey.toString(),
          })
        } catch (error) {
          console.error('Failed to authenticate user with backend:', error)
        }
      }
      authenticateUser()
    }
  }, [account, authenticate])

  const signIn = useCallback(async () => {
    setIsLoading(true)
    try {
      await connect()
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [connect])

  const signOut = useCallback(async () => {
    setIsLoading(true)
    try {
      await disconnect()
      await logout()
      clearAll() // Clear all data from store on logout
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [disconnect, logout, clearAll])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!account && !!user,
        isLoading,
        user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthProviderState {
  return useContext(AuthContext)
}
