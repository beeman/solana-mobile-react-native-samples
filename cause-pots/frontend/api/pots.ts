import { Pot, CreatePotRequest, UpdatePotRequest, AddContributionRequest } from './types'

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:3000'

export async function createPot(request: CreatePotRequest): Promise<Pot> {
  const response = await fetch(`${API_BASE_URL}/api/pots`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error('Failed to create pot')
  }

  return await response.json()
}

export async function getPotById(potId: string): Promise<Pot | null> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}`)

  if (!response.ok) {
    return null
  }

  return await response.json()
}

export async function getAllPots(): Promise<Pot[]> {
  const response = await fetch(`${API_BASE_URL}/api/pots`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function getUserPots(userAddress: string): Promise<Pot[]> {
  const response = await fetch(`${API_BASE_URL}/api/pots?userAddress=${userAddress}`)

  if (!response.ok) {
    return []
  }

  return await response.json()
}

export async function updatePot(potId: string, updates: UpdatePotRequest): Promise<Pot> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error('Failed to update pot')
  }

  return await response.json()
}

export async function deletePot(potId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete pot')
  }
}

export async function addContributorToPot(potId: string, contributorAddress: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}/contributors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ contributorAddress }),
  })

  if (!response.ok) {
    throw new Error('Failed to add contributor')
  }
}

export async function removeContributorFromPot(potId: string, contributorAddress: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}/contributors/${contributorAddress}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to remove contributor')
  }
}

export async function addContribution(request: AddContributionRequest): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${request.potId}/contributions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contributorAddress: request.contributorAddress,
      amount: request.amount,
      currency: request.currency,
      transactionSignature: request.transactionSignature,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to add contribution')
  }
}

export async function removeContribution(potId: string, contributionId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}/contributions/${contributionId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to remove contribution')
  }
}

export async function signPotRelease(potId: string, signerAddress: string, transactionSignature?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}/sign`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signerAddress, transactionSignature }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('❌ signPotRelease failed:', {
      status: response.status,
      statusText: response.statusText,
      body: errorText,
      potId,
      signerAddress,
    })
    throw new Error(`Failed to sign pot release: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  console.log('✅ signPotRelease success:', result)
}

export async function releasePot(potId: string, releasedBy: string, transactionSignature?: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/pots/${potId}/release`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ releasedBy, transactionSignature }),
  })

  if (!response.ok) {
    throw new Error('Failed to release pot')
  }
}
