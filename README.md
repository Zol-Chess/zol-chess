# ZolChess

A high-performance Web3 chess puzzle platform built on Solana and Next.js. Players solve tactical puzzles, earn ELO ratings tracked on-chain, collect NFT achievement rewards, and accumulate token points — all with a seamless, near-zero-friction wallet experience.

## Architecture

The system operates across three decoupled tiers:

```
[ Next.js Client Engine ]  <--->  [ Next.js API Authority ]  <--->  [ Solana Blockchain ]

     (IndexedDB Cache)                (Private Key Vault)             (Anchor Program)
```

**Client Engine** — Displays the puzzle UI, tracks board state via chess.js, and writes progress into the browser's persistent IndexedDB store before any wallet prompt appears.

**API Authority** — Stateless validation gatekeeper. Queries the puzzle repository, evaluates submitted move sequences, generates a structured payload, and stamps it with a backend Ed25519 signature.

**Ledger Settlement** — The Anchor program on Solana verifies the backend signature via the native Ed25519 SigVerify precompile, updates the player's on-chain profile, and triggers NFT minting for achievements.

### Offline-First Save Loop

```
[Puzzle Solved]
      │
      ▼
[Verify via API] ──> Returns backend-signed ticket
      │
      ▼
[IndexedDB Log] ──> Persists ticket & metadata locally
      │
      ▼
[Wallet Prompt] ──> User approves transaction?
      ├──> YES: Broadcast Tx ──> Clear IndexedDB entry
      └──> NO / Disconnect: Leave in IndexedDB ──> Re-sync on next login
```

If a user closes the tab, rejects the wallet prompt, or loses connectivity after solving a puzzle, the signed ticket is preserved in IndexedDB. On the next login the client detects pending entries and prompts the player to settle them before proceeding.

## Stack

| Layer          | Technology                                   |
| -------------- | -------------------------------------------- |
| Frontend       | Next.js, React, TypeScript                   |
| Styling        | Tailwind CSS v4                              |
| Solana Client  | `@solana/kit`, wallet-standard               |
| Program Client | Codama-generated, `@solana/kit`              |
| Program        | Anchor 0.31 (Rust), `mpl-core`, `anchor-spl` |
| Testing        | LiteSVM (in-process Solana VM)               |

## On-Chain Program

**Program ID:** `8rma9vAqsVAz6pAWFCqnaGTktkzpVk1TWFQsgH3VEh6Y`

### Instructions

| Instruction                    | Description                                                            |
| ------------------------------ | ---------------------------------------------------------------------- |
| `initialize_user`              | Creates a `PlayerProfile` PDA and `PuzzleHistory` PDA for a new wallet |
| `submit_puzzle`                | Validates the Ed25519 backend ticket, updates ELO and history          |
| `initialize_rewards`           | One-time setup for the rewards authority PDA                           |
| `initialize_reward_mint`       | Creates the SPL token mint used for point rewards                      |
| `initialize_reward_collection` | Creates the Metaplex Core collection for achievement NFTs              |
| `create_achievement_reward`    | Registers an achievement definition on-chain                           |
| `claim_tokens`                 | Transfers earned SPL token points to the player's wallet               |
| `claim_achievement`            | Mints a Metaplex Core NFT when an achievement milestone is reached     |

### Account State

**`PlayerProfile` PDA** — seeds: `["player", wallet]`

| Field            | Type   | Description                        |
| ---------------- | ------ | ---------------------------------- |
| `authority`      | Pubkey | Owning wallet                      |
| `elo`            | u32    | Current ELO rating (starts at 399) |
| `highest_rating` | u32    | All-time peak ELO                  |
| `total_points`   | u32    | Cumulative score points earned     |
| `claimed_points` | u32    | Points already redeemed for tokens |
| `games_won`      | u32    | Total puzzles solved               |
| `nft_count`      | u16    | Number of achievement NFTs held    |
| `achievements`   | u64    | Bitmask of unlocked achievements   |
| `last_active`    | i64    | Unix timestamp of last submission  |

**`PuzzleHistory` PDA** — seeds: `["puzzle-history", wallet]`

Stores a fixed circular buffer of the 50 most recent puzzle records (19 bytes each) plus running counters for streaks and totals.

| Field               | Type           | Description                            |
| ------------------- | -------------- | -------------------------------------- |
| `puzzles_solved`    | u32            | Lifetime solved count                  |
| `puzzles_attempted` | u32            | Lifetime attempt count                 |
| `current_streak`    | u16            | Current consecutive-solve streak       |
| `longest_streak`    | u16            | All-time best streak                   |
| `recent_records`    | [[u8; 19]; 50] | Circular buffer of the last 50 records |

Each 19-byte record encodes: `puzzle_id` (5 bytes), `time_taken` (u32 LE, seconds), `attempts` (u8), `solved` flag (u8), `timestamp` (i64 LE).

### Security Model

Signature replay is mitigated by a 24-hour TTL on each backend ticket and by binding the player's public key into the signed message buffer. The `realloc::payer = player` pattern ensures any account expansion rent is charged to the player's wallet, preventing artificial bloat attacks.

## Project Structure

```
├── app/
│   ├── (dashboard)/
│   │   └── page.tsx                     # Main dashboard page
│   ├── components/
│   │   ├── dashboard/                   # ELO, rankings, streak, profile panels
│   │   ├── puzzle/                      # Puzzle board and submission flow
│   │   └── rewards/                     # Achievement nodes, NFT rewards UI
│   ├── generated/
│   │   └── zol_chess_program/           # Codama-generated program client
│   ├── lib/
│   │   ├── wallet/                      # wallet-standard connection layer
│   │   ├── hooks/
│   │   │   ├── use-player-profile.ts    # On-chain profile sync + auto-init
│   │   │   ├── use-balance.ts           # SWR wallet balance
│   │   │   └── use-send-transaction.ts  # Transaction pipeline
│   │   ├── cluster.ts                   # RPC endpoint factory
│   │   ├── errors.ts                    # Human-readable error parsing
│   │   └── explorer.ts                  # Explorer URL helpers
│   └── state/
│       └── auth.ts                      # Zustand store for wallet + player state
├── anchor/
│   └── programs/zol_chess_program/
│       ├── src/
│       │   ├── instructions/            # initialize_user, submit_puzzle, rewards, …
│       │   ├── state/                   # PlayerProfile, PuzzleHistory, Rewards
│       │   ├── constants.rs             # ELO seeds, achievement bitmasks
│       │   ├── errors.rs                # Custom program errors
│       │   └── tests.rs                 # LiteSVM integration tests
│       └── Cargo.toml
└── codama.json                          # Codama client generation config
```

## Getting Started

```shell
npm install
npm run setup   # Builds the Anchor program and generates the TypeScript client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and connect your wallet. The app auto-initializes your player profile on first connect.

## Local Development

1. **Start a local validator**

   ```bash
   solana-test-validator
   ```

2. **Build and deploy the program**

   ```bash
   solana config set --url localhost
   cd anchor
   anchor build
   anchor deploy
   cd ..
   npm run codama:js   # Regenerate client if the IDL changed
   ```

3. **Switch to localnet** in the app using the cluster selector in the header.

## Testing

Tests run against [LiteSVM](https://github.com/LiteSVM/litesvm) — an in-process Solana VM with no validator required.

```bash
# Build first (tests load the compiled .so from target/deploy/)
anchor build -- --features testing

# Run all tests
cargo test -p zol-chess --features testing

# Run a specific test
cargo test -p zol-chess --features testing test_solved_increases_elo
```

The `testing` feature flag bypasses Ed25519 signature verification so tests can submit puzzles with dummy zero-byte signatures. Tests live in [anchor/programs/zol_chess_program/src/tests.rs](anchor/programs/zol_chess_program/src/tests.rs).

## Deploying

### Prerequisites

- [Rust](https://rustup.rs/)
- [Solana CLI](https://solana.com/docs/intro/installation)
- [Anchor](https://www.anchor-lang.com/docs/installation)

### Steps

1. Configure your target cluster:

   ```bash
   solana config set --url devnet   # or mainnet-beta
   ```

2. Fund your deploy wallet (devnet only):

   ```bash
   solana airdrop 2
   ```

3. Build and deploy:

   ```bash
   cd anchor
   anchor build
   anchor keys sync    # Updates program ID in source
   anchor build        # Rebuild with synced ID
   anchor deploy
   cd ..
   npm run setup       # Regenerate client with new program ID
   ```

## Regenerating the Client

After modifying the program IDL, regenerate the TypeScript client:

```bash
npm run setup   # Or: npm run anchor-build && npm run codama:js
```

This runs [Codama](https://github.com/codama-idl/codama) to produce type-safe instruction builders and account deserializers from the Anchor IDL.

## Screenshot

![Screenshot of the test passing](https://res.cloudinary.com/da8vqkdmt/image/upload/v1782075116/WhatsApp_Image_2026-06-21_at_21.49.44_dovevv.jpg)

## Learn More

- [Solana Docs](https://solana.com/docs)
- [Anchor Docs](https://www.anchor-lang.com/docs/introduction)
- [Metaplex Core](https://developers.metaplex.com/core)
- [@solana/kit](https://github.com/anza-xyz/kit)
- [Codama](https://github.com/codama-idl/codama)
- [LiteSVM](https://github.com/LiteSVM/litesvm)
