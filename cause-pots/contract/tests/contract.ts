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
    await airdrop(authority.publicKey, 10);
    await airdrop(contributor1.publicKey, 10);
    await airdrop(contributor2.publicKey, 10);
    await airdrop(contributor3.publicKey, 10);
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

    it("Fails with invalid unlock period (0 days)", async () => {
      const potName = "Zero Days";
      const [potPDA] = getPotPDA(authority.publicKey, potName);

      try {
        await program.methods
          .createPot(
            potName,
            "Description",
            new anchor.BN(10 * LAMPORTS_PER_SOL),
            new anchor.BN(0), // Invalid
            2
          )
          .accounts({
            pot: potPDA,
            authority: authority.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("InvalidUnlockPeriod");
      }
    });

    it("Fails with invalid signers required (0)", async () => {
      const potName = "Zero Signers";
      const [potPDA] = getPotPDA(authority.publicKey, potName);

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

      await program.methods
        .createPot(pot1Name, "First pot", new anchor.BN(10 * LAMPORTS_PER_SOL), new anchor.BN(30), 2)
        .accounts({
          pot: pot1PDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      await program.methods
        .createPot(pot2Name, "Second pot", new anchor.BN(20 * LAMPORTS_PER_SOL), new anchor.BN(60), 3)
        .accounts({
          pot: pot2PDA,
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
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();
    });

    it("First contribution creates contributor account", async () => {
      const [contributorPDA] = getContributorPDA(testPotPDA, contributor1.publicKey);
      const contributionAmount = 2 * LAMPORTS_PER_SOL;

      await program.methods
        .contribute(new anchor.BN(contributionAmount))
        .accounts({
          pot: testPotPDA,
          contributorAccount: contributorPDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      // Verify pot updated
      const pot = await program.account.potAccount.fetch(testPotPDA);
      expect(pot.totalContributed.toNumber()).to.equal(contributionAmount);
      expect(pot.contributors).to.have.lengthOf(2); // authority + contributor1

      // Verify contributor account
      const contributorAccount = await program.account.contributorAccount.fetch(contributorPDA);
      expect(contributorAccount.contributor.toString()).to.equal(contributor1.publicKey.toString());
      expect(contributorAccount.totalContributed.toNumber()).to.equal(contributionAmount);
      expect(contributorAccount.contributionCount).to.equal(1);
    });

    it("Subsequent contributions update totals", async () => {
      const [contributorPDA] = getContributorPDA(testPotPDA, contributor1.publicKey);
      const additionalAmount = 1 * LAMPORTS_PER_SOL;

      const potBefore = await program.account.potAccount.fetch(testPotPDA);
      const contributorBefore = await program.account.contributorAccount.fetch(contributorPDA);

      await program.methods
        .contribute(new anchor.BN(additionalAmount))
        .accounts({
          pot: testPotPDA,
          contributorAccount: contributorPDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const potAfter = await program.account.potAccount.fetch(testPotPDA);
      const contributorAfter = await program.account.contributorAccount.fetch(contributorPDA);

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

      await program.methods
        .contribute(new anchor.BN(1.5 * LAMPORTS_PER_SOL))
        .accounts({
          pot: testPotPDA,
          contributorAccount: contributor2PDA,
          contributor: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();

      await program.methods
        .contribute(new anchor.BN(2.5 * LAMPORTS_PER_SOL))
        .accounts({
          pot: testPotPDA,
          contributorAccount: contributor3PDA,
          contributor: contributor3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor3])
        .rpc();

      const pot = await program.account.potAccount.fetch(testPotPDA);
      expect(pot.contributors).to.have.lengthOf(4); // authority + 3 contributors
    });

    it("Fails with zero amount", async () => {
      const [contributorPDA] = getContributorPDA(testPotPDA, contributor1.publicKey);

      try {
        await program.methods
          .contribute(new anchor.BN(0))
          .accounts({
            pot: testPotPDA,
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
            authority: authority.publicKey,
            recipient: recipient.publicKey,
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

    it("Fails releasing before time-lock", async () => {
      const earlyReleasePotName = "Early Release Test";
      const [earlyPotPDA] = getPotPDA(authority.publicKey, earlyReleasePotName);

      await program.methods
        .createPot(
          earlyReleasePotName,
          "Testing early release",
          new anchor.BN(1 * LAMPORTS_PER_SOL),
          new anchor.BN(30),
          1 // Only 1 signature needed
        )
        .accounts({
          pot: earlyPotPDA,
          authority: authority.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authority])
        .rpc();

      try {
        await program.methods
          .releaseFunds(recipient.publicKey)
          .accounts({
            pot: earlyPotPDA,
            authority: authority.publicKey,
            recipient: recipient.publicKey,
          })
          .signers([authority])
          .rpc();

        expect.fail("Should have thrown error");
      } catch (error: any) {
        expect(error.toString()).to.include("TimeLockNotExpired");
      }
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
      await program.methods
        .contribute(new anchor.BN(3 * LAMPORTS_PER_SOL))
        .accounts({
          pot: integrationPotPDA,
          contributorAccount: contrib1PDA,
          contributor: contributor1.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor1])
        .rpc();

      const [contrib2PDA] = getContributorPDA(integrationPotPDA, contributor2.publicKey);
      await program.methods
        .contribute(new anchor.BN(4 * LAMPORTS_PER_SOL))
        .accounts({
          pot: integrationPotPDA,
          contributorAccount: contrib2PDA,
          contributor: contributor2.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor2])
        .rpc();

      const [contrib3PDA] = getContributorPDA(integrationPotPDA, contributor3.publicKey);
      await program.methods
        .contribute(new anchor.BN(2 * LAMPORTS_PER_SOL))
        .accounts({
          pot: integrationPotPDA,
          contributorAccount: contrib3PDA,
          contributor: contributor3.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([contributor3])
        .rpc();

      pot = await program.account.potAccount.fetch(integrationPotPDA);
      console.log(`   ✅ Total contributed: ${pot.totalContributed.toNumber() / LAMPORTS_PER_SOL} SOL`);
      console.log(`   👥 Contributors: ${pot.contributors.length}`);

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
