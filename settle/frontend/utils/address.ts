/**
 * Address validation utilities for Solana addresses
 */

import { PublicKey } from '@solana/web3.js';

/**
 * Validate if a string is a valid Solana address
 *
 * @param address - Address string to validate
 * @returns true if valid, false otherwise
 */
export function isValidAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
}

/**
 * Shorten address for display (first 4 and last 4 characters)
 *
 * @param address - Base58 address string
 * @param chars - Number of characters to show on each end (default: 4)
 * @returns Shortened address string (e.g., "Ab1c...Xy9z")
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (address.length <= chars * 2) {
    return address;
  }
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}
