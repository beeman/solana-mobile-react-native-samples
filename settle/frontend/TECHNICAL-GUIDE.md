# Web3 Integration Guide - Settle App

> **📖 Deep Dive Documentation**
> This is a comprehensive technical guide explaining all Web3/Solana integration details.
> For quick start instructions, see [README.md](README.md).

This document explains all the Web3/Solana integration steps implemented in the Settle app, with detailed explanations of **why** each decision was made.

## Table of Contents
1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Setup & Prerequisites](#setup--prerequisites)
4. [Wallet Connection](#wallet-connection)
5. [Transaction Signing](#transaction-signing)
6. [AllDomains (.skr) Integration](#alldomains-skr-integration)
7. [Common Issues & Solutions](#common-issues--solutions)

---

## Overview
An expense splitting application, similar to Splitwise. Login with wallet, add friends via their phone number or public key, create groups, split expenses, pay using SOL transfer transactions, and view transaction details on the activity page.

---

## Project Structure

The frontend follows a clean, organized structure optimized for React Native development with Expo Router:

```
settle/frontend/
├── app/                      # Expo Router app directory
│   ├── (tabs)/              # Tab-based navigation screens
│   │   ├── _layout.tsx      # Tab layout configuration
│   │   ├── account.tsx      # Account/profile screen
│   │   ├── activity.tsx     # Activity feed screen
│   │   ├── friends.tsx      # Friends list screen
│   │   └── groups.tsx       # Groups list screen
│   ├── activity-detail/     # Dynamic routes
│   │   └── [id].tsx         # Activity detail screen
│   ├── group-detail/
│   │   └── [id].tsx         # Group detail screen
│   ├── _layout.tsx          # Root layout (crypto polyfill + wallet provider)
│   ├── login.tsx            # Wallet login screen
│   ├── signup.tsx           # User registration screen
│   ├── add-expense.tsx      # Add expense screen
│   ├── create-group.tsx     # Create group screen
│   ├── balances.tsx         # Settle up/payment screen
│   └── ...                  # Other screens
├── utils/                   # Utility functions
│   ├── address.ts           # Address validation utilities
│   ├── api-client.ts        # HTTP client configuration
│   ├── formatters.ts        # Data formatting utilities
│   └── validators.ts        # Input validation
├── solana/                  # Solana/Web3 integration
│   └── transaction.ts       # SOL transfers & transactions
├── apis/                    # API client functions
│   ├── auth.ts              # Auth & wallet session APIs
│   ├── expenses.ts          # Expense management APIs
│   ├── groups.ts            # Group management APIs
│   ├── friends.ts           # Friends management APIs
│   └── balances.ts          # Balance & settlement APIs
├── components/              # Reusable UI components
│   ├── common/              # Generic components (Button, Input, etc.)
│   ├── providers/           # React context providers
│   │   ├── ConnectionProvider.tsx
│   │   └── ThemeProvider.tsx
│   ├── hooks/               # Custom React hooks
│   └── ui/                  # UI-specific components
├── constants/               # App-wide constants
│   ├── wallet.ts            # Wallet/Solana constants
│   └── theme.ts             # Theme configuration
└── assets/                  # Static assets (images, fonts)
```

### Key Directories for Web3 Integration

- **[app/_layout.tsx](app/_layout.tsx)**: Crypto polyfill setup + wallet provider configuration
- **[solana/](solana/)**: Solana/Web3 integration
  - [transaction.ts](solana/transaction.ts): SOL transfers, balance checking, USD/SOL conversion
- **[utils/address.ts](utils/address.ts)**: Address validation utilities
- **[constants/wallet.ts](constants/wallet.ts)**: App identity, cluster configuration

---

## Setup & Prerequisites

### Required Dependencies

```bash
npm install @solana/web3.js
npm install @wallet-ui/react-native-web3js
npm install @tanstack/react-query
npm install react-native-get-random-values
```

### Critical: Crypto Polyfill Setup

**⚠️ IMPORTANT**: React Native doesn't have `crypto.getRandomValues()` by default, which Solana Web3.js requires.

#### Implementation: `app/_layout.tsx`

```typescript
import 'react-native-get-random-values';

// Then other imports...
import { Stack } from 'expo-router';
// ...
```

### Why This Is Critical

#### 1. **Order Matters**
**What**: Must be the first import in your root layout
**Why**:
- Polyfills global `crypto` object
- Other modules check for crypto on import
- If imported late, modules already failed their checks
- Can cause random "crypto.getRandomValues() not supported" errors

#### 2. **What Does It Polyfill?**
**What**: Provides `crypto.getRandomValues()` API
**Why Needed**:
- Solana Web3.js uses it for transaction IDs
- UUID generation for request tracking
- Secure random number generation
- Native crypto APIs not available in React Native

#### 3. **Error If Missing**
```
Error: crypto.getRandomValues() not supported.
See https://github.com/uuidjs/uuid#getrandomvalues-not-supported
```

**Symptoms**:
- ✅ Wallet connection works (doesn't need crypto)
- ❌ Transactions fail (needs crypto for blockhash/IDs)
- ❌ getLatestBlockhash() throws error
- ❌ Random crashes when signing

### Native Module Setup

For Solana Mobile Wallet Adapter to work, you need a development build:

```bash
# Generate native projects
npx expo prebuild --clean

# Build for Android
npx expo run:android
```

**Why Not Expo Go**:
- Expo Go doesn't include custom native modules
- Mobile Wallet Adapter requires native Android code
- Must use development build or EAS Build

---

## Wallet Connection

### Implementation: `app/_layout.tsx`

```typescript
import { MobileWalletAdapterProvider } from '@wallet-ui/react-native-web3js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SOLANA_CLUSTER, SOLANA_RPC_ENDPOINT } from '@/constants/wallet';

const queryClient = new QueryClient();

export default function RootLayout() {
  const clusterId = `solana:${SOLANA_CLUSTER}` as const;

  return (
    <QueryClientProvider client={queryClient}>
      <MobileWalletAdapterProvider
        clusterId={clusterId}
        endpoint={SOLANA_RPC_ENDPOINT}
        identity={{ name: 'Settle' }}
      >
        {/* App content */}
      </MobileWalletAdapterProvider>
    </QueryClientProvider>
  );
}
```

### Usage in Components: `app/login.tsx`

```typescript
import { useMobileWalletAdapter } from '@wallet-ui/react-native-web3js';

export default function LoginScreen() {
  const { account, connect } = useMobileWalletAdapter();

  const handleConnectWallet = async () => {
    const connectedAccount = await connect();
    const address = connectedAccount.publicKey.toString();

    // Connect to backend with wallet address
    const response = await connectWallet(address);
    // ...
  };
}
```

### Why This Approach?

#### 1. **Using Wallet UI SDK**
**What**: `@wallet-ui/react-native-web3js` from beeman

**Why**:
- Production-ready, maintained SDK
- Handles wallet lifecycle automatically
- Built-in auth token persistence
- Simplified API compared to raw MWA
- Includes TypeScript types

#### 2. **React Query Integration**
**What**: Required by Wallet UI SDK

**Why**:
- Manages wallet state efficiently
- Handles caching and revalidation
- Provides loading/error states


#### 3. **App Identity Configuration**
**What**: Metadata about your app shown in wallet approval dialog

**Why**:
- Users see who's requesting access
- Builds trust and brand recognition
- Required by wallet apps for security

```typescript
identity={{ name: 'Settle' }}
```

---

## Transaction Signing

### Implementation: `app/balances.tsx`

```typescript
import { useMobileWalletAdapter } from '@wallet-ui/react-native-web3js';
import { useConnection } from '@/components/providers';
import { Transaction, SystemProgram, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function BalancesScreen() {
  const { account, signAndSendTransaction } = useMobileWalletAdapter();
  const connection = useConnection();
  const publicKey = account?.publicKey;
  const connected = !!account;

  const handleSettleUp = async (recipientPubkey, amount, lamports) => {
    // Get fresh blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Create transfer instruction
    const transaction = new Transaction({
      feePayer: publicKey,
      blockhash,
      lastValidBlockHeight,
    }).add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: new PublicKey(recipientPubkey),
        lamports,
      })
    );

    // Sign and send (SDK handles auth automatically)
    const signature = await signAndSendTransaction(transaction);
    console.log('Transaction sent:', signature);

    // Confirm transaction
    const confirmation = await connection.confirmTransaction({
      signature,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error('Transaction failed');
    }
  };
}
```

### Why This Flow?

#### 1. **SDK Handles Authorization**
**What**: No manual auth token management needed
**Why**:
- SDK automatically manages session state
- Handles token expiry and refresh
- Eliminates boilerplate retry logic
- Creates seamless UX

#### 2. **USD to SOL Conversion**
**What**: Fetch live SOL/USD price and convert payment amounts
**Why**:
- Users think in USD, blockchain operates in SOL
- CoinGecko API provides real-time pricing
- Fallback rate if API fails
- Ensures accurate payment amounts

```typescript
// solana/transaction.ts
export const getSolToUsdRate = async (): Promise<number> => {
  try {
    const response = await axios.get(COINGECKO_PRICE_API);
    const rate = response.data.solana.usd;
    if (!rate) throw new Error('Could not fetch SOL to USD rate.');
    return rate;
  } catch (error) {
    const fallbackRate = 50;
    console.warn(`Using fallback SOL/USD rate: ${fallbackRate}`);
    return fallbackRate;
  }
};
```

#### 3. **Using `getLatestBlockhash()`**
**What**: Get recent blockhash for transaction expiry
**Why**:
- Transactions expire after ~150 blocks (~1-2 minutes)
- Prevents replay attacks
- Ensures transaction is recent and valid
- Required for transaction confirmation

#### 4. **Converting SOL to Lamports**
**What**: `lamports = amountInSol * LAMPORTS_PER_SOL`
**Why**:
- Prevents floating-point precision issues
- Native unit for Solana runtime

```typescript
const lamports = Math.floor(0.001 * LAMPORTS_PER_SOL); // 1,000,000 lamports
```

#### 5. **SystemProgram.transfer()**
**What**: Built-in Solana instruction for SOL transfers
**Why**:
- Optimized native instruction
- Lower compute units = lower fees
- Simpler than custom programs
- Battle-tested and secure

#### 6. **Transaction Confirmation**
**What**: `confirmTransaction()` before returning success
**Why**:
- Transaction might fail after submission
- Network issues could prevent finalization
- User needs to know actual result
- Prevents showing success for failed transactions

---

## AllDomains (.skr) Integration

### Overview

The app integrates with **AllDomains SDK** to display user-friendly `.skr` domains instead of raw Solana public keys throughout the interface.

**Example**:
- **Without domains**: `7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU`
- **With domains**: `alice.skr`

### How It Works

#### Backend Domain Resolution

The backend automatically resolves .skr domains when users connect their wallet:

1. User connects wallet via Mobile Wallet Adapter
2. Backend receives the public key
3. Queries Solana blockchain using AllDomains SDK (`@onsol/tldparser`)
4. Stores resolved domain in database (`skr_domain` column)
5. Returns domain along with user data

#### Frontend Display Logic

The frontend receives domain data from API responses and displays it with fallback:

```typescript
// Example from app/(tabs)/account.tsx
{userData?.skr_domain || account?.publicKey?.toString() || 'Not connected'}
```

### Related Files

**Frontend**:
- [app/(tabs)/account.tsx](app/(tabs)/account.tsx) - Account screen showing user's domain
- [apis/friends.ts](apis/friends.ts) - Friend interface with `skr_domain`

---

## Common Issues & Solutions

### Issue: "crypto.getRandomValues() not supported" Error
**Cause**: Missing crypto polyfill for React Native
**Solution**:
1. Install: `npm install react-native-get-random-values`
2. Import as FIRST line in `app/_layout.tsx`: `import 'react-native-get-random-values';`
3. Reload app (may need full rebuild)

### Issue: "Transaction expired" Error
**Cause**: Blockhash too old (>150 blocks)
**Solution**: Get fresh blockhash before each transaction (already implemented)

### Issue: Wallet popup doesn't appear
**Cause**: Native module not linked
**Solution**: Run `npx expo prebuild --clean` and rebuild

### Issue: "Insufficient funds" Error
**Cause**: Not enough SOL for transaction + fees
**Solution**: Check balance first, add buffer for fees (~0.000005 SOL)

---

## Important Constants

Solana configuration is managed through environment variables and [constants/wallet.ts](constants/wallet.ts):

**Environment Variables** (`.env`):
```bash
EXPO_PUBLIC_SOLANA_CLUSTER=devnet
EXPO_PUBLIC_SOLANA_RPC_ENDPOINT=https://api.devnet.solana.com
```

**Constants** ([constants/wallet.ts](constants/wallet.ts)):
```typescript
export const APP_IDENTITY = {
  name: 'Settle',
  uri: 'https://settle.app',
  icon: 'favicon.ico',
};

export const SOLANA_CLUSTER = (process.env.EXPO_PUBLIC_SOLANA_CLUSTER || 'devnet') as 'devnet' | 'testnet' | 'mainnet-beta';
export const SOLANA_RPC_ENDPOINT = process.env.EXPO_PUBLIC_SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com';
```

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
