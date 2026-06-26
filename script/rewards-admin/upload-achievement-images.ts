import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

import { readJson, type RewardAdminConfig } from "./common";

type UploadOptions = {
  rpcUrl: string;
  irysAddress: string;
  keypairPath: string;
  imagesDir: string;
  collectionImagePath?: string;
  tokenImagePath?: string;
  configPath: string;
  outPath: string;
  metadataDir: string;
  uploadMetadata: boolean;
  uploadRewardMetadata: boolean;
  updateConfig: boolean;
  allowOrderFallback: boolean;
};

type UploadedImage = {
  fileName: string;
  slug: string;
  path: string;
  uri: string;
};

type UploadedAchievement = {
  id: number;
  requiredBit: string;
  name: string;
  imageFileName: string;
  imageUri: string;
  metadataPath?: string;
  metadataUri?: string;
};

type UploadedRewardMetadata = {
  name: string;
  imageFileName?: string;
  imageUri?: string;
  metadataPath: string;
  metadataUri: string;
};

const IMAGE_CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

function valueAfter(args: string[], flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function parseOptions(args = process.argv.slice(2)): UploadOptions {
  const collectionImagePath = valueAfter(args, "--collection-image");
  const tokenImagePath = valueAfter(args, "--token-image");

  return {
    rpcUrl:
      valueAfter(args, "--rpc") ??
      process.env.SOLANA_RPC_URL ??
      "https://api.devnet.solana.com",
    irysAddress:
      valueAfter(args, "--irys") ??
      process.env.IRYS_ADDRESS ??
      "https://devnet.irys.xyz/",
    keypairPath: path.resolve(
      valueAfter(args, "--keypair") ??
        process.env.SOLANA_KEYPAIR ??
        path.join(homedir(), ".config/solana/id.json")
    ),
    imagesDir: path.resolve(
      valueAfter(args, "--images-dir") ?? "public/achievements/images"
    ),
    collectionImagePath: collectionImagePath
      ? path.resolve(collectionImagePath)
      : undefined,
    tokenImagePath: tokenImagePath ? path.resolve(tokenImagePath) : undefined,
    configPath: path.resolve(
      valueAfter(args, "--config") ??
        process.env.REWARDS_CONFIG_FILE ??
        "script/rewards-admin/config.json"
    ),
    outPath: path.resolve(
      valueAfter(args, "--out") ??
        "script/rewards-admin/achievement-irys-uris.json"
    ),
    metadataDir: path.resolve(
      valueAfter(args, "--metadata-dir") ??
        "script/rewards-admin/generated-metadata"
    ),
    uploadMetadata: !args.includes("--images-only"),
    uploadRewardMetadata:
      !args.includes("--images-only") && !args.includes("--achievements-only"),
    updateConfig: args.includes("--update-config"),
    allowOrderFallback: args.includes("--allow-order-fallback"),
  };
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function listImagePaths(imagesDir: string) {
  const entries = await readdir(imagesDir, { withFileTypes: true });
  return entries
    .filter((entry) => {
      const extension = path.extname(entry.name).toLowerCase();
      return entry.isFile() && extension in IMAGE_CONTENT_TYPES;
    })
    .map((entry) => path.join(imagesDir, entry.name))
    .sort((a, b) => path.basename(a).localeCompare(path.basename(b)));
}

function selectImagePaths({
  allImagePaths,
  config,
  allowOrderFallback,
}: {
  allImagePaths: string[];
  config?: RewardAdminConfig;
  allowOrderFallback: boolean;
}) {
  if (!config) return allImagePaths;

  const bySlug = new Map(
    allImagePaths.map((imagePath) => [
      slugify(path.basename(imagePath, path.extname(imagePath))),
      imagePath,
    ])
  );
  const selected = config.achievements
    .map((achievement) => bySlug.get(slugify(achievement.name)))
    .filter((imagePath): imagePath is string => Boolean(imagePath));

  if (selected.length === config.achievements.length) {
    return selected;
  }

  if (
    allowOrderFallback &&
    allImagePaths.length === config.achievements.length
  ) {
    return allImagePaths;
  }

  return allImagePaths;
}

async function createUploader(options: UploadOptions) {
  const secretKey = Uint8Array.from(
    await readJson<number[]>(options.keypairPath)
  );
  if (secretKey.length !== 64) {
    throw new Error(
      `Expected a 64-byte Solana keypair at ${options.keypairPath}`
    );
  }

  const umi = createUmi(options.rpcUrl);
  const keypair = umi.eddsa.createKeypairFromSecretKey(secretKey);
  const signer = createSignerFromKeypair(umi, keypair);

  umi.use(irysUploader({ address: options.irysAddress }));
  umi.use(signerIdentity(signer));

  return { umi, signer };
}

async function uploadImages(
  umi: Awaited<ReturnType<typeof createUploader>>["umi"],
  imagePaths: string[]
): Promise<UploadedImage[]> {
  const files = await Promise.all(
    imagePaths.map(async (imagePath) => {
      const extension = path.extname(imagePath).toLowerCase();
      const fileName = path.basename(imagePath);
      const bytes = await readFile(imagePath);

      return createGenericFile(bytes, fileName, {
        contentType: IMAGE_CONTENT_TYPES[extension],
      });
    })
  );

  const uris = await umi.uploader.upload(files);
  return imagePaths.map((imagePath, index) => ({
    fileName: path.basename(imagePath),
    slug: slugify(path.basename(imagePath, path.extname(imagePath))),
    path: path.relative(process.cwd(), imagePath),
    uri: uris[index],
  }));
}

function chooseImageBySlug(images: UploadedImage[], preferredSlugs: string[]) {
  for (const slug of preferredSlugs) {
    const image = images.find((item) => item.slug === slug);
    if (image) return image;
  }

  return images[0];
}

function findUploadedImageByPath(images: UploadedImage[], imagePath?: string) {
  if (!imagePath) return undefined;

  const absoluteImagePath = path.resolve(imagePath);
  return images.find((image) => path.resolve(image.path) === absoluteImagePath);
}

async function uploadExtraImageIfNeeded({
  umi,
  images,
  imagePath,
}: {
  umi: Awaited<ReturnType<typeof createUploader>>["umi"];
  images: UploadedImage[];
  imagePath?: string;
}) {
  if (!imagePath) return undefined;

  const existing = findUploadedImageByPath(images, imagePath);
  if (existing) return existing;

  const [uploaded] = await uploadImages(umi, [imagePath]);
  return uploaded;
}

function matchAchievementsToImages({
  config,
  images,
  allowOrderFallback,
}: {
  config?: RewardAdminConfig;
  images: UploadedImage[];
  allowOrderFallback: boolean;
}): UploadedAchievement[] {
  if (!config) return [];

  const bySlug = new Map(images.map((image) => [image.slug, image]));
  const exactMatches: UploadedAchievement[] = [];
  const missing = [];

  for (const achievement of config.achievements) {
    const image = bySlug.get(slugify(achievement.name));
    if (!image) {
      missing.push(achievement.name);
      continue;
    }

    exactMatches.push({
      id: achievement.id,
      requiredBit: achievement.requiredBit,
      name: achievement.name,
      imageFileName: image.fileName,
      imageUri: image.uri,
    });
  }

  if (missing.length === 0) return exactMatches;

  if (!allowOrderFallback) {
    console.warn(
      [
        "Could not map every achievement by filename slug.",
        `Missing slugged image files for: ${missing.join(", ")}`,
        "Use filenames like first-victory.png, five-win-streak.png, ten-puzzles.png, puzzle-centurion.png.",
        "Or rerun with --allow-order-fallback to map sorted image files to config order.",
      ].join("\n")
    );
    return exactMatches;
  }

  if (images.length !== config.achievements.length) {
    throw new Error(
      `Order fallback requires ${config.achievements.length} images, found ${images.length}`
    );
  }

  console.warn(
    "Using order fallback: sorted image files are being mapped to achievement config order."
  );

  return config.achievements.map((achievement, index) => ({
    id: achievement.id,
    requiredBit: achievement.requiredBit,
    name: achievement.name,
    imageFileName: images[index].fileName,
    imageUri: images[index].uri,
  }));
}

async function uploadAchievementMetadata({
  umi,
  metadataDir,
  achievements,
}: {
  umi: Awaited<ReturnType<typeof createUploader>>["umi"];
  metadataDir: string;
  achievements: UploadedAchievement[];
}) {
  await mkdir(metadataDir, { recursive: true });

  const metadataFiles = await Promise.all(
    achievements.map(async (achievement) => {
      const slug = slugify(achievement.name);
      const metadataPath = path.join(metadataDir, `${slug}.json`);
      const metadata = {
        name: achievement.name,
        description: `ZolChess achievement reward: ${achievement.name}`,
        image: achievement.imageUri,
        attributes: [
          { trait_type: "Achievement ID", value: achievement.id },
          { trait_type: "Required Bit", value: achievement.requiredBit },
        ],
      };

      await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);

      return createGenericFile(
        Buffer.from(JSON.stringify(metadata)),
        `${slug}.json`,
        { contentType: "application/json" }
      );
    })
  );

  const metadataUris = await umi.uploader.upload(metadataFiles);
  return achievements.map((achievement, index) => ({
    ...achievement,
    metadataPath: path.relative(
      process.cwd(),
      path.join(metadataDir, `${slugify(achievement.name)}.json`)
    ),
    metadataUri: metadataUris[index],
  }));
}

async function uploadJsonMetadata({
  umi,
  metadataDir,
  fileName,
  metadata,
}: {
  umi: Awaited<ReturnType<typeof createUploader>>["umi"];
  metadataDir: string;
  fileName: string;
  metadata: Record<string, unknown>;
}) {
  await mkdir(metadataDir, { recursive: true });

  const metadataPath = path.join(metadataDir, fileName);
  const metadataJson = JSON.stringify(metadata, null, 2);
  await writeFile(metadataPath, `${metadataJson}\n`);

  const [metadataUri] = await umi.uploader.upload([
    createGenericFile(Buffer.from(metadataJson), fileName, {
      contentType: "application/json",
    }),
  ]);

  return {
    metadataPath: path.relative(process.cwd(), metadataPath),
    metadataUri,
  };
}

async function uploadRewardMetadata({
  umi,
  metadataDir,
  config,
  images,
  collectionImagePath,
  tokenImagePath,
}: {
  umi: Awaited<ReturnType<typeof createUploader>>["umi"];
  metadataDir: string;
  config?: RewardAdminConfig;
  images: UploadedImage[];
  collectionImagePath?: string;
  tokenImagePath?: string;
}) {
  if (!config) return {};

  const collectionImage =
    (await uploadExtraImageIfNeeded({
      umi,
      images,
      imagePath: collectionImagePath,
    })) ?? chooseImageBySlug(images, ["puzzle-centurion", "first-victory"]);

  const tokenImage =
    (await uploadExtraImageIfNeeded({
      umi,
      images,
      imagePath: tokenImagePath,
    })) ?? chooseImageBySlug(images, ["first-victory", "puzzle-centurion"]);

  const collectionMetadata = await uploadJsonMetadata({
    umi,
    metadataDir,
    fileName: "zol-achievements.json",
    metadata: {
      name: config.collection.name,
      description: "ZolChess achievement reward collection",
      image: collectionImage?.uri,
      attributes: [{ trait_type: "Collection", value: "Achievements" }],
    },
  });

  const tokenMetadata = await uploadJsonMetadata({
    umi,
    metadataDir,
    fileName: "zol-token.json",
    metadata: {
      name: "ZolChess Reward Token",
      symbol: "ZOL",
      description: "ZolChess puzzle reward token",
      image: tokenImage?.uri,
    },
  });

  return {
    collection: {
      name: config.collection.name,
      imageFileName: collectionImage?.fileName,
      imageUri: collectionImage?.uri,
      ...collectionMetadata,
    } satisfies UploadedRewardMetadata,
    token: {
      name: "ZolChess Reward Token",
      imageFileName: tokenImage?.fileName,
      imageUri: tokenImage?.uri,
      ...tokenMetadata,
    } satisfies UploadedRewardMetadata,
  };
}

async function updateConfigUris({
  configPath,
  config,
  collection,
  token,
  achievements,
}: {
  configPath: string;
  config?: RewardAdminConfig;
  collection?: UploadedRewardMetadata;
  token?: UploadedRewardMetadata;
  achievements: UploadedAchievement[];
}) {
  if (!config) return;

  const achievementUris = new Map(
    achievements.map((achievement) => [
      achievement.id,
      achievement.metadataUri ?? achievement.imageUri,
    ])
  );
  const updatedConfig: RewardAdminConfig = {
    ...config,
    tokenMetadataUri: token?.metadataUri ?? config.tokenMetadataUri,
    collection: {
      ...config.collection,
      uri: collection?.metadataUri ?? config.collection.uri,
    },
    achievements: config.achievements.map((achievement) => ({
      ...achievement,
      uri: achievementUris.get(achievement.id) ?? achievement.uri,
    })),
  };

  await writeFile(configPath, `${JSON.stringify(updatedConfig, null, 2)}\n`);
}

async function main() {
  const options = parseOptions();
  const config = existsSync(options.configPath)
    ? await readJson<RewardAdminConfig>(options.configPath)
    : undefined;
  const allImagePaths = await listImagePaths(options.imagesDir);
  const imagePaths = selectImagePaths({
    allImagePaths,
    config,
    allowOrderFallback: options.allowOrderFallback,
  });

  if (imagePaths.length === 0) {
    throw new Error(`No PNG/JPEG/WebP images found in ${options.imagesDir}`);
  }

  const { umi, signer } = await createUploader(options);

  console.log("ZolChess achievement image uploader");
  console.log(`  RPC: ${options.rpcUrl}`);
  console.log(`  Irys: ${options.irysAddress}`);
  console.log(`  signer: ${signer.publicKey}`);
  console.log(`  images: ${options.imagesDir}`);
  console.log(`  output: ${options.outPath}`);

  const images = await uploadImages(umi, imagePaths);
  let achievements = matchAchievementsToImages({
    config,
    images,
    allowOrderFallback: options.allowOrderFallback,
  });

  if (options.uploadMetadata && achievements.length > 0) {
    achievements = await uploadAchievementMetadata({
      umi,
      metadataDir: options.metadataDir,
      achievements,
    });
  }

  const rewardMetadata = options.uploadRewardMetadata
    ? await uploadRewardMetadata({
        umi,
        metadataDir: options.metadataDir,
        config,
        images,
        collectionImagePath: options.collectionImagePath,
        tokenImagePath: options.tokenImagePath,
      })
    : {};

  if (options.updateConfig) {
    await updateConfigUris({
      configPath: options.configPath,
      config,
      collection: rewardMetadata.collection,
      token: rewardMetadata.token,
      achievements,
    });
  }

  const output = {
    generatedAt: new Date().toISOString(),
    clusterRpc: options.rpcUrl,
    irysAddress: options.irysAddress,
    tokenMetadataUri: rewardMetadata.token?.metadataUri,
    collectionMetadataUri: rewardMetadata.collection?.metadataUri,
    token: rewardMetadata.token,
    collection: rewardMetadata.collection,
    images,
    achievements,
    achievementInstructionUris: achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      uri: achievement.metadataUri ?? achievement.imageUri,
    })),
  };

  await mkdir(path.dirname(options.outPath), { recursive: true });
  await writeFile(options.outPath, `${JSON.stringify(output, null, 2)}\n`);

  for (const image of images) {
    console.log(`  image: ${image.fileName} -> ${image.uri}`);
  }
  for (const achievement of achievements) {
    console.log(
      `  achievement ${achievement.id}: ${achievement.name} -> ${
        achievement.metadataUri ?? achievement.imageUri
      }`
    );
  }
  if (rewardMetadata.collection) {
    console.log(
      `  collection metadata: ${rewardMetadata.collection.metadataUri}`
    );
  }
  if (rewardMetadata.token) {
    console.log(`  token metadata: ${rewardMetadata.token.metadataUri}`);
  }
  if (options.updateConfig) {
    console.log(`  updated config: ${options.configPath}`);
  }

  console.log(`\nWrote ${options.outPath}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
