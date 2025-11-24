# Backend - .skr address resolution

> Express API server for .skr domain resolution using the Solana Name Service.

**Tech Stack:** Node.js, Express, TypeScript, @onsol/tldparser, Solana Web3.js

## Features

- Resolve .skr domain names to Solana wallet addresses
- Reverse lookup wallet addresses to find associated .skr domains
- Health check endpoint for monitoring
- CORS enabled for mobile app requests

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Install dependencies
npm install
```

### Running the Server

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

Server runs on `http://localhost:3000`

---

## API Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

### Resolve Domain to Address

```http
POST /api/resolve-domain
Content-Type: application/json

{
  "domain": "example.skr"
}
```

**Success Response (200):**
```json
{
  "address": "5FHwkrdxkQXLQ9d3TbDrPNkzKNLJgZxphLKNLA4Kk3wZ"
}
```

**Error Response (404):**
```json
{
  "error": "Domain not found"
}
```

### Resolve Address to Domain

```http
POST /api/resolve-address
Content-Type: application/json

{
  "address": "5FHwkrdxkQXLQ9d3TbDrPNkzKNLJgZxphLKNLA4Kk3wZ"
}
```

**Success Response (200):**
```json
{
  "domain": "example.skr"
}
```

**Error Response (404):**
```json
{
  "error": "No .skr domain found for this address"
}
```

---

## Configuration

### RPC Endpoint

The server uses Solana Mainnet by default. To change the RPC endpoint, edit `src/index.ts`:

```typescript
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
```

For better performance in production, consider using a dedicated RPC provider.

### Port

Default port is `3000`. The server binds to all interfaces for Docker/container compatibility.

---

## Project Structure

```
backend/
├── src/
│   └── index.ts          # Express server and API routes
├── dist/                  # Compiled JavaScript (after build)
├── package.json
└── tsconfig.json
```

---

## Key Concepts

### Domain Resolution

Uses `@onsol/tldparser` to resolve .skr domains via the Solana Name Service. The parser connects to Solana mainnet to query domain ownership records.

**Files:** [src/index.ts](src/index.ts)

### Reverse Lookup

Queries all domains owned by a wallet address, filtered to the `.skr` TLD. Returns the first matching domain if found.

**Files:** [src/index.ts](src/index.ts)

---

## Common Issues

### Error: "Request timed out"

**Cause:** Solana RPC endpoint is slow or rate-limited.

**Solution:**
1. Use a dedicated RPC provider (Helius, QuickNode, etc.)
2. Increase timeout in the code if needed

### Error: "CORS blocked"

**Cause:** Frontend running on unexpected origin.

**Solution:** The server has CORS enabled for all origins. If issues persist, check that the frontend is using the correct API URL (`http://10.0.2.2:3000` for Android emulator).

### Error: "Domain not found" for known domain

**Cause:** Domain might be on a different TLD or not registered.

**Solution:** Ensure the domain includes the `.skr` extension and is registered on Solana mainnet.

---

## Development

### Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with ts-node |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run compiled JavaScript |

### Testing Endpoints

```bash
# Test health check
curl http://localhost:3000/health

# Test domain resolution
curl -X POST http://localhost:3000/api/resolve-domain \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.skr"}'

# Test address resolution
curl -X POST http://localhost:3000/api/resolve-address \
  -H "Content-Type: application/json" \
  -d '{"address": "5FHwkrdxkQXLQ9d3TbDrPNkzKNLJgZxphLKNLA4Kk3wZ"}'
```

---

## Documentation

- **[Root README](../README.md)** - App overview and quick start
- **[Frontend README](../frontend/README.md)** - Mobile app documentation

---

## Resources

### Official Documentation
- [Express.js Docs](https://expressjs.com/)
- [@onsol/tldparser](https://www.npmjs.com/package/@onsol/tldparser)
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)

### Solana Name Service
- [SNS Documentation](https://docs.bonfida.org/collection/an-introduction-to-the-solana-name-service)
- [AllDomains](https://alldomains.id/) - .skr domain registry

---

## License

MIT License - See [LICENSE](../../LICENSE) for details
