use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct PuzzleHistory {
    pub player: Pubkey,
    // pub time_taken: u32,
    pub recent_records: [[u8; 19]; 50],
    pub puzzles_solved: u32,
    pub puzzles_attempted: u32,
    pub current_streak: u16,
    pub longest_streak: u16,
    pub perfect_solve_streak: u16,
    pub last_puzzle_id: [u8; 5],
    pub history_root: [u8; 32],
    pub recent_index: u8,
    pub count: u8,
    pub bump: u8,
}
