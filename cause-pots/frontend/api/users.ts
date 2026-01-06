import { User, AuthUserRequest, UpdateUserRequest } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

/**
 * Authenticate user with wallet (creates user if doesn't exist)
 */
export async function authenticateUser(data: AuthUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to authenticate user')
  }

  return response.json()
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch user')
  }

  return response.json()
}

/**
 * Get user by wallet address
 */
export async function getUserByAddress(address: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/by-address/${address}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch user')
  }

  return response.json()
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update user')
  }

  return response.json()
}

/**
 * Get all users
 */
export async function getAllUsers(): Promise<User[]> {
  const response = await fetch(`${API_BASE_URL}/api/users`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch users')
  }

  return response.json()
}
