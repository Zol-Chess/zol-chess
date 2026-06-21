use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_2022::Token2022,
    token_interface::{mint_to, Mint, MintTo, TokenAccount},
};

use crate::{
    ChessErrors, PlayerProfile, RewardsConfig, PLAYER_SEED, REWARDS_AUTHORITY_SEED,
    REWARDS_CONFIG_SEED, REWARDS_MINT_SEED,
};

const ZOL_DECIMAL_MULTIPLIER: u64 = 1_000_000;

pub(crate) fn calculate_mint_amount(total_points: u32, claimed_points: u32) -> Result<u64> {
    let claimable_points = total_points
        .checked_sub(claimed_points)
        .ok_or(ChessErrors::MathsOverflow)?;
    require!(claimable_points > 0, ChessErrors::NoRewardsToClaim);

    u64::from(claimable_points)
        .checked_mul(ZOL_DECIMAL_MULTIPLIER)
        .ok_or_else(|| ChessErrors::MathsOverflow.into())
}

#[derive(Accounts)]
pub struct ClaimTokens<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    #[account(
        mut,
        seeds = [PLAYER_SEED, player.key().as_ref()],
        bump = player_profile.bump,
        constraint = player_profile.authority == player.key()
            @ ChessErrors::UnauthorizedAccess,
    )]
    pub player_profile: Account<'info, PlayerProfile>,
    #[account(
        seeds = [REWARDS_CONFIG_SEED],
        bump = reward_config.bump,
    )]
    pub reward_config: Account<'info, RewardsConfig>,
    /// CHECK: PDA used only as the Token-2022 mint authority.
    #[account(
        seeds = [REWARDS_AUTHORITY_SEED],
        bump = reward_config.authority_bump,
    )]
    pub reward_authority: UncheckedAccount<'info>,
    #[account(
        mut,
        seeds = [REWARDS_MINT_SEED],
        bump = reward_config.mint_bump,
        address = reward_config.reward_mint @ ChessErrors::InvalidRewardMint,
        mint::token_program = token_program,
    )]
    pub reward_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = player,
        associated_token::mint = reward_mint,
        associated_token::authority = player,
        associated_token::token_program = token_program,
    )]
    pub player_ata: InterfaceAccount<'info, TokenAccount>,
    pub token_program: Program<'info, Token2022>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClaimTokens<'info> {
    pub fn claim(&mut self) -> Result<()> {
        require!(!self.reward_config.paused, ChessErrors::RewardsPaused);

        let mint_amount = calculate_mint_amount(
            self.player_profile.total_points,
            self.player_profile.claimed_points,
        )?;

        let signer_seeds: &[&[&[u8]]] =
            &[&[REWARDS_AUTHORITY_SEED, &[self.reward_config.authority_bump]]];
        let cpi_accounts = MintTo {
            authority: self.reward_authority.to_account_info(),
            to: self.player_ata.to_account_info(),
            mint: self.reward_mint.to_account_info(),
        };
        let cpi_context = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );

        mint_to(cpi_context, mint_amount)?;
        self.player_profile.claimed_points = self.player_profile.total_points;

        Ok(())
    }
}
