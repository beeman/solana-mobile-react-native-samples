import { Keypair, PublicKey } from '@solana/web3.js'
import { create } from 'zustand'
import { createPot, addContribution, releasePot, getPotById } from '../api/pots'
import { getActivitiesForUser, getAllActivities } from '../api/activities'

export type Friend = {
  id: string
  publicKey: PublicKey
  address: string
  domain?: string
  displayName?: string
  addedAt: Date
}

export type Contribution = {
  id: string
  potId: string
  contributorAddress: string
  amount: number
  currency: 'SOL' | 'USDC'
  timestamp: Date
}

export type PotCategory = 'Goal' | 'Emergency' | 'Bills' | 'Events' | 'Others'

export type Pot = {
  id: string
  name: string
  description?: string
  creatorAddress: string
  potPubkey?: string
  vaultPubkey?: string
  targetAmount: number
  totalContributed?: number
  targetDate: Date
  unlockTimestamp?: number
  currency: 'SOL' | 'USDC'
  category: PotCategory
  signersRequired?: number
  signatures?: string[]
  contributors: string[]
  contributions: Contribution[]
  createdAt: Date
  isReleased: boolean
  releasedAt?: Date
  releasedBy?: string
  recipientAddress?: string
}

export type ActivityType = 'pot_created' | 'contribution' | 'release' | 'sign_release' | 'friend_added'

export type Activity = {
  id: string
  type: ActivityType
  timestamp: Date
  userId: string
  userName?: string
  potId?: string
  potName?: string
  friendId?: string
  friendAddress?: string
  amount?: number
  currency?: 'SOL' | 'USDC'
  transactionSignature?: string
}

interface AppStore {
  friends: Friend[]
  addFriend: (publicKey: PublicKey, address: string, displayName?: string, domain?: string) => void
  removeFriend: (friendId: string) => void
  getFriendByAddress: (address: string) => Friend | undefined
  setFriends: (friends: Friend[]) => void

  pots: Pot[]
  createPot: (pot: Omit<Pot, 'id' | 'createdAt' | 'contributions' | 'isReleased'> & { transactionSignature?: string }) => Promise<void>
  updatePot: (potId: string, updates: Partial<Pot>) => void
  addContributorToPot: (potId: string, contributorAddress: string) => void
  addContribution: (contribution: Omit<Contribution, 'id' | 'timestamp'> & { transactionSignature?: string }) => Promise<void>
  releasePot: (potId: string, releasedBy: string, transactionSignature?: string) => Promise<void>
  getPotById: (potId: string) => Pot | undefined
  getUserPots: (userAddress: string) => Pot[]
  setPots: (pots: Pot[]) => void
  refreshPot: (potId: string) => Promise<void>

  activities: Activity[]
  fetchActivities: (userAddress?: string) => Promise<void>
  setActivities: (activities: Activity[]) => void

  clearAll: () => void
}

export const useAppStore = create<AppStore>((set, get) => {
  return {
    // Friends
    friends: [],
  addFriend: (publicKey, address, displayName, domain) => {
    const friend: Friend = {
      id: `friend-${Date.now()}-${Math.random()}`,
      publicKey,
      address,
      displayName,
      domain,
      addedAt: new Date(),
    }
    set((state) => ({
      friends: [...state.friends, friend],
    }))
  },
  removeFriend: (friendId) => {
    set((state) => ({
      friends: state.friends.filter((f) => f.id !== friendId),
    }))
  },
  getFriendByAddress: (address) => {
    return get().friends.find((f) => f.address === address)
  },
  setFriends: (friends) => {
    set({ friends })
  },

  // Pots
  pots: [],
  createPot: async (potData) => {
    try {
      // Call backend API to create pot
      const createdPot = await createPot({
        name: potData.name,
        description: potData.description,
        creatorAddress: potData.creatorAddress,
        potPubkey: potData.potPubkey,
        vaultPubkey: potData.vaultPubkey,
        targetAmount: potData.targetAmount,
        targetDate: potData.targetDate.toISOString(),
        unlockTimestamp: potData.unlockTimestamp,
        currency: potData.currency,
        category: potData.category,
        signersRequired: potData.signersRequired,
        recipientAddress: potData.recipientAddress,
        contributors: potData.contributors,
        transactionSignature: potData.transactionSignature,
      })

      // Convert API response (string dates) to local format (Date objects)
      const pot: Pot = {
        ...createdPot,
        targetDate: new Date(createdPot.targetDate),
        createdAt: new Date(createdPot.createdAt),
        releasedAt: createdPot.releasedAt ? new Date(createdPot.releasedAt) : undefined,
        contributions: createdPot.contributions.map(c => ({
          ...c,
          timestamp: new Date(c.timestamp),
        })),
      }

      set((state) => ({
        pots: [...state.pots, pot],
      }))
    } catch (error) {
      console.error('Failed to create pot in database:', error)
      throw error
    }
  },
  updatePot: (potId, updates) => {
    set((state) => ({
      pots: state.pots.map((pot) => (pot.id === potId ? { ...pot, ...updates } : pot)),
    }))
  },
  addContributorToPot: (potId, contributorAddress) => {
    set((state) => {
      const updatedPots = state.pots.map((pot) =>
        pot.id === potId && !pot.contributors.includes(contributorAddress)
          ? { ...pot, contributors: [...pot.contributors, contributorAddress] }
          : pot
      )

      const isAlreadyFriend = state.friends.some((f) => f.address === contributorAddress)
      let updatedFriends = state.friends
      if (!isAlreadyFriend) {
        try {
          const publicKey = new PublicKey(contributorAddress)
          updatedFriends = [
            ...state.friends,
            {
              id: `friend-${contributorAddress.slice(0, 8)}`,
              publicKey,
              address: contributorAddress,
              addedAt: new Date(),
            },
          ]
        } catch {}
      }

      return {
        pots: updatedPots,
        friends: updatedFriends,
      }
    })
  },
  addContribution: async (contributionData) => {
    try {
      // Call backend API to add contribution
      await addContribution({
        potId: contributionData.potId,
        contributorAddress: contributionData.contributorAddress,
        amount: contributionData.amount,
        currency: contributionData.currency,
        transactionSignature: contributionData.transactionSignature,
      })

      // Update local state
      const contribution: Contribution = {
        ...contributionData,
        id: `contribution-${Date.now()}-${Math.random()}`,
        timestamp: new Date(),
      }
      set((state) => ({
        pots: state.pots.map((pot) =>
          pot.id === contribution.potId
            ? { ...pot, contributions: [...pot.contributions, contribution] }
            : pot
        ),
      }))
    } catch (error) {
      console.error('Failed to add contribution to database:', error)
      throw error
    }
  },
  releasePot: async (potId, releasedBy, transactionSignature) => {
    try {
      // Call backend API to release pot
      await releasePot(potId, releasedBy, transactionSignature)

      // Update local state
      set((state) => ({
        pots: state.pots.map((pot) =>
          pot.id === potId
            ? { ...pot, isReleased: true, releasedAt: new Date(), releasedBy }
            : pot
        ),
      }))
    } catch (error) {
      console.error('Failed to release pot in database:', error)
      throw error
    }
  },
  getPotById: (potId) => {
    return get().pots.find((p) => p.id === potId)
  },
  getUserPots: (userAddress) => {
    return get().pots.filter(
      (pot) => pot.creatorAddress === userAddress || pot.contributors.includes(userAddress)
    )
  },
  setPots: (pots) => {
    set({ pots })
  },
  refreshPot: async (potId: string) => {
    try {
      const potData = await getPotById(potId)

      if (!potData) {
        throw new Error('Pot not found in backend')
      }

      // Convert API response (string dates) to local format (Date objects)
      const pot: Pot = {
        ...potData,
        targetDate: new Date(potData.targetDate),
        createdAt: new Date(potData.createdAt),
        releasedAt: potData.releasedAt ? new Date(potData.releasedAt) : undefined,
        contributions: potData.contributions.map(c => ({
          ...c,
          timestamp: new Date(c.timestamp),
        })),
      }

      // Update the pot in the store
      set((state) => ({
        pots: state.pots.map((p) => (p.id === potId ? pot : p)),
      }))
    } catch (error) {
      console.error('Failed to refresh pot from backend:', error)
      throw error
    }
  },

  // Activity
  activities: [],
  fetchActivities: async (userAddress) => {
    try {
      const activities = userAddress
        ? await getActivitiesForUser(userAddress)
        : await getAllActivities()

      // Convert API response (string dates) to local format (Date objects)
      const activitiesWithDates = activities.map(a => ({
        ...a,
        timestamp: new Date(a.timestamp),
      }))

      set({ activities: activitiesWithDates })
    } catch (error) {
      console.error('Failed to fetch activities:', error)
      throw error
    }
  },
  setActivities: (activities) => {
    set({ activities })
  },

  clearAll: () => {
    set({
      friends: [],
      pots: [],
      activities: [],
    })
  },
  }
})

