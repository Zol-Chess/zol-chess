#[cfg(test)]
mod tests {

    use crate::state::{PlayerProfile, PuzzleHistory};
    use crate::ID as PROGRAM_ID;

    use anchor_lang::{system_program::ID as SYSTEM_PROGRAM_ID, AccountDeserialize};
    use litesvm::LiteSVM;
    use solana_sdk::{
        instruction::{AccountMeta, Instruction},
        pubkey::Pubkey,
        signature::Keypair,
        signer::Signer,
        transaction::Transaction,
    };

    use crate::constants::{
        FIRST_WIN, FIVE_STREAK, HUNDRED_PUZZLES, INITIAL_PLAYER_RATING, PLAYER_SEED,
        PUZZLE_HISTORY_SEED, TEN_PUZZLES,
    };

    const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
    const DUMMY_SIG: [u8; 64] = [0u8; 64];

    fn discriminator(name: &str) -> [u8; 8] {
        use solana_sdk::hash::hashv;
        let hash = hashv(&[format!("global:{name}").as_bytes()]);
        hash.to_bytes()[..8].try_into().unwrap()
    }

    fn player_info_pda(user: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(&[PLAYER_SEED, user.as_ref()], &PROGRAM_ID).0
    }

    fn puzzle_history_pda(user: &Pubkey) -> Pubkey {
        Pubkey::find_program_address(&[PUZZLE_HISTORY_SEED, user.as_ref()], &PROGRAM_ID).0
    }

    fn initialize_user_ix(user: &Pubkey) -> Instruction {
        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*user, true),
                AccountMeta::new(player_info_pda(user), false),
                AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
            ],
            data: discriminator("initialize_user").to_vec(),
        }
    }

    fn submit_puzzle_ix(
        authority: &Pubkey,
        puzzle_id: &str,
        puzzle_rating: u32,
        time_taken: u32,
        solved: bool,
        attempts: u8,
        solution_signature: [u8; 64],
    ) -> Instruction {
        let mut data = discriminator("submit_puzzle").to_vec();
        // Borsh: String = u32 len + utf8 bytes
        let id_bytes = puzzle_id.as_bytes();
        data.extend_from_slice(&(id_bytes.len() as u32).to_le_bytes());
        data.extend_from_slice(id_bytes);
        data.extend_from_slice(&puzzle_rating.to_le_bytes());
        data.extend_from_slice(&time_taken.to_le_bytes());
        data.push(solved as u8);
        data.push(attempts);
        data.extend_from_slice(&solution_signature);

        Instruction {
            program_id: PROGRAM_ID,
            accounts: vec![
                AccountMeta::new(*authority, true),
                AccountMeta::new(puzzle_history_pda(authority), false),
                AccountMeta::new(player_info_pda(authority), false),
                AccountMeta::new_readonly(SYSTEM_PROGRAM_ID, false),
            ],
            data,
        }
    }

    fn setup_svm() -> LiteSVM {
        let mut svm = LiteSVM::new();
        let program_bytes = include_bytes!("../../../target/deploy/zol_chess.so");
        svm.add_program(PROGRAM_ID, program_bytes);
        svm
    }

    fn new_funded_user(svm: &mut LiteSVM) -> Keypair {
        let kp = Keypair::new();
        svm.airdrop(&kp.pubkey(), 10 * LAMPORTS_PER_SOL).unwrap();
        kp
    }

    fn send_ok(svm: &mut LiteSVM, ix: Instruction, signer: &Keypair) {
        let bh = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(&[ix], Some(&signer.pubkey()), &[signer], bh);
        svm.send_transaction(tx)
            .expect("transaction should succeed");
    }

    fn send_err(svm: &mut LiteSVM, ix: Instruction, signer: &Keypair) {
        let bh = svm.latest_blockhash();
        let tx = Transaction::new_signed_with_payer(&[ix], Some(&signer.pubkey()), &[signer], bh);
        assert!(
            svm.send_transaction(tx).is_err(),
            "transaction should have failed"
        );
    }

    fn get_profile(svm: &LiteSVM, user: &Pubkey) -> PlayerProfile {
        let data = svm
            .get_account(&player_info_pda(user))
            .expect("PlayerProfile account not found")
            .data;
        PlayerProfile::try_deserialize(&mut data.as_slice())
            .expect("failed to deserialize PlayerProfile")
    }

    fn get_history(svm: &LiteSVM, user: &Pubkey) -> PuzzleHistory {
        let data = svm
            .get_account(&puzzle_history_pda(user))
            .expect("PuzzleHistory account not found")
            .data;
        PuzzleHistory::try_deserialize(&mut data.as_slice())
            .expect("failed to deserialize PuzzleHistory")
    }

    #[test]
    fn test_initialize_user_creates_profile() {
        let mut svm = setup_svm();
        let user = new_funded_user(&mut svm);

        send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

        let profile = get_profile(&svm, &user.pubkey());
        assert_eq!(profile.authority, user.pubkey());
        assert_eq!(profile.elo, INITIAL_PLAYER_RATING);
        assert_eq!(profile.highest_rating, INITIAL_PLAYER_RATING);
        assert_eq!(profile.total_points, 0);
        assert_eq!(profile.nft_count, 0);
        assert_eq!(profile.games_won, 0);
        assert_eq!(profile.achievements, 0);
    }

    #[test]
    fn test_initialize_user_twice_fails() {
        let mut svm = setup_svm();
        let user = new_funded_user(&mut svm);

        send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);
        // The `init` constraint rejects an already-initialized account
        send_err(&mut svm, initialize_user_ix(&user.pubkey()), &user);
    }

    #[cfg(feature = "testing")]
    mod submit_puzzle_tests {
        use super::*;

        fn submit(
            svm: &mut LiteSVM,
            user: &Keypair,
            puzzle_id: &str,
            puzzle_rating: u32,
            solved: bool,
            attempts: u8,
        ) {
            send_ok(
                svm,
                submit_puzzle_ix(
                    &user.pubkey(),
                    puzzle_id,
                    puzzle_rating,
                    30,
                    solved,
                    attempts,
                    DUMMY_SIG,
                ),
                user,
            );
        }

        fn submit_fail(
            svm: &mut LiteSVM,
            user: &Keypair,
            puzzle_id: &str,
            puzzle_rating: u32,
            solved: bool,
            attempts: u8,
        ) {
            send_err(
                svm,
                submit_puzzle_ix(
                    &user.pubkey(),
                    puzzle_id,
                    puzzle_rating,
                    30,
                    solved,
                    attempts,
                    DUMMY_SIG,
                ),
                user,
            );
        }

        #[test]
        fn test_solved_increases_elo() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            let before = get_profile(&svm, &user.pubkey());
            // puzzle 100 above player: raw_gain = 10 + 100/40 = 12, attempts=1 → gain=12
            submit(&mut svm, &user, "puz01", before.elo + 100, true, 1);

            let after = get_profile(&svm, &user.pubkey());
            assert_eq!(after.elo, before.elo + 12);
            assert_eq!(after.highest_rating, before.elo + 12);
            assert_eq!(after.games_won, 1);
            assert_eq!(after.total_points, 12);
        }

        #[test]
        fn test_solved_two_attempts_halves_gain() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            let before = get_profile(&svm, &user.pubkey());
            // raw_gain=12, attempts=2 → gain = max(12/2, 1) = 6
            submit(&mut svm, &user, "puz01", before.elo + 100, true, 2);

            let after = get_profile(&svm, &user.pubkey());
            assert_eq!(after.elo, before.elo + 6);
        }

        #[test]
        fn test_solved_three_plus_attempts_gains_one() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            let before = get_profile(&svm, &user.pubkey());
            submit(&mut svm, &user, "puz01", before.elo + 500, true, 3);

            let after = get_profile(&svm, &user.pubkey());
            assert_eq!(after.elo, before.elo + 1);
        }

        #[test]
        fn test_failed_decreases_elo() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            let before = get_profile(&svm, &user.pubkey());
            // same rating: raw_loss = 10 + 0 = 10
            submit(&mut svm, &user, "puz01", before.elo, false, 1);

            let after = get_profile(&svm, &user.pubkey());
            assert_eq!(after.elo, before.elo.saturating_sub(10));
            assert_eq!(after.games_won, 0);
        }

        #[test]
        fn test_elo_does_not_underflow() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            // puzzle_rating=0 → loss=10+(elo-0)/40 ≈ 19, so ~21 rounds reach 0.
            // 30 rounds guarantees saturation with none wrapping.
            for i in 0u8..30 {
                let id = format!("p{:04}", i);
                submit(&mut svm, &user, &id, 0, false, 1);
            }

            let profile = get_profile(&svm, &user.pubkey());
            assert_eq!(profile.elo, 0, "ELO should saturate at 0, not underflow");
        }

        #[test]
        fn test_first_win_achievement() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            submit(&mut svm, &user, "puz01", 400, true, 1);

            let profile = get_profile(&svm, &user.pubkey());
            assert_ne!(profile.achievements & FIRST_WIN, 0);
        }

        #[test]
        fn test_first_win_not_set_on_loss() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            submit(&mut svm, &user, "puz01", 400, false, 1);

            let profile = get_profile(&svm, &user.pubkey());
            assert_eq!(profile.achievements & FIRST_WIN, 0);
        }

        #[test]
        fn test_five_streak_achievement() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            for i in 0u8..5 {
                let id = format!("p{:04}", i);
                submit(&mut svm, &user, &id, 400, true, 1);
            }

            let profile = get_profile(&svm, &user.pubkey());
            assert_ne!(profile.achievements & FIVE_STREAK, 0);
        }

        #[test]
        fn test_ten_puzzles_achievement() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            for i in 0u8..10 {
                let id = format!("p{:04}", i);
                submit(&mut svm, &user, &id, 400, true, 1);
            }

            let profile = get_profile(&svm, &user.pubkey());
            assert_ne!(profile.achievements & TEN_PUZZLES, 0);
        }

        #[test]
        fn test_hundred_puzzles_achievement() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            for i in 0u8..100 {
                let id = format!("p{:03}", i); // 5 bytes: 'p' + 3 digits
                let id = format!("{:05}", i);
                submit(&mut svm, &user, &id, 400, true, 1);
            }

            let profile = get_profile(&svm, &user.pubkey());
            assert_ne!(profile.achievements & HUNDRED_PUZZLES, 0);
        }

        // ── streaks ───────────────────────────────────────────────────────────

        #[test]
        fn test_streak_increments_on_win() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            submit(&mut svm, &user, "puz01", 400, true, 1);
            submit(&mut svm, &user, "puz02", 400, true, 1);
            submit(&mut svm, &user, "puz03", 400, true, 1);

            let history = get_history(&svm, &user.pubkey());
            assert_eq!(history.current_streak, 3);
            assert_eq!(history.longest_streak, 3);
        }

        #[test]
        fn test_streak_resets_on_loss() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            submit(&mut svm, &user, "puz01", 400, true, 1);
            submit(&mut svm, &user, "puz02", 400, true, 1);
            submit(&mut svm, &user, "puz03", 400, false, 1); // loss

            let history = get_history(&svm, &user.pubkey());
            assert_eq!(history.current_streak, 0);
            assert_eq!(history.longest_streak, 2);
        }

        #[test]
        fn test_longest_streak_preserved_after_reset() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            // Build streak of 4, lose, build streak of 2
            for i in 0u8..4 {
                let id = format!("p{:04}", i);
                submit(&mut svm, &user, &id, 400, true, 1);
            }
            submit(&mut svm, &user, "puz99", 400, false, 1);
            submit(&mut svm, &user, "puz98", 400, true, 1);
            submit(&mut svm, &user, "puz97", 400, true, 1);

            let history = get_history(&svm, &user.pubkey());
            assert_eq!(history.current_streak, 2);
            assert_eq!(history.longest_streak, 4);
        }

        #[test]
        fn test_puzzles_attempted_and_solved_counters() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            submit(&mut svm, &user, "puz01", 400, true, 1);
            submit(&mut svm, &user, "puz02", 400, false, 1);
            submit(&mut svm, &user, "puz03", 400, true, 1);

            let history = get_history(&svm, &user.pubkey());
            assert_eq!(history.puzzles_attempted, 3);
            assert_eq!(history.puzzles_solved, 2);
        }

        #[test]
        fn test_recent_record_bytes_written_correctly() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            let time_taken = 42u32;
            send_ok(
                &mut svm,
                submit_puzzle_ix(&user.pubkey(), "puz01", 400, time_taken, true, 1, DUMMY_SIG),
                &user,
            );

            let history = get_history(&svm, &user.pubkey());
            assert_eq!(history.count, 1);
            let record = &history.recent_records[0];
            // bytes [0..5] = puzzle_id
            assert_eq!(&record[0..5], b"puz01");
            // bytes [5..9] = time_taken (LE u32)
            let recorded_time = u32::from_le_bytes(record[5..9].try_into().unwrap());
            assert_eq!(recorded_time, time_taken);
            // byte [10] = solved
            assert_eq!(record[10], 1u8);
        }

        #[test]
        fn test_record_circular_buffer_wraps() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            // Fill all 50 slots, then write one more
            for i in 0u8..51 {
                let id = format!("{:05}", i);
                submit(&mut svm, &user, &id, 400, true, 1);
            }

            let history = get_history(&svm, &user.pubkey());
            assert_eq!(history.count, 50, "count should cap at 50");
            // The 51st write went to index 0, so recent_index should be 1
            assert_eq!(history.recent_index, 1);
            // Slot 0 should now hold puzzle "00050"
            assert_eq!(&history.recent_records[0][0..5], b"00050");
        }

        #[test]
        fn test_puzzle_id_not_five_bytes_fails() {
            let mut svm = setup_svm();
            let user = new_funded_user(&mut svm);
            send_ok(&mut svm, initialize_user_ix(&user.pubkey()), &user);

            // 6-char ID → try_into::<[u8;5]> fails → InvalidPuzzleId error
            submit_fail(&mut svm, &user, "toolng", 400, true, 1);
        }
    }
}
