/**
 * TLD Parser Utility for Solana and EVM domain resolution
 * Using @onsol/tldparser for ANS (Alternative Name Service) domains
 */

import { TldParser } from '@onsol/tldparser';
import { Connection, PublicKey } from '@solana/web3.js';

export type SupportedChain = 'solana' | 'eclipse' | 'monad';

export interface DomainInfo {
  domain: string;
  owner: string | null;
  tld: string;
}

export interface NameRecord {
  domain: string;
  owner: string;
  data: Record<string, any>;
}

/**
 * Initialize TLD Parser for Solana/SVM chains
 */
export function initSolanaTldParser(connection: Connection): TldParser {
  return new TldParser(connection);
}

/**
 * Initialize TLD Parser for EVM chains (like Monad)
 */
export function initEvmTldParser(rpcUrl: string): TldParser {
  return new TldParser(rpcUrl);
}

/**
 * Get all domains owned by a user on Solana
 */
export async function getUserDomains(
  connection: Connection,
  ownerAddress: string
): Promise<string[]> {
  try {
    const parser = initSolanaTldParser(connection);
    const owner = new PublicKey(ownerAddress);
    const domains = await parser.getAllUserDomains(owner);
    return domains.map((d) => d.domain);
  } catch (error) {
    console.error('Error fetching user domains:', error);
    throw error;
  }
}

/**
 * Get the owner of a domain (reverse lookup)
 */
export async function getDomainOwner(
  connection: Connection,
  domain: string,
  tld: string = 'sol'
): Promise<string | null> {
  try {
    const parser = initSolanaTldParser(connection);
    const owner = await parser.getOwnerFromDomainTld(domain, tld);
    return owner ? owner.toBase58() : null;
  } catch (error) {
    console.error('Error fetching domain owner:', error);
    return null;
  }
}

/**
 * Get name record data for a domain
 */
export async function getDomainRecord(
  connection: Connection,
  domain: string,
  tld: string = 'sol'
): Promise<NameRecord | null> {
  try {
    const parser = initSolanaTldParser(connection);
    const record = await parser.getNameRecordFromDomainTld(domain, tld);

    if (!record) return null;

    return {
      domain: `${domain}.${tld}`,
      owner: record.owner.toBase58(),
      data: record,
    };
  } catch (error) {
    console.error('Error fetching domain record:', error);
    return null;
  }
}

/**
 * Get the main/primary domain for a wallet
 */
export async function getMainDomain(
  connection: Connection,
  ownerAddress: string
): Promise<string | null> {
  try {
    const parser = initSolanaTldParser(connection);
    const owner = new PublicKey(ownerAddress);
    const mainDomain = await parser.getMainDomain(owner);
    return mainDomain?.domain || null;
  } catch (error) {
    console.error('Error fetching main domain:', error);
    return null;
  }
}

/**
 * Resolve a domain to a wallet address (like DNS)
 */
export async function resolveDomain(
  connection: Connection,
  fullDomain: string
): Promise<string | null> {
  try {
    // Split domain and TLD
    const parts = fullDomain.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid domain format. Expected: domain.tld');
    }

    const tld = parts.pop()!;
    const domain = parts.join('.');

    return await getDomainOwner(connection, domain, tld);
  } catch (error) {
    console.error('Error resolving domain:', error);
    return null;
  }
}

/**
 * Check if a domain is available (not owned)
 */
export async function isDomainAvailable(
  connection: Connection,
  domain: string,
  tld: string = 'sol'
): Promise<boolean> {
  try {
    const owner = await getDomainOwner(connection, domain, tld);
    return owner === null;
  } catch (error) {
    console.error('Error checking domain availability:', error);
    return false;
  }
}
