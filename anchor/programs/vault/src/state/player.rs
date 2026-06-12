use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct PlayerProfile {
    pub authority: Pubkey,
    pub elo: u32,
    pub total_points: u32,
    pub puzzles_solved: u32,
    pub games_won: u32,
    pub last_active: i64,
}
