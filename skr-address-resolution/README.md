# .skr address resolution

> A Solana Name Service lookup app for resolving .skr domain names to wallet addresses and vice versa.

## What is this?

.skr address resolution is a **demo application** showcasing Solana Name Service (SNS) integration with React Native mobile apps. It demonstrates bidirectional domain lookup using the Solana blockchain.

## Screenshots & Demo

**Sign In**

| Sign In Screen |
|---|
| ![Sign In](./screenshots/sign-in.png) |

**Main Features**

| Domain Lookup | Address Lookup | Results |
|---|---|---|
| ![Domain Lookup](./screenshots/domain.png) | ![Address Lookup](./screenshots/address.png) | ![Results](./screenshots/results.png) |

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
