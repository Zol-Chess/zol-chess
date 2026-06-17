"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { createSolanaClient, type SolanaClient, type ClusterMoniker } from "./solana-client";
import { useCluster } from "../components/cluster-context";

const SolanaClientContext = createContext<SolanaClient | null>(null);

// Module-level cache so the WebSocket transport is created once per cluster,
// not once per render cycle (which would accumulate close listeners).
const clientCache = new Map<ClusterMoniker, SolanaClient>();

function getOrCreateClient(cluster: ClusterMoniker): SolanaClient {
  if (!clientCache.has(cluster)) {
    clientCache.set(cluster, createSolanaClient(cluster));
  }
  return clientCache.get(cluster)!;
}

export function SolanaClientProvider({ children }: { children: ReactNode }) {
  const { cluster } = useCluster();
  const client = useMemo(() => getOrCreateClient(cluster), [cluster]);

  return (
    <SolanaClientContext.Provider value={client}>
      {children}
    </SolanaClientContext.Provider>
  );
}

export function useSolanaClient() {
  const client = useContext(SolanaClientContext);
  if (!client)
    throw new Error("useSolanaClient must be used within SolanaClientProvider");
  return client;
}
