import { useState, useCallback } from 'react'
import { Transaction, TransactionMessage, VersionedTransaction } from '@solana/web3.js'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'

export function useTransaction() {
  const { connection, signAndSendTransaction } = useMobileWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const executeTransaction = useCallback(
    async (transaction: Transaction): Promise<string> => {
      setIsLoading(true)
      setError(null)

      try {
        if (!signAndSendTransaction) {
          throw new Error('Wallet not connected')
        }

        // Get latest blockhash and context slot
        const {
          context: { slot: minContextSlot },
          value: latestBlockhash,
        } = await connection.getLatestBlockhashAndContext()

        // Convert legacy Transaction to VersionedTransaction
        const messageV0 = new TransactionMessage({
          payerKey: transaction.feePayer!,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: transaction.instructions,
        }).compileToLegacyMessage()

        const versionedTransaction = new VersionedTransaction(messageV0)

        // Sign and send transaction via MWA
        const signature = await signAndSendTransaction(versionedTransaction, minContextSlot)
        console.log("SIGNATURE IS:" , signature);
        // Confirm transaction
        await connection.confirmTransaction(
          { signature, ...latestBlockhash },
          'confirmed'
        )

        setIsLoading(false)
        return signature
      } catch (err) {
        const error = err as Error
        setError(error)
        setIsLoading(false)
        throw error
      }
    },
    [connection, signAndSendTransaction]
  )

  return {
    executeTransaction,
    isLoading,
    error,
  }
}
