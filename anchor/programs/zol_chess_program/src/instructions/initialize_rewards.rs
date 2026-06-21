//the admin accounts initializes the rewards and rules of the puzzles, including token accounts and
//nfts collections.
//
//

use crate::constants::*;
use crate::state::rewards::*;
use crate::ChessErrors;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct InitializeRewards<'info> {
    #[account(mut, constraint = admin.key() == INITIAL_REWARDS_ADMIN @ChessErrors::UnauthorizedAccess)]
    pub admin: Signer<'info>,
    #[account(
        init,
        payer = admin,
        space = RewardsConfig::DISCRIMINATOR.len() + RewardsConfig::INIT_SPACE,
        seeds = [REWARDS_CONFIG_SEED],
        bump
        )]
    pub reward_config: Account<'info, RewardsConfig>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitializeRewards<'info> {
    pub fn init(&mut self, bumps: InitializeRewardsBumps) -> Result<()> {
        self.reward_config.set_inner(RewardsConfig {
            admin: self.admin.key(),
            reward_mint: Pubkey::default(),
            reward_collection: Pubkey::default(),
            paused: false,
            bump: bumps.reward_config,
            authority_bump: 0,
            mint_bump: 0,
        });

        Ok(())
    }
}
