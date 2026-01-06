import { TldParser } from '@onsol/tldparser'
import { Connection, PublicKey } from '@solana/web3.js'

// Initialize TLD Parser with mainnet connection (no retries to avoid rate limits)
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const connection = new Connection(SOLANA_RPC_URL, {
  commitment: 'confirmed',
  disableRetryOnRateLimit: true, // Disable automatic retries
})
const parser = new TldParser(connection)

/**
 * Resolve a .skr domain name to a Solana public key
 * @param domain - The domain name (e.g., "alice.skr" or just "alice")
 * @returns The resolved public key as a string, or null if not found
 */
export async function resolveDomainToAddress(domain: string): Promise<string | null> {
  try {
    // Ensure domain has .skr extension
    const normalizedDomain = domain.endsWith('.skr') ? domain : `${domain}.skr`

    // Use TldParser to resolve the domain
    const owner = await parser.getOwnerFromDomainTld(normalizedDomain)

    if (owner) {
      return typeof owner === 'string' ? owner : owner.toBase58()
    }

    return null
  } catch (error) {
    console.error(`Error resolving domain ${domain}:`, error)
    return null
  }
}

/**
 * Reverse lookup: find the .skr domain for a given wallet address
 * @param address - The Solana wallet address
 * @returns The domain name (with .skr extension) or null if not found
 */
export async function resolveAddressToDomain(address: string): Promise<string | null> {
  try {
    const pubkey = new PublicKey(address)

    // Single check - if no result, means no domain (don't retry)
    const domains = await parser.getParsedAllUserDomainsFromTld(pubkey, 'skr')

    if (domains && domains.length > 0) {
      // Get the first domain (keep .skr extension)
      const domainName = 'domain' in domains[0] ? domains[0].domain : ''
      return domainName || null
    }

    return null
  } catch (error) {
    // Single attempt only - if it fails, return null (no domain)
    // Don't retry or log - just accept there's no domain
    return null
  }
}

/**
 * Check if a string is a valid domain format
 * @param input - The input string to check
 * @returns true if the input appears to be a domain name
 */
export function isDomainFormat(input: string): boolean {
  // Domain must have .skr extension, everything else is treated as a pubkey
  return input.endsWith('.skr')
}
