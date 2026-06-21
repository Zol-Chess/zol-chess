use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub authority: Pubkey,
    pub elo: u32,
    pub highest_rating: u32,
    pub total_points: u32,
    pub nft_count: u16,
    pub reward_nonce: u64,
    pub games_won: u32,
    #[max_len(10)]
    pub achievements: u64,
    pub last_active: i64,
    pub bump: u8,
    pub claimed_points: u32,
}
