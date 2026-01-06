export type PotCategory = 'Goal' | 'Emergency' | 'Bills' | 'Events' | 'Others'

export type User = {
  id: string
  pubkey: string
  address: string
  name?: string
  avatarUri?: string
  isProfileComplete: boolean
  createdAt: string
  updatedAt: string
}

export type Friend = {
  id: string
  publicKey: string
  address: string
  displayName?: string
  addedAt: string
}

export type Contribution = {
  id: string
  potId: string
  contributorAddress: string
  amount: number
  currency: 'SOL' | 'USDC'
  timestamp: string
}

export type Pot = {
  id: string
  name: string
  description?: string
  creatorAddress: string
  potPubkey?: string
  vaultPubkey?: string
  targetAmount: number
  totalContributed?: number
  targetDate: string
  unlockTimestamp?: number
  currency: 'SOL' | 'USDC'
  category: PotCategory
  signersRequired?: number
  signatures?: string[]
  contributors: string[]
  contributions: Contribution[]
  createdAt: string
  isReleased: boolean
  releasedAt?: string
  releasedBy?: string
  recipientAddress?: string
}

export type ActivityType = 'pot_created' | 'contribution' | 'release' | 'sign_release' | 'friend_added'

export type Activity = {
  id: string
  type: ActivityType
  timestamp: string
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

export type CreatePotRequest = {
  name: string
  description?: string
  creatorAddress: string
  potPubkey?: string
  vaultPubkey?: string
  targetAmount: number
  targetDate: string
  unlockTimestamp?: number
  currency: 'SOL' | 'USDC'
  category: PotCategory
  signersRequired?: number
  recipientAddress?: string
  contributors: string[]
  transactionSignature?: string
}

export type UpdatePotRequest = {
  name?: string
  description?: string
  targetAmount?: number
  targetDate?: string
  currency?: 'SOL' | 'USDC'
  category?: PotCategory
}

export type AddContributionRequest = {
  contributorAddress: string
  amount: number
  currency: 'SOL' | 'USDC'
  transactionSignature?: string
}

export type AddFriendRequest = {
  currentUserAddress: string
  address: string
  displayName?: string
}

export type UpdateFriendRequest = {
  displayName?: string
}
