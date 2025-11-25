# .skr address resolution

> An AllDomains lookup app for resolving .skr domain names to wallet addresses and vice versa.

## What is this?

.skr address resolution is a **demo application** showcasing AllDomains integration with React Native mobile apps. It demonstrates bidirectional domain lookup using the Solana blockchain and the `@onsol/tldparser` library.

## Screenshots & Demo

| Sign In | Wallet Popup | Domain Lookup | Address Lookup |
|:---:|:---:|:---:|:---:|
| <img width="180" alt="signin" src="https://github.com/user-attachments/assets/d2f31f64-127e-4a3c-80ac-d01ea4588d8f" /> | <img width="180" alt="wallet popup" src="https://github.com/user-attachments/assets/db412fb7-7c75-4243-98fe-abfb713fea5c" /> | <img width="180" alt="domain lookup" src="https://github.com/user-attachments/assets/46cee9c0-4ae7-412d-b978-d902437d95e7" /> | <img width="180" alt="address lookup" src="https://github.com/user-attachments/assets/d0cf991e-5364-43d8-a152-71bd0cf609f3" /> |

| No .skr Domain | With .skr Domain |
|:---:|:---:|
| <img width="180" alt="No skr" src="https://github.com/user-attachments/assets/17192072-21ac-43aa-b9d8-3f9a94fa4a50" /> | <img width="180" alt="Yes skr" src="https://github.com/user-attachments/assets/5e7f9133-ea2d-4c5e-9711-683a3082fcfb" /> |

**Key Features:**
- Personalized welcome with user's .skr domain or truncated wallet address
- Wallet-based authentication (Solana Mobile Wallet Adapter)
- Domain to address lookup aka `example.skr` → wallet address
- Address to domain reverse lookup aka wallet address → `example.skr`

## Project Structure

```
skr-address-resolution/
├── frontend/     # React Native mobile app
└── backend/      # Express API for domain resolution
```

## .skr Address Resolution

Each Seeker owner has a `.skr` domain tied to their primary wallet. You can query this onchain using the `@onsol/tldparser` library, which provides methods for both domain-to-address and address-to-domain lookups.

### How It Works

This app demonstrates the complete resolution flow:

1. **User Authentication**
   - User connects their Solana wallet via Mobile Wallet Adapter
   - App receives the wallet's public key after authorization

2. **Personalized Welcome (Address → Domain)**
   - Frontend sends user's public key to backend `/api/resolve-address`
   - Backend queries Solana mainnet using `parser.getParsedAllUserDomainsFromTld(publicKey, 'skr')`
   - Returns first `.skr` domain found, or 404 if none exists
   - Frontend displays domain name or truncated address as fallback

3. **Search Functionality**
   - **Domain Lookup:** User enters `example.skr` → backend calls `parser.getOwnerFromDomainTld(domain)` → returns wallet address
   - **Address Lookup:** User enters wallet address → backend calls `parser.getParsedAllUserDomainsFromTld(publicKey, 'skr')` → returns `.skr` domain

All resolution logic happens server-side to keep RPC calls secure and efficient.

### Domain to Address Lookup

Resolve a `.skr` domain (e.g., `example.skr`) to its owner's wallet address:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { TldParser } from '@onsol/tldparser';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const parser = new TldParser(connection);

// Look up domain owner
const domain = 'example.skr';
const owner = await parser.getOwnerFromDomainTld(domain);

if (owner) {
  const ownerAddress = owner.toBase58();
  console.log(`${domain} belongs to ${ownerAddress}`);
} else {
  console.log('Domain not found');
}
```

**Implementation:** [backend/src/index.ts:22-46](backend/src/index.ts#L22-L46)

### Address to Domain Lookup (Reverse Lookup)

Resolve a wallet address to its associated `.skr` domain:

```typescript
import { Connection, PublicKey } from '@solana/web3.js';
import { TldParser } from '@onsol/tldparser';

const connection = new Connection('https://api.mainnet-beta.solana.com');
const parser = new TldParser(connection);

// Look up user's .skr domain
const walletAddress = new PublicKey('YourWalletAddressHere');
const domains = await parser.getParsedAllUserDomainsFromTld(walletAddress, 'skr');

if (domains && domains.length > 0) {
  const domainName = domains[0].domain;
  console.log(`Address has .skr domain: ${domainName}`);
} else {
  console.log('No .skr domain found for this address');
}
```

**Implementation:** [backend/src/index.ts:48-76](backend/src/index.ts#L48-L76)

### Key Points

- **Library:** `@onsol/tldparser` handles all AllDomains lookups
- **Connection:** Requires a Solana RPC connection (mainnet-beta for production)
- **TLD Filtering:** Use `getParsedAllUserDomainsFromTld(publicKey, 'skr')` to specifically query `.skr` domains
- **Multiple Domains:** A wallet can own multiple domains; this demo uses the first one found

### Resources

- [AllDomains Developer Guide](https://docs.alldomains.id/protocol/developer-guide/ad-sdks/svm-sdks/solana-mainnet-sdk) - Official documentation for Solana SDK
- [@onsol/tldparser NPM Package](https://www.npmjs.com/package/@onsol/tldparser) - Domain resolution library

## Frontend

**Tech Stack:**
- React Native + Expo (SDK 54)
- TypeScript
- Expo Router (file-based navigation)
- Solana Mobile Wallet Adapter

**Setup:**
```bash
cd frontend
npm install

npx expo prebuild --clean  # Required for native modules
npx expo run:android
```

**Important:** Requires a development build (not Expo Go) due to native Solana Mobile Wallet Adapter dependencies.

**Documentation:**
- [README.md](frontend/README.md) - Comprehensive setup and usage guide

## Backend

**Tech Stack:**
- Node.js + Express
- TypeScript
- @onsol/tldparser (Domain resolution)

**Setup:**
```bash
cd backend
npm install

# Start server
npm run dev  # Runs on port 3000
```

**API Endpoints:**
- Domain Resolution: `POST /api/resolve-domain`
- Address Resolution: `POST /api/resolve-address`
- Health Check: `GET /health`

**Documentation:**
- [README.md](backend/README.md) - Detailed API documentation and setup
