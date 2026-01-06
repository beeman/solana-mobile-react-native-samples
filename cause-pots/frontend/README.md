# Frontend - Cause Pots

**Demo application** showcasing Anchor smart contract integration into React Native. This app demonstrates building custom transactions and instructions, working with Program Derived Addresses (PDAs), and integrating Solana programs using Mobile Wallet Adapter in a group savings context.

**Tech Stack:** React Native, Expo (SDK 54), TypeScript, Anchor Framework (0.32), Solana Mobile Wallet Adapter

📖 **[View Technical Deep Dive →](TECHNICAL-GUIDE.md)** - Comprehensive guide to Solana/Anchor integration

## Quick Start

### Prerequisites

- Android device or emulator
- Node.js 18+
- [Mock MWA Wallet](https://github.com/solana-mobile/mobile-wallet-adapter/tree/main/examples/example-clientlib-ktx) installed
- Backend API running (see [backend/README.md](../backend/README.md))

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

```bash
# Generate native projects (required for native modules)
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

**Important:** Requires a development build (not Expo Go) due to native Solana Mobile Wallet Adapter dependencies.

---

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Solana Configuration
EXPO_PUBLIC_SOLANA_CLUSTER=devnet
EXPO_PUBLIC_PROGRAM_ID=CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR
```

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API endpoint | `http://10.0.2.2:3000/api` (Android emulator) |
| `EXPO_PUBLIC_SOLANA_CLUSTER` | Solana network | `devnet` |
| `EXPO_PUBLIC_PROGRAM_ID` | Deployed Anchor program ID | `CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR` |

**Note:** `10.0.2.2` is the special IP for Android emulator to access host machine's localhost. For physical devices, use your computer's local IP address (e.g., `192.168.1.100`).

## Anchor IDL Setup

This app uses Anchor 0.32 which requires the IDL (Interface Definition Language) files to be copied from the contract after building.

If you encounter IDL-related errors, regenerate from the contract:
```bash
cd ../contract
anchor build
# Copy BOTH generated files
cp target/idl/contract.json ../frontend/idl/contract.json
cp target/types/contract.ts ../frontend/idl/idl.ts
```

See [TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md#anchor-framework--idl) for details.

## Key Features

- **Wallet Integration**: Mobile Wallet Adapter for secure wallet connections
- **Time-Locked Pots**: Create savings pots with unlock timestamps
- **Multi-Signature**: M-of-N approval voting for fund release
- **Program Derived Addresses**: Deterministic account generation
- **Friend Management**: Add friends via public key or .skr domains
- **Transaction History**: Complete blockchain audit trail

## Architecture Highlights

**Program Service Pattern**: `PotProgram` service class abstracts Anchor contract interactions

**Hybrid State Management**: On-chain state (vault balances, signatures) + off-chain metadata (names, descriptions)

**Transaction Flow**: Build → Sign via MWA → Send to blockchain → Record in backend

📖 **See [TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md)** for comprehensive implementation details, code walkthroughs, and best practices.

## Common Issues

### IDL parse error / Invalid program ID
1. Verify program ID in `.env` matches deployed contract
2. Regenerate IDL:
   ```bash
   cd ../contract && anchor build
   cp target/idl/contract.json ../frontend/idl/contract.json
   cp target/types/contract.ts ../frontend/idl/idl.ts
   ```
3. Rebuild: `npx expo prebuild --clean && npx expo run:android`

### Network request failed / API unreachable
1. Verify backend is running: `cd ../backend && npm start`
2. Check API URL in `.env` (use `10.0.2.2` for emulator, local IP for physical device)
3. Ensure firewall allows port 3000

### Wallet connection timeout
1. Ensure Solana wallet app installed
2. Rebuild native modules: `npx expo prebuild --clean`
3. Clear app data and reinstall

### Transaction simulation failed
1. Request devnet SOL via Account screen
2. Check Solana Explorer for error details
3. Verify pot configuration

📖 **See [TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md#common-anchor-errors)** for detailed error troubleshooting

## Resources

- [Solana Mobile Docs](https://docs.solanamobile.com/)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md) - Complete implementation guide
