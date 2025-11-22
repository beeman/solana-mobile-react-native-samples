import express from 'express';
import cors from 'cors';
import { Connection, PublicKey } from '@solana/web3.js';
import { TldParser } from '@onsol/tldparser';

const app = express();
const PORT = 3000;

// Mainnet RPC endpoint
const RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';
const connection = new Connection(RPC_ENDPOINT);

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Resolve domain to address
app.post('/api/resolve-domain', async (req, res) => {
  const { domain } = req.body;

  if (!domain || typeof domain !== 'string') {
    return res.status(400).json({ error: 'Domain is required' });
  }

  try {
    console.log(`[resolve-domain] Looking up domain: ${domain}`);
    const parser = new TldParser(connection);
    const owner = await parser.getOwnerFromDomainTld(domain);

    if (owner) {
      const ownerAddress = typeof owner === 'string' ? owner : owner.toBase58();
      console.log(`[resolve-domain] Found owner: ${ownerAddress}`);
      return res.json({ address: ownerAddress });
    } else {
      console.log(`[resolve-domain] Domain not found: ${domain}`);
      return res.status(404).json({ error: 'Domain not found' });
    }
  } catch (error: any) {
    console.error(`[resolve-domain] Error:`, error.message);
    return res.status(500).json({ error: error.message || 'Failed to resolve domain' });
  }
});

// Resolve address to domain (reverse lookup)
app.post('/api/resolve-address', async (req, res) => {
  const { address } = req.body;

  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    console.log(`[resolve-address] Looking up address: ${address}`);
    const parser = new TldParser(connection);
    const publicKey = new PublicKey(address);

    // Only search .skr TLD
    const domains = await parser.getParsedAllUserDomainsFromTld(publicKey, 'skr');

    if (domains && domains.length > 0) {
      const domainName = domains[0].domain;
      console.log(`[resolve-address] Found domain: ${domainName}`);
      return res.json({ domain: domainName });
    } else {
      console.log(`[resolve-address] No .skr domain found for address: ${address}`);
      return res.status(404).json({ error: 'No .skr domain found for this address' });
    }
  } catch (error: any) {
    console.error(`[resolve-address] Error:`, error.message);
    return res.status(500).json({ error: error.message || 'Failed to resolve address' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
