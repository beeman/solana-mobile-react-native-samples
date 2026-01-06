# Cause Pots

A decentralized group savings application built on Solana. Create collaborative savings pots with time-locks and multi-signature release mechanisms to save together with friends and family.

## What is this?

Cause Pots is a **demo application** showcasing how to build a mobile dApp on Solana with Anchor smart contracts. It demonstrates custom program derived addresses (PDAs), transaction construction, .skr domain resolution, and Mobile Wallet Adapter integration through a group savings use case.

## Screenshots & Demo

### Login and Wallet Connection

| Welcome Screen | Connect Wallet | Create Profile |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/42c9d608-9976-4753-865c-a35ac6a037b4" width="108" /> | <img src="https://github.com/user-attachments/assets/00fc1eb6-372b-49d2-a2a6-a7e5b0b9edbf" width="108" /> | <img src="https://github.com/user-attachments/assets/cea6a6cd-709d-49b3-90c7-219d725ac0de" width="108" /> |

---

### Pot Creation and Management

| Pots List | Create Pot | Pot Details | Add Contribution |
|---|---|---|---|
| <img src="https://github.com/user-attachments/assets/a195cef9-509e-4cf3-8bf5-93ef8ebf77c3" width="108" /> | <img src="https://github.com/user-attachments/assets/97d55e81-c972-49fa-8903-37b5827526e9" width="108" /> <img src="https://github.com/user-attachments/assets/b958cf2d-f760-4fcc-ae1a-b1162bbe68b4" width="108" /> | <img src="https://github.com/user-attachments/assets/e7c904a8-36ab-4c37-b0b0-4bad7c6ce95f" width="108" /> | <img src="https://github.com/user-attachments/assets/1cf09f0a-cb3c-4849-8a6a-e860b835c3ac" width="108" /> |

---

### Multi-Signature Release Flow

| Sign for Release | Release Funds | After Release |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/f59fea39-0ef0-4011-b6d2-4e5547c615fd" width="108" /> | <img src="https://github.com/user-attachments/assets/e36462cc-94e4-41a8-8965-652a9054e80e" width="108" /> |<img width="108" height="240" alt="after release" src="https://github.com/user-attachments/assets/56219438-0524-42ac-a5ce-34216360b41b" />|


---

### Friends & Account Management

| Friends List | Add Friend | Account Details |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/19932877-cd7b-4308-87c7-09184ad35eea" width="108" /> | <img src="https://github.com/user-attachments/assets/53bdd0a9-73a3-4a8c-81a0-9ca4515fd38b" width="108" /> | <img src="https://github.com/user-attachments/assets/f9cdb9e5-e4d6-4768-9b97-f3a59d063905" width="108" /> |

---

### Activity Tracking

| Activity Feed | Activity Details | Blockchain Explorer |
|---|---|---|
| <img src="https://github.com/user-attachments/assets/b422b517-eea3-4d76-ab85-3ac7bce2bfc1" width="108" /> | <img src="https://github.com/user-attachments/assets/8f27fe0a-b7d1-4a99-afaf-fdb131cac9f9" width="108" /> | <img src="https://github.com/user-attachments/assets/395d8765-eeda-4f6f-9fa7-28ab190108f9" width="108" /> |


**Key Features:**
- Time-locked collaborative savings pots
- Multi-signature release approval (M-of-N voting)
- SOL and USDC support
- Friend management with .skr domain resolution
- Complete blockchain transaction history
- Mobile Wallet Adapter integration

## Project Structure

```
cause-pots/
├── frontend/     # React Native mobile app (Expo)
├── backend/      # Express REST API server
└── contract/     # Solana smart contract (Anchor)
```

## Frontend

**Tech Stack:**
- React Native + Expo (SDK 54)
- TypeScript
- Expo Router (file-based navigation)
- Solana Mobile Wallet Adapter
- Anchor Framework (0.32)
- @solana/web3.js v1.98.4

**Setup:**
```bash
cd frontend
npm install

# Configure environment (create .env file)
# EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api
# EXPO_PUBLIC_SOLANA_CLUSTER=devnet
# EXPO_PUBLIC_PROGRAM_ID=CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR

npx expo prebuild --clean  # Required for native modules
npx expo run:android
```

**Important:** Requires a development build (not Expo Go) due to native Solana Mobile Wallet Adapter dependencies.

**Documentation:**
- [README.md](frontend/README.md) - Setup and configuration guide
- [TECHNICAL-GUIDE.md](frontend/TECHNICAL-GUIDE.md) - Comprehensive Solana/Anchor integration deep dive

## Backend

**Tech Stack:**
- Node.js + Express
- SQLite3 (local database)

**Setup:**
```bash
cd backend
npm install
npm run init-db  # Initialize database
npm start        # Run server on port 3000
```

**API Endpoints:**
- Users: `/api/users/*`
- Pots: `/api/pots/*`
- Friends: `/api/friends/*`
- Activities: `/api/activities/*`

**Documentation:**
- [README.md](backend/README.md) - Complete API documentation

## Contract

**Tech Stack:**
- Anchor Framework 0.32
- Rust

**Deployed Program:**
- Devnet: `CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR`

**Setup:**
```bash
cd contract
anchor build
anchor test
anchor deploy --provider.cluster devnet  # Optional: deploy your own instance
```

**Documentation:**
- [README.md](contract/README.md) - Smart contract specification and testing
