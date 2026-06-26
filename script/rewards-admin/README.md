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

## Upload achievement images to Irys

The achievement uploader sends local PNG/JPEG/WebP files to Irys and writes the
resulting URLs to a JSON file:

```bash
pnpm rewards:upload-images \
  --rpc https://api.devnet.solana.com \
  --keypair ~/.config/solana/id.json
```

Defaults:

```text
images:   public/achievements/images
config:   script/rewards-admin/config.json
out:      script/rewards-admin/achievement-irys-uris.json
Irys:     https://devnet.irys.xyz/
```

When the image filenames match achievement slugs, for example
`first-victory.png`, the script also uploads metadata JSON files and writes
`achievementInstructionUris` that can be copied into achievement reward config
URIs. Use `--images-only` to skip metadata upload.

By default the uploader also writes and uploads:

- `zol-token.json` for the reward mint metadata URI.
- `zol-achievements.json` for the Metaplex Core collection metadata URI.

It reuses the generated achievement art as fallback images. Pass explicit images
when you want separate artwork:

```bash
pnpm rewards:upload-images \
  --rpc https://api.devnet.solana.com \
  --keypair ~/.config/solana/id.json \
  --collection-image public/achievements/images/puzzle-centurion.png \
  --token-image public/achievements/images/first-victory.png \
  --update-config
```

With `--update-config`, the script writes the uploaded token, collection, and
achievement metadata URIs back into `script/rewards-admin/config.json`.
Use `--achievements-only` to skip token and collection metadata upload.

If the images have generic filenames, the script still uploads them and writes
their image URLs. Rename them to match the achievement slugs, or pass
`--allow-order-fallback` to map sorted image files to the achievement config
order.
