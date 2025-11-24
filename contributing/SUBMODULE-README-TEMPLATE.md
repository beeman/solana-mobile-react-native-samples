# [Module Name] - [App Name]

> Brief description of this module's purpose and what it provides.

**Tech Stack:** React Native, Expo, [Key Technologies]

**Note:** Android only. Do not include iOS-specific instructions.

📖 **[View Technical Deep Dive →](TECHNICAL-GUIDE.md)** _(optional, for complex implementations)_

## Features

- Feature 1 description
- Feature 2 description
- Feature 3 description
- Feature 4 description

## Screenshots

[Screenshots or demo GIF - optional if already in root README]

---

## Quick Start

### Prerequisites

- Android device or emulator
- Node.js 18+
- [Any other specific requirements]

### Installation

```bash
# Install dependencies
npm install
```

### Running the App

```bash
# Generate native projects (if native modules required)
npx expo prebuild --clean

# Run on Android
npx expo run:android
```

---

## Configuration

### Environment Variables

Create a `.env` file in this directory:

```bash
# [Category 1 - e.g., API Configuration]
EXPO_PUBLIC_API_URL=http://10.0.2.2:3000/api

# [Category 2 - e.g., Service Configuration]
EXPO_PUBLIC_SERVICE_KEY=your-key-here
EXPO_PUBLIC_SERVICE_ENDPOINT=https://api.service.com
```

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_API_URL` | Backend API endpoint | `http://10.0.2.2:3000/api` |
| `EXPO_PUBLIC_FOO` | Description of variable | `value` |

### Critical Setup: [Important Configuration]

[Any critical setup steps that must be done correctly]

**Why?** [Explanation of why this is important]

```typescript
// Example of critical setup
import 'required-polyfill'; // MUST be first import
```

---

## Project Structure

```
module-name/
├── app/                      # Expo Router screens
│   ├── (tabs)/              # Tab navigation
│   ├── _layout.tsx          # Root layout
│   ├── screen1.tsx          # Screen descriptions
│   └── screen2.tsx
├── [key-directory]/         # Key integration directory ⭐
│   ├── service1.ts          # Service descriptions
│   └── service2.ts
├── apis/                    # API client functions
│   └── api.ts
├── components/              # Reusable components
│   ├── providers/           # React context providers
│   └── common/              # Common components
├── constants/               # App constants
│   └── config.ts
├── utils/                   # Utility functions
└── assets/                  # Static assets
```

---

## Key Concepts

### [Feature 1 Name]

Brief explanation (2-3 sentences) of how this feature works and why implementation decisions were made.

**Files:** [file.ts](path/to/file.ts)

### [Feature 2 Name]

Brief explanation of the implementation approach and key benefits.

**Files:** [service.ts](path/to/service.ts)

### [Feature 3 Name]

Brief explanation of what this feature provides.

**Files:** [component.tsx](path/to/component.tsx)

_Note: Keep this section concise (2-3 sentences per feature). For detailed implementation explanations, create a [TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md)._

---

## Common Issues

### Error: "Description of Problem"

**Solution:**
1. Step to resolve
2. Another step
3. Rebuild if needed

### Error: "Another Problem"

**Solution:** How to fix this issue

```bash
# Example command to fix
npm run fix-command
```

### Issue: Descriptive Issue Name

**Cause:** Why this happens

**Solution:** Steps to resolve

---

## Documentation

- **[TECHNICAL-GUIDE.md](TECHNICAL-GUIDE.md)** - _(Optional)_ Comprehensive guide explaining all implementation details
- **[Root README](../README.md)** - App overview and screenshots
- **[Backend README](../backend/README.md)** - _(If applicable)_ API server documentation

---

## Resources

### Official Documentation
- [Technology 1 Docs](url)
- [Technology 2 Docs](url)
- [Technology 3 Docs](url)

### Developer Tools
- [Tool 1](url)
- [Tool 2](url)

### Sample Apps
- [Reference App 1](url)
- [Reference App 2](url)

---

## License

MIT License - See [LICENSE](../../LICENSE) for details
