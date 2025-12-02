# Settle - Web3 Expense Splitting App

> An expense splitting application with Solana wallet integration. Login with wallet, add friends, create groups, split expenses, and pay using SOL transfers.

**Tech Stack:** React Native, Expo Router, Wallet UI SDK, Web3.js

📖 **[View Technical Deep Dive →](TECHNICAL-GUIDE.md)**

## Features

- Connect Solana wallet via Mobile Wallet Adapter
- **Display .skr domains** - Shows user-friendly AllDomains (.skr) instead of public keys
- Add friends via phone number or public key
- Create groups and split expenses
- Send SOL payments with automatic USD conversion
- View transaction history

---

## Quick Start

### Prerequisites

- Android device or emulator
- Node.js 18+
- [Mock MWA Wallet](https://github.com/solana-mobile/mobile-wallet-adapter/tree/main/examples/example-clientlib-ktx) installed

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

```bash
# Generate native projects
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

---

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# Solana Configuration
EXPO_PUBLIC_SOLANA_CLUSTER=devnet
EXPO_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
```

### Critical Setup: Crypto Polyfill

React Native requires a crypto polyfill for Solana Web3.js. **Import it first** in [app/_layout.tsx](app/_layout.tsx):

```typescript
import 'react-native-get-random-values';
```

**Why?** Solana Web3.js uses `crypto.getRandomValues()` for transaction IDs. Without this, you'll get:
```
Error: crypto.getRandomValues() not supported
```

---

## Project Structure

```
settle/frontend/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation (groups, friends, activity, account)
│   ├── _layout.tsx          # Root layout with wallet provider
│   ├── login.tsx            # Wallet login screen
│   ├── add-expense.tsx      # Add expense screen
│   └── balances.tsx         # Payment screen
├── utils/                   # Utility functions
│   ├── address.ts           # Address validation utilities
│   ├── api-client.ts        # HTTP client
│   ├── formatters.ts        # Data formatting
│   └── validators.ts        # Input validation
├── solana/                  # Web3 integration
│   └── transaction.ts       # SOL transfers & transactions
├── apis/                    # API client functions
│   └── auth.ts              # Wallet session APIs
├── components/              # Reusable components
│   ├── providers/           # React context providers
│   │   ├── ConnectionProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── hooks/               # Custom hooks
└── constants/               # App constants
    └── wallet.ts            # Solana configuration
```

---

## Key Concepts

### Wallet Integration

Uses `@wallet-ui/react-native-web3js` SDK for Mobile Wallet Adapter functionality, providing a unified hook (`useMobileWalletAdapter()`) for all wallet operations.

**Files:** [app/_layout.tsx](app/_layout.tsx), [app/login.tsx](app/login.tsx)

### Address Validation

Simple utilities for validating Solana addresses before transactions.

**Files:** [utils/address.ts](utils/address.ts)

### Transaction Signing

SOL payments with automatic USD-to-SOL conversion using live CoinGecko prices. The SDK handles authorization automatically.

**Files:** [solana/transaction.ts](solana/transaction.ts), [app/balances.tsx](app/balances.tsx)

### Session Persistence

The Wallet UI SDK handles auth token persistence automatically across app restarts.

---

## Common Issues

### Error: "crypto.getRandomValues() not supported"

**Solution:**
1. Install: `npm install react-native-get-random-values`
2. Import as **first line** in [app/_layout.tsx](app/_layout.tsx)
3. Rebuild: `npx expo prebuild --clean && npx expo run:android`

### Error: "Transaction expired"

**Solution:** Blockhash is too old (>150 blocks). Get fresh blockhash before each transaction (already implemented).

### Wallet popup doesn't appear

**Solution:** Native module not linked. Run `npx expo prebuild --clean` and rebuild.

---

## Documentation

- **[TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md)** - Comprehensive guide explaining all implementation details
- **[Backend README](../backend/README.md)** - API server documentation

---

## Resources

### Official Documentation
- [Solana Mobile Docs](https://docs.solanamobile.com/react-native/overview)
- [Wallet UI SDK](https://github.com/beeman/web3js-expo-wallet-ui)
- [Solana Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)

### Developer Tools
- [Solana Explorer (Devnet)](https://explorer.solana.com/?cluster=devnet)
- [Solana Faucet](https://faucet.solana.com/)
- [Solana Cookbook](https://solanacookbook.com/)

### Sample Apps
- [Solana Mobile dApp Scaffold](https://github.com/solana-mobile/solana-mobile-dapp-scaffold)
- [Wallet UI Examples](https://github.com/beeman/web3js-expo-wallet-ui)

---
