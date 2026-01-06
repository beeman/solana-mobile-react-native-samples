import { Activity } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

export async function getActivitiesForUser(userAddress: string): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities?userAddress=${userAddress}`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function getAllActivities(): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function getActivitiesForPot(potId: string): Promise<Activity[]> {
  const response = await fetch(`${API_BASE_URL}/api/activities?potId=${potId}`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function markActivityAsRead(activityId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/activities/${activityId}/read`, {
    method: 'POST',
  })

  if (!response.ok) {
    throw new Error('Failed to mark activity as read')
  }
}
