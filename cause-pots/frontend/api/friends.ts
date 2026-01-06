import { Friend, AddFriendRequest, UpdateFriendRequest } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

export async function addFriend(request: AddFriendRequest): Promise<Friend> {
  const response = await fetch(`${API_BASE_URL}/api/friends`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    const errorMessage = errorData.message || errorData.error || 'Failed to add friend'
    throw new Error(errorMessage)
  }

  return await response.json()
}

export async function removeFriend(friendId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/friends/${friendId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to remove friend')
  }
}

export async function updateFriend(friendId: string, updates: UpdateFriendRequest): Promise<Friend> {
  const response = await fetch(`${API_BASE_URL}/api/friends/${friendId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error('Failed to update friend')
  }

  return await response.json()
}

export async function getFriendById(friendId: string): Promise<Friend | null> {
  const response = await fetch(`${API_BASE_URL}/api/friends/${friendId}`)

  if (!response.ok) {
    return null
  }

  return await response.json()
}

export async function getFriendByAddress(address: string): Promise<Friend | null> {
  const response = await fetch(`${API_BASE_URL}/api/friends?address=${address}`)

  if (!response.ok) {
    return null
  }

  return await response.json()
}

export async function getFriends(userAddress?: string): Promise<Friend[]> {
  const url = userAddress
    ? `${API_BASE_URL}/api/friends?userAddress=${userAddress}`
    : `${API_BASE_URL}/api/friends`

  const response = await fetch(url)

  if (!response.ok) {
    return []
  }

  return await response.json()
}
