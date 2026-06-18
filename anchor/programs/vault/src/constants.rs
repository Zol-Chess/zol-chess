use anchor_lang::prelude::*;

pub const INITIAL_PLAYER_RATING: u32 = 399;

// pub const PUZZLE_RECORD_LENGTH: u32 = 50;

pub const FIRST_WIN: u64 = 1 << 0; // 00000001 (1)

pub const FIVE_STREAK: u64 = 1 << 1; // 00000010 (2)

pub const TEN_PUZZLES: u64 = 1 << 2;

pub const HUNDRED_PUZZLES: u64 = 1 << 3;

pub const PLAYER_SEED: &[u8] = b"player_info";

pub const PUZZLE_HISTORY: &[u8] = b"puzzle_history";
