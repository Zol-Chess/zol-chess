use crate::state::rewards::*;
use crate::{ChessErrors, ACHIEVEMENT_REWARD_SEED, REWARDS_CONFIG_SEED};
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(achievement_id:u16)]
pub struct CreateAchievementReward<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        seeds = [REWARDS_CONFIG_SEED],
        bump = reward_config.bump,
        has_one = admin @ ChessErrors::UnauthorizedAccess,
    )]
    pub reward_config: Account<'info, RewardsConfig>,
    #[account(
        init,
        payer = admin,
        seeds = [ACHIEVEMENT_REWARD_SEED, &achievement_id.to_le_bytes()],
        space = AchievementReward::DISCRIMINATOR.len() + AchievementReward::INIT_SPACE,
        bump,
    )]
    pub achievement_reward: Account<'info, AchievementReward>,
    pub system_program: Program<'info, System>,
}

impl<'info> CreateAchievementReward<'info> {
    pub fn create(
        &mut self,
        achievement_id: u16,
        required_bit: u64,
        name: String,
        uri: String,
        bumps: CreateAchievementRewardBumps,
    ) -> Result<()> {
        require!(name.len() <= 64, ChessErrors::MetadataNameTooLong);
        require!(uri.len() <= 200, ChessErrors::MetadataUriTooLong);
        require!(
            is_valid_achievement_bit(required_bit),
            ChessErrors::InvalidAchievementBit
        );

        self.achievement_reward.set_inner(AchievementReward {
            achievement_id,
            required_bit,
            name,
            uri,
            active: true,
            bump: bumps.achievement_reward,
        });

        Ok(())
    }
}
