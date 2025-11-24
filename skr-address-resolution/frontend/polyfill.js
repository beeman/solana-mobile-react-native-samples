// CRITICAL: Must be imported FIRST for Solana Web3.js
import 'react-native-get-random-values';

import { getRandomValues as expoCryptoGetRandomValues } from 'expo-crypto'
import { Buffer } from 'buffer'

global.Buffer = Buffer

// Ensure Map is available globally
if (typeof global.Map === 'undefined') {
  global.Map = Map
}

// getRandomValues polyfill
class Crypto {
  getRandomValues = expoCryptoGetRandomValues
}

const webCrypto = typeof crypto !== 'undefined' ? crypto : new Crypto()

;(() => {
  if (typeof crypto === 'undefined') {
    Object.defineProperty(window, 'crypto', {
      configurable: true,
      enumerable: true,
      get: () => webCrypto,
    })
  }
})()
