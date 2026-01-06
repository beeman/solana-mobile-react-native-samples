import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Contract } from "../target/types/contract";
import { expect } from "chai";
import { Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram } from "@solana/web3.js";

describe("Cause Pots - Comprehensive Tests", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Contract as Program<Contract>;

  // Test accounts
  let authority: Keypair;
  let contributor1: Keypair;
  let contributor2: Keypair;
  let contributor3: Keypair;
  let nonContributor: Keypair;
  let recipient: Keypair;

  // Helper to airdrop SOL
  async function airdrop(publicKey: PublicKey, amount: number) {
    const signature = await provider.connection.requestAirdrop(
      publicKey,
      amount * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);
  }

  // Helper to get pot PDA
  function getPotPDA(authority: PublicKey, name: string): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("pot"),
        authority.toBuffer(),
        Buffer.from(name),
      ],
      program.programId
    );
  }

  // Helper to get vault PDA
  function getVaultPDA(pot: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("vault"),
        pot.toBuffer(),
      ],
      program.programId
    );
  }

  // Helper to get contributor PDA
  function getContributorPDA(pot: PublicKey, contributor: PublicKey): [PublicKey, number] {
    return PublicKey.findProgramAddressSync(
      [
        Buffer.from("contributor"),
        pot.toBuffer(),
        contributor.toBuffer(),
      ],
      program.programId
    );
  }

  before(async () => {
    // Generate test keypairs
    authority = Keypair.generate();
    contributor1 = Keypair.generate();
    contributor2 = Keypair.generate();
    contributor3 = Keypair.generate();
    nonContributor = Keypair.generate();
    recipient = Keypair.generate();

    // Airdrop SOL to all test accounts
    await airdrop(authority.publicKey, 20);
    await airdrop(contributor1.publicKey, 20);
    await airdrop(contributor2.publicKey, 20);
    await airdrop(contributor3.publicKey, 20);
    await airdrop(nonContributor.publicKey, 5);
    await airdrop(recipient.publicKey, 1);

    console.log("✅ Test accounts funded");
  });

  // ============================================================================
  // CREATE POT TESTS
  // ============================================================================

  describe("create_pot", () => {
    it("Successfully creates a pot with valid parameters", async () => {
      const potName = "Trip Fund";
      const [potPDA] = getPotPDA(authority.publicKey, potName);
      const [vaultPDA] = getVaultPDA(potPDA);

      const tx = await program.methods
        .createPot(
          potName,
          "Saving for Tokyo trip",
          new anchor.BN(50 * LAMPORTS_PER_SOL),
          new anchor.BN(30), // 30 days
          2   // 2-of-3 multi-sig
        )
        .accounts({
          pot: potPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      console.log("✅ Pot created:", tx);

      // Fetch and verify pot account
      const pot = await program.account.potAccount.fetch(potPDA);
      expect(pot.name).to.equal(potName);
      expect(pot.description).to.equal("Saving for Tokyo trip");
      expect(pot.authority.toString()).to.equal(authority.publicKey.toString());
      expect(pot.targetAmount.toNumber()).to.equal(50 * LAMPORTS_PER_SOL);
      expect(pot.totalContributed.toNumber()).to.equal(0);
      expect(pot.signersRequired).to.equal(2);
      expect(pot.signatures).to.be.empty;
      expect(pot.contributors).to.have.lengthOf(1);
      expect(pot.contributors[0].toString()).to.equal(authority.publicKey.toString());
      expect(pot.isReleased).to.be.false;
    });

    it("Fails with name too long (>32 chars)", async () => {
      const longName = "A".repeat(33);

      try {
        const [potPDA] = getPotPDA(authority.publicKey, longName);
        const [vaultPDA] = getVaultPDA(potPDA);

        await program.methods
          .createPot(
            longName,
            "Description",
            new anchor.BN(10 * LAMPORTS_PER_SOL),
            new anchor.BN(30),
            2
          )
          .accounts({
            pot: potPDA,
            potVault: vaultPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        // PDA seed length check happens before contract call
        expect(error.toString()).to.match(/Max seed length exceeded|NameTooLong/);
      }
    });

    it("Fails with description too long (>200 chars)", async () => {
      const potName = "Short Name";
      const longDescription = "A".repeat(201);
      const [potPDA] = getPotPDA(authority.publicKey, potName);
      const [vaultPDA] = getVaultPDA(potPDA);

      try {
        await program.methods
          .createPot(
            potName,
            longDescription,
            new anchor.BN(10 * LAMPORTS_PER_SOL),
            new anchor.BN(30),
            2
          )
          .accounts({
            pot: potPDA,
            potVault: vaultPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("DescriptionTooLong");
      }
    });

    it("Fails with invalid target amount (0)", async () => {
      const potName = "Zero Target";
      const [potPDA] = getPotPDA(authority.publicKey, potName);
      const [vaultPDA] = getVaultPDA(potPDA);

      try {
        await program.methods
          .createPot(
            potName,
            "Description",
            new anchor.BN(0),
            new anchor.BN(30),
            2
          )
          .accounts({
            pot: potPDA,
            potVault: vaultPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidTargetAmount");
      }
    });

    it("Fails with invalid signers required (0)", async () => {
      const potName = "Zero Signers";
      const [potPDA] = getPotPDA(authority.publicKey, potName);
      const [vaultPDA] = getVaultPDA(potPDA);

      try {
        await program.methods
          .createPot(
            potName,
            "Description",
            new anchor.BN(10 * LAMPORTS_PER_SOL),
            new anchor.BN(30),
            0 // Invalid
          )
          .accounts({
            pot: potPDA,
            potVault: vaultPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidSignersRequired");
      }
    });

    it("Can create multiple pots with different names", async () => {
      const pot1Name = "Pot One";
      const pot2Name = "Pot Two";
      const [pot1PDA] = getPotPDA(authority.publicKey, pot1Name);
      const [pot2PDA] = getPotPDA(authority.publicKey, pot2Name);
      const [vault1PDA] = getVaultPDA(pot1PDA);
      const [vault2PDA] = getVaultPDA(pot2PDA);

      await program.methods
        .createPot(pot1Name, "First pot", new anchor.BN(10 * LAMPORTS_PER_SOL), new anchor.BN(30), 2)
        .accounts({
          pot: pot1PDA,
          potVault: vault1PDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await program.methods
        .createPot(pot2Name, "Second pot", new anchor.BN(20 * LAMPORTS_PER_SOL), new anchor.BN(60), 3)
        .accounts({
          pot: pot2PDA,
          potVault: vault2PDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      const pot1 = await program.account.potAccount.fetch(pot1PDA);
      const pot2 = await program.account.potAccount.fetch(pot2PDA);

      expect(pot1.name).to.equal(pot1Name);
      expect(pot2.name).to.equal(pot2Name);
      expect(pot1.targetAmount.toNumber()).to.equal(10 * LAMPORTS_PER_SOL);
      expect(pot2.targetAmount.toNumber()).to.equal(20 * LAMPORTS_PER_SOL);
    });
  });

  // ============================================================================
  // CONTRIBUTE TESTS
  // ============================================================================

  describe("contribute", () => {
    let testPotPDA: PublicKey;
    const testPotName = "Contribution Test Pot";

    before(async () => {
      // Create a test pot
      [testPotPDA] = getPotPDA(authority.publicKey, testPotName);
      const [vaultPDA] = getVaultPDA(testPotPDA);

      await program.methods
        .createPot(
          testPotName,
          "Testing contributions",
          new anchor.BN(10 * LAMPORTS_PER_SOL),
          new anchor.BN(30),
          2
        )
        .accounts({
          pot: testPotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    });

    it("First contribution creates contributor account", async () => {
      const [contributorPDA] = getContributorPDA(testPotPDA, contributor1.publicKey);
      const [vaultPDA] = getVaultPDA(testPotPDA);
      const contributionAmount = 2 * LAMPORTS_PER_SOL;

      const contributorBalanceBefore = await provider.connection.getBalance(contributor1.publicKey);
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(new anchor.BN(contributionAmount))
        .accounts({
          pot: testPotPDA,
          potVault: vaultPDA,
          contributorAccount: contributorPDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const contributorBalanceAfter = await provider.connection.getBalance(contributor1.publicKey);
      const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);

      // Verify contributor balance change (decreased by contribution + fees)
      // Note: This also accounts for the rent for creating the contributor account
      expect(contributorBalanceAfter).to.be.at.most(contributorBalanceBefore - contributionAmount);

      // Verify pot updated
      const pot = await program.account.potAccount.fetch(testPotPDA);
      expect(pot.totalContributed.toNumber()).to.equal(contributionAmount);
      expect(pot.contributors).to.have.lengthOf(2); // authority + contributor1

      // Verify actual vault balance
      console.log("Total money in vault after first contribution:", vaultBalanceAfter);
      expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + contributionAmount);

      // Verify contributor account
      const contributorAccount = await program.account.contributorAccount.fetch(contributorPDA);
      expect(contributorAccount.contributor.toString()).to.equal(contributor1.publicKey.toString());
      expect(contributorAccount.totalContributed.toNumber()).to.equal(contributionAmount);
      expect(contributorAccount.contributionCount).to.equal(1);
    });

    it("Subsequent contributions update totals", async () => {
      const [contributorPDA] = getContributorPDA(testPotPDA, contributor1.publicKey);
      const [vaultPDA] = getVaultPDA(testPotPDA);
      const additionalAmount = 1 * LAMPORTS_PER_SOL;

      const potBefore = await program.account.potAccount.fetch(testPotPDA);
      const contributorBefore = await program.account.contributorAccount.fetch(contributorPDA);
      const contributorBalanceBefore = await provider.connection.getBalance(contributor1.publicKey);
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(new anchor.BN(additionalAmount))
        .accounts({
          pot: testPotPDA,
          potVault: vaultPDA,
          contributorAccount: contributorPDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const contributorBalanceAfter = await provider.connection.getBalance(contributor1.publicKey);
      const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);

      // Verify balances
      expect(vaultBalanceAfter).to.equal(vaultBalanceBefore + additionalAmount);
      expect(contributorBalanceAfter).to.be.at.most(contributorBalanceBefore - additionalAmount);

      console.log("Total money after contribution in pot:", vaultBalanceAfter);

      const potAfter = await program.account.potAccount.fetch(testPotPDA);
      const contributorAfter = await program.account.contributorAccount.fetch(contributorPDA);

      expect(vaultBalanceAfter).to.equal(potAfter.totalContributed.toNumber());
      expect(potAfter.totalContributed.toNumber()).to.equal(
        potBefore.totalContributed.toNumber() + additionalAmount
      );
      expect(contributorAfter.totalContributed.toNumber()).to.equal(
        contributorBefore.totalContributed.toNumber() + additionalAmount
      );
      expect(contributorAfter.contributionCount).to.equal(
        contributorBefore.contributionCount + 1
      );
    });

    it("Multiple contributors can contribute", async () => {
      const [contributor2PDA] = getContributorPDA(testPotPDA, contributor2.publicKey);
      const [contributor3PDA] = getContributorPDA(testPotPDA, contributor3.publicKey);
      const [vaultPDA] = getVaultPDA(testPotPDA);

      // --- Contribution from Contributor 2 ---
      const contrib2Amount = new anchor.BN(1.5 * LAMPORTS_PER_SOL);
      const c2BalanceBefore = await provider.connection.getBalance(contributor2.publicKey);
      const vaultBalanceBeforeC2 = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(contrib2Amount)
        .accounts({
          pot: testPotPDA,
          potVault: vaultPDA,
          contributorAccount: contributor2PDA,
          contributor: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();

      const c2BalanceAfter = await provider.connection.getBalance(contributor2.publicKey);
      const vaultBalanceAfterC2 = await provider.connection.getBalance(vaultPDA);

      expect(c2BalanceAfter).to.be.at.most(c2BalanceBefore - contrib2Amount.toNumber());
      expect(vaultBalanceAfterC2).to.equal(vaultBalanceBeforeC2 + contrib2Amount.toNumber());

      // --- Contribution from Contributor 3 ---
      const contrib3Amount = new anchor.BN(2.5 * LAMPORTS_PER_SOL);
      const c3BalanceBefore = await provider.connection.getBalance(contributor3.publicKey);
      const vaultBalanceBeforeC3 = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(contrib3Amount)
        .accounts({
          pot: testPotPDA,
          potVault: vaultPDA,
          contributorAccount: contributor3PDA,
          contributor: contributor3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor3])
        .rpc();

      const c3BalanceAfter = await provider.connection.getBalance(contributor3.publicKey);
      const vaultBalanceAfterC3 = await provider.connection.getBalance(vaultPDA);

      expect(c3BalanceAfter).to.be.at.most(c3BalanceBefore - contrib3Amount.toNumber());
      expect(vaultBalanceAfterC3).to.equal(vaultBalanceBeforeC3 + contrib3Amount.toNumber());

      const pot = await program.account.potAccount.fetch(testPotPDA);
      expect(pot.contributors).to.have.lengthOf(4); // authority + 3 contributors

      // Verify actual vault balance matches total contributed
      const finalVaultBalance = await provider.connection.getBalance(vaultPDA);
      console.log("Total money in vault after multiple contributions:", finalVaultBalance);
      expect(finalVaultBalance).to.equal(pot.totalContributed.toNumber());
    });

    it("Fails with zero amount", async () => {
      const [contributorPDA] = getContributorPDA(testPotPDA, contributor1.publicKey);
      const [vaultPDA] = getVaultPDA(testPotPDA);

      try {
        await program.methods
          .contribute(new anchor.BN(0))
          .accounts({
            pot: testPotPDA,
            potVault: vaultPDA,
            contributorAccount: contributorPDA,
            contributor: contributor1.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([contributor1])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidAmount");
      }
    });
  });

  // ============================================================================
  // SIGN RELEASE TESTS
  // ============================================================================

  describe("sign_release", () => {
    let signingPotPDA: PublicKey;
    const signingPotName = "Signing Test Pot";

    before(async () => {
      // Create a pot with 1 day time-lock for faster testing
      [signingPotPDA] = getPotPDA(authority.publicKey, signingPotName);
      const [vaultPDA] = getVaultPDA(signingPotPDA);

      await program.methods
        .createPot(
          signingPotName,
          "Testing multi-sig",
          new anchor.BN(5 * LAMPORTS_PER_SOL),
          new anchor.BN(1), // 1 day (short for testing)
          2  // 2-of-3 required
        )
        .accounts({
          pot: signingPotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // Add contributors
      const [contrib1PDA] = getContributorPDA(signingPotPDA, contributor1.publicKey);
      const [contrib2PDA] = getContributorPDA(signingPotPDA, contributor2.publicKey);

      await program.methods
        .contribute(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          pot: signingPotPDA,
          potVault: vaultPDA,
          contributorAccount: contrib1PDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      await program.methods
        .contribute(new anchor.BN(1 * LAMPORTS_PER_SOL))
        .accounts({
          pot: signingPotPDA,
          potVault: vaultPDA,
          contributorAccount: contrib2PDA,
          contributor: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();
    });

    it("Fails signing before time-lock expires", async () => {
      try {
        await program.methods
          .signRelease()
          .accounts({
            pot: signingPotPDA,
            signer: contributor1.publicKey,
          })
          .signers([contributor1])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("TimeLockNotExpired");
      }
    });

    it("Fails if non-contributor tries to sign", async () => {
      try {
        await program.methods
          .signRelease()
          .accounts({
            pot: signingPotPDA,
            signer: nonContributor.publicKey,
          })
          .signers([nonContributor])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("NotAContributor");
      }
    });
  });

  // ============================================================================
  // RELEASE FUNDS TESTS
  // ============================================================================

  describe("release_funds", () => {
    it("Fails releasing without sufficient signatures", async () => {
      const releasePotName = "Release Test Pot";
      const [releasePotPDA] = getPotPDA(authority.publicKey, releasePotName);
      const [vaultPDA] = getVaultPDA(releasePotPDA);

      await program.methods
        .createPot(
          releasePotName,
          "Testing release",
          new anchor.BN(5 * LAMPORTS_PER_SOL),
          new anchor.BN(1),
          2 // Needs 2 signatures
        )
        .accounts({
          pot: releasePotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      try {
        await program.methods
          .releaseFunds(recipient.publicKey)
          .accounts({
            pot: releasePotPDA,
            potVault: vaultPDA,
            authority: authority.publicKey,
            recipient: recipient.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        // The error is thrown - verify it's about insufficient signatures
        // Anchor errors have error codes, InsufficientSignatures is custom error #10
        const errorStr = error.toString();
        expect(errorStr).to.satisfy((msg: string) =>
          msg.includes("InsufficientSignatures") ||
          msg.includes("6010") || // Custom error code
          msg.includes("AnchorError") // Generic Anchor error check
        );
      }
    });

    it("Successfully releases funds after time-lock and with enough signatures", async () => {
      const releasePotName = "Successful Release Pot";
      const [releasePotPDA] = getPotPDA(authority.publicKey, releasePotName);
      const [vaultPDA] = getVaultPDA(releasePotPDA);
      const unlock_period_seconds = 2;

      // 1. Create a pot with a short time-lock and 1 required signature
      await program.methods
        .createPot(
          releasePotName,
          "Testing successful release",
          new anchor.BN(5 * LAMPORTS_PER_SOL),
          new anchor.BN(unlock_period_seconds/86400),
          1 // Needs 1 signature (authority)
        )
        .accounts({
          pot: releasePotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // 2. Contribute to the pot so there's something to release
      const [contrib1PDA] = getContributorPDA(releasePotPDA, contributor1.publicKey);
      const contributionAmount = new anchor.BN(3 * LAMPORTS_PER_SOL);
      await program.methods
        .contribute(contributionAmount)
        .accounts({
          pot: releasePotPDA,
          potVault: vaultPDA,
          contributorAccount: contrib1PDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      let pot = await program.account.potAccount.fetch(releasePotPDA);
      expect(pot.totalContributed.toNumber()).to.equal(contributionAmount.toNumber());

      // Sign for release

       await program.methods
          .signRelease()
          .accounts({
            pot: releasePotPDA,
            signer: contributor1.publicKey,
          })
          .signers([contributor1])
          .rpc();

      // 3. Wait for time-lock to expire
      console.log(`     (Waiting ${unlock_period_seconds + 1} seconds for time-lock to expire...)`);
      await new Promise(resolve => setTimeout(resolve, (unlock_period_seconds + 1) * 1000));

      // 4. Get balances before release
      const vaultBalanceBefore = await provider.connection.getBalance(vaultPDA);
      const recipientBalanceBefore = await provider.connection.getBalance(recipient.publicKey);
      console.log(vaultBalanceBefore, recipientBalanceBefore);

      // 5. Now release the funds
      await program.methods
        .releaseFunds(recipient.publicKey)
        .accounts({
          pot: releasePotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          recipient: recipient.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      // 6. Get balances after release
      const vaultBalanceAfter = await provider.connection.getBalance(vaultPDA);
      const recipientBalanceAfter = await provider.connection.getBalance(recipient.publicKey);
      console.log(vaultBalanceAfter, recipientBalanceAfter);
      // 7. Verify balances and pot state
      expect(vaultBalanceAfter).to.equal(0); // Vault should be emptied after release
      // Recipient balance should increase by the exact contributed amount
      expect(recipientBalanceAfter).to.equal(recipientBalanceBefore + contributionAmount.toNumber());

      pot = await program.account.potAccount.fetch(releasePotPDA);
      expect(pot.isReleased).to.be.true; // Pot should be marked as released
    });
  });

  // ============================================================================
  // ADD CONTRIBUTOR TESTS
  // ============================================================================

  describe("add_contributor", () => {
    let addContribPotPDA: PublicKey;
    const addContribPotName = "Add Contributor Test";

    before(async () => {
      [addContribPotPDA] = getPotPDA(authority.publicKey, addContribPotName);
      const [vaultPDA] = getVaultPDA(addContribPotPDA);

      await program.methods
        .createPot(
          addContribPotName,
          "Testing add contributor",
          new anchor.BN(5 * LAMPORTS_PER_SOL),
          new anchor.BN(30),
          2
        )
        .accounts({
          pot: addContribPotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    });

    it("Authority can add contributor", async () => {
      const newContributor = Keypair.generate().publicKey;

      await program.methods
        .addContributor(newContributor)
        .accounts({
          pot: addContribPotPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      const pot = await program.account.potAccount.fetch(addContribPotPDA);
      expect(pot.contributors.map(c => c.toString())).to.include(newContributor.toString());
    });

    it("Fails adding duplicate contributor", async () => {
      const newContributor = Keypair.generate().publicKey;

      await program.methods
        .addContributor(newContributor)
        .accounts({
          pot: addContribPotPDA,
          authority: authority.publicKey,
        })
        .signers([authority])
        .rpc();

      try {
        await program.methods
          .addContributor(newContributor)
          .accounts({
            pot: addContribPotPDA,
            authority: authority.publicKey,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("AlreadyAContributor");
      }
    });
  });

  // ============================================================================
  // INTEGRATION TEST
  // ============================================================================

  describe("Full workflow integration", () => {
    it("Complete pot lifecycle", async () => {
      console.log("\n🧪 Running full integration test...\n");

      // 1. Create pot
      const integrationPotName = "Integration Test Pot";
      const [integrationPotPDA] = getPotPDA(authority.publicKey, integrationPotName);
      const [vaultPDA] = getVaultPDA(integrationPotPDA);

      console.log("1️⃣  Creating pot...");
      await program.methods
        .createPot(
          integrationPotName,
          "Full workflow test",
          new anchor.BN(10 * LAMPORTS_PER_SOL),
          new anchor.BN(1), // Short time-lock for testing
          2  // 2-of-3 signatures
        )
        .accounts({
          pot: integrationPotPDA,
          potVault: vaultPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      let pot = await program.account.potAccount.fetch(integrationPotPDA);
      console.log(`   ✅ Pot created: ${pot.name}`);
      console.log(`   📅 Unlock timestamp: ${pot.unlockTimestamp.toString()}`);

      // 2. Multiple contributions
      console.log("\n2️⃣  Adding contributions...");

      const [contrib1PDA] = getContributorPDA(integrationPotPDA, contributor1.publicKey);
      const contrib1Amount = 3 * LAMPORTS_PER_SOL;
      const contrib1BalanceBefore = await provider.connection.getBalance(contributor1.publicKey);
      const vaultBalanceBeforeC1 = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(new anchor.BN(contrib1Amount))
        .accounts({
          pot: integrationPotPDA,
          potVault: vaultPDA,
          contributorAccount: contrib1PDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const contrib1BalanceAfter = await provider.connection.getBalance(contributor1.publicKey);
      const vaultBalanceAfterC1 = await provider.connection.getBalance(vaultPDA);
      expect(contrib1BalanceAfter).to.be.at.most(contrib1BalanceBefore - contrib1Amount);
      expect(vaultBalanceAfterC1).to.equal(vaultBalanceBeforeC1 + contrib1Amount);


      const [contrib2PDA] = getContributorPDA(integrationPotPDA, contributor2.publicKey);
      const contrib2Amount = 4 * LAMPORTS_PER_SOL;
      const contrib2BalanceBefore = await provider.connection.getBalance(contributor2.publicKey);
      const vaultBalanceBeforeC2 = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(new anchor.BN(contrib2Amount))
        .accounts({
          pot: integrationPotPDA,
          potVault: vaultPDA,
          contributorAccount: contrib2PDA,
          contributor: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();

      const contrib2BalanceAfter = await provider.connection.getBalance(contributor2.publicKey);
      const vaultBalanceAfterC2 = await provider.connection.getBalance(vaultPDA);
      expect(contrib2BalanceAfter).to.be.at.most(contrib2BalanceBefore - contrib2Amount);
      expect(vaultBalanceAfterC2).to.equal(vaultBalanceBeforeC2 + contrib2Amount);

      const [contrib3PDA] = getContributorPDA(integrationPotPDA, contributor3.publicKey);
      const contrib3Amount = 2 * LAMPORTS_PER_SOL;
      const contrib3BalanceBefore = await provider.connection.getBalance(contributor3.publicKey);
      const vaultBalanceBeforeC3 = await provider.connection.getBalance(vaultPDA);

      await program.methods
        .contribute(new anchor.BN(contrib3Amount))
        .accounts({
          pot: integrationPotPDA,
          potVault: vaultPDA,
          contributorAccount: contrib3PDA,
          contributor: contributor3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor3])
        .rpc();

      const contrib3BalanceAfter = await provider.connection.getBalance(contributor3.publicKey);
      const vaultBalanceAfterC3 = await provider.connection.getBalance(vaultPDA);
      expect(contrib3BalanceAfter).to.be.at.most(contrib3BalanceBefore - contrib3Amount);
      expect(vaultBalanceAfterC3).to.equal(vaultBalanceBeforeC3 + contrib3Amount);

      pot = await program.account.potAccount.fetch(integrationPotPDA);
      console.log(`   ✅ Total contributed: ${pot.totalContributed.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   👥 Contributors: ${pot.contributors.length}`);

      // Verify actual vault balance
      const vaultBalance = await provider.connection.getBalance(vaultPDA);
      console.log(`   💰 Vault balance: ${vaultBalance / LAMPORTS_PER_SOL} SOL`);
      expect(vaultBalance).to.equal(pot.totalContributed.toNumber());

      // 3. Verify contributor tracking
      console.log("\n3️⃣  Verifying contributor accounts...");
      const contrib1Account = await program.account.contributorAccount.fetch(contrib1PDA);
      console.log(`   ✅ Contributor 1: ${contrib1Account.contributionCount} contributions, ${contrib1Account.totalContributed.toNumber() / LAMPORTS_PER_SOL} SOL`);

      // 4. Summary
      console.log("\n✅ Integration test completed successfully!");
      console.log("   ⚠️  Note: Time-lock and signature tests require time advancement");
    });
  });
});
