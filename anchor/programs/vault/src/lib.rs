use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

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

declare_id!("5ZAQpJNP5wEgxiHGHT1SumsfpxJ1VTJhp6YFnPckXZRR");

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
    ) -> Result<()> {
        ctx.accounts.submit(
            ctx.bumps,
            puzzle_id,
            puzzle_rating,
            time_taken,
            solved,
            attempts,
        )
    }

    pub fn deposit(ctx: Context<VaultAction>, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.vault.lamports() == 0,
            VaultError::VaultAlreadyExists
        );

        let rent = Rent::get()?.minimum_balance(0);
        require!(amount > rent, VaultError::InvalidAmount);

        transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.signer.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn withdraw(ctx: Context<VaultAction>) -> Result<()> {
        require!(ctx.accounts.vault.lamports() > 0, VaultError::InvalidAmount);

        let bump = ctx.bumps.vault;
        let signer_key = ctx.accounts.signer.key();
        let signer_seeds: &[&[&[u8]]] = &[&[b"vault", signer_key.as_ref(), &[bump]]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.vault.to_account_info(),
                    to: ctx.accounts.signer.to_account_info(),
                },
                signer_seeds,
            ),
            ctx.accounts.vault.lamports(),
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct VaultAction<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", signer.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum VaultError {
    #[msg("Vault already exists")]
    VaultAlreadyExists,
    #[msg("Invalid amount")]
    InvalidAmount,
}
