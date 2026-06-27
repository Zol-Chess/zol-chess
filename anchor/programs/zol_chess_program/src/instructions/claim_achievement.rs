use anchor_lang::prelude::*;
use mpl_core::{
    instructions::{AddPluginV1CpiBuilder, CreateV2CpiBuilder},
    types::{FreezeDelegate, Plugin, PluginAuthority},
    ID as MPL_CORE_ID,
};

use crate::{
    is_valid_achievement_bit, AchievementReward, ChessErrors, PlayerProfile, RewardsConfig,
    UserAchievementClaim, ACHIEVEMENT_CLAIM_SEED, ACHIEVEMENT_REWARD_SEED, PLAYER_SEED,
    REWARDS_AUTHORITY_SEED, REWARDS_CONFIG_SEED,
};

#[derive(Accounts)]
#[instruction(achievement_id: u16)]
pub struct ClaimAchievement<'info> {
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
    /// CHECK: PDA used as the Metaplex Core collection authority.
    #[account(
        seeds = [REWARDS_AUTHORITY_SEED],
        bump = reward_config.authority_bump,
    )]
    pub reward_authority: UncheckedAccount<'info>,
    #[account(
        seeds = [ACHIEVEMENT_REWARD_SEED, &achievement_id.to_le_bytes()],
        bump = achievement_reward.bump,
        constraint = achievement_reward.achievement_id == achievement_id,
    )]
    pub achievement_reward: Account<'info, AchievementReward>,
    #[account(
        init,
        payer = player,
        seeds = [
            ACHIEVEMENT_CLAIM_SEED,
            player.key().as_ref(),
            &achievement_id.to_le_bytes(),
        ],
        bump,
        space = UserAchievementClaim::DISCRIMINATOR.len()
            + UserAchievementClaim::INIT_SPACE,
    )]
    pub user_achievement_claim: Account<'info, UserAchievementClaim>,
    #[account(mut)]
    pub asset: Signer<'info>,
    /// CHECK: Address and owner constraints bind this account to the configured Core collection.
    #[account(
        mut,
        address = reward_config.reward_collection @ ChessErrors::InvalidRewardCollection,
        owner = MPL_CORE_ID,
    )]
    pub reward_collection: UncheckedAccount<'info>,
    /// CHECK: Address constraint verifies the Metaplex Core program.
    #[account(address = MPL_CORE_ID)]
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> ClaimAchievement<'info> {
    pub fn mint_asset(&mut self, bumps: ClaimAchievementBumps) -> Result<()> {
        require!(!self.reward_config.paused, ChessErrors::RewardsPaused);
        require!(
            self.achievement_reward.active,
            ChessErrors::AchievementInactive
        );
        require!(
            is_valid_achievement_bit(self.achievement_reward.required_bit),
            ChessErrors::InvalidAchievementBit
        );
        require!(
            self.player_profile.achievements & self.achievement_reward.required_bit != 0,
            ChessErrors::AchievementNotUnlocked
        );

        let signer_seeds: &[&[&[u8]]] =
            &[&[REWARDS_AUTHORITY_SEED, &[self.reward_config.authority_bump]]];

        CreateV2CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(Some(&self.reward_collection.to_account_info()))
            .owner(Some(&self.player.to_account_info()))
            .authority(Some(&self.reward_authority.to_account_info()))
            .payer(&self.player.to_account_info())
            .update_authority(None)
            .system_program(&self.system_program.to_account_info())
            .name(self.achievement_reward.name.clone())
            .uri(self.achievement_reward.uri.clone())
            .invoke_signed(signer_seeds)?;

        AddPluginV1CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .collection(Some(&self.reward_collection.to_account_info()))
            .authority(Some(&self.player.to_account_info()))
            .system_program(&self.system_program.to_account_info())
            .payer(&self.player.to_account_info())
            .plugin(Plugin::FreezeDelegate(FreezeDelegate { frozen: true }))
            .init_authority(PluginAuthority::UpdateAuthority)
            .invoke()?;

        self.user_achievement_claim.set_inner(UserAchievementClaim {
            player: self.player.key(),
            achievement_id: self.achievement_reward.achievement_id,
            asset: self.asset.key(),
            claimed_at: Clock::get()?.unix_timestamp,
            bump: bumps.user_achievement_claim,
        });
        self.player_profile.nft_count = self
            .player_profile
            .nft_count
            .checked_add(1)
            .ok_or(ChessErrors::MathsOverflow)?;

        Ok(())
    }
}
