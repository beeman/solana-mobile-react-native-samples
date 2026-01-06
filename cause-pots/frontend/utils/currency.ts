/**
 * Currency conversion utilities
 * All blockchain transactions are in SOL, but we support USD display
 */

const COINGECKO_PRICE_API = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd'
const FALLBACK_SOL_PRICE = 100 // Fallback if API fails

/**
 * Fetches the current SOL to USD conversion rate from CoinGecko
 */
export const getSolToUsdRate = async (): Promise<number> => {
  try {
    const response = await fetch(COINGECKO_PRICE_API)
    const data = await response.json()
    const rate = data?.solana?.usd

    if (!rate || typeof rate !== 'number') {
      throw new Error('Invalid rate from API')
    }

    console.log(`Current SOL/USD rate: $${rate}`)
    return rate
  } catch (error) {
    console.error('Error fetching SOL to USD rate:', error)
    console.warn(`Using fallback SOL/USD rate: $${FALLBACK_SOL_PRICE}`)
    return FALLBACK_SOL_PRICE
  }
}

/**
 * Converts a USD amount to its SOL equivalent
 * @param amountInUsd - Amount in USD
 * @param solToUsdRate - Current SOL/USD exchange rate
 * @returns Amount in SOL
 */
export const convertUsdToSol = (amountInUsd: number, solToUsdRate: number): number => {
  if (solToUsdRate <= 0) return 0
  return amountInUsd / solToUsdRate
}

/**
 * Converts a SOL amount to its USD equivalent
 * @param amountInSol - Amount in SOL
 * @param solToUsdRate - Current SOL/USD exchange rate
 * @returns Amount in USD
 */
export const convertSolToUsd = (amountInSol: number, solToUsdRate: number): number => {
  return amountInSol * solToUsdRate
}

/**
 * Format currency amount for display
 * @param amount - Amount to format
 * @param currency - Currency type ('SOL' or 'USDC')
 * @returns Formatted string
 */
export const formatCurrency = (amount: number, currency: 'SOL' | 'USDC'): string => {
  if (currency === 'SOL') {
    return `${amount.toFixed(4)} SOL`
  }
  return `$${amount.toFixed(2)}`
}
