import { useState, useEffect, useCallback } from 'react'
import { getSolToUsdRate, convertUsdToSol, convertSolToUsd } from '@/utils/currency'

/**
 * Hook for currency conversion between SOL and USD
 * Fetches and caches the SOL/USD exchange rate
 */
export function useCurrencyConversion() {
  const [solPrice, setSolPrice] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Fetch SOL price on mount and refresh every 60 seconds
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setIsLoading(true)
        const price = await getSolToUsdRate()
        setSolPrice(price)
        setError(null)
      } catch (err) {
        setError(err as Error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrice()

    // Refresh price every 60 seconds
    const interval = setInterval(fetchPrice, 60000)

    return () => clearInterval(interval)
  }, [])

  /**
   * Convert USD amount to SOL
   */
  const usdToSol = useCallback(
    (usdAmount: number): number => {
      if (!solPrice) return 0
      return convertUsdToSol(usdAmount, solPrice)
    },
    [solPrice]
  )

  /**
   * Convert SOL amount to USD
   */
  const solToUsd = useCallback(
    (solAmount: number): number => {
      if (!solPrice) return 0
      return convertSolToUsd(solAmount, solPrice)
    },
    [solPrice]
  )

  return {
    solPrice,
    isLoading,
    error,
    usdToSol,
    solToUsd,
  }
}
