# Settle Backend API

Express.js backend with SQLite3 database for the Settle app (Splitwise clone for Solana Mobile).

## Tech Stack

- **Express.js** - Web framework
- **SQLite3** - Database
- **JWT** - Wallet-based authentication

## Features

- ✅ Wallet-based authentication (Solana public key)
- ✅ Groups & expense management
- ✅ Friend system
- ✅ Balance calculation & settlements
- ✅ Activity feed
- ✅ Settings management
- ✅ Group invitations
- ✅ Search functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
- Edit `.env` file if needed (default PORT=3000)
- Change `JWT_SECRET` for production

3. Initialize database:
```bash
npm run init-db
```

4. (Optional) Seed demo data:
```bash
npm run seed  # Only after logging in once
```

5. Start server:
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/connect` - Connect wallet (check if user exists)
- `POST /api/auth/complete-profile` - Complete profile for new users
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update profile
- `POST /api/user/profile-image` - Upload profile image
- `DELETE /api/user/account` - Delete account

### Groups
- `GET /api/groups` - Get all groups
- `GET /api/groups/:id` - Get single group
- `POST /api/groups` - Create group
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/leave` - Leave group
- `GET /api/groups/:id/members` - Get group members
- `POST /api/groups/:id/members` - Add member to group

### Expenses
- `GET /api/expenses` - Get all expenses
- `GET /api/expenses/:id` - Get single expense
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `PUT /api/expenses/:id/split` - Adjust split

### Friends
- `GET /api/friends` - Get all friends
- `POST /api/friends` - Add friend
- `DELETE /api/friends/:id` - Remove friend
- `GET /api/friends/search` - Search users

### Balances
- `GET /api/balances` - Get balances
- `POST /api/balances/settle` - Create settlement

### Activity
- `GET /api/activity` - Get activity feed

### Settings
- `GET /api/settings/email` - Get email settings
- `PUT /api/settings/email` - Update email settings

### Invites
- `GET /api/invites/:groupId` - Get invite code
- `POST /api/invites/join` - Join via invite code

### Search
- `GET /api/search/users` - Search users
- `GET /api/search` - Unified search

## Authentication Flow

1. User connects wallet (provides public key)
2. Backend checks if pubkey exists:
   - **Exists**: Return token + user data
   - **New**: Create user, return token + requiresProfileCompletion flag
3. If new user, frontend shows profile completion screen
4. User submits name (and optional phone)
5. Frontend calls `/api/auth/complete-profile`
6. User is now fully registered

## Database Schema

- **users** - User accounts (pubkey-based auth)
- **groups** - Expense groups
- **group_members** - Group membership
- **friends** - Friend relationships
- **expenses** - Expense records
- **expense_participants** - Split details
- **settlements** - Payment records
- **activities** - Activity feed
- **email_settings** - Notification preferences

## Frontend Integration

Configure the API URL in `frontend/.env`:

```bash
# For Android Emulator
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# For iOS Simulator
EXPO_PUBLIC_API_URL=http://localhost:3000/api

# For Physical Device (replace with your computer's IP)
EXPO_PUBLIC_API_URL=http://192.168.1.x:3000/api
```

**Note:** Expo requires the `EXPO_PUBLIC_` prefix for environment variables to be accessible in the app.

## Development

- Database file: `settle.db`
- Logs: Check console output
- Reset database: `rm settle.db && npm run init-db`

## License

MIT
