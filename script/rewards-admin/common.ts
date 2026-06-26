import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

import {
  createKeyPairSignerFromBytes,
  type Address,
  type Instruction,
  type TransactionSigner,
} from "@solana/kit";
import { createClient } from "@solana/kit-client-rpc";

export type RewardAdminConfig = {
  tokenMetadataUri: string;
  collection: {
    name: string;
    uri: string;
  };
  achievements: Array<{
    id: number;
    requiredBit: string;
    name: string;
    uri: string;
  }>;
};

export type AdminOptions = {
  command: "config" | "mint" | "collection" | "achievements" | "all";
  rpcUrl: string;
  wsUrl?: string;
  keypairPath: string;
  configPath: string;
  collectionKeypairPath: string;
  send: boolean;
};

function valueAfter(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

export function parseOptions(args = process.argv.slice(2)): AdminOptions {
  const command = args[0] as AdminOptions["command"] | undefined;
  if (
    !command ||
    !["config", "mint", "collection", "achievements", "all"].includes(command)
  ) {
    throw new Error(
      "Usage: rewards-admin <config|mint|collection|achievements|all> [--send] [--rpc URL] [--keypair PATH] [--config PATH]"
    );
  }

  const rpcUrl =
    valueAfter(args, "--rpc") ??
    process.env.SOLANA_RPC_URL ??
    // "http://127.0.0.1:8899";
    "https://api.devnet.solana.com";

  return {
    command,
    rpcUrl,
    wsUrl: valueAfter(args, "--ws") ?? process.env.SOLANA_WS_URL,
    keypairPath: path.resolve(
      valueAfter(args, "--keypair") ??
        process.env.SOLANA_KEYPAIR ??
        path.join(homedir(), ".config/solana/id.json")
    ),
    configPath: path.resolve(
      valueAfter(args, "--config") ??
        process.env.REWARDS_CONFIG_FILE ??
        "script/rewards-admin/config.json"
    ),
    collectionKeypairPath: path.resolve(
      valueAfter(args, "--collection-keypair") ??
        process.env.REWARD_COLLECTION_KEYPAIR ??
        ".local/reward-collection-keypair.json"
    ),
    send: args.includes("--send"),
  };
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export async function loadAdminSigner(keypairPath: string) {
  const bytes = Uint8Array.from(await readJson<number[]>(keypairPath));
  if (bytes.length !== 64) {
    throw new Error(`Expected a 64-byte Solana keypair at ${keypairPath}`);
  }

  return createKeyPairSignerFromBytes(bytes);
}

export function createAdminClient(
  options: AdminOptions,
  payer: TransactionSigner
) {
  return createClient({
    url: options.rpcUrl,
    payer,
    rpcSubscriptionsConfig: options.wsUrl ? { url: options.wsUrl } : undefined,
    skipPreflight: false,
  });
}

export async function accountExists(
  client: ReturnType<typeof createAdminClient>,
  address: Address
) {
  const response = await client.rpc
    .getAccountInfo(address, { encoding: "base64" })
    .send();
  return response.value !== null;
}

export async function submitInstruction({
  client,
  instruction,
  label,
  send,
}: {
  client: ReturnType<typeof createAdminClient>;
  instruction: Instruction;
  label: string;
  send: boolean;
}) {
  console.log(`\n${label}`);
  console.log(`  program: ${instruction.programAddress}`);
  console.log(`  accounts: ${instruction.accounts?.length ?? 0}`);

  if (!send) {
    console.log("  status: dry-run (pass --send to submit)");
    return;
  }

  console.log("  status: submitting with RPC preflight enabled");
  const result = await client.sendTransaction([instruction]);
  console.log(`  signature: ${result.context.signature}`);
}

export function validateConfig(config: RewardAdminConfig) {
  if (!config.tokenMetadataUri || config.tokenMetadataUri.length > 200) {
    throw new Error("tokenMetadataUri must contain 1-200 bytes");
  }
  if (!config.collection.name || config.collection.name.length > 64) {
    throw new Error("collection.name must contain 1-64 bytes");
  }
  if (!config.collection.uri || config.collection.uri.length > 200) {
    throw new Error("collection.uri must contain 1-200 bytes");
  }

  const ids = new Set<number>();
  for (const achievement of config.achievements) {
    const bit = BigInt(achievement.requiredBit);
    if (
      achievement.id < 0 ||
      achievement.id > 65_535 ||
      ids.has(achievement.id)
    ) {
      throw new Error(`Invalid or duplicate achievement id ${achievement.id}`);
    }
    if (bit === 0n || (bit & (bit - 1n)) !== 0n || bit > 1n << 63n) {
      throw new Error(
        `Achievement ${achievement.id} requiredBit must be one u64 bit`
      );
    }
    if (!achievement.name || achievement.name.length > 64) {
      throw new Error(`Achievement ${achievement.id} name must be 1-64 bytes`);
    }
    if (!achievement.uri || achievement.uri.length > 200) {
      throw new Error(`Achievement ${achievement.id} URI must be 1-200 bytes`);
    }
    ids.add(achievement.id);
  }
}
