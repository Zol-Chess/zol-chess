import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  createKeyPairSignerFromBytes,
  type TransactionSigner,
} from "@solana/kit";
import { generateSigner } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import {
  getCreateAchievementRewardInstructionAsync,
  getInitializeRewardCollectionInstructionAsync,
  getInitializeRewardMintInstructionAsync,
  getInitializeRewardsInstructionAsync,
} from "../../app/generated/zol_chess_program/instructions";
import {
  findAchievementRewardPda,
  findRewardConfigPda,
  findRewardMintPda,
} from "../../app/generated/zol_chess_program/pdas";

import {
  accountExists,
  createAdminClient,
  loadAdminSigner,
  parseOptions,
  readJson,
  submitInstruction,
  validateConfig,
  type AdminOptions,
  type RewardAdminConfig,
} from "./common";

async function loadOrCreateCollectionSigner(
  options: AdminOptions
): Promise<TransactionSigner> {
  try {
    const bytes = Uint8Array.from(
      JSON.parse(
        await readFile(options.collectionKeypairPath, "utf8")
      ) as number[]
    );
    return await createKeyPairSignerFromBytes(bytes);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }

  const umi = createUmi(options.rpcUrl);
  const collection = generateSigner(umi);
  await mkdir(path.dirname(options.collectionKeypairPath), { recursive: true });
  await writeFile(
    options.collectionKeypairPath,
    `${JSON.stringify(Array.from(collection.secretKey))}\n`,
    { mode: 0o600 }
  );
  console.log(
    `Generated Umi collection signer ${collection.publicKey} at ${options.collectionKeypairPath}`
  );
  return createKeyPairSignerFromBytes(collection.secretKey);
}

async function initializeConfig(
  options: AdminOptions,
  admin: TransactionSigner,
  client: ReturnType<typeof createAdminClient>
) {
  const [rewardConfig] = await findRewardConfigPda();
  if (await accountExists(client, rewardConfig)) {
    console.log(`\nRewards config already exists: ${rewardConfig}`);
    return;
  }

  await submitInstruction({
    client,
    instruction: await getInitializeRewardsInstructionAsync({ admin }),
    label: `Initialize rewards config ${rewardConfig}`,
    send: options.send,
  });
}

async function initializeMint(
  options: AdminOptions,
  config: RewardAdminConfig,
  admin: TransactionSigner,
  client: ReturnType<typeof createAdminClient>
) {
  const [rewardMint] = await findRewardMintPda();
  if (await accountExists(client, rewardMint)) {
    console.log(`\nReward mint already exists: ${rewardMint}`);
    return;
  }

  await submitInstruction({
    client,
    instruction: await getInitializeRewardMintInstructionAsync({
      admin,
      uri: config.tokenMetadataUri,
    }),
    label: `Initialize Token-2022 reward mint ${rewardMint}`,
    send: options.send,
  });
}

async function initializeCollection(
  options: AdminOptions,
  config: RewardAdminConfig,
  admin: TransactionSigner,
  client: ReturnType<typeof createAdminClient>
) {
  const collection = await loadOrCreateCollectionSigner(options);
  if (await accountExists(client, collection.address)) {
    console.log(`\nReward collection already exists: ${collection.address}`);
    return;
  }

  await submitInstruction({
    client,
    instruction: await getInitializeRewardCollectionInstructionAsync({
      admin,
      rewardCollection: collection,
      name: config.collection.name,
      uri: config.collection.uri,
    }),
    label: `Initialize Metaplex Core collection ${collection.address}`,
    send: options.send,
  });
}

async function initializeAchievements(
  options: AdminOptions,
  config: RewardAdminConfig,
  admin: TransactionSigner,
  client: ReturnType<typeof createAdminClient>
) {
  for (const achievement of config.achievements) {
    const [achievementReward] = await findAchievementRewardPda({
      achievementId: achievement.id,
    });
    if (await accountExists(client, achievementReward)) {
      console.log(
        `\nAchievement ${achievement.id} already exists: ${achievementReward}`
      );
      continue;
    }

    await submitInstruction({
      client,
      instruction: await getCreateAchievementRewardInstructionAsync({
        admin,
        achievementId: achievement.id,
        requiredBit: BigInt(achievement.requiredBit),
        name: achievement.name,
        uri: achievement.uri,
      }),
      label: `Create achievement ${achievement.id}: ${achievement.name}`,
      send: options.send,
    });
  }
}

async function main() {
  const options = parseOptions();
  const config = await readJson<RewardAdminConfig>(options.configPath);
  validateConfig(config);

  const admin = await loadAdminSigner(options.keypairPath);
  const client = createAdminClient(options, admin);

  console.log("ZolChess rewards admin");
  console.log(`  command: ${options.command}`);
  console.log(`  RPC: ${options.rpcUrl}`);
  console.log(`  admin: ${admin.address}`);
  console.log(`  mode: ${options.send ? "SEND" : "DRY RUN"}`);

  if (options.command === "config" || options.command === "all") {
    await initializeConfig(options, admin, client);
  }
  if (options.command === "mint" || options.command === "all") {
    await initializeMint(options, config, admin, client);
  }
  if (options.command === "collection" || options.command === "all") {
    await initializeCollection(options, config, admin, client);
  }
  if (options.command === "achievements" || options.command === "all") {
    await initializeAchievements(options, config, admin, client);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
