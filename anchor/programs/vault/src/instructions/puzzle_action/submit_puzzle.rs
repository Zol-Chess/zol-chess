use anchor_lang::prelude::*;

use crate::{
    ChessErrors, PlayerProfile, PuzzleHistory, FIRST_WIN, FIVE_STREAK, HUNDRED_PUZZLES,
    PLAYER_SEED, PUZZLE_HISTORY, TEN_PUZZLES,
};

#[derive(Accounts)]
pub struct SubmitPuzzle<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init_if_needed,
        payer = authority,
        seeds = [PUZZLE_HISTORY, authority.key().as_ref()],
        bump,
        space = PuzzleHistory::INIT_SPACE + PuzzleHistory::DISCRIMINATOR.len()
    )]
    pub puzzle_history: Account<'info, PuzzleHistory>,
    #[account(
        mut,
        seeds = [PLAYER_SEED, authority.key().as_ref()],
        has_one = authority,
        bump = player_info.bump
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
    ) -> Result<()> {
        let history = &mut self.puzzle_history;
        let player_info = &mut self.player_info;

        let timestamp = Clock::get()?.unix_timestamp;

        if history.player == Pubkey::default() {
            history.player = player_info.authority;
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

            // Each achievement is independent; |= preserves existing flags
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

            // Rating loss on fail: mirror of solve — failing easy puzzles costs more
            let player_elo = player_info.elo as i32;
            let puzzle_elo = puzzle_rating as i32;
            let raw_loss = 10i32 + (player_elo - puzzle_elo) / 40;
            let loss = raw_loss.max(2) as u32;

            player_info.elo = player_info.elo.saturating_sub(loss);
        }

        Ok(())
    }
}
