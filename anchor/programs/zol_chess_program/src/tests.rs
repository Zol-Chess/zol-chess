use crate::{
    calculate_mint_amount, is_valid_achievement_bit, FIRST_WIN, FIVE_STREAK, HUNDRED_PUZZLES,
    TEN_PUZZLES,
};

#[test]
fn converts_unclaimed_points_to_six_decimal_zol() {
    assert_eq!(calculate_mint_amount(25, 7).unwrap(), 18_000_000);
}

#[test]
fn rejects_empty_or_invalid_claim_balances() {
    assert!(calculate_mint_amount(10, 10).is_err());
    assert!(calculate_mint_amount(9, 10).is_err());
}

#[test]
fn accepts_single_achievement_bits() {
    for bit in [FIRST_WIN, FIVE_STREAK, TEN_PUZZLES, HUNDRED_PUZZLES] {
        assert!(is_valid_achievement_bit(bit));
    }
}

#[test]
fn rejects_zero_and_multi_bit_achievement_masks() {
    assert!(!is_valid_achievement_bit(0));
    assert!(!is_valid_achievement_bit(FIRST_WIN | FIVE_STREAK));
}
