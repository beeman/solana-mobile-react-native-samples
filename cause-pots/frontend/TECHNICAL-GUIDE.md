# Anchor Smart Contract Integration Guide - Cause Pots

> **📖 Deep Dive Documentation**
> This guide explains Anchor/Solana smart contract integration in React Native.
> For quick start instructions, see [README.md](README.md).

This document focuses on **smart contract integration** - specifically how to connect Anchor programs to React Native using Mobile Wallet Adapter, PDAs, and type-safe transactions.

**Note**: All code snippets include file references (e.g., `services/pot-program.ts:29-67`) showing where the actual implementation can be found.

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup & Prerequisites](#setup--prerequisites)
4. [Mobile Wallet Adapter Integration](#mobile-wallet-adapter-integration)
5. [Anchor Framework & IDL](#anchor-framework--idl)
6. [Program Derived Addresses (PDAs)](#program-derived-addresses-pdas)
7. [Transaction Building Pattern](#transaction-building-pattern)
8. [Smart Contract Features](#smart-contract-features)
9. [State Management](#state-management)
10. [Common Issues](#common-issues)

---

## Overview

Cause Pots demonstrates Solana smart contract integration in React Native with:

- **Anchor Framework**: Type-safe contract interactions via IDL
- **Program Derived Addresses (PDAs)**: Deterministic account generation
- **Time-Locked Contracts**: Funds locked until unlock timestamp
- **Multi-Signature Release**: M-of-N contributor approval required
- **Hybrid State**: On-chain (vault, signatures) + off-chain (metadata, UI)
- **Mobile Wallet Adapter**: Secure transaction signing

**Use Case**: Group savings pot with $5000 target, locked until June 2025. All 3 contributors must sign to release funds after unlock date.

---

## Architecture

### Data Flow: Creating a Pot

```
User Form → PotProgram Service → MWA Sign → Blockchain → Backend API → UI Update
    ↓              ↓                  ↓           ↓            ↓           ↓
Validate    Build Transaction   Sign TX   Execute Contract  Store Data  Refresh
```

### Three-Layer Stack

```
┌─────────────────────────────────────────────────┐
│   React Native (UI + Zustand Store)            │
│   └─ PotProgram Service (Anchor Integration)   │
└─────────────────────────────────────────────────┘
         │                          │
         │ API Calls                │ Transactions
         ▼                          ▼
┌───────────────┐        ┌──────────────────────┐
│ Express/SQLite│        │   Solana Blockchain  │
│ (Metadata)    │        │   - Anchor Program   │
│               │        │   - PDA Accounts     │
│               │        │   - Vault (holds SOL)│
└───────────────┘        └──────────────────────┘
```

**Blockchain Role**: Enforces fund custody, time-locks, multi-sig
**Backend Role**: Caches data for fast UI queries

---

## Setup & Prerequisites

### Required Dependencies

```json
{
  "@coral-xyz/anchor": "^0.32.1",
  "@solana/web3.js": "^1.98.4",
  "@solana-mobile/mobile-wallet-adapter-protocol": "^2.2.5",
  "@solana-mobile/mobile-wallet-adapter-protocol-web3js": "^2.2.5"
}
```

### Critical: Crypto Polyfills

**⚠️ REQUIRED**: React Native lacks `crypto.getRandomValues()` needed for transaction IDs.

```bash
npm install expo-crypto buffer
```

**Setup** (`index.js` - MUST be first import):

```javascript
import './polyfill'
import 'expo-router/entry'
```

**Polyfill** (`polyfill.js`):

**Reference**: `polyfill.js:1-20`

```javascript
import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto'
import { Buffer } from 'buffer'

global.Buffer = Buffer

class Crypto {
  getRandomValues = expoCryptoGetRandomValues
}

const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto()

;(() => {
  if (typeof crypto === 'undefined') {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    })
  }
})()
```

**Why This Matters**:
- Solana Web3.js checks for crypto on module load
- If imported late, modules fail before polyfill loads
- Transactions need crypto for blockhash generation

### Native Module Setup

```bash
# Generate native Android project (required for MWA)
npx expo prebuild --clean
npx expo run:android
```

**Why Not Expo Go**: MWA requires custom native Android bridge code not available in Expo Go sandbox.

### Environment Configuration

```bash
# .env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
EXPO_PUBLIC_SOLANA_CLUSTER=devnet
EXPO_PUBLIC_PROGRAM_ID=CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR
```

**10.0.2.2**: Android emulator's IP for host machine's localhost
**Real Device**: Use computer's local IP (e.g., `192.168.1.100:3000`)

---

## Mobile Wallet Adapter Integration

### Provider Setup

This app uses `@wallet-ui/react-native-web3js` wrapper for simplified MWA integration:

```typescript
// components/app-providers.tsx
import { MobileWalletProvider } from '@wallet-ui/react-native-web3js'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <MobileWalletProvider chain="devnet" endpoint={DEVNET_ENDPOINT}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </MobileWalletProvider>
  )
}
```

### Auth Provider Pattern

**Reference**: `components/auth/auth-provider.tsx:18-88`

```typescript
export function AuthProvider({ children }: PropsWithChildren) {
  const [hasAuthenticated, setHasAuthenticated] = useState(false)
  const { account, connect, disconnect } = useMobileWallet()
  const { user, authenticate, logout } = useWalletAuth()
  const { clearAll } = useAppStore()

  // Authenticate with backend when wallet connects (only once)
  useEffect(() => {
    if (account?.publicKey && !hasAuthenticated && !user) {
      const authenticateUser = async () => {
        try {
          await authenticate({
            pubkey: account.publicKey.toString(),
            address: account.publicKey.toString(),
          })
          setHasAuthenticated(true)
        } catch (error) {
          console.error('Failed to authenticate user with backend:', error)
        }
      }
      authenticateUser()
    }
  }, [account, hasAuthenticated, user, authenticate])

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!account && !!user, ... }}>
      {children}
    </AuthContext.Provider>
  )
}
```

### Transaction Signing Hook

**Reference**: `hooks/use-transaction.ts:5-61`

```typescript
export function useTransaction() {
  const { connection, signAndSendTransaction } = useMobileWallet()

  const executeTransaction = async (transaction: Transaction): Promise<string> => {
    // Get fresh blockhash
    const { context: { slot: minContextSlot }, value: latestBlockhash } =
      await connection.getLatestBlockhashAndContext()

    // Convert to VersionedTransaction (required by newer MWA)
    const messageV0 = new TransactionMessage({
      payerKey: transaction.feePayer!,
      recentBlockhash: latestBlockhash.blockhash,
      instructions: transaction.instructions,
    }).compileToLegacyMessage()

    const versionedTransaction = new VersionedTransaction(messageV0)

    // Sign and send
    const signature = await signAndSendTransaction(versionedTransaction, minContextSlot)

    // Confirm
    await connection.confirmTransaction({ signature, ...latestBlockhash }, 'confirmed')

    return signature
  }

  return { executeTransaction }
}
```

**Why This Pattern**:
- Centralized blockhash management
- Auto token management by `@wallet-ui`
- Converts legacy Transaction → VersionedTransaction
- Uses `confirmed` commitment (fast for mobile)

---

## Anchor Framework & IDL

### What is Anchor?

Anchor provides:
- **Type-safe client code** generated from IDL
- **Automatic account validation** in smart contracts
- **Built-in error handling** with custom codes
- **Cross-program invocation (CPI)** helpers

### IDL Generation

```bash
cd contract
anchor build

# Generates two files:
# - target/idl/contract.json (snake_case - runtime IDL)
# - target/types/contract.ts (camelCase - TypeScript types)

# Copy BOTH files to frontend
cp target/idl/contract.json ../frontend/idl/contract.json
cp target/types/contract.ts ../frontend/idl/idl.ts
```

**Frontend IDL Structure**:

```
frontend/idl/
├── contract.json    # Raw IDL (copied from target/idl/contract.json)
├── idl.ts          # TypeScript types (copied from target/types/contract.ts)
└── index.ts        # Barrel export (manually created)
```

**Why Both Files?**
- `contract.json`: Runtime IDL that Anchor's Program class uses to build transactions
- `idl.ts`: TypeScript type definitions for type-safe method calls and IntelliSense
- `index.ts`: Exports both for convenient import

**Usage**:

```typescript
import { Contract, IDL } from '@/idl'

const provider = new AnchorProvider(connection, {} as any, { commitment: 'confirmed' })
const program = new Program<Contract>(IDL as Contract, provider)
```

**When to Regenerate IDL**:
- After modifying contract instructions
- After changing account structures
- If frontend throws "Unknown instruction" errors

**Regeneration Steps**:
```bash
cd contract
anchor build
cp target/idl/contract.json ../frontend/idl/contract.json
cp target/types/contract.ts ../frontend/idl/idl.ts
```

### Service Architecture Pattern

**Key Design**: Separate transaction **building** from **execution**

**Reference**: `services/pot-program.ts:5-114`

```typescript
export class PotProgramService {
  private program: Program<Contract>
  private connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
    const provider = new AnchorProvider(
      connection,
      {} as any, // Wallet not needed for read-only operations
      { commitment: 'confirmed' }
    )
    this.program = new Program<Contract>(IDL as Contract, provider)
  }

  // Builds transaction (does NOT execute)
  async buildCreatePotTx(params: {
    authority: PublicKey
    name: string
    description: string
    targetAmount: number
    unlockDays: number
    signersRequired: number
    contributors?: string[]
  }): Promise<Transaction> {
    const [potPDA] = this.getPotPDA(params.authority, params.name)
    const [vaultPDA] = this.getVaultPDA(potPDA)

    const targetAmountLamports = new BN(params.targetAmount * web3.LAMPORTS_PER_SOL)

    const createPotInstruction = await this.program.methods
      .createPot(
        params.name,
        params.description,
        targetAmountLamports,
        new BN(params.unlockDays),
        params.signersRequired
      )
      .accounts({
        pot: potPDA,
        potVault: vaultPDA,
        authority: params.authority,
        systemProgram: SystemProgram.programId,
      })
      .instruction()

    const tx = new Transaction().add(createPotInstruction)
    tx.feePayer = params.authority
    // Blockhash set by executeTransaction
    return tx
  }
}
```

**Why Separate Building from Execution?**:
- Service testable without wallet
- Reusable transaction builders
- Single source of truth for signing logic
- Clean separation of concerns

---

## Program Derived Addresses (PDAs)

### What are PDAs?

PDAs are **deterministic addresses** derived from seeds, eliminating keypair management.

```typescript
// ❌ Old way: Random keypairs
const potKeypair = Keypair.generate()  // Must store private key

// ✅ PDA way: Deterministic
const [potPDA, bump] = PublicKey.findProgramAddressSync(
  [Buffer.from('pot'), authority.toBuffer(), Buffer.from(potName)],
  programId
)
// Same seeds → same address every time!
```

### Benefits

- **Deterministic**: Reproducible from seeds
- **No Private Key**: Programs control them (no key management)
- **Discoverable**: Recreate address without storage

### PDA Implementation

**Reference**: `services/pot-program.ts:29-67`

```typescript
export class PotProgramService {
  // Pot account: ["pot", authority, name]
  getPotPDA(authority: PublicKey, potName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('pot'), authority.toBuffer(), Buffer.from(potName)],
      this.program.programId
    )
  }

  // Vault account: ["vault", pot]
  getVaultPDA(pot: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('vault'), pot.toBuffer()],
      this.program.programId
    )
  }

  // Contributor account: ["contributor", pot, contributor]
  getContributorPDA(pot: PublicKey, contributor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('contributor'), pot.toBuffer(), contributor.toBuffer()],
      this.program.programId
    )
  }
}
```

### Seed Design Patterns

**Pot Seeds**:
- `'pot'`: Namespace (distinguishes account types)
- `authority`: Each creator has unique pots
- `potName`: Creator can have multiple pots

**Vault Seeds**:
- `'vault'`: Namespace
- `pot`: One vault per pot (references the pot PDA)

**Contributor Seeds**:
- `'contributor'`: Namespace
- `pot`: Which pot (references the pot PDA)
- `contributor`: Which contributor

### Bump Seeds

```typescript
const [potPDA, bump] = PublicKey.findProgramAddressSync(seeds, programId)
//      ^^^^^^    ^^^^
//      address   0-255
```

**What is bump?**
- Single byte added to seeds
- Ensures address is NOT on Ed25519 curve (no private key)
- Anchor auto-validates in contract with `bump` constraint

---

## Transaction Building Pattern

### Architecture: Service + Hook Separation

**1. Service Layer** - Builds transactions:

```typescript
// services/pot-program.ts
export class PotProgramService {
  async buildCreatePotTx(...): Promise<Transaction> {
    // Build Anchor instruction
    // Return unsigned transaction
  }
}
```

**2. Hook Layer** - Executes transactions:

**Reference**: `hooks/use-pot-program.ts:7-50`

```typescript
export function usePotProgram() {
  const { connection, account } = useMobileWallet()
  const { executeTransaction } = useTransaction()
  const programService = useMemo(() => new PotProgramService(connection), [connection])

  const createPot = async (params: {
    name: string
    description: string
    targetAmount: number
    unlockDays: number
    signersRequired: number
    contributors?: string[]
  }) => {
    const authority = account.publicKey

    // 1. Build transaction
    const tx = await programService.buildCreatePotTx({
      authority,
      ...params,
    })

    // 2. Execute (blockhash, sign, send, confirm)
    const signature = await executeTransaction(tx)

    // 3. Return data
    const [potPDA] = programService.getPotPDA(authority, params.name)
    return { signature, potPubkey: potPDA.toBase58() }
  }

  return { createPot, programService }
}
```

### Complete Flow Example

**Reference**: Conceptual example based on `app/(tabs)/pots/create.tsx`

```typescript
export default function CreatePotScreen() {
  const { account } = useMobileWallet()
  const { createPot, programService } = usePotProgram()
  const { createPot: savePotToBackend } = useAppStore()

  const handleCreate = async () => {
    // 1. Create on blockchain
    const { signature, potPubkey } = await createPot({
      name: 'Vacation Fund',
      description: 'Summer trip',
      targetAmount: 5,
      unlockDays: 180,
      signersRequired: 2,
      contributors: [friend1, friend2],
    })

    // 2. Get vault PDA
    const [vaultPDA] = programService.getVaultPDA(new PublicKey(potPubkey))

    // 3. Save to backend
    await savePotToBackend({
      potPubkey,
      vaultPubkey: vaultPDA.toBase58(),
      transactionSignature: signature,
      // ... metadata
    })
  }
}
```

### Why Fresh Blockhash?

**Purpose**: Prevents replay attacks

```typescript
// ❌ Don't reuse
const blockhash = await connection.getLatestBlockhash()
// ... 2 minutes later
tx.recentBlockhash = blockhash  // Might be expired!

// ✅ Fresh before signing
const { blockhash } = await connection.getLatestBlockhash()
tx.recentBlockhash = blockhash
await signAndSend(tx)
```

**Expiration**: ~150 blocks (~60-75 seconds)

### Commitment Levels

```typescript
'processed'  // Fastest, can be rolled back
'confirmed'  // ⭐ Recommended for mobile (2s, secure enough)
'finalized'  // Slowest (~30s, guaranteed after 32 blocks)
```

---

## Smart Contract Features

### Time-Locks

**Concept**: Funds locked until blockchain timestamp

**Frontend**:

**Reference**: Conceptual example based on `app/(tabs)/pots/create.tsx`

```typescript
const unlockDate = new Date('2025-06-01')
const unlockDays = Math.ceil((unlockDate - Date.now()) / (1000 * 60 * 60 * 24))

await createPot({ unlockDays, ... })
```

**Smart Contract**:

**Reference**: `contract/programs/contract/src/lib.rs:10-48, 143-171`

```rust
pub fn create_pot(ctx: Context<CreatePot>, unlock_days: i64, ...) -> Result<()> {
    let clock = Clock::get()?;
    pot.unlock_timestamp = clock.unix_timestamp + (unlock_days * 86400);
    Ok(())
}

pub fn release_funds(ctx: Context<ReleaseFunds>, recipient: Pubkey) -> Result<()> {
    let clock = Clock::get()?;
    require!(
        clock.unix_timestamp >= pot.unlock_timestamp,
        ErrorCode::TimeLockNotExpired
    );
    // ... release funds
}
```

**Why Blockchain Time?**
- Client clocks can be manipulated
- Blockchain time is consensus-based
- Prevents bypassing locks

### Multi-Signature Release

**Concept**: M-of-N contributors must approve

**Setup**:

**Reference**: Conceptual example based on `hooks/use-pot-program.ts:26-50`

```typescript
await createPot({
  signersRequired: 2,  // 2 out of 3 must sign
  contributors: [alice, bob, charlie],
})
```

**Signing Flow**:

**Reference**: `contract/programs/contract/src/lib.rs:111-133, 143-171`

```rust
pub fn sign_release(ctx: Context<SignRelease>) -> Result<()> {
    let pot = &mut ctx.accounts.pot;
    let signer = ctx.accounts.signer.key();

    // Validate contributor
    require!(pot.contributors.contains(&signer), ErrorCode::NotAContributor);

    // Prevent double-signing
    require!(!pot.signatures.contains(&signer), ErrorCode::AlreadySigned);

    // Add signature
    pot.signatures.push(signer);
    Ok(())
}

pub fn release_funds(ctx: Context<ReleaseFunds>, recipient: Pubkey) -> Result<()> {
    let pot = &ctx.accounts.pot;

    // Check threshold
    require!(
        pot.signatures.len() >= pot.signers_required as usize,
        ErrorCode::InsufficientSignatures
    );

    // Transfer funds
    // ...
}
```

**Frontend Integration**:

**Reference**: Conceptual example based on `hooks/use-pot-program.ts:87-114`

```typescript
export function usePotProgram() {
  const signForRelease = async (potId: string) => {
    const pot = await getPotById(potId)

    // Add signature on-chain
    const signature = await program.signRelease(pot.potPubkey)

    // Record in backend
    await api.pots.sign(potId, { signature })
  }

  const releaseFunds = async (potId: string, recipient: string) => {
    const pot = await getPotById(potId)

    // Validate threshold
    if (pot.signatures.length < pot.signersRequired) {
      throw new Error('Insufficient signatures')
    }

    // Execute release
    await program.releaseFunds(pot.potPubkey, new PublicKey(recipient))
  }
}
```

### On-Chain vs Off-Chain Data

**On-Chain (Blockchain)**:
- ✅ Fund custody (vault PDA holds SOL)
- ✅ Time-lock enforcement
- ✅ Multi-sig threshold
- ✅ Signature validation

**Off-Chain (Backend API)**:
- ✅ Pot metadata (names, descriptions)
- ✅ Activity history
- ✅ Fast UI queries
- ✅ User profiles

**Data Flow**:

```
User Action → Blockchain TX → Backend Sync → Frontend Display
    ↓              ↓                ↓              ↓
Create pot    Execute contract  Store metadata  getAllPots()
```

---

## State Management

### Zustand Store Pattern

**Reference**: `store/app-store.ts:67-90, 92-160`

```typescript
interface AppStore {
  pots: Pot[]
  createPot: (pot: Omit<Pot, 'id' | 'createdAt' | 'contributions' | 'isReleased'>) => Promise<void>
  updatePot: (potId: string, updates: Partial<Pot>) => void
  setPots: (pots: Pot[]) => void
  refreshPot: (potId: string) => Promise<void>

  friends: Friend[]
  setFriends: (friends: Friend[]) => void
  addFriend: (publicKey: PublicKey, address: string, displayName?: string) => void

  activities: Activity[]
  setActivities: (activities: Activity[]) => void
}

export const useAppStore = create<AppStore>((set) => ({
  pots: [],
  createPot: async (potData) => {
    const createdPot = await createPot({ ...potData })
    set((state) => ({ pots: [createdPot, ...state.pots] }))
  },
  setPots: (pots) => set({ pots }),
  updatePot: (id, updates) => set((state) => ({
    pots: state.pots.map((p) => (p.id === id ? { ...p, ...updates } : p)),
  })),
  // ... more methods
}))
```

### Data Synchronization

**Initial Load**:

**Reference**: Conceptual example

```typescript
export function useInitializeData() {
  const { user } = useAppStore()

  useEffect(() => {
    if (!user) return

    const load = async () => {
      const [pots, friends, activities] = await Promise.all([
        api.pots.getAll(user.address),
        api.friends.getAll(),
        api.activities.getAll(user.address),
      ])

      setPots(pots)
      setFriends(friends)
      setActivities(activities)
    }

    load()
  }, [user])
}
```

**After Transaction**:

**Reference**: Conceptual example based on `hooks/use-pot-program.ts` + `store/app-store.ts`

```typescript
const createPot = async (params) => {
  // 1. Execute blockchain transaction
  const { signature, potPubkey } = await program.createPot(params)

  // 2. Save to backend
  const pot = await api.pots.create({
    potPubkey,
    transactionSignature: signature,
    ...params,
  })

  // 3. Optimistic UI update
  addPot(pot)
}
```

---

## Common Issues

### "crypto.getRandomValues() not supported"

**Cause**: Missing polyfill
**Solution**: Import `react-native-get-random-values` as FIRST line in `index.js`

### "Account does not exist"

**Cause**: PDA not initialized or wrong seeds
**Solution**: Verify seeds match contract, check transaction on Solana Explorer

### "Invalid instruction data"

**Cause**: Parameter types don't match IDL
**Solution**:

```typescript
// ❌ Wrong
program.methods.createPot(100, 1234567890, 2)

// ✅ Correct
program.methods.createPot(
  "Vacation Fund",                     // string
  new BN(100 * LAMPORTS_PER_SOL),      // BN for u64
  new BN(1234567890),                  // BN for i64
  2                                     // number for u8
)
```

### "Transaction expired"

**Cause**: Blockhash too old
**Solution**: Get fresh blockhash before each transaction

### "Already in use"

**Cause**: PDA already initialized
**Solution**: Can't create pot with same name twice; use different name

---

## Account Structures

### Smart Contract Accounts

**Reference**: `contract/programs/contract/src/lib.rs:221-261, 263-284`

```rust
#[account]
#[derive(InitSpace)]
pub struct PotAccount {
    pub authority: Pubkey,              // Creator
    pub vault: Pubkey,                  // Vault PDA holding SOL

    #[max_len(32)]
    pub name: String,
    #[max_len(200)]
    pub description: String,

    pub target_amount: u64,
    pub total_contributed: u64,
    pub unlock_timestamp: i64,

    pub signers_required: u8,
    #[max_len(10)]
    pub signatures: Vec<Pubkey>,        // Who has signed for release
    #[max_len(20)]
    pub contributors: Vec<Pubkey>,      // Allowed contributors

    pub is_released: bool,
    pub recipient: Option<Pubkey>,
    pub bump: u8,
    pub vault_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ContributorAccount {
    pub pot: Pubkey,
    pub contributor: Pubkey,
    pub total_contributed: u64,
    pub contribution_count: u32,
    pub bump: u8,
}
```

---

## Resources

### Documentation
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Mobile Docs](https://docs.solanamobile.com/)
- [Solana Cookbook](https://solanacookbook.com/)

### Tools
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Anchor CLI](https://www.anchor-lang.com/docs/cli)

### Next Steps
1. Read contract code: `../contract/programs/contract/src/lib.rs`
2. Explore service: `services/pot-program.ts`
3. Try creating a pot and view transaction on Solana Explorer
