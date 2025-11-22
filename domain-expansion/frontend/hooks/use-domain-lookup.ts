import { useState } from 'react';

const API_BASE_URL = 'http://10.0.2.2:3000';

export type SearchMode = 'domain' | 'pubkey';

export interface DomainLookupResult {
  input: string;
  result: string | null;
  error: string | null;
  isLoading: boolean;
}

export function useDomainLookup() {
  const [result, setResult] = useState<DomainLookupResult>({
    input: '',
    result: null,
    error: null,
    isLoading: false,
  });

  const searchDomain = async (domain: string) => {
    setResult({ input: domain, result: null, error: null, isLoading: true });

    try {
      console.log('[Domain Lookup] Calling backend API...');
      const response = await fetch(`${API_BASE_URL}/api/resolve-domain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[Domain Lookup] Found address:', data.address);
        setResult({
          input: domain,
          result: data.address,
          error: null,
          isLoading: false,
        });
      } else {
        console.log('[Domain Lookup] Error:', data.error);
        setResult({
          input: domain,
          result: null,
          error: data.error || 'Domain not found',
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('[Domain Lookup] Network error:', error);
      setResult({
        input: domain,
        result: null,
        error: error.message || 'Failed to lookup domain',
        isLoading: false,
      });
    }
  };

  const searchPublicKey = async (pubkey: string) => {
    setResult({ input: pubkey, result: null, error: null, isLoading: true });

    try {
      console.log('[Reverse Lookup] Calling backend API...');
      const response = await fetch(`${API_BASE_URL}/api/resolve-address`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: pubkey }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('[Reverse Lookup] Found domain:', data.domain);
        setResult({
          input: pubkey,
          result: data.domain,
          error: null,
          isLoading: false,
        });
      } else {
        console.log('[Reverse Lookup] Error:', data.error);
        setResult({
          input: pubkey,
          result: null,
          error: data.error || 'No .skr domains found for this public key',
          isLoading: false,
        });
      }
    } catch (error: any) {
      console.error('[Reverse Lookup] Network error:', error);
      setResult({
        input: pubkey,
        result: null,
        error: error.message || 'Failed to lookup public key',
        isLoading: false,
      });
    }
  };

  const reset = () => {
    setResult({
      input: '',
      result: null,
      error: null,
      isLoading: false,
    });
  };

  return {
    result,
    searchDomain,
    searchPublicKey,
    reset,
  };
}

// Helper function to resolve address to domain (for welcome message)
export async function resolveAddressToDomain(address: string): Promise<string | null> {
  try {
    console.log('[resolveAddressToDomain] Fetching domain for:', address);
    const response = await fetch(`${API_BASE_URL}/api/resolve-address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    const data = await response.json();
    console.log('[resolveAddressToDomain] Response:', response.status, data);

    if (response.ok) {
      return data.domain;
    }
    return null;
  } catch (error) {
    console.error('[resolveAddressToDomain] Error:', error);
    return null;
  }
}
