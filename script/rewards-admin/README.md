# Rewards Admin CLI

The CLI initializes the ZolChess reward accounts through the generated Solana Kit
client. Umi generates the Metaplex Core collection signer, which is persisted locally
and converted to a Kit transaction signer for the Anchor instruction.

Commands are dry-run by default. Add `--send` to submit transactions with RPC
preflight enabled.

## Setup

Copy and edit the metadata configuration:

```bash
cp script/rewards-admin/config.example.json script/rewards-admin/config.json
```

The default admin keypair is:

```text
~/.config/solana/id.json
```

For `initialize_rewards`, the on-chain instruction validates the signer against the
program's compile-time `INITIAL_REWARDS_ADMIN`. Later commands validate it against
`RewardsConfig.admin`; the CLI does not duplicate either authority.

## Commands

Preview every initialization:

```bash
pnpm rewards:init
```

Submit every missing initialization in order:

```bash
pnpm rewards:init --send
```

Run individual stages:

```bash
pnpm rewards:admin config --send
pnpm rewards:admin mint --send
pnpm rewards:admin collection --send
pnpm rewards:admin achievements --send
```

Use a different cluster, keypair, or configuration:

```bash
pnpm rewards:init --send \
  --rpc https://api.devnet.solana.com \
  --ws wss://api.devnet.solana.com \
  --keypair ~/.config/solana/id.json \
  --config script/rewards-admin/config.json
```

The collection signer is stored at `.local/reward-collection-keypair.json` by
default. Back it up after initialization. Override its location with:

```bash
--collection-keypair /secure/path/reward-collection.json
```

Each command checks whether its target account already exists and skips it when
initialized.
