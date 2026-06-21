use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use anchor_spl::{
    token_2022::Token2022,
    token_interface::{
        spl_pod::optional_keys::OptionalNonZeroPubkey,
        spl_token_2022::{extension::ExtensionType, state::Mint as SplMint},
        spl_token_metadata_interface::state::TokenMetadata,
        token_metadata_initialize, Mint, TokenMetadataInitialize,
    },
};

use crate::{
    ChessErrors, RewardsConfig, REWARDS_AUTHORITY_SEED, REWARDS_CONFIG_SEED, REWARDS_MINT_SEED,
};

const TOKEN_NAME: &str = "ZolChess";
const TOKEN_SYMBOL: &str = "ZOL";

#[derive(Accounts)]
#[instruction(uri: String)]
pub struct InitializeRewardMint<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        seeds = [REWARDS_CONFIG_SEED],
        bump = reward_config.bump,
        has_one = admin @ ChessErrors::UnauthorizedAccess,
        constraint = reward_config.reward_mint == Pubkey::default()
            @ ChessErrors::RewardMintAlreadyInitialized,
    )]
    pub reward_config: Account<'info, RewardsConfig>,
    /// CHECK: PDA used as mint and metadata authority.
    #[account(
        seeds = [REWARDS_AUTHORITY_SEED],
        bump,
    )]
    pub reward_authority: UncheckedAccount<'info>,
    #[account(
        init,
        payer = admin,
        seeds = [REWARDS_MINT_SEED],
        bump,
        mint::decimals = 6,
        mint::authority = reward_authority,
        mint::token_program = token_program,
        extensions::metadata_pointer::authority = reward_authority,
        extensions::metadata_pointer::metadata_address = reward_mint,
    )]
    pub reward_mint: InterfaceAccount<'info, Mint>,
    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeRewardMint<'info> {
    pub fn init(&mut self, uri: String, bumps: InitializeRewardMintBumps) -> Result<()> {
        require!(uri.len() <= 200, ChessErrors::MetadataUriTooLong);

        let metadata = TokenMetadata {
            update_authority: OptionalNonZeroPubkey::try_from(Some(self.reward_authority.key()))?,
            mint: self.reward_mint.key(),
            name: TOKEN_NAME.to_owned(),
            symbol: TOKEN_SYMBOL.to_owned(),
            uri: uri.clone(),
            additional_metadata: vec![],
        };
        let base_mint_len =
            ExtensionType::try_calculate_account_len::<SplMint>(&[ExtensionType::MetadataPointer])?;
        let metadata_len = metadata.tlv_size_of()?;
        let target_len = base_mint_len
            .checked_add(metadata_len)
            .ok_or(ChessErrors::MathsOverflow)?;
        let required_lamports = Rent::get()?.minimum_balance(target_len);
        let current_lamports = self.reward_mint.to_account_info().lamports();
        let additional_lamports = required_lamports.saturating_sub(current_lamports);

        if additional_lamports > 0 {
            transfer(
                CpiContext::new(
                    self.system_program.to_account_info(),
                    Transfer {
                        from: self.admin.to_account_info(),
                        to: self.reward_mint.to_account_info(),
                    },
                ),
                additional_lamports,
            )?;
        }

        let signer_seeds: &[&[&[u8]]] = &[&[REWARDS_AUTHORITY_SEED, &[bumps.reward_authority]]];
        token_metadata_initialize(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TokenMetadataInitialize {
                    program_id: self.token_program.to_account_info(),
                    metadata: self.reward_mint.to_account_info(),
                    update_authority: self.reward_authority.to_account_info(),
                    mint_authority: self.reward_authority.to_account_info(),
                    mint: self.reward_mint.to_account_info(),
                },
                signer_seeds,
            ),
            TOKEN_NAME.to_owned(),
            TOKEN_SYMBOL.to_owned(),
            uri,
        )?;

        self.reward_config.reward_mint = self.reward_mint.key();
        self.reward_config.authority_bump = bumps.reward_authority;
        self.reward_config.mint_bump = bumps.reward_mint;

        Ok(())
    }
}
