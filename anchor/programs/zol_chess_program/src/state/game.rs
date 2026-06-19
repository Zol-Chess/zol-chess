use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct GameResult {
    pub white: Pubkey,
    pub black: Pubkey,
    pub winner: Option<Pubkey>,
    pub elo_change_white: i16,
    pub elo_change_black: i16,
}
