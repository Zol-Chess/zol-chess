import { createEmptyClient } from "@solana/kit";
import { rpc, rpcAirdrop } from "@solana/kit-plugin-rpc";

export type ClusterMoniker = "localnet" | "devnet" | "testnet" | "mainnet";

export const CLUSTERS: ClusterMoniker[] = [
  "localnet",
  "devnet",
  "testnet",
  "mainnet",
];

const CLUSTER_URLS: Record<ClusterMoniker, string> = {
  localnet: "http://localhost:8899",
  devnet: "https://api.devnet.solana.com",
  testnet: "https://api.testnet.solana.com",
  mainnet: "https://api.mainnet-beta.solana.com",
};

const WS_URLS: Record<ClusterMoniker, string> = {
  localnet: "ws://localhost:8900",
  devnet: "wss://api.devnet.solana.com",
  testnet: "wss://api.testnet.solana.com",
  mainnet: "wss://api.mainnet-beta.solana.com",
};

export function getClusterUrl(cluster: ClusterMoniker) {
  return CLUSTER_URLS[cluster];
}

export function getClusterWsConfig(cluster: ClusterMoniker) {
  return cluster === "mainnet" ? undefined : { url: WS_URLS[cluster] };
}

export function createSolanaClient(cluster: ClusterMoniker) {
  const url = CLUSTER_URLS[cluster];
  const wsUrl = WS_URLS[cluster];
  return createEmptyClient()
    .use(rpc(url, { url: wsUrl }))
    .use(rpcAirdrop());
}

export type SolanaClient = ReturnType<typeof createSolanaClient>;
