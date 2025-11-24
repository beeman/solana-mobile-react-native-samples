# [App Name]

> One or two sentence description of what the app does and its primary purpose.

**Note:** This sample app is for **Android only**. Do not include iOS-specific instructions or references.

## What is this?

[App Name] is a **demo application** showcasing [main technology/integration]. It demonstrates [key use case or feature].

## Screenshots & Demo

**[Section Name - e.g., "Login and Setup"]**

| Screen 1 | Screen 2 | Screen 3 |
|---|---|---|
| <img src="[screenshot-url]" alt="Screen 1" height="360" /> | <img src="[screenshot-url]" alt="Screen 2" height="360" /> | <img src="[screenshot-url]" alt="Screen 3" height="360" /> |

**[Section Name - e.g., "Main Features"]**

| Screen 4 | Screen 5 |
|---|---|
| <img src="[screenshot-url]" alt="Screen 4" height="360" /> | <img src="[screenshot-url]" alt="Screen 5" height="360" /> |

**Key Features:**
- Feature 1 description
- Feature 2 description
- Feature 3 description
- Feature 4 description

## Project Structure

```
app-name/
├── frontend/     # React Native mobile app
└── backend/      # [Backend description - Express API, Firebase, etc.]
```

## Frontend

**Tech Stack:**
- React Native + Expo (SDK XX)
- TypeScript
- [Additional key technologies]

**Setup:**
```bash
cd frontend
npm install

npx expo prebuild --clean  # If native modules required
npx expo run:android
```

**Important:** [Any critical setup notes, e.g., "Requires development build due to native dependencies"]. Android only.

**Documentation:**
- [README.md](frontend/README.md) - Comprehensive setup and usage guide

## Backend

**Tech Stack:**
- [Backend framework - Node.js + Express, Firebase, etc.]
- [Database - SQLite, PostgreSQL, MongoDB, etc.]

**Setup:**
```bash
cd backend
npm install

# Initialize database (if applicable)
npm run init-db

# Start server
npm start  # Runs on port XXXX
```

**API Endpoints:**
- [Category 1]: `/api/[route]/*`
- [Category 2]: `/api/[route]/*`

**Documentation:**
- [README.md](backend/README.md) - Detailed API documentation and setup
