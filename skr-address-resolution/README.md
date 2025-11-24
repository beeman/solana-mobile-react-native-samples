# .skr address resolution

> A Solana Name Service lookup app for resolving .skr domain names to wallet addresses and vice versa.

## What is this?

.skr address resolution is a **demo application** showcasing Solana Name Service (SNS) integration with React Native mobile apps. It demonstrates bidirectional domain lookup using the Solana blockchain.

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
