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
    #[msg("Invalid update authority")]
    InvalidUpdateAuthority,
    #[msg("Reward mint has already been initialized")]
    RewardMintAlreadyInitialized,
    #[msg("Reward collection has already been initialized")]
    RewardCollectionAlreadyInitialized,
    #[msg("Metadata name too long")]
    MetadataNameTooLong,
    #[msg("Metadata uri too long")]
    MetadataUriTooLong,
    #[msg("Achievement required bit must contain exactly one bit")]
    InvalidAchievementBit,
    #[msg("Rewards are paused")]
    RewardsPaused,
    #[msg("No rewards are available to claim")]
    NoRewardsToClaim,
    #[msg("The reward mint does not match the configured mint")]
    InvalidRewardMint,
    #[msg("The reward collection does not match the configured collection")]
    InvalidRewardCollection,
    #[msg("The achievement reward is inactive")]
    AchievementInactive,
    #[msg("The player has not unlocked this achievement")]
    AchievementNotUnlocked,
}
