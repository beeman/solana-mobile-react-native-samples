use anchor_lang::prelude::*;

declare_id!("CTtGEyhWsub71K9bDKJZbaBDNbqNk54fUuh4pLB8M5sR");

#[program]
pub mod contract {
    use super::*;

    /// Create a new savings pot with time-lock and multi-sig requirements
    pub fn create_pot(
        ctx: Context<CreatePot>,
        name: String,
        description: String,
        target_amount: u64,
        unlock_days: i64,
        signers_required: u8,
    ) -> Result<()> {
        require!(name.len() <= 32, ErrorCode::NameTooLong);
        require!(description.len() <= 200, ErrorCode::DescriptionTooLong);
        require!(target_amount > 0, ErrorCode::InvalidTargetAmount);
        require!(unlock_days > 0, ErrorCode::InvalidUnlockPeriod);
        require!(signers_required > 0, ErrorCode::InvalidSignersRequired);

        let pot = &mut ctx.accounts.pot;
        let clock = Clock::get()?;

        pot.authority = ctx.accounts.authority.key();
        pot.name = name;
        pot.description = description;
        pot.target_amount = target_amount;
        pot.total_contributed = 0;
        pot.unlock_timestamp = clock.unix_timestamp + (unlock_days * 86400); // Convert days to seconds
        pot.signers_required = signers_required;
        pot.signatures = Vec::new();
        pot.contributors = vec![ctx.accounts.authority.key()]; // Creator is first contributor
        pot.is_released = false;
        pot.released_at = None;
        pot.recipient = None;
        pot.created_at = clock.unix_timestamp;
        pot.bump = ctx.bumps.pot;

        msg!("Pot created: {}", pot.name);
        msg!("Unlock date: {}", pot.unlock_timestamp);
        msg!("Signers required: {}", pot.signers_required);

        Ok(())
    }

    /// Contribute SOL to a pot
    pub fn contribute(ctx: Context<Contribute>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidAmount);

        let pot = &mut ctx.accounts.pot;
        let contributor_account = &mut ctx.accounts.contributor_account;
        let clock = Clock::get()?;

        require!(!pot.is_released, ErrorCode::PotAlreadyReleased);

        // Transfer SOL from contributor to pot PDA
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.contributor.key(),
            &pot.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.contributor.to_account_info(),
                pot.to_account_info(),
            ],
        )?;

        // Update pot totals
        pot.total_contributed = pot
            .total_contributed
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        // Add contributor to list if not already present
        if !pot.contributors.contains(&ctx.accounts.contributor.key()) {
            pot.contributors.push(ctx.accounts.contributor.key());
        }

        // Update contributor tracking
        if contributor_account.pot == Pubkey::default() {
            // First time initialization
            contributor_account.pot = pot.key();
            contributor_account.contributor = ctx.accounts.contributor.key();
            contributor_account.total_contributed = 0;
            contributor_account.contribution_count = 0;
            contributor_account.joined_at = clock.unix_timestamp;
            contributor_account.bump = ctx.bumps.contributor_account;
        }

        contributor_account.total_contributed = contributor_account
            .total_contributed
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;
        contributor_account.contribution_count += 1;
        contributor_account.last_contribution_at = clock.unix_timestamp;

        msg!("Contribution: {} lamports", amount);
        msg!("Total contributed: {} lamports", pot.total_contributed);

        Ok(())
    }

    /// Sign to approve release (multi-sig)
    pub fn sign_release(ctx: Context<SignRelease>) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        let signer = ctx.accounts.signer.key();
        let clock = Clock::get()?;

        require!(!pot.is_released, ErrorCode::PotAlreadyReleased);
        require!(
            pot.contributors.contains(&signer),
            ErrorCode::NotAContributor
        );
        require!(!pot.signatures.contains(&signer), ErrorCode::AlreadySigned);

        // Check time-lock has passed
        require!(
            clock.unix_timestamp >= pot.unlock_timestamp,
            ErrorCode::TimeLockNotExpired
        );

        // Add signature
        pot.signatures.push(signer);

        msg!("Release signed by: {}", signer);
        msg!(
            "Signatures: {}/{}",
            pot.signatures.len(),
            pot.signers_required
        );

        Ok(())
    }

    /// Release funds to recipient (requires threshold signatures)
    pub fn release_funds(ctx: Context<ReleaseFunds>, recipient: Pubkey) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        let clock = Clock::get()?;

        require!(!pot.is_released, ErrorCode::PotAlreadyReleased);
        require!(
            clock.unix_timestamp >= pot.unlock_timestamp,
            ErrorCode::TimeLockNotExpired
        );
        require!(
            pot.signatures.len() >= pot.signers_required as usize,
            ErrorCode::InsufficientSignatures
        );

        // Calculate amount to transfer (keep rent-exempt minimum)
        let rent = Rent::get()?;
        let min_balance = rent.minimum_balance(pot.to_account_info().data_len());
        let pot_balance = pot.to_account_info().lamports();

        let transfer_amount = pot_balance
            .checked_sub(min_balance)
            .ok_or(ErrorCode::InsufficientFunds)?;

        require!(transfer_amount > 0, ErrorCode::InsufficientFunds);

        // Transfer SOL from pot PDA to recipient
        **pot.to_account_info().try_borrow_mut_lamports()? -= transfer_amount;
        **ctx.accounts.recipient.try_borrow_mut_lamports()? += transfer_amount;

        // Mark as released
        pot.is_released = true;
        pot.released_at = Some(clock.unix_timestamp);
        pot.recipient = Some(recipient);

        msg!("Funds released: {} lamports", transfer_amount);
        msg!("Recipient: {}", recipient);

        Ok(())
    }

    /// Add a contributor to the pot (authority only)
    pub fn add_contributor(ctx: Context<AddContributor>, new_contributor: Pubkey) -> Result<()> {
        let pot = &mut ctx.accounts.pot;

        require!(!pot.is_released, ErrorCode::PotAlreadyReleased);
        require!(
            !pot.contributors.contains(&new_contributor),
            ErrorCode::AlreadyAContributor
        );

        pot.contributors.push(new_contributor);

        msg!("Contributor added: {}", new_contributor);

        Ok(())
    }
}

// ============================================================================
// Account Structures
// ============================================================================

#[account]
#[derive(InitSpace)]
pub struct PotAccount {
    /// Creator and authority of the pot
    pub authority: Pubkey,

    /// Pot metadata
    #[max_len(32)]
    pub name: String,
    #[max_len(200)]
    pub description: String,

    /// Financial details
    pub target_amount: u64,
    pub total_contributed: u64,

    /// Time-lock
    pub unlock_timestamp: i64,

    /// Multi-sig configuration
    pub signers_required: u8,
    #[max_len(10)]
    pub signatures: Vec<Pubkey>,

    /// Contributors list
    #[max_len(20)]
    pub contributors: Vec<Pubkey>,

    /// Release status
    pub is_released: bool,
    pub released_at: Option<i64>,
    pub recipient: Option<Pubkey>,

    /// Metadata
    pub created_at: i64,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct ContributorAccount {
    /// References
    pub pot: Pubkey,
    pub contributor: Pubkey,

    /// Contribution tracking
    pub total_contributed: u64,
    pub contribution_count: u32,
    pub last_contribution_at: i64,

    /// Metadata
    pub joined_at: i64,
    pub bump: u8,
}

// ============================================================================
// Context Structs
// ============================================================================

#[derive(Accounts)]
#[instruction(name: String)]
pub struct CreatePot<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + PotAccount::INIT_SPACE,
        seeds = [b"pot", authority.key().as_ref(), name.as_bytes()],
        bump
    )]
    pub pot: Account<'info, PotAccount>,

    #[account(mut)]
    pub authority: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)]
    pub pot: Account<'info, PotAccount>,

    #[account(
        init_if_needed,
        payer = contributor,
        space = 8 + ContributorAccount::INIT_SPACE,
        seeds = [b"contributor", pot.key().as_ref(), contributor.key().as_ref()],
        bump
    )]
    pub contributor_account: Account<'info, ContributorAccount>,

    #[account(mut)]
    pub contributor: Signer<'info>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SignRelease<'info> {
    #[account(mut)]
    pub pot: Account<'info, PotAccount>,

    pub signer: Signer<'info>,
}

#[derive(Accounts)]
pub struct ReleaseFunds<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub pot: Account<'info, PotAccount>,

    pub authority: Signer<'info>,

    /// CHECK: Recipient can be any account
    #[account(mut)]
    pub recipient: AccountInfo<'info>,
}

#[derive(Accounts)]
pub struct AddContributor<'info> {
    #[account(
        mut,
        has_one = authority,
    )]
    pub pot: Account<'info, PotAccount>,

    pub authority: Signer<'info>,
}

// ============================================================================
// Error Codes
// ============================================================================

#[error_code]
pub enum ErrorCode {
    #[msg("Pot name is too long (max 32 characters)")]
    NameTooLong,

    #[msg("Pot description is too long (max 200 characters)")]
    DescriptionTooLong,

    #[msg("Target amount must be greater than 0")]
    InvalidTargetAmount,

    #[msg("Unlock period must be greater than 0 days")]
    InvalidUnlockPeriod,

    #[msg("Signers required must be greater than 0")]
    InvalidSignersRequired,

    #[msg("Contribution amount must be greater than 0")]
    InvalidAmount,

    #[msg("Pot has already been released")]
    PotAlreadyReleased,

    #[msg("Time-lock period has not expired yet")]
    TimeLockNotExpired,

    #[msg("You are not a contributor to this pot")]
    NotAContributor,

    #[msg("You have already signed the release")]
    AlreadySigned,

    #[msg("Insufficient signatures for release")]
    InsufficientSignatures,

    #[msg("Already a contributor")]
    AlreadyAContributor,

    #[msg("Insufficient funds in pot")]
    InsufficientFunds,

    #[msg("Arithmetic overflow")]
    Overflow,
}
