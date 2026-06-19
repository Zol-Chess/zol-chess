use anchor_lang::prelude::*;

#[error_code]
pub enum ChessErrors {
    #[msg("The signature is invalid")]
    InvalidSignature,
    #[msg("This puzzle id is invalid")]
    InvalidPuzzleId,
    #[msg("Unauthorized access")]
    UnauthorizedAccess,
    #[msg("Detected a mathematical overflow")]
    MathsOverflow,
}
