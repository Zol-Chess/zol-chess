# ZolChess On-Chain Rewards Plan

## Summary

Extend the existing Anchor program so players claim rewards from state accrued in
their on-chain accounts:

- `PlayerProfile.total_points` determines fungible token rewards.
- `PlayerProfile.achievements` determines achievement NFT eligibility.
- `PuzzleHistory` supplies activity and streak data for the rewards UI.
- Token and NFT claims require no backend call, settlement ticket, TTL, or claim nonce.

Before rewards are enabled, harden `submit_puzzle` so the points and achievement bits
entering `PlayerProfile` are authenticated and cannot be replayed. The current
signature covers only the puzzle ID and player while rating, solved state, attempts,
and time remain client-controlled.

## Current State

The program currently provides:

- `PlayerProfile` at `[b"player_info", player]`.
- `PuzzleHistory` at `[b"puzzle_history", player]`.
- Puzzle Elo and point calculations based on puzzle rating and attempts.
- Achievement bits for first win, five-win streak, ten wins, and one hundred wins.
- A backend signature over `puzzle_id + player`.

The current implementation does not yet provide:

- Authentication of every input used to calculate points.
- Replay protection when submitting the same signed puzzle.
- A Token-2022 reward mint or token claim instruction.
- Metaplex Core collection, assets, or duplicate-claim receipts.
- Live rewards-page data or functional claim actions.

## Point Accrual Boundary

Rewards are calculated only from `PlayerProfile`, but point accrual must be secured
before those points become redeemable.

### Signed puzzle result

The backend issues a signature only after validating the completed puzzle. The signed
binary message contains:

```text
domain:          fixed bytes "ZOL_CHESS_PUZZLE_V1"
program_id:      Pubkey
player:          Pubkey
puzzle_id:       [u8; 5]
puzzle_rating:   u32 little-endian
time_taken:      u32 little-endian
solved:          u8
attempts:        u8
reward_nonce:    u64 little-endian
```

This is an authenticated puzzle result, not a reward-claim ticket. It has no TTL and
is never used by `claim_tokens` or `claim_achievement`.

`submit_puzzle` must:

1. Verify the backend signature over the complete message.
2. Require the signed program ID to equal the executing program.
3. Require the signed player to equal the transaction signer and profile authority.
4. Require the signed nonce to equal `PlayerProfile.reward_nonce`.
5. Validate puzzle ID length and bounded time and attempts.
6. Calculate Elo, points, streaks, and achievements from the signed values.
7. Increment `reward_nonce` after a successful update.

The client submits total attempts as `incorrectCount + 1`; a first-try solve is
`attempts = 1`. The backend must reject duplicate completion for the same player and
puzzle before signing a new nonce.

## Accounts and Ownership

| Account | Seeds or address | Owner | Purpose |
| --- | --- | --- | --- |
| `RewardsConfig` | `[b"rewards_config"]` | ZolChess program | Stores admin transfer state, reward mint, NFT collection, pause state, and bump |
| `PlayerProfile` | `[b"player_info", player]` | ZolChess program | Source of total points, claimed points, achievements, nonce, and NFT count |
| `PuzzleHistory` | `[b"puzzle_history", player]` | ZolChess program | Existing puzzle history, counters, and streak data |
| `AchievementReward` | `[b"achievement_reward", achievement_id_le]` | ZolChess program | Defines an achievement bit and NFT metadata |
| `UserAchievementClaim` | `[b"achievement_claim", player, achievement_id_le]` | ZolChess program | Permanent duplicate-claim receipt |
| `RewardAuthority` | `[b"reward_authority"]` | No allocated account | PDA signer controlling the mint and Core collection |
| Reward mint | `[b"reward_mint"]` | Token-2022 program | Six-decimal ZOL mint with metadata extensions |
| Player reward ATA | Standard Token-2022 ATA | Token-2022 program | Holds claimed ZOL |
| NFT collection | `[b"reward_collection"]` | Metaplex Core program | ZolChess achievement collection |
| Achievement asset | `[b"achievement_asset", player, achievement_id_le]` | Metaplex Core program | Deterministic achievement NFT |

Players sign claim transactions and pay fees and player-specific rent. Administrative
initialization pays for global reward accounts. `RewardAuthority` is only a signing
PDA and requires no allocated account.

## Account Structures

### RewardsConfig

```rust
#[account]
pub struct RewardsConfig {
    pub admin: Pubkey,
    pub pending_admin: Pubkey,
    pub reward_mint: Pubkey,
    pub reward_collection: Pubkey,
    pub paused: bool,
    pub bump: u8,
}
```

`initialize_rewards` requires a signer equal to a compile-time `INITIAL_REWARDS_ADMIN`
constant so configuration initialization cannot be claimed by an arbitrary wallet.
It initializes pending admin, mint, and collection fields to `Pubkey::default()`.

Mint and collection initialization require the corresponding config field to remain
default, create the expected PDA, and then store its address. All later administrative
instructions require `RewardsConfig.admin`. Admin transfer uses a two-step
`propose_rewards_admin` and `accept_rewards_admin` flow: proposal writes
`pending_admin`, acceptance requires that signer, moves it to `admin`, and clears
`pending_admin`.

The pause flag blocks new token and NFT claims without affecting puzzle play or
previously minted assets.

### PlayerProfile

Preserve every existing field in its current order and append reward fields:

```rust
#[account]
pub struct PlayerProfile {
    pub authority: Pubkey,
    pub elo: u32,
    pub highest_rating: u32,
    pub total_points: u32,
    pub nft_count: u16,
    pub reward_nonce: u64,
    pub games_won: u32,
    pub achievements: u64,
    pub last_active: i64,
    pub bump: u8,
    pub version: u8,
    pub claimed_points: u32,
}
```

The current account size is 83 bytes including the discriminator. Version 1 is 88
bytes. `reward_nonce` protects puzzle-result accrual only; claims do not read or modify
it. Do not add a separate per-player reward ledger.

New profiles initialize with:

```text
version = 1
total_points = 0
claimed_points = 0
reward_nonce = 0
```

### AchievementReward

```rust
#[account]
#[derive(InitSpace)]
pub struct AchievementReward {
    pub achievement_id: u16,
    pub required_bit: u64,
    #[max_len(64)]
    pub name: String,
    #[max_len(200)]
    pub uri: String,
    pub active: bool,
    pub bump: u8,
}
```

`required_bit` must contain exactly one supported achievement bit. Updates may change
name, URI, and active status but cannot change `achievement_id`, `required_bit`, seeds,
or account size.

Each supported achievement has one admin-created definition:

```text
achievement_id 1 -> FIRST_WIN
achievement_id 2 -> FIVE_STREAK
achievement_id 3 -> TEN_PUZZLES
achievement_id 4 -> HUNDRED_PUZZLES
```

The program derives the definition from:

```text
[b"achievement_reward", achievement_id.to_le_bytes()]
```

`name` and `uri` identify the Metaplex Core asset to mint. The URI points to off-chain
JSON metadata hosted on HTTPS, IPFS, or Arweave. The program never accepts a
client-selected name, URI, or eligibility bit during a claim.

### UserAchievementClaim

```rust
#[account]
pub struct UserAchievementClaim {
    pub player: Pubkey,
    pub achievement_id: u16,
    pub asset: Pubkey,
    pub claimed_at: i64,
    pub bump: u8,
}
```

The receipt is initialized only during a successful claim and remains the permanent
duplicate-claim marker if the NFT is transferred or burned.

## Reward Rules

### Token-2022 initialization

Initialize the reward mint at `[b"reward_mint"]` with:

- Six decimals.
- `RewardAuthority` as mint authority.
- No freeze authority.
- MetadataPointer extension targeting the mint itself.
- TokenMetadata extension with name `ZolChess`, symbol `ZOL`, and an admin-supplied URI
  limited to 200 bytes.
- `RewardAuthority` as metadata update authority.

Account size and rent must include all enabled Token-2022 extensions.

### Token claims

```text
1 puzzle point = 1 ZOL
claimable_points = total_points - claimed_points
mint_atomic_units = claimable_points * 1,000,000
```

`claim_tokens` must:

1. Verify the player signer, profile authority, and player PDA seeds.
2. Verify `RewardsConfig`, the configured mint, Token-2022 program, associated-token
   program, and the player's Token-2022 ATA.
3. Create the ATA when absent with the player as payer.
4. Reject paused and zero-value claims.
5. Use checked subtraction and checked `u64` multiplication.
6. Mint the complete claimable amount using `RewardAuthority`.
7. Set `claimed_points = total_points` only after the mint CPI succeeds.

The transaction is atomic, so a failed mint cannot consume points.

### Achievement claims

Supported bits remain:

```text
bit 0: first win
bit 1: five-puzzle streak
bit 2: ten puzzle wins
bit 3: one hundred puzzle wins
```

`claim_achievement` verifies:

```text
rewards are not paused
achievement PDA matches the supplied achievement_id
stored achievement_id matches the instruction argument
achievement is active
required_bit is one supported bit
player profile contains required_bit
claim receipt and deterministic asset do not exist
configured collection matches the supplied Core collection
```

The client supplies only `achievement_id` for selecting the reward definition. The
program loads the matching `AchievementReward` PDA and uses its stored `name` and
`uri` as the Core asset metadata.

The instruction derives:

```text
claim receipt = [b"achievement_claim", player, achievement_id_le]
Core asset    = [b"achievement_asset", player, achievement_id_le]
```

It creates the asset using `invoke_signed`, adds it to the configured collection,
creates `UserAchievementClaim`, and increments `PlayerProfile.nft_count` with checked
arithmetic. All operations are atomic.

## Anchor Instructions

### Administrative

- `initialize_rewards`
- `initialize_reward_mint`
- `initialize_reward_collection`
- `create_achievement_reward`
- `update_achievement_reward`
- `set_rewards_paused`
- `propose_rewards_admin`
- `accept_rewards_admin`

`initialize_reward_collection` creates the deterministic Core collection with
`RewardAuthority` as collection authority. Collection name and URI are instruction
arguments limited to 64 and 200 bytes.

`create_achievement_reward` accepts `achievement_id`, `required_bit`, `name`, `uri`,
and `active`, derives the definition PDA from the ID, validates the supported one-bit
mapping, and stores the definition. `update_achievement_reward` may change only
`name`, `uri`, and `active`; ID and required bit are immutable.

### Player

- Existing `initialize_user`, updated for profile version 1.
- `migrate_player_profile_v1`
- Existing `submit_puzzle`, updated to authenticate all result fields and consume the
  profile nonce.
- `claim_tokens`
- `claim_achievement`

Token and NFT claims remain separate transactions.

## Existing Account Migration

Do not change the existing `PlayerProfile` or `PuzzleHistory` seed formulas.

`migrate_player_profile_v1` handles the exact legacy size of 83 bytes:

1. Accept the profile as an `UncheckedAccount`.
2. Verify program ownership, discriminator, exact legacy length, and
   `[b"player_info", player]` PDA derivation.
3. Manually decode every legacy field and verify the stored authority against the
   player signer.
4. Transfer the additional rent from the player before reallocating to 88 bytes.
5. Preserve every legacy field and append `version = 1` and `claimed_points = 0`.

Existing `total_points` and achievement bits remain claimable after migration.
Migration rejects new-layout accounts, malformed data, invalid ownership, invalid PDA,
invalid authority, and insufficient rent without changing account data.

Do not reallocate `PuzzleHistory`.

## Client and Rewards Page

After changing accounts and instructions, rebuild the Anchor IDL and regenerate the
Codama client.

The profile hook must fetch encoded account data before decoding:

- An 83-byte account is legacy and exposes `requiresMigration = true`.
- An 88-byte account uses the version-1 decoder.
- Any other size, wrong owner, or wrong discriminator is treated as invalid.

The rewards page reads:

- `PlayerProfile` for total points, claimed points, claimable ZOL, achievement bits,
  nonce, and NFT count.
- `PuzzleHistory` for recent activity and streaks.
- The player's Token-2022 ATA for ZOL balance.
- `AchievementReward` accounts and deterministic claim PDAs for eligibility and claim
  status.
- Metaplex Core assets for claimed NFT details.

Replace mocked SOL values with total points, claimable ZOL, ZOL balance, streaks, and
achievement state. Do not display per-puzzle ZOL credits because the current 19-byte
history record does not store points awarded.

The client discovers achievement definitions by fetching all program-owned
`AchievementReward` accounts, validates their owner and discriminator, and sorts them
by `achievement_id`. For each definition it:

1. Reads display metadata from the stored name and off-chain URI.
2. Checks eligibility with
   `(player_profile.achievements & required_bit) != 0`.
3. Derives `UserAchievementClaim` to determine claimed status.
4. Sends only `achievement_id` when the player claims.

Legacy profiles must migrate before puzzle submission or claims. Simulate every
migration and claim transaction before requesting wallet approval, wait for confirmed
execution, and refresh all affected queries.

## Testing

### Anchor and LiteSVM

- Replace the stale vault tests with puzzle and rewards tests.
- Test signed-field alteration, wrong player/program/key, replayed nonce, duplicate
  completion, first-try normalization, and nonce increments.
- Test scoring for attempts one, two, and three or more, including ratings above and
  below player Elo.
- Test exact 83-to-88-byte migration, preserved fields, repeated migration, malformed
  data, invalid authority/PDA/owner, and insufficient rent.
- Test rewards initialization authorization, one-time mint/collection initialization,
  pause control, and two-step admin transfer.
- Test Token-2022 extensions, metadata, mint authority, exact claim amount, ATA
  creation, zero/repeated claims, overflow, wrong mint/program/ATA, and paused claims.
- Test Core collection authority, achievement eligibility, deterministic asset
  creation, duplicate claims, unsupported bits, wrong collection, and atomic receipts.
- Test achievement ID-to-PDA derivation, immutable ID/required-bit mapping, admin-only
  metadata updates, inactive definitions, URI/name bounds, and rejection of
  client-supplied metadata.

### API and client

- Test complete signed-message encoding against shared vectors.
- Test backend solution validation and duplicate player-puzzle rejection.
- Test total-attempt normalization and altered-result rejection.
- Test raw legacy detection, migration gating, simulation, wallet rejection,
  confirmation, and account refresh.
- Test achievement account discovery, ordering by ID, eligibility calculation, claim
  PDA lookup, off-chain metadata loading failure, and ID-only claim submission.
- Test removal of mocked SOL and per-puzzle reward values.

## Assumptions

- Existing points and achievement bits are grandfathered and claimable.
- One puzzle point equals one ZOL with six decimals.
- Point accrual is hardened before token or NFT claims are enabled.
- Claims are entirely on-chain; backend authorization applies only when points enter
  `PlayerProfile`.
- Token supply is inflationary and controlled by `RewardAuthority`.
- Achievement NFTs use Metaplex Core.
- Mainnet remains out of scope until localnet and devnet tests pass.
