import { ellipsify } from './ellipsify'

/**
 * Display a user-friendly representation of an address
 * If a domain is available, show it (already includes .skr), otherwise show ellipsified address
 */
export function displayAddress(address: string, domain?: string | null, chars: number = 8): string {
  if (domain) {
    return domain
  }
  return ellipsify(address, chars)
}

/**
 * Display a user-friendly name for a user
 * Priority: name > domain (includes .skr) > ellipsified address
 */
export function displayUserName(
  address: string,
  name?: string | null,
  domain?: string | null,
  chars: number = 8
): string {
  if (name) {
    return name
  }
  return displayAddress(address, domain, chars)
}
