# API Layer

This folder contains API client functions that communicate with the Express backend. All authentication is wallet-based using Solana public keys.

## Structure

```
apis/
├── index.ts          # Central export for all APIs
├── auth.ts           # Wallet authentication (connect, complete profile)
├── user.ts           # User profile management
├── groups.ts         # Group CRUD operations
├── friends.ts        # Friends management
├── expenses.ts       # Expense tracking
├── balances.ts       # Balance calculation & settlement
├── activity.ts       # Activity feed
├── settings.ts       # User settings
├── invites.ts        # Group invitations
├── reports.ts        # Reports & exports
└── search.ts         # Search functionality
```

## Usage

Import the APIs you need:

```typescript
import { connectWallet, completeProfile } from '@/apis/auth';
import { createGroup, getGroups } from '@/apis/groups';
import { createExpense } from '@/apis/expenses';
```

Or import everything:

```typescript
import * as API from '@/apis';
```

## Example

```typescript
// Connect wallet (checks if user exists, creates if new)
const handleWalletConnect = async (pubkey: string) => {
  const response = await connectWallet(pubkey);

  if (response.success) {
    if (response.data.requiresProfileCompletion) {
      // New user - show profile completion screen
      console.log('Complete your profile');
    } else {
      // Existing user - logged in
      console.log('Welcome back:', response.data.user);
    }
  }
};

// Complete profile for new users
const handleCompleteProfile = async () => {
  const response = await completeProfile({
    name: 'John Doe',
    phone: '+1234567890', // optional
  });

  console.log('Profile completed:', response.user);
};

// Create a group
const handleCreateGroup = async () => {
  const response = await createGroup({
    name: 'Weekend Trip',
    type: 'trip',
  });

  console.log('Group created:', response.group);
};
```

## API Categories

### Authentication (`auth.ts`)
- `connectWallet(pubkey)` - Connect wallet & check if user exists
- `completeProfile(data)` - Complete profile for new users
- `saveWalletAuth(data)` - Save wallet auth token locally
- `getStoredWalletAuth()` - Get cached wallet session
- `clearWalletAuth()` - Clear wallet session

### User Profile (`user.ts`)
- `getProfile()` - Get current user profile
- `updateProfile(data)` - Update profile (name, phone, etc.)
- `uploadProfileImage(file)` - Upload avatar
- `deleteAccount()` - Delete account

### Groups (`groups.ts`)
- `getGroups()` - List all groups
- `getGroup(id)` - Get group details
- `createGroup(data)` - Create new group
- `updateGroup(id, data)` - Update group
- `deleteGroup(id)` - Delete group
- `leaveGroup(id)` - Leave group
- `updateGroupSettings(id, settings)` - Update settings
- `searchGroups(query)` - Search groups
- `getGroupMembers(groupId)` - Get members
- `addGroupMember(groupId, data)` - Add member

### Friends (`friends.ts`)
- `getFriends()` - List friends
- `addFriend(data)` - Add friend by phone or pubkey
- `removeFriend(friendId)` - Remove friend
- `searchUsers(query)` - Search for users to add

### Expenses (`expenses.ts`)
- `createExpense(data)` - Create expense
- `getExpenses(groupId?)` - List expenses
- `getExpense(id)` - Get expense details
- `updateExpense(id, data)` - Update expense
- `deleteExpense(id)` - Delete expense
- `adjustSplit(expenseId, data)` - Adjust split

### Balances (`balances.ts`)
- `getBalances(groupId?)` - Get balances
- `settleUp(data)` - Record settlement (with transaction signature)

### Activity (`activity.ts`)
- `getActivity()` - Get activity feed
- `getActivityByGroup(groupId)` - Get group activity

### Settings (`settings.ts`)
- `getEmailSettings()` - Get email notification settings
- `updateEmailSettings(settings)` - Update email preferences

### Invites (`invites.ts`)
- `getInviteCode(groupId)` - Get group invite code
- `joinByInviteCode(code)` - Join group via invite code

### Reports (`reports.ts`)
- `getTotals(groupId?, period)` - Get spending totals

### Search (`search.ts`)
- `searchUsers(query)` - Search users by name, phone, or pubkey

## Backend Integration

All API functions use the axios client from [utils/api-client.ts](../utils/api-client.ts), which:

1. **Auto-adds JWT token** from AsyncStorage to all requests
2. **Handles 401 errors** by clearing auth and redirecting to login
3. **Configurable base URL** via `EXPO_PUBLIC_API_URL` in `.env`

Example API call:
```typescript
import apiClient from '@/utils/api-client';

export const getGroups = async () => {
  const response = await apiClient.get('/groups');
  return response.data;
};
```

## Authentication Flow

1. User connects Solana wallet via Mobile Wallet Adapter
2. Frontend calls `connectWallet(pubkey)` with the wallet's public key
3. Backend checks if user exists:
   - **Exists**: Returns JWT token + user data
   - **New user**: Creates user, returns JWT + `requiresProfileCompletion: true`
4. If new user, frontend shows profile completion screen
5. User submits name (+ optional phone)
6. Frontend calls `completeProfile(data)`
7. User is now fully registered and logged in

The JWT token is automatically added to all subsequent API requests via the axios interceptor.

