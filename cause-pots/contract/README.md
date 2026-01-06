# Cause Pots Smart Contract

A Solana smart contract for group savings with time-locked PDAs and multi-signature release mechanisms. Built with Anchor framework.

## Overview

Cause Pots enables groups to save SOL together with built-in protections:
- **Time-Lock**: Funds cannot be released until a specified unlock date
- **Multi-Signature**: Requires M-of-N contributor signatures to release funds
- **Contributor Tracking**: Detailed tracking of individual contributions
- **Authority Management**: Pot creator can add new contributors

## Deployment

**Network:** Solana Devnet

**Program ID:**
```
CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR
```

**Explorer:** [View on Solana Explorer](https://explorer.solana.com/address/CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR?cluster=devnet)

## Account Structures

### PotAccount
Main account storing pot state and funds.

| Field | Type | Description |
|-------|------|-------------|
| `authority` | `Pubkey` | Creator and authority of the pot |
| `name` | `String` | Pot name (max 32 chars) |
| `description` | `String` | Pot description (max 200 chars) |
| `target_amount` | `u64` | Target savings goal in lamports |
| `total_contributed` | `u64` | Total SOL contributed |
| `unlock_timestamp` | `i64` | Unix timestamp when funds can be released (calculated from unlock_days) |
| `signers_required` | `u8` | Number of signatures needed for release |
| `signatures` | `Vec<Pubkey>` | List of approving signers (max 10) |
| `contributors` | `Vec<Pubkey>` | List of contributors (max 20) |
| `is_released` | `bool` | Whether funds have been released |
| `released_at` | `Option<i64>` | Timestamp of release |
| `recipient` | `Option<Pubkey>` | Address that received funds |
| `created_at` | `i64` | Creation timestamp |
| `bump` | `u8` | PDA bump seed |
| `vault_bump` | `u8` | Vault PDA bump seed |

**PDA Seeds:** `["pot", authority, name]`

### ContributorAccount
Per-contributor tracking account.

| Field | Type | Description |
|-------|------|-------------|
| `pot` | `Pubkey` | Reference to pot account |
| `contributor` | `Pubkey` | Contributor's public key |
| `total_contributed` | `u64` | Total lamports contributed |
| `contribution_count` | `u32` | Number of contributions |
| `last_contribution_at` | `i64` | Timestamp of last contribution |
| `joined_at` | `i64` | Timestamp when joined |
| `bump` | `u8` | PDA bump seed |

**PDA Seeds:** `["contributor", pot, contributor]`

## Instructions

### create_pot

Create a new savings pot with time-lock and multi-sig configuration.

**Parameters:**
- `name: String` - Pot name (max 32 characters)
- `description: String` - Pot description (max 200 characters)
- `target_amount: u64` - Target savings goal in lamports
- `unlock_days: i64` - Number of days until unlock (converted to timestamp internally)
- `signers_required: u8` - Number of signatures needed for release

**Validations:**
- Name length ≤ 32 characters
- Description length ≤ 200 characters
- Target amount > 0
- Signers required > 0

**Note:** `unlock_days` can be 0 for immediate/same-day unlock. It's converted to Unix timestamp: `current_time + (unlock_days * 86400)`

**Example:**
```typescript
const [potPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("pot"), authority.publicKey.toBuffer(), Buffer.from("Trip Fund")],
  program.programId
);
const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), potPDA.toBuffer()],
  program.programId
);

await program.methods
  .createPot(
    "Trip Fund",
    "Saving for Tokyo trip",
    new anchor.BN(50 * LAMPORTS_PER_SOL),
    new anchor.BN(30),
    2
  )
  .accounts({
    pot: potPDA,
    potVault: vaultPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

### contribute

Contribute SOL to a pot. Automatically creates contributor account on first contribution.

**Parameters:**
- `amount: u64` - Amount to contribute in lamports

**Validations:**
- Amount > 0
- Pot not already released

**Behavior:**
- Transfers SOL from contributor to pot PDA
- Updates pot's total_contributed
- Adds contributor to contributors list if new
- Creates/updates ContributorAccount

**Example:**
```typescript
const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), potPDA.toBuffer()],
  program.programId
);
const [contributorPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("contributor"), potPDA.toBuffer(), contributor.publicKey.toBuffer()],
  program.programId
);

await program.methods
  .contribute(new anchor.BN(2 * LAMPORTS_PER_SOL))
  .accounts({
    pot: potPDA,
    potVault: vaultPDA,
    contributorAccount: contributorPDA,
    contributor: contributor.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([contributor])
  .rpc();
```

### sign_release

Sign to approve fund release (multi-sig voting).

**Validations:**
- Pot not already released
- Signer is a contributor
- Signer hasn't already signed
- Time-lock has expired

**Example:**
```typescript
await program.methods
  .signRelease()
  .accounts({
    pot: potPDA,
    signer: contributor.publicKey,
  })
  .signers([contributor])
  .rpc();
```

### release_funds

Release pot funds to a recipient. Requires signature threshold and authority.

**Parameters:**
- `recipient: Pubkey` - Address to receive funds

**Validations:**
- Pot not already released
- Time-lock has expired
- Signature threshold met
- Sufficient funds after rent-exempt reserve

**Behavior:**
- Transfers SOL from pot PDA to recipient
- Marks pot as released
- Records release timestamp and recipient

**Example:**
```typescript
const [vaultPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("vault"), potPDA.toBuffer()],
  program.programId
);

await program.methods
  .releaseFunds(recipient.publicKey)
  .accounts({
    pot: potPDA,
    potVault: vaultPDA,
    authority: authority.publicKey,
    recipient: recipient.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();
```

### add_contributor

Add a new contributor to the pot. Authority only.

**Parameters:**
- `new_contributor: Pubkey` - Public key of new contributor

**Validations:**
- Pot not already released
- Contributor not already in list

**Example:**
```typescript
await program.methods
  .addContributor(newContributor.publicKey)
  .accounts({
    pot: potPDA,
    authority: authority.publicKey,
  })
  .signers([authority])
  .rpc();
```

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 6000 | `NameTooLong` | Pot name exceeds 32 characters |
| 6001 | `DescriptionTooLong` | Description exceeds 200 characters |
| 6002 | `InvalidTargetAmount` | Target amount must be > 0 |
| 6003 | `InvalidSignersRequired` | Signers required must be > 0 |
| 6004 | `InvalidAmount` | Contribution amount must be > 0 |
| 6005 | `PotAlreadyReleased` | Cannot modify released pot |
| 6006 | `TimeLockNotExpired` | Time-lock period not expired |
| 6007 | `NotAContributor` | Only contributors can sign |
| 6008 | `AlreadySigned` | Contributor already signed |
| 6009 | `InsufficientSignatures` | Not enough signatures for release |
| 6010 | `AlreadyAContributor` | Contributor already exists |
| 6011 | `InsufficientFunds` | Pot doesn't have enough funds |
| 6012 | `Overflow` | Arithmetic overflow |

## Testing

The contract includes 18 comprehensive tests covering all functionality:

**Test Coverage:**
- Pot creation with validation (7 tests)
- Contribution tracking and account creation (4 tests)
- Multi-sig signing with time-lock enforcement (2 tests)
- Fund release with threshold validation (2 tests)
- Contributor management (2 tests)
- Complete lifecycle integration (1 test)

**Run Tests:**
```bash
anchor test
```

**Expected Output:**
```
18 passing (12s)
```

## Development

### Prerequisites
- Rust 1.89.0
- Solana CLI 3.1.3
- Anchor CLI 0.32.1
- Node.js 16+

### Setup
```bash
anchor build
anchor test
```

### Deploy
```bash
# Devnet
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
```

## Complete Usage Flow

```typescript
// 1. Create pot with time-lock and 2-of-3 multi-sig
await program.methods.createPot(
  "Trip Fund", "Tokyo trip", new BN(50 * LAMPORTS_PER_SOL), new BN(30), 2
).rpc();

// 2. Contributors contribute
await program.methods.contribute(new BN(2 * LAMPORTS_PER_SOL)).rpc();

// 3. After time-lock, contributors sign (2 required)
await program.methods.signRelease().rpc();
await program.methods.signRelease().rpc();

// 4. Authority releases funds
await program.methods.releaseFunds(recipient.publicKey).rpc();
```

See tests for complete examples.

## Security Considerations

### Implemented Protections

- Time-lock enforcement via Clock
- Multi-signature threshold validation
- Authority-only controls with constraints
- PDA security with deterministic addresses
- Arithmetic safety with checked operations
- State immutability for released pots

### Known Limitations

- No withdrawal mechanism for contributors
- Fixed multi-sig configuration after creation
- Authority trust required for final release

## Resources

- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Frontend README](../frontend/README.md) - React Native integration guide
- [Frontend TECHNICAL-GUIDE](../frontend/TECHNICAL-GUIDE.md) - Deep dive into client-side integration
