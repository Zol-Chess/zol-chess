"use client";

import useSWR from "swr";
import { type Address, type Lamports } from "@solana/kit";
import { useCluster } from "../../components/cluster-context";
import { useSolanaClient } from "../solana-client-context";

export function useBalance(address?: Address) {
  const { cluster } = useCluster();
  const client = useSolanaClient();

  const { data, isLoading, error, mutate } = useSWR(
    address ? (["balance", cluster, address] as const) : null,
    async ([, , addr]) => {
      const { value } = await client.rpc.getBalance(addr).send();
      return value;
    },
    { refreshInterval: 60_000, revalidateOnFocus: true }
  );

  return {
    lamports: (data ?? null) as Lamports | null,
    isLoading,
    error,
    mutate,
  };
}
