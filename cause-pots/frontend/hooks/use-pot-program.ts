import { useMemo } from 'react'
import { PublicKey } from '@solana/web3.js'
import { useMobileWallet } from '@wallet-ui/react-native-web3js'
import { PotProgramService } from '@/services/pot-program'
import { useTransaction } from './use-transaction'

export function usePotProgram() {
  const { connection, account } = useMobileWallet()
  const { executeTransaction, isLoading, error } = useTransaction()

  // Create program service instance
  const programService = useMemo(() => {
    return new PotProgramService(connection)
  }, [connection])

  // Helper to get PublicKey from account
  const getAccountPublicKey = () => {
    if (!account) {
      throw new Error('Wallet not connected')
    }
    // account.publicKey is already a PublicKey object
    return account.publicKey
  }

  // Create pot
  const createPot = async (params: {
    name: string
    description: string
    targetAmount: number
    unlockDays: number
    signersRequired: number
    contributors?: string[] // Additional contributors to add on-chain
  }) => {
    const authority = getAccountPublicKey()

    const tx = await programService.buildCreatePotTx({
      authority,
      ...params,
    })

    const signature = await executeTransaction(tx)

    // Return pot PDA along with signature
    const [potPDA] = programService.getPotPDA(authority, params.name)

    return {
      signature,
      potPubkey: potPDA.toBase58(),
    }
  }

  // Contribute to pot
  const contribute = async (params: {
    potPubkey: string
    amount: number
  }) => {
    const contributor = getAccountPublicKey()

    const tx = await programService.buildContributeTx({
      potPubkey: new PublicKey(params.potPubkey),
      contributor,
      amount: params.amount,
    })

    const signature = await executeTransaction(tx)
    return signature
  }

  // Add contributor to pot
  const addContributor = async (params: {
    potPubkey: string
    newContributor: string
  }) => {
    const authority = getAccountPublicKey()

    const tx = await programService.buildAddContributorTx({
      potPubkey: new PublicKey(params.potPubkey),
      authority,
      newContributor: new PublicKey(params.newContributor),
    })

    const signature = await executeTransaction(tx)
    return signature
  }

  // Sign release
  const signRelease = async (potPubkey: string) => {
    const signer = getAccountPublicKey()

    const tx = await programService.buildSignReleaseTx({
      potPubkey: new PublicKey(potPubkey),
      signer,
    })

    const signature = await executeTransaction(tx)
    return signature
  }

  // Release funds
  const releaseFunds = async (params: {
    potPubkey: string
    recipient: string
  }) => {
    const authority = getAccountPublicKey()

    const tx = await programService.buildReleaseFundsTx({
      potPubkey: new PublicKey(params.potPubkey),
      authority,
      recipient: new PublicKey(params.recipient),
    })

    const signature = await executeTransaction(tx)
    return signature
  }

  // Fetch pot data
  const fetchPot = async (potPubkey: string) => {
    return programService.fetchPot(new PublicKey(potPubkey))
  }

  // Fetch contributor data
  const fetchContributor = async (potPubkey: string, contributorAddress: string) => {
    const [contributorPDA] = programService.getContributorPDA(
      new PublicKey(potPubkey),
      new PublicKey(contributorAddress)
    )
    return programService.fetchContributor(contributorPDA)
  }

  // Fetch all pots
  const fetchAllPots = async () => {
    return programService.fetchAllPots()
  }

  // Fetch pots by authority
  const fetchPotsByAuthority = async (authority: string) => {
    return programService.fetchPotsByAuthority(new PublicKey(authority))
  }

  // Get pot PDA
  const getPotPDA = (potName: string) => {
    const authority = getAccountPublicKey()
    const [potPDA] = programService.getPotPDA(authority, potName)
    return potPDA.toBase58()
  }

  return {
    // Write methods
    createPot,
    contribute,
    addContributor,
    signRelease,
    releaseFunds,

    // Read methods
    fetchPot,
    fetchContributor,
    fetchAllPots,
    fetchPotsByAuthority,

    // Utilities
    getPotPDA,
    programService,

    // State
    isLoading,
    error,
  }
}
