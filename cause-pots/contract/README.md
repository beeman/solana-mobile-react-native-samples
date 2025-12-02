# Cause Pots Smart Contract

A Solana smart contract for group savings with time-locked PDAs and multi-signature release mechanisms. Built with Anchor framework.

## Overview

Cause Pots enables groups to save SOL together with built-in protections:
- **Time-Lock**: Funds cannot be released until a specified unlock date
- **Multi-Signature**: Requires M-of-N contributor signatures to release funds
- **Contributor Tracking**: Detailed tracking of individual contributions
- **Authority Management**: Pot creator can add new contributors

## Program ID
```
58pL9f7ghhBpJNeavRiCp7mdeCACZ232NPxaFEj9zGfN
```

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
| `unlock_timestamp` | `i64` | Unix timestamp when funds can be released |
| `signers_required` | `u8` | Number of signatures needed for release |
| `signatures` | `Vec<Pubkey>` | List of approving signers (max 10) |
| `contributors` | `Vec<Pubkey>` | List of contributors (max 20) |
| `is_released` | `bool` | Whether funds have been released |
| `released_at` | `Option<i64>` | Timestamp of release |
| `recipient` | `Option<Pubkey>` | Address that received funds |
| `created_at` | `i64` | Creation timestamp |
| `bump` | `u8` | PDA bump seed |

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
- `unlock_days: i64` - Number of days until unlock
- `signers_required: u8` - Number of signatures needed for release

**Validations:**
- Name length ≤ 32 characters
- Description length ≤ 200 characters
- Target amount > 0
- Unlock days > 0
- Signers required > 0

**Example:**
```typescript
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
await program.methods
  .contribute(new anchor.BN(2 * LAMPORTS_PER_SOL))
  .accounts({
    pot: potPDA,
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
await program.methods
  .releaseFunds(recipient.publicKey)
  .accounts({
    pot: potPDA,
    authority: authority.publicKey,
    recipient: recipient.publicKey,
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
| 6003 | `InvalidUnlockPeriod` | Unlock period must be > 0 days |
| 6004 | `InvalidSignersRequired` | Signers required must be > 0 |
| 6005 | `InvalidAmount` | Contribution amount must be > 0 |
| 6006 | `PotAlreadyReleased` | Cannot modify released pot |
| 6007 | `TimeLockNotExpired` | Time-lock period not expired |
| 6008 | `NotAContributor` | Only contributors can sign |
| 6009 | `AlreadySigned` | Contributor already signed |
| 6010 | `InsufficientSignatures` | Not enough signatures for release |
| 6011 | `AlreadyAContributor` | Contributor already exists |
| 6012 | `InsufficientFunds` | Pot doesn't have enough funds |
| 6013 | `Overflow` | Arithmetic overflow |

## Testing

The contract includes 18 comprehensive tests covering all functionality:

**Test Coverage:**
- ✓ Pot creation with validation (7 tests)
- ✓ Contribution tracking and account creation (4 tests)
- ✓ Multi-sig signing with time-lock enforcement (2 tests)
- ✓ Fund release with threshold validation (2 tests)
- ✓ Contributor management (2 tests)
- ✓ Complete lifecycle integration (1 test)

**Run Tests:**
```bash
anchor test
```

**Expected Output:**
```
18 passing (12s)
```

## Development Setup

### Prerequisites

- Rust 1.89.0 (configured via rust-toolchain.toml)
- Solana CLI 3.1.3
- Anchor CLI 0.32.1
- Anchor Lang 0.32.1
- Node.js 16+ with Yarn

### Installation

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Solana
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Install Anchor
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install 0.32.1
avm use 0.32.1

# Install dependencies
yarn install
```

### Build

```bash
anchor build
```

### Deploy

**Localnet:**
```bash
anchor test
```

**Devnet:**
```bash
solana config set --url devnet
solana airdrop 2
anchor deploy --provider.cluster devnet
```

**Mainnet:**
```bash
solana config set --url mainnet-beta
anchor deploy --provider.cluster mainnet
```

## Usage Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "./target/types/contract";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.Contract as Program<Contract>;

// 1. Create pot
const potName = "Trip Fund";
const [potPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("pot"), authority.publicKey.toBuffer(), Buffer.from(potName)],
  program.programId
);

await program.methods
  .createPot(
    potName,
    "Saving for Tokyo trip",
    new anchor.BN(50 * LAMPORTS_PER_SOL),
    new anchor.BN(30),
    2
  )
  .accounts({
    pot: potPDA,
    authority: authority.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .signers([authority])
  .rpc();

// 2. Contributors contribute
for (const contributor of [contributor1, contributor2, contributor3]) {
  const [contributorPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("contributor"), potPDA.toBuffer(), contributor.publicKey.toBuffer()],
    program.programId
  );

  await program.methods
    .contribute(new anchor.BN(2 * LAMPORTS_PER_SOL))
    .accounts({
      pot: potPDA,
      contributorAccount: contributorPDA,
      contributor: contributor.publicKey,
      systemProgram: SystemProgram.programId,
    })
    .signers([contributor])
    .rpc();
}

// 3. After time-lock expires, contributors sign
await program.methods
  .signRelease()
  .accounts({ pot: potPDA, signer: contributor1.publicKey })
  .signers([contributor1])
  .rpc();

await program.methods
  .signRelease()
  .accounts({ pot: potPDA, signer: contributor2.publicKey })
  .signers([contributor2])
  .rpc();

// 4. Authority releases funds
await program.methods
  .releaseFunds(recipient.publicKey)
  .accounts({
    pot: potPDA,
    authority: authority.publicKey,
    recipient: recipient.publicKey,
  })
  .signers([authority])
  .rpc();
```

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

## License

MIT
