import { useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { getAllPots } from '@/api/pots'
import { getFriends } from '@/api/friends'
import { getActivitiesForUser } from '@/api/activities'
import { useAppStore } from '@/store/app-store'

/**
 * Hook to initialize app data from the backend API
 * Call this in your root component (e.g., app layout or main screen)
 * @param userAddress - The wallet address of the current user (required after authentication)
 */
export function useInitializeData(userAddress?: string) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { setFriends, setPots, setActivities, clearAll } = useAppStore()

  useEffect(() => {
    // Clear store and skip loading if no user address (not authenticated yet)
    if (!userAddress) {
      clearAll()
      setIsLoading(false)
      return
    }

    let isMounted = true

    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)

        // Load data in parallel for better performance
        const [pots, friends, activities] = await Promise.all([
          getAllPots().catch((err) => {
            console.error('Failed to load pots:', err)
            throw err
          }),
          getFriends(userAddress).catch((err) => {
            console.error('Failed to load friends:', err)
            throw err
          }),
          getActivitiesForUser(userAddress!).catch((err) => {
            console.error('Failed to load activities:', err)
            throw err
          }),
        ])

        if (isMounted) {
          // Convert API friends to store format (with PublicKey objects)
          const storeFriends = friends.map((friend) => {
            try {
              return {
                ...friend,
                publicKey: new PublicKey(friend.address),
                addedAt: new Date(friend.addedAt),
              }
            } catch (error) {
              console.error(`Invalid friend address: ${friend.address}`, error)
              return null
            }
          }).filter((f) => f !== null) as any[]

          // Convert API data dates to Date objects
          const storePots = pots.map((pot) => ({
            ...pot,
            targetDate: new Date(pot.targetDate),
            createdAt: new Date(pot.createdAt),
            releasedAt: pot.releasedAt ? new Date(pot.releasedAt) : undefined,
            contributions: pot.contributions.map((c) => ({
              ...c,
              timestamp: new Date(c.timestamp),
            })),
          }))

          const storeActivities = activities.map((activity) => ({
            ...activity,
            timestamp: new Date(activity.timestamp),
          }))

          // Update store with backend data
          setFriends(storeFriends)
          setPots(storePots)
          setActivities(storeActivities)

          setIsLoading(false)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to load data'))
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [userAddress, setFriends, setPots, setActivities, clearAll])

  return { isLoading, error }
}
