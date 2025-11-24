# Frontend - .skr address resolution

> React Native mobile app for .skr domain lookup with Solana wallet integration.

**Tech Stack:** React Native, Expo SDK 54, TypeScript, Solana Mobile Wallet Adapter

**Template:** This project was bootstrapped using the [Solana Expo Template](https://templates.solana.com/web3js-expo)

## Features

- Personalized welcome message with user's .skr domain or truncated wallet address
- Secure wallet authentication via Solana Mobile Wallet Adapter
- Domain to address lookup (e.g., `example.skr` → wallet address)
- Address to domain reverse lookup

---

## Quick Start

### Prerequisites

- Node.js 18+
- Android Studio with emulator or physical Android device
- A Solana wallet app (Phantom, Solflare, etc.) installed on the device
- Backend server running (see [backend README](../backend/README.md))

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

```bash
# Generate native projects (required for native modules)
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

**Important:** This app requires a development build due to native dependencies (Solana Mobile Wallet Adapter). Expo Go is not supported.

---

## Configuration

### Backend API URL

The app connects to the backend at `http://10.0.2.2:3000` (Android emulator's localhost). To change this, edit `hooks/use-domain-lookup.ts`:

```typescript
const API_BASE_URL = 'http://10.0.2.2:3000';
```

| Environment | URL |
|-------------|-----|
| Android Emulator | `http://10.0.2.2:3000` |
| Physical Device | `http://<your-computer-ip>:3000` |

### App Configuration

Edit `constants/app-config.ts` to customize:

```typescript
export class AppConfig {
  static name = 'dotskr demo'
  static uri = 'https://skrdemo.app'
  static clusters: Cluster[] = [
    // Solana cluster configuration
  ]
}
```

---

## Project Structure

```
frontend/
├── app/                          # Expo Router screens
│   ├── _layout.tsx               # Root layout with providers
│   ├── index.tsx                 # Main screen (domain lookup)
│   └── sign-in.tsx               # Wallet connection screen
├── components/
│   ├── auth/
│   │   └── auth-provider.tsx     # Authentication context
│   ├── solana/
│   │   ├── solana-provider.tsx   # Solana connection provider
│   │   ├── use-authorization.tsx # Wallet authorization hook
│   │   └── use-mobile-wallet.tsx # Mobile wallet adapter hook
│   ├── cluster/
│   │   └── cluster-provider.tsx  # Solana cluster configuration
│   ├── animated-splash.tsx       # Lottie splash animation
│   ├── app-providers.tsx         # Combined providers wrapper
│   ├── app-text.tsx              # Custom text component
│   └── app-theme.tsx             # Theme configuration
├── hooks/
│   └── use-domain-lookup.ts      # Domain resolution API calls ⭐
├── constants/
│   └── app-config.ts             # App configuration
├── utils/
│   └── ellipsify.ts              # String truncation utility
├── assets/
│   ├── images/                   # App icons and images
│   └── lottie/                   # Lottie animation files
└── app.json                      # Expo configuration
```

---

## Key Concepts

### Wallet Authentication

Uses Solana Mobile Wallet Adapter for secure wallet connections. The auth state is persisted in AsyncStorage and managed via React Context.

**Files:** [components/auth/auth-provider.tsx](components/auth/auth-provider.tsx), [components/solana/use-authorization.tsx](components/solana/use-authorization.tsx)

### Domain Resolution

All domain lookups are handled by the backend API. The frontend sends requests and displays results. This keeps RPC logic server-side for better security.

**Files:** [hooks/use-domain-lookup.ts](hooks/use-domain-lookup.ts)

### Welcome Message

On app load, fetches the user's .skr domain from the backend. If found, displays the domain name; otherwise shows a truncated wallet address.

**Files:** [app/index.tsx](app/index.tsx)

---

## Common Issues

### Error: "Network request failed"

**Cause:** Backend server not running or wrong API URL.

**Solution:**
1. Ensure backend is running: `cd ../backend && npm run dev`
2. For physical devices, update `API_BASE_URL` to your computer's IP address
3. Check that port 3000 is not blocked by firewall

### Error: "No wallet found"

**Cause:** No Solana wallet app installed on the device.

**Solution:** Install Phantom, Solflare, or another Solana wallet from the app store.

### Build fails with native module errors

**Cause:** Native modules not properly linked.

**Solution:**
```bash
# Clean and rebuild
npx expo prebuild --clean
npx expo run:android
```

### Wallet connection fails silently

**Cause:** App scheme not properly configured.

**Solution:** Ensure `app.json` has the correct scheme:
```json
{
  "expo": {
    "scheme": "skrdemo"
  }
}
```

---

## Documentation

- **[Root README](../README.md)** - App overview and quick start
- **[Backend README](../backend/README.md)** - API server documentation

---

## Resources

### Official Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- [Solana Mobile Wallet Adapter](https://docs.solanamobile.com/react-native/overview)

### Solana Development
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Solana Cookbook](https://solanacookbook.com/)

---

## License

MIT License - See [LICENSE](../../LICENSE) for details
