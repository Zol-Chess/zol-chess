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

declare_id!("8rma9vAqsVAz6pAWFCqnaGTktkzpVk1TWFQsgH3VEh6Y");

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

    pub fn initialize_rewards(ctx: Context<InitializeRewards>) -> Result<()> {
        ctx.accounts.init(ctx.bumps)
    }

    pub fn initialize_reward_mint(ctx: Context<InitializeRewardMint>, uri: String) -> Result<()> {
        ctx.accounts.init(uri, ctx.bumps)
    }

    pub fn initialize_reward_collection(
        ctx: Context<InitializeRewardCollection>,
        name: String,
        uri: String,
    ) -> Result<()> {
        ctx.accounts.init_collection(name, uri, ctx.bumps)
    }

    pub fn create_achievement_reward(
        ctx: Context<CreateAchievementReward>,
        achievement_id: u16,
        required_bit: u64,
        name: String,
        uri: String,
    ) -> Result<()> {
        ctx.accounts
            .create(achievement_id, required_bit, name, uri, ctx.bumps)
    }

    pub fn claim_tokens(ctx: Context<ClaimTokens>) -> Result<()> {
        ctx.accounts.claim()
    }

    pub fn claim_achievement(ctx: Context<ClaimAchievement>, achievement_id: u16) -> Result<()> {
        let _ = achievement_id;
        ctx.accounts.mint_asset(ctx.bumps)
    }
}
