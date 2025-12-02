# Cause Pots - Frontend Blockchain Integration

## 🎯 Overview

This document outlines how to integrate the frontend with the Anchor smart contract and backend API to create a fully functional blockchain-powered savings app.

**Integration Points:**
- Anchor program client for on-chain transactions
- Mobile Wallet Adapter (MWA) for transaction signing
- Backend API for cached data
- Real-time state synchronization

---

## 📋 Setup Checklist

### Prerequisites
- [ ] Smart contract deployed to devnet
- [ ] Backend server running
- [ ] IDL file from contract
- [ ] Program ID configured

### Installation

```bash
cd frontend

# Install Anchor and SPL Token dependencies
npm install @coral-xyz/anchor @solana/spl-token

# Verify MWA is installed
npm list @solana-mobile/mobile-wallet-adapter-protocol
```

### Project Structure

```
frontend/
├── services/
│   ├── pot-program.ts           # Anchor program client
│   ├── api-client.ts            # Backend API client
│   └── transaction-builder.ts   # Transaction helpers
├── hooks/
│   ├── use-pot-program.ts       # Hook for pot operations
│   └── use-transaction.ts       # Hook for MWA transactions
├── store/
│   ├── blockchain-store.ts      # Blockchain state (new)
│   └── app-store.ts             # UI state (existing)
└── idl/
    └── cause_pots.json          # Program IDL
```

---

## 🔧 Configuration

### 1. Copy IDL File

```bash
# Copy IDL from contract to frontend
cp ../contract/target/idl/cause_pots.json ./idl/
```

### 2. Environment Variables

```typescript
// constants/app-config.ts
export class AppConfig {
  static name = 'Cause Pots'
  static uri = 'https://example.com'

  // Blockchain config
  static programId = 'YourProgramIDHere'
  static backendUrl = 'http://localhost:3000/api'

  // Clusters
  static clusters: Cluster[] = [
    {
      id: 'solana:devnet',
      name: 'Devnet',
      endpoint: clusterApiUrl('devnet'),
      network: ClusterNetwork.Devnet,
    },
  ]
}
```

---

## 🏗️ Core Services

### 1. Pot Program Service

```typescript
// services/pot-program.ts
import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import idl from '@/idl/cause_pots.json'
import { AppConfig } from '@/constants/app-config'
import type { CausePots } from '@/types/cause_pots'

export class PotProgramService {
  private program: Program<CausePots>
  private connection: Connection

  constructor(connection: Connection) {
    this.connection = connection

    // Create read-only provider
    const provider = new AnchorProvider(
      connection,
      {} as any, // Wallet not needed for reads
      { commitment: 'confirmed' }
    )

    this.program = new Program<CausePots>(
      idl as any,
      new PublicKey(AppConfig.programId),
      provider
    )
  }

  /**
   * Derive pot PDA
   */
  getPotPDA(authority: PublicKey, potName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('pot'),
        authority.toBuffer(),
        Buffer.from(potName),
      ],
      this.program.programId
    )
  }

  /**
   * Derive contributor PDA
   */
  getContributorPDA(pot: PublicKey, contributor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('contributor'),
        pot.toBuffer(),
        contributor.toBuffer(),
      ],
      this.program.programId
    )
  }

  /**
   * Build create pot transaction
   */
  async buildCreatePotTx(params: {
    authority: PublicKey
    name: string
    description: string
    targetAmount: number
    unlockDays: number
    signersRequired: number
    currency: 'SOL' | 'USDC'
  }): Promise<Transaction> {
    const [potPDA] = this.getPotPDA(params.authority, params.name)

    const tx = await this.program.methods
      .createPot(
        params.name,
        params.description,
        new BN(params.targetAmount * web3.LAMPORTS_PER_SOL),
        new BN(params.unlockDays),
        params.signersRequired,
        params.currency === 'SOL' ? { sol: {} } : { usdc: {} }
      )
      .accounts({
        pot: potPDA,
        authority: params.authority,
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction()

    tx.feePayer = params.authority
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

    return tx
  }

  /**
   * Build contribute transaction
   */
  async buildContributeTx(params: {
    potPubkey: PublicKey
    contributor: PublicKey
    amount: number
  }): Promise<Transaction> {
    const [contributorPDA] = this.getContributorPDA(params.potPubkey, params.contributor)

    const tx = await this.program.methods
      .contribute(new BN(params.amount * web3.LAMPORTS_PER_SOL))
      .accounts({
        pot: params.potPubkey,
        contributorAccount: contributorPDA,
        contributor: params.contributor,
        systemProgram: web3.SystemProgram.programId,
      })
      .transaction()

    tx.feePayer = params.contributor
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

    return tx
  }

  /**
   * Build sign release transaction
   */
  async buildSignReleaseTx(params: {
    potPubkey: PublicKey
    signer: PublicKey
  }): Promise<Transaction> {
    const tx = await this.program.methods
      .signRelease()
      .accounts({
        pot: params.potPubkey,
        signer: params.signer,
      })
      .transaction()

    tx.feePayer = params.signer
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

    return tx
  }

  /**
   * Build release funds transaction
   */
  async buildReleaseFundsTx(params: {
    potPubkey: PublicKey
    authority: PublicKey
    recipient: PublicKey
  }): Promise<Transaction> {
    const tx = await this.program.methods
      .releaseFunds(params.recipient)
      .accounts({
        pot: params.potPubkey,
        authority: params.authority,
        recipient: params.recipient,
      })
      .transaction()

    tx.feePayer = params.authority
    tx.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash

    return tx
  }

  /**
   * Fetch pot account
   */
  async fetchPot(potPubkey: PublicKey) {
    return await this.program.account.potAccount.fetch(potPubkey)
  }

  /**
   * Fetch contributor account
   */
  async fetchContributor(contributorPDA: PublicKey) {
    return await this.program.account.contributorAccount.fetch(contributorPDA)
  }

  /**
   * Fetch all pots
   */
  async fetchAllPots() {
    return await this.program.account.potAccount.all()
  }
}
```

### 2. API Client Service

```typescript
// services/api-client.ts
import { AppConfig } from '@/constants/app-config'

export class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = AppConfig.backendUrl
  }

  /**
   * Generic fetch wrapper
   */
  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data
  }

  /**
   * Get all pots
   */
  async getPots(params?: { limit?: number; offset?: number }) {
    const queryParams = new URLSearchParams({
      limit: String(params?.limit || 50),
      offset: String(params?.offset || 0),
    })
    return this.fetch(`/pots?${queryParams}`)
  }

  /**
   * Get pot by pubkey
   */
  async getPot(pubkey: string) {
    return this.fetch(`/pots/${pubkey}`)
  }

  /**
   * Get pot contributors
   */
  async getPotContributors(pubkey: string) {
    return this.fetch(`/pots/${pubkey}/contributors`)
  }

  /**
   * Get pot contributions
   */
  async getPotContributions(pubkey: string) {
    return this.fetch(`/pots/${pubkey}/contributions`)
  }

  /**
   * Get user pots
   */
  async getUserPots(userPubkey: string) {
    return this.fetch(`/users/${userPubkey}/pots`)
  }

  /**
   * Get user activities
   */
  async getUserActivities(userPubkey: string) {
    return this.fetch(`/users/${userPubkey}/activities`)
  }

  /**
   * Cache new pot (after on-chain creation)
   */
  async cachePot(potPubkey: string) {
    return this.fetch(`/pots`, {
      method: 'POST',
      body: JSON.stringify({ pot_pubkey: potPubkey }),
    })
  }
}
```

### 3. Transaction Hook

```typescript
// hooks/use-transaction.ts
import { useState, useCallback } from 'react'
import { Transaction } from '@solana/web3.js'
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'
import { useConnection } from '@/components/solana/solana-provider'

export function useTransaction() {
  const { connection } = useConnection()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const executeTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      setIsLoading(true)
      setError(null)

      try {
        // Sign and send transaction via MWA
        const signature = await transact(async (wallet) => {
          const authResult = await wallet.authorize({
            cluster: 'devnet',
            identity: { name: 'Cause Pots' },
          })

          const signedTx = await wallet.signTransactions({
            transactions: [transaction],
          })

          const sig = await connection.sendRawTransaction(signedTx[0].serialize())
          return sig
        })

        // Confirm transaction
        await connection.confirmTransaction(signature, 'confirmed')

        setIsLoading(false)
        return signature
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsLoading(false)
        throw error
      }
    },
    [connection]
  )

  return {
    executeTransaction,
    isLoading,
    error,
  }
}
```

---

## 🔄 Blockchain Store

```typescript
// store/blockchain-store.ts
import { create } from 'zustand'
import { PublicKey } from '@solana/web3.js'
import { PotProgramService } from '@/services/pot-program'
import { ApiClient } from '@/services/api-client'

interface BlockchainStore {
  // Services
  programService: PotProgramService | null
  apiClient: ApiClient

  // State
  isLoading: boolean
  error: Error | null

  // Actions
  initializeServices: (connection: Connection) => void
  createPot: (params: CreatePotParams) => Promise<string>
  contributeToPot: (params: ContributeParams) => Promise<string>
  signRelease: (potPubkey: string, signer: PublicKey) => Promise<string>
  releaseFunds: (potPubkey: string, authority: PublicKey, recipient: PublicKey) => Promise<string>
  syncPotsFromBackend: () => Promise<void>
}

export const useBlockchainStore = create<BlockchainStore>((set, get) => ({
  programService: null,
  apiClient: new ApiClient(),
  isLoading: false,
  error: null,

  initializeServices: (connection) => {
    set({
      programService: new PotProgramService(connection),
    })
  },

  createPot: async (params) => {
    const { programService, apiClient } = get()
    if (!programService) throw new Error('Program service not initialized')

    set({ isLoading: true, error: null })

    try {
      // Build transaction
      const tx = await programService.buildCreatePotTx(params)

      // Execute via MWA (handled by UI component)
      // Return transaction for component to execute
      return tx.serialize().toString('base64')
    } catch (error) {
      set({ error: error as Error })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  contributeToPot: async (params) => {
    // Similar to createPot
  },

  // ... other actions

  syncPotsFromBackend: async () => {
    const { apiClient } = get()
    set({ isLoading: true })

    try {
      const pots = await apiClient.getPots()
      // Update app store with fetched pots
      useAppStore.getState().setPots(pots)
    } catch (error) {
      set({ error: error as Error })
    } finally {
      set({ isLoading: false })
    }
  },
}))
```

---

## 🎨 UI Integration Examples

### 1. Create Pot Flow

```typescript
// app/(tabs)/pots/create/index.tsx
import { useTransaction } from '@/hooks/use-transaction'
import { useBlockchainStore } from '@/store/blockchain-store'
import { useWalletUi } from '@/components/solana/use-wallet-ui'

export default function CreatePotScreen() {
  const { account } = useWalletUi()
  const { programService } = useBlockchainStore()
  const { executeTransaction, isLoading } = useTransaction()
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    targetAmount: 0,
    unlockDays: 30,
    signersRequired: 2,
    currency: 'SOL' as 'SOL' | 'USDC',
  })

  const handleCreate = async () => {
    if (!account || !programService) return

    try {
      // 1. Build transaction
      const tx = await programService.buildCreatePotTx({
        authority: new PublicKey(account.address),
        ...formData,
      })

      // 2. Execute via MWA
      const signature = await executeTransaction(tx)

      // 3. Get pot PDA
      const [potPDA] = programService.getPotPDA(
        new PublicKey(account.address),
        formData.name
      )

      // 4. Cache to backend
      await apiClient.cachePot(potPDA.toString())

      // 5. Show success
      showToast({ title: 'Pot created!', type: 'success' })

      // 6. Navigate back
      router.back()
    } catch (error) {
      console.error('Create pot error:', error)
      showToast({ title: 'Failed to create pot', type: 'error' })
    }
  }

  return (
    <AppPage>
      {/* Form UI */}
      <Button onPress={handleCreate} loading={isLoading}>
        Create Pot
      </Button>
    </AppPage>
  )
}
```

### 2. Contribute Flow

```typescript
// components/pots/ContributeModal.tsx
export function ContributeModal({ pot, onClose }: Props) {
  const { account } = useWalletUi()
  const { programService } = useBlockchainStore()
  const { executeTransaction, isLoading } = useTransaction()
  const [amount, setAmount] = useState('')

  const handleContribute = async () => {
    if (!account || !programService) return

    try {
      // 1. Build transaction
      const tx = await programService.buildContributeTx({
        potPubkey: new PublicKey(pot.pot_pubkey),
        contributor: new PublicKey(account.address),
        amount: parseFloat(amount),
      })

      // 2. Execute via MWA (popup appears!)
      const signature = await executeTransaction(tx)

      // 3. Show success
      showToast({
        title: `Contributed ${amount} ${pot.currency}!`,
        type: 'success',
      })

      // 4. Refresh pot data
      await syncPotData(pot.pot_pubkey)

      onClose()
    } catch (error) {
      console.error('Contribute error:', error)
      showToast({ title: 'Contribution failed', type: 'error' })
    }
  }

  return (
    <Modal visible onClose={onClose}>
      {/* Amount input */}
      <Button onPress={handleContribute} loading={isLoading}>
        {isLoading ? 'Signing...' : 'Contribute'}
      </Button>
    </Modal>
  )
}
```

### 3. Multi-sig Release Flow

```typescript
// app/(tabs)/pots/[id]/index.tsx
export default function PotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { account } = useWalletUi()
  const { programService } = useBlockchainStore()
  const { executeTransaction } = useTransaction()
  const pot = usePot(id)

  const handleSignRelease = async () => {
    if (!account || !programService) return

    try {
      const tx = await programService.buildSignReleaseTx({
        potPubkey: new PublicKey(pot.pot_pubkey),
        signer: new PublicKey(account.address),
      })

      await executeTransaction(tx)

      showToast({ title: 'Release signed!', type: 'success' })

      // Refresh signatures
      await syncPotData(pot.pot_pubkey)
    } catch (error) {
      showToast({ title: 'Sign failed', type: 'error' })
    }
  }

  const handleReleaseFunds = async () => {
    if (!account || !programService) return

    try {
      const tx = await programService.buildReleaseFundsTx({
        potPubkey: new PublicKey(pot.pot_pubkey),
        authority: new PublicKey(account.address),
        recipient: new PublicKey(pot.authority_pubkey), // Or show input
      })

      await executeTransaction(tx)

      showToast({ title: 'Funds released!', type: 'success' })
    } catch (error) {
      showToast({ title: 'Release failed', type: 'error' })
    }
  }

  const canSign = pot.contributors.includes(account?.address)
  const canRelease = pot.signatures?.length >= pot.signers_required

  return (
    <AppPage>
      {/* Pot details */}

      {/* Signatures section */}
      <View>
        <Text>Signatures: {pot.signatures?.length || 0} of {pot.signers_required}</Text>

        {canSign && !pot.is_released && (
          <Button onPress={handleSignRelease}>Sign Release</Button>
        )}

        {canRelease && !pot.is_released && (
          <Button onPress={handleReleaseFunds}>Release Funds</Button>
        )}
      </View>
    </AppPage>
  )
}
```

---

## 🔄 Data Synchronization Strategy

### Hybrid Approach

```typescript
// utils/data-sync.ts
export class DataSyncManager {
  /**
   * Fetch pot data (Backend first, then blockchain)
   */
  async fetchPot(potPubkey: string) {
    try {
      // 1. Try backend first (fast)
      const cachedPot = await apiClient.getPot(potPubkey)

      // 2. Check if cache is fresh (< 30 seconds old)
      const isFresh = Date.now() - new Date(cachedPot.synced_at).getTime() < 30000

      if (isFresh) {
        return cachedPot
      }

      // 3. Fetch from blockchain (slower but accurate)
      const onChainPot = await programService.fetchPot(new PublicKey(potPubkey))

      // 4. Return on-chain data
      return onChainPot
    } catch (error) {
      // Fallback to blockchain if backend fails
      return await programService.fetchPot(new PublicKey(potPubkey))
    }
  }
}
```

---

## ✅ Implementation Checklist

### Phase 1: Setup
- [ ] Copy IDL to frontend
- [ ] Install Anchor dependencies
- [ ] Create services directory
- [ ] Configure program ID

### Phase 2: Core Services
- [ ] Implement PotProgramService
- [ ] Implement ApiClient
- [ ] Create transaction hook
- [ ] Create blockchain store

### Phase 3: UI Integration
- [ ] Update create pot flow
- [ ] Update contribute flow
- [ ] Implement sign release UI
- [ ] Implement release funds UI
- [ ] Add loading states
- [ ] Add error handling

### Phase 4: Polish
- [ ] Add transaction status tracking
- [ ] Implement optimistic UI updates
- [ ] Add retry logic
- [ ] Test all flows end-to-end

---

## 🧪 Testing

```typescript
// Test MWA flow locally
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js'

// Test transaction building
const tx = await programService.buildCreatePotTx({
  authority: wallet.publicKey,
  name: 'Test Pot',
  // ...
})

console.log('Transaction built:', tx)
```

---

## 🐛 Common Issues

### Issue: "Program account not found"
**Solution:** Ensure program is deployed and program ID is correct

### Issue: "MWA not connecting"
**Solution:** Ensure Solana wallet app is installed on device

### Issue: "Transaction timeout"
**Solution:** Increase commitment level or retry logic

---

*Last Updated: 2025-12-02*
