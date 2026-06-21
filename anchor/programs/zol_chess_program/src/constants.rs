use anchor_lang::prelude::*;

pub const PUZZLE_PUBLIC_KEY: Pubkey = Pubkey::new_from_array([
    145, 205, 148, 7, 160, 199, 120, 98, 15, 20, 27, 186, 120, 158, 163, 58, 148, 85, 244, 68, 158,
    93, 26, 7, 115, 49, 47, 157, 37, 116, 136, 100,
]);

pub const INITIAL_PLAYER_RATING: u32 = 399;

// pub const PUZZLE_RECORD_LENGTH: u32 = 50;

pub const FIRST_WIN: u64 = 1 << 0; // 00000001 (1)

pub const FIVE_STREAK: u64 = 1 << 1; // 00000010 (2)

pub const TEN_PUZZLES: u64 = 1 << 2;

pub const HUNDRED_PUZZLES: u64 = 1 << 3;

pub const PLAYER_SEED: &[u8] = b"player_info";

pub const PUZZLE_HISTORY_SEED: &[u8] = b"puzzle_history";
pub const REWARDS_CONFIG_SEED: &[u8] = b"rewards_config";
pub const REWARDS_AUTHORITY_SEED: &[u8] = b"rewards_authority";
pub const REWARDS_MINT_SEED: &[u8] = b"rewards_mint";
pub const REWARDS_COLLECTION_SEED: &[u8] = b"rewards_collection";
pub const ACHIEVEMENT_REWARD_SEED: &[u8] = b"achievement_reward";
pub const ACHIEVEMENT_CLAIM_SEED: &[u8] = b"achievement_claim";

pub const INITIAL_REWARDS_ADMIN: Pubkey = pubkey!("FvjNP5Lh19KCumNWLQc87q61Bnp2KR7Q1Tqgohoq1QLh");
