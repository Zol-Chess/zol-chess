use anchor_lang::prelude::*;
use brine_ed25519::{hasher::Sha512, verify, Signature};

use crate::{
    ChessErrors, PlayerProfile, PuzzleHistory, FIRST_WIN, FIVE_STREAK, HUNDRED_PUZZLES,
    INITIAL_PLAYER_RATING, PLAYER_SEED, PUZZLE_HISTORY_SEED, PUZZLE_PUBLIC_KEY, TEN_PUZZLES,
};

#[derive(Accounts)]
pub struct SubmitPuzzle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [PUZZLE_HISTORY_SEED, authority.key().as_ref()],
        bump,
        space = PuzzleHistory::INIT_SPACE + PuzzleHistory::DISCRIMINATOR.len()
    )]
    pub puzzle_history: Account<'info, PuzzleHistory>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        bump,
        space = PlayerProfile::INIT_SPACE + PlayerProfile::DISCRIMINATOR.len()
    )]
    pub player_info: Account<'info, PlayerProfile>,
    pub system_program: Program<'info, System>,
}

impl<'info> SubmitPuzzle<'info> {
    pub fn submit(
        &mut self,
        bumps: SubmitPuzzleBumps,
        puzzle_id: String,
        puzzle_rating: u32,
        time_taken: u32,
        solved: bool,
        attempts: u8,
        solution_signature: [u8; 64],
    ) -> Result<()> {
        msg!("START");
        // Pass message as three slices — avoids format!/base58 (~1M CU cost in BPF).
        // Message layout: puzzle_id_utf8 | ':' | authority_pubkey_raw_32_bytes
        let signature = Signature::from(solution_signature);
        let pk = PUZZLE_PUBLIC_KEY.to_bytes();
        verify::<Sha512>(
            &pk,
            &signature,
            &[puzzle_id.as_bytes(), b":", self.authority.key().as_ref()],
        )
        .map_err(|_| ChessErrors::InvalidSignature)?;

        let history = &mut self.puzzle_history;
        let player_info = &mut self.player_info;

        let timestamp = Clock::get()?.unix_timestamp;

        if player_info.authority == Pubkey::default() {
            player_info.authority = self.authority.key();
            player_info.elo = INITIAL_PLAYER_RATING;
            player_info.highest_rating = INITIAL_PLAYER_RATING;
            player_info.last_active = timestamp;
            player_info.bump = bumps.player_info;
        }

        if history.player == Pubkey::default() {
            history.player = self.authority.key();
            history.bump = bumps.puzzle_history;
        }

        let pid: [u8; 5] = puzzle_id
            .as_bytes()
            .try_into()
            .map_err(|_| ChessErrors::InvalidPuzzleId)?;

        let index = history.recent_index as usize;

        let mut record: [u8; 19] = [0; 19];
        record[0..5].copy_from_slice(&pid);
        record[5..9].copy_from_slice(&time_taken.to_le_bytes());
        record[9] = attempts;
        record[10] = solved as u8;
        record[11..19].copy_from_slice(&timestamp.to_le_bytes());

        history.recent_records[index] = record;
        history.recent_index = ((index + 1) % 50) as u8;
        if history.count < 50 {
            history.count += 1;
        }

        history.last_puzzle_id = pid;
        history.puzzles_attempted += 1;
        player_info.last_active = timestamp;

        if solved {
            history.puzzles_solved += 1;
            history.current_streak += 1;
            player_info.games_won += 1;

            if history.current_streak > history.longest_streak {
                history.longest_streak = history.current_streak;
            }

            if player_info.games_won == 1 {
                player_info.achievements |= FIRST_WIN;
            }
            if history.current_streak == 5 {
                player_info.achievements |= FIVE_STREAK;
            }
            if player_info.games_won == 10 {
                player_info.achievements |= TEN_PUZZLES;
            }
            if player_info.games_won == 100 {
                player_info.achievements |= HUNDRED_PUZZLES;
            }

            if attempts == 1 {
                history.perfect_solve_streak += 1;
            } else {
                history.perfect_solve_streak = 0;
            }

            let player_elo = player_info.elo as i32;
            let puzzle_elo = puzzle_rating as i32;
            let raw_gain = 10i32 + (puzzle_elo - player_elo) / 40;
            let base_gain = raw_gain.max(2) as u32;

            let gain = match attempts {
                1 => base_gain,
                2 => (base_gain / 2).max(1),
                _ => 1,
            };

            player_info.elo = player_info.elo.saturating_add(gain);
            player_info.total_points = player_info.total_points.saturating_add(gain);

            if player_info.elo > player_info.highest_rating {
                player_info.highest_rating = player_info.elo;
            }
        } else {
            history.current_streak = 0;
            history.perfect_solve_streak = 0;

            let player_elo = player_info.elo as i32;
            let puzzle_elo = puzzle_rating as i32;
            let raw_loss = 10i32 + (player_elo - puzzle_elo) / 40;
            let loss = raw_loss.max(2) as u32;

            player_info.elo = player_info.elo.saturating_sub(loss);
        }

        Ok(())
    }
}
