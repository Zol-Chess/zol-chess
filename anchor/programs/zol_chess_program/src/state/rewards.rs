use anchor_lang::prelude::*;

pub fn is_valid_achievement_bit(required_bit: u64) -> bool {
    required_bit != 0 && required_bit.count_ones() == 1
}

#[account]
#[derive(InitSpace)]
pub struct RewardsConfig {
    pub admin: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_collection: Pubkey,
    pub paused: bool,
    pub bump: u8,
    pub authority_bump: u8,
    pub mint_bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct AchievementReward {
    pub achievement_id: u16,
    pub required_bit: u64,
    #[max_len(64)]
    pub name: String,
    #[max_len(200)]
    pub uri: String,
    pub active: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct UserAchievementClaim {
    pub player: Pubkey,
    pub achievement_id: u16,
    pub asset: Pubkey,
    pub claimed_at: i64,
    pub bump: u8,
}
