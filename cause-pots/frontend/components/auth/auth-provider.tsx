import React, { createContext, PropsWithChildren, useContext, useState, useCallback } from 'react'
import { useWalletUi } from '@/components/solana/use-wallet-ui'

export interface AuthProviderState {
  isAuthenticated: boolean
  isLoading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthProviderState>({} as AuthProviderState)

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(false)
  const { account, connect, disconnect } = useWalletUi()

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
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [disconnect])

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!account,
        isLoading,
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
