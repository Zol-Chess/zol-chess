# Rewards Implementation Improvements

## Implemented Scope

The reward implementation keeps the instruction surface limited to:

- `initialize_rewards`
- `initialize_reward_mint`
- `initialize_reward_collection`
- `create_achievement_reward`
- `claim_tokens`
- `claim_achievement`

The Anchor IDL and Codama client were regenerated after these changes.

## Reward Configuration

`initialize_rewards` creates the singleton `[b"rewards_config"]` PDA and:

- Restricts first initialization to `INITIAL_REWARDS_ADMIN`.
- Stores the administrator.
- Initializes mint and collection addresses to `Pubkey::default()`.
- Stores config, reward-authority, and mint bumps.
- Keeps mint and collection setup in their dedicated instructions.

Later administrative instructions authorize against `RewardsConfig.admin`.

## Token-2022 Mint

`initialize_reward_mint` now:

- Creates a deterministic mint at `[b"rewards_mint"]`.
- Requires the concrete Token-2022 program.
- Uses six decimals and `RewardAuthority` as mint authority.
- Initializes a MetadataPointer targeting the mint.
- Funds the mint for variable-length metadata storage.
- Initializes TokenMetadata with name `ZolChess`, symbol `ZOL`, and the supplied URI.
- Rejects metadata URIs longer than 200 bytes.
- Prevents a second mint initialization.
- Stores the mint address and authority/mint bumps in `RewardsConfig`.

No freeze authority is configured.

## Metaplex Core Collection

`initialize_reward_collection` uses:

- The administrator as payer.
- A client-generated collection keypair as the collection signer.
- `RewardAuthority` as the collection update authority through `invoke_signed`.
- A maximum collection name length of 64 bytes.
- A maximum collection URI length of 200 bytes.

The collection address and reward-authority bump are persisted in `RewardsConfig`.
A second collection initialization is rejected.

## Dynamic Achievement Definitions

`create_achievement_reward` derives one PDA per dynamic achievement:

```text
[b"achievement_reward", achievement_id.to_le_bytes()]
```

It:

- Requires `RewardsConfig.admin`.
- Stores the ID, eligibility bit, name, URI, active status, and bump.
- Limits names to 64 bytes and URIs to 200 bytes.
- Requires `required_bit` to contain exactly one set bit.

The `u64` achievement mask supports at most 64 independent eligibility conditions.
Multiple achievement IDs may intentionally share one bit.

## Token Claims

`claim_tokens` now:

- Verifies the player signer and `PlayerProfile` PDA.
- Verifies the configured deterministic Token-2022 mint.
- Creates the player's Token-2022 ATA when absent.
- Calculates `total_points - claimed_points`.
- Mints one six-decimal ZOL per claimable point with checked arithmetic.
- Signs the CPI with `RewardAuthority`.
- Updates `claimed_points` only after successful minting.
- Rejects paused, empty, repeated, invalid-mint, and invalid-balance claims.

`claimed_points` was appended to `PlayerProfile` and initializes to zero for new
profiles.

## Achievement Claims

`claim_achievement` now:

- Verifies the player and `PlayerProfile` PDA.
- Loads the dynamic achievement definition by ID.
- Rejects inactive, invalid-bit, and locked achievements.
- Verifies the configured Metaplex Core collection.
- Creates a permanent
  `[b"achievement_claim", player, achievement_id.to_le_bytes()]` receipt.
- Creates the Core asset with a client-generated asset signer.
- Uses the definition's stored name and off-chain metadata URI.
- Signs collection authorization with `RewardAuthority`.
- Increments `PlayerProfile.nft_count` after successful asset creation.

The transaction is atomic, so failed Core creation does not persist the receipt or NFT
count update.

## Verification

Completed checks:

- `cargo fmt --all -- --check`
- `cargo test -p zol-chess --lib`: 5 passed
- `NO_DNA=1 anchor build`: passed
- `npm run codama:js`: passed
- `git diff --check`: passed

The generated TypeScript now defaults reward mint and claim instructions to the
Token-2022 program.

Repository-wide `tsc --noEmit` still fails on existing unrelated application issues,
including removed vault imports, wallet-context type mismatches, and the missing
`verifySolution` export.

## Remaining Risks

### Existing player accounts

Adding `claimed_points` changes the serialized `PlayerProfile` size. Existing deployed
profiles require migration or a local/devnet state reset before this program version
can deserialize them. No migration instruction was added because the requested
instruction surface was kept minimal.

### Metaplex Core dependency warning

The BPF build reports an MPL Core dependency stack frame exceeding 4096 bytes by 88
bytes. Anchor still exits successfully, but this warning must be resolved or validated
against the deployment toolchain before mainnet use.

### Integration testing

The current tests cover reward arithmetic and achievement-bit validation. Localnet
integration tests are still required for:

- Token-2022 metadata initialization.
- ATA creation and reward minting.
- Metaplex collection creation.
- Achievement asset and duplicate-receipt behavior.
