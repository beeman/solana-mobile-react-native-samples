# Settle

A Web3-enabled expense splitting application, similar to Splitwise. Users can login with their Solana wallet, add friends, create groups, split expenses, and settle up using SOL transfer transactions on the Solana blockchain.

## What is this?

Settle is a **demo application** showcasing how to integrate Solana Mobile Wallet Adapter into a React Native app for real-world use cases like peer-to-peer payments. It combines traditional expense splitting features with blockchain-based settlement.

## Screenshots & Demo

**Login, connect wallet, and create profile**

| Login | Connect Wallet | Create Profile |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/7da9e444-6098-4742-aace-5dedb8de124e" alt="Login" height="360" /> | <img src="https://github.com/user-attachments/assets/54b59356-a05b-4e09-a351-812ef23b7e50" alt="Connect Wallet" height="360" /> | <img src="https://github.com/user-attachments/assets/d2a255b4-acb9-4608-98d7-ad467af4c58b" alt="Create Profile" height="360" /> |

**Group-related screens**

| Groups | Create Group | Group Details |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/0f0498cf-5973-4fa1-bfae-bbbea8448928" alt="Groups Screen" height="360" /> | <img src="https://github.com/user-attachments/assets/f8a251c0-b58f-4226-a802-21d8fa1d917f" alt="Create Group" height="360" /> | <img src="https://github.com/user-attachments/assets/4b2cba59-5450-45f2-8b52-2896e4c5cc2f" alt="Group Details" height="360" /> |

| Balances | Group Settings | Group Settings(.skr domain)| Add Members |
|---|---|---|---|
| <img src="https://github.com/user-attachments/assets/66fed02c-35d1-4453-aa17-688a7f22b106" alt="Balances" height="360" /> | <img src="https://github.com/user-attachments/assets/508c620c-42c6-464f-b7f3-43aa400d3327" alt="Group Settings" height="360" /> | <img height="360" alt="Screenshot_20251126_234944" src="https://github.com/user-attachments/assets/64212a4f-d796-4404-8f72-d760d1e06565" />| <img src="https://github.com/user-attachments/assets/7b015d1d-916b-4836-9d71-4c14e0b1a8be" alt="Add Members" height="360" /> |

**Create and handle expenses**

| Create Expense | Pay Balances |
|---|---|
| <img src="https://github.com/user-attachments/assets/898178d7-5dd0-4816-8370-ee561c1803ea" alt="Create Expense" height="360" /> | <img src="https://github.com/user-attachments/assets/1fc61bbf-17f3-422b-9ad6-dea16ab4b523" alt="Pay Balances" height="360" /> |

**Friend-related screens**

| Friends | Add Friend |
|---|---|
| <img src="https://github.com/user-attachments/assets/cd881290-825f-485f-bb47-46c87dc10da9" alt="Friends" height="360" /> | <img src="https://github.com/user-attachments/assets/fdd8494b-7780-4c4b-a870-f14a2b1815b0" alt="Add Friend" height="360" /> |

**Activity-related screens**

| Activity Tab | Activity Details | Explorer |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/58f323b3-d78f-42f2-888d-c6ed140358ee" alt="Activity Tab" height="360" /> | <img src="https://github.com/user-attachments/assets/5f831da6-a0bf-4b27-8fd8-f98022463b5a" alt="Activity Details" height="360" /> | <img src="https://github.com/user-attachments/assets/6b496a03-8f6e-4d38-ae23-9535ad001843" alt="Explorer" height="360" /> |

**Account**

| Account | Account(.skr domain) |
|---|---|
| <img src="https://github.com/user-attachments/assets/fce60f42-799b-4f62-8cd6-2e2032506d92" alt="Account" height="360" /> | <img height="360" alt="Screenshot_20251126_234932" src="https://github.com/user-attachments/assets/444f3c3c-c4f9-480a-8eeb-410450f662ff" />
|



**Key Features:**
- Wallet-based authentication (Solana Mobile Wallet Adapter)
- **AllDomains (.skr) integration** - Display user-friendly domains instead of public keys
- Add friends via phone number or public key
- Create expense groups and track shared costs
- Split expenses with flexible allocation
- Pay friends directly with SOL transfers
- View transaction history on Solana blockchain

## Project Structure

```
settle/
├── frontend/     # React Native mobile app
└── backend/      # Express REST API
```

## Frontend

**Tech Stack:**
- React Native + Expo (SDK 52)
- TypeScript
- Expo Router (file-based navigation)
- Wallet UI SDK (@wallet-ui/react-native-web3js)
- @solana/web3.js

**Setup:**
```bash
cd frontend
npm install

# Configure API URL in .env (defaults to Android Emulator)

npx expo prebuild --clean  # Required for native modules
npx expo run:android
```

**Important:** Requires a development build (not Expo Go) due to native Solana Mobile Wallet Adapter dependencies.

**Documentation:**
- [README.md](frontend/README.md) - Comprehensive guide to the Solana integration

## Backend

**Tech Stack:**
- Node.js + Express
- SQLite3 (local database)
- JWT authentication (wallet-based)
- AllDomains SDK (@onsol/tldparser) - .skr domain resolution

**Setup:**
```bash
cd backend
npm install
npm run init-db  # Initialize database
npm run seed     # (Optional) Add demo data after user has logged in once
npm start        # Run server on port 3000
```

**API Endpoints:**
- Authentication: `/api/auth/*`
- Users: `/api/users/*`
- Friends: `/api/friends/*`
- Groups: `/api/groups/*`
- Expenses: `/api/expenses/*`
- Activity: `/api/activity/*`
