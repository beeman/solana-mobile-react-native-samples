import { Program, AnchorProvider, BN, web3 } from '@coral-xyz/anchor'
import { Connection, PublicKey, Transaction, SystemProgram } from '@solana/web3.js'
import { Contract, IDL } from '@/idl'

export class PotProgramService {
  private program: Program<Contract>
  private connection: Connection

  constructor(connection: Connection) {
    this.connection = connection

    // Create read-only provider for queries
    const provider = new AnchorProvider(
      connection,
      {} as any, // Wallet not needed for read-only operations
      { commitment: 'confirmed' }
    )

    this.program = new Program<Contract>(
      IDL as Contract,
      provider
    )
  }

  /**
   * Derive pot PDA
   * Seeds: ["pot", authority, name]
   */
  getPotPDA(authority: PublicKey, potName: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('pot'),
        authority.toBuffer(),
        Buffer.from(potName),
      ],
      this.program.programId
    )
  }

  /**
   * Derive vault PDA
   * Seeds: ["vault", pot]
   */
  getVaultPDA(pot: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('vault'),
        pot.toBuffer(),
      ],
      this.program.programId
    )
  }

  /**
   * Derive contributor PDA
   * Seeds: ["contributor", pot, contributor]
   */
  getContributorPDA(pot: PublicKey, contributor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from('contributor'),
        pot.toBuffer(),
        contributor.toBuffer(),
      ],
      this.program.programId
    )
  }

  /**
   * Build create pot transaction
   */
  async buildCreatePotTx(params: {
    authority: PublicKey
    name: string
    description: string
    targetAmount: number
    unlockDays: number
    signersRequired: number
    contributors?: string[] // Additional contributors to add (excluding authority)
  }): Promise<Transaction> {
    const [potPDA] = this.getPotPDA(params.authority, params.name)
    const [vaultPDA] = this.getVaultPDA(potPDA)

    // Convert target amount to lamports (assuming SOL)
    const targetAmountLamports = new BN(params.targetAmount * web3.LAMPORTS_PER_SOL)

    const createPotInstruction = await this.program.methods
      .createPot(
        params.name,
        params.description,
        targetAmountLamports,
        new BN(params.unlockDays),
        params.signersRequired
      )
      .accounts({
        pot: potPDA,
        potVault: vaultPDA,
        authority: params.authority,
        systemProgram: SystemProgram.programId,
      })
      .instruction()

    const tx = new Transaction()
    tx.add(createPotInstruction)

    // Add contributor instructions for each selected contributor (excluding authority)
    if (params.contributors && params.contributors.length > 0) {
      for (const contributorAddress of params.contributors) {
        const contributorPubkey = new PublicKey(contributorAddress)

        // Skip if contributor is the authority (already added in create_pot)
        if (contributorPubkey.equals(params.authority)) {
          continue
        }

        const addContributorInstruction = await this.program.methods
          .addContributor(contributorPubkey)
          .accounts({
            pot: potPDA,
            authority: params.authority,
          })
          .instruction()

        tx.add(addContributorInstruction)
      }
    }

    tx.feePayer = params.authority

    // Don't set blockhash here - let the transaction hook handle it
    return tx
  }

  /**
   * Build contribute transaction
   */
  async buildContributeTx(params: {
    potPubkey: PublicKey
    contributor: PublicKey
    amount: number
  }): Promise<Transaction> {
    const [vaultPDA] = this.getVaultPDA(params.potPubkey)
    const [contributorPDA] = this.getContributorPDA(params.potPubkey, params.contributor)

    // Convert amount to lamports
    const amountLamports = new BN(params.amount * web3.LAMPORTS_PER_SOL)

    const instruction = await this.program.methods
      .contribute(amountLamports)
      .accounts({
        pot: params.potPubkey,
        potVault: vaultPDA,
        contributorAccount: contributorPDA,
        contributor: params.contributor,
        systemProgram: SystemProgram.programId,
      })
      .instruction()

    const tx = new Transaction()
    tx.add(instruction)
    tx.feePayer = params.contributor

    // Don't set blockhash here - let the transaction hook handle it
    return tx
  }

  /**
   * Build add contributor transaction
   */
  async buildAddContributorTx(params: {
    potPubkey: PublicKey
    authority: PublicKey
    newContributor: PublicKey
  }): Promise<Transaction> {
    const instruction = await this.program.methods
      .addContributor(params.newContributor)
      .accounts({
        pot: params.potPubkey,
        authority: params.authority,
      })
      .instruction()

    const tx = new Transaction()
    tx.add(instruction)
    tx.feePayer = params.authority

    // Don't set blockhash here - let the transaction hook handle it
    return tx
  }

  /**
   * Build sign release transaction
   */
  async buildSignReleaseTx(params: {
    potPubkey: PublicKey
    signer: PublicKey
  }): Promise<Transaction> {
    const instruction = await this.program.methods
      .signRelease()
      .accounts({
        pot: params.potPubkey,
        signer: params.signer,
      })
      .instruction()

    const tx = new Transaction()
    tx.add(instruction)
    tx.feePayer = params.signer

    // Don't set blockhash here - let the transaction hook handle it
    return tx
  }

  /**
   * Build release funds transaction
   */
  async buildReleaseFundsTx(params: {
    potPubkey: PublicKey
    authority: PublicKey
    recipient: PublicKey
  }): Promise<Transaction> {
    const [vaultPDA] = this.getVaultPDA(params.potPubkey)

    const instruction = await this.program.methods
      .releaseFunds(params.recipient)
      .accounts({
        pot: params.potPubkey,
        potVault: vaultPDA,
        authority: params.authority,
        recipient: params.recipient,
        systemProgram: SystemProgram.programId,
      })
      .instruction()

    const tx = new Transaction()
    tx.add(instruction)
    tx.feePayer = params.authority

    // Don't set blockhash here - let the transaction hook handle it
    return tx
  }

  /**
   * Fetch pot account from blockchain
   */
  async fetchPot(potPubkey: PublicKey) {
    try {
      return await this.program.account.potAccount.fetch(potPubkey)
    } catch (error) {
      console.error('Error fetching pot:', error)
      throw error
    }
  }

  /**
   * Fetch contributor account from blockchain
   */
  async fetchContributor(contributorPDA: PublicKey) {
    try {
      return await this.program.account.contributorAccount.fetch(contributorPDA)
    } catch (error) {
      console.error('Error fetching contributor:', error)
      throw error
    }
  }

  /**
   * Fetch all pot accounts
   */
  async fetchAllPots() {
    try {
      return await this.program.account.potAccount.all()
    } catch (error) {
      console.error('Error fetching all pots:', error)
      throw error
    }
  }

  /**
   * Get pot accounts for a specific authority
   */
  async fetchPotsByAuthority(authority: PublicKey) {
    try {
      return await this.program.account.potAccount.all([
        {
          memcmp: {
            offset: 8, // Discriminator
            bytes: authority.toBase58(),
          },
        },
      ])
    } catch (error) {
      console.error('Error fetching pots by authority:', error)
      throw error
    }
  }
}
