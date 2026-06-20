use anchor_lang::prelude::*;

use crate::{PlayerProfile, INITIAL_PLAYER_RATING, PLAYER_SEED};

#[derive(Accounts)]

pub struct InitialzeAccount<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        seeds = [PLAYER_SEED, user.key().as_ref()],
        bump,
        space = PlayerProfile::INIT_SPACE + PlayerProfile::DISCRIMINATOR.len()
    )]
    pub player_info: Account<'info, PlayerProfile>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitialzeAccount<'info> {
    pub fn init(&mut self, bumps: InitialzeAccountBumps) -> Result<()> {
        self.player_info.set_inner(PlayerProfile {
            authority: self.user.key(),
            elo: INITIAL_PLAYER_RATING,
            highest_rating: INITIAL_PLAYER_RATING,
            total_points: 0,
            nft_count: 0,
            reward_nonce: 0,
            games_won: 0,
            achievements: 0,
            last_active: Clock::get()?.unix_timestamp,
            bump: bumps.player_info,
        });
        Ok(())
    }
}
