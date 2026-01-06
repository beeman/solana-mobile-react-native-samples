import { useState, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { authenticateUser } from '@/api/users'
import type { User } from '@/api/types'

const USER_STORAGE_KEY = '@cause_pots:user'
const USER_ID_STORAGE_KEY = '@cause_pots:user_id'

/**
 * Hook to handle wallet-based user authentication
 *
 * Usage:
 * ```tsx
 * const { user, authenticate, logout, isLoading } = useWalletAuth()
 *
 * // After wallet connects:
 * await authenticate({
 *   pubkey: wallet.publicKey.toString(),
 *   address: wallet.publicKey.toString(),
 *   name: 'Optional Name'
 * })
 * ```
 */
export function useWalletAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Authenticate user with wallet
   * Creates user if doesn't exist, or returns existing user
   */
  const authenticate = useCallback(async (walletData: {
    pubkey: string
    address: string
    name?: string
  }) => {
    try {
      setIsLoading(true)
      setError(null)

      // Call backend auth endpoint
      const authenticatedUser = await authenticateUser(walletData)

      // Store user data
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authenticatedUser))
      await AsyncStorage.setItem(USER_ID_STORAGE_KEY, authenticatedUser.id)

      setUser(authenticatedUser)
      setIsLoading(false)

      return authenticatedUser
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Authentication failed')
      setError(error)
      setIsLoading(false)
      throw error
    }
  }, [])

  /**
   * Restore user from storage (e.g., on app launch)
   */
  const restoreUser = useCallback(async () => {
    try {
      setIsLoading(true)
      const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY)

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser) as User
        setUser(parsedUser)
      }

      setIsLoading(false)
    } catch (err) {
      console.error('Failed to restore user:', err)
      setIsLoading(false)
    }
  }, [])

  /**
   * Logout user and clear storage
   */
  const logout = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY)
      await AsyncStorage.removeItem(USER_ID_STORAGE_KEY)
      setUser(null)
      setError(null)
    } catch (err) {
      console.error('Failed to logout:', err)
    }
  }, [])

  /**
   * Update user state (for profile updates)
   */
  const updateUserState = useCallback(async (updatedUser: User) => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser))
      setUser(updatedUser)
    } catch (err) {
      console.error('Failed to update user state:', err)
    }
  }, [])

  return {
    user,
    isLoading,
    error,
    authenticate,
    restoreUser,
    logout,
    updateUserState,
  }
}
