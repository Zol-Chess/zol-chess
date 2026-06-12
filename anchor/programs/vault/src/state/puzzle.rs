use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct PuzzleAttempt {
    pub player: Pubkey,
    pub puzzle_id: u64,
    pub solved: bool,
    pub attempts: u8,
    pub time_taken: u32,
    pub score_awarded: u32,
}
