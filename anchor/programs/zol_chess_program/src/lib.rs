use anchor_lang::prelude::*;

#[cfg(test)]
mod tests;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use errors::*;
pub use instructions::*;
pub use state::*;

declare_id!("4DbgpcAxF7u3Uf2T2obBLZXuHZCECnG3mEjrgxxqFr5K");

#[program]
pub mod zol_chess_program {
    use super::*;

    pub fn initialize_user(ctx: Context<InitialzeAccount>) -> Result<()> {
        ctx.accounts.init(ctx.bumps)
    }

    pub fn submit_puzzle(
        ctx: Context<SubmitPuzzle>,
        puzzle_id: String,
        puzzle_rating: u32,
        time_taken: u32,
        solved: bool,
        attempts: u8,
        solution_signature: [u8; 64],
    ) -> Result<()> {
        ctx.accounts.submit(
            ctx.bumps,
            puzzle_id,
            puzzle_rating,
            time_taken,
            solved,
            attempts,
            solution_signature,
        )
    }
}
