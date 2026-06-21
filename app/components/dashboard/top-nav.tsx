"use client";

import { useState, useEffect, memo } from "react";
import { toast } from "sonner";
import { lamports as sol } from "@solana/kit";

import { useWalletValues, WalletStatus } from "@/lib/wallet/context";
import { useSolanaClient } from "@/lib/solana-client-context";
import { useBalance } from "@/lib/hooks/use-balance";
import { usePlayerProfile } from "@/lib/hooks/use-player-profile";
import { useAuthStore } from "@/state/auth";

import { useCluster } from "../cluster-context";

const WalletConnectionState: Partial<Record<WalletStatus, string>> = {
  connected: "Wallet Connected",
  disconnected: "Connect Wallet",
  connecting: "Connecting Wallet",
  error: "Connection Failed",
};

const TpsDisplay = memo(function TpsDisplay() {
  const [tps, setTps] = useState(3532);
  useEffect(() => {
    const id = setInterval(() => {
      setTps((prev) => Math.max(0, prev + Math.floor(Math.random() * 200) - 100));
    }, 3000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="flex flex-col">
      <span className="font-mono text-xs text-chess-muted uppercase tracking-widest leading-short">
        Network TPS
      </span>
      <span className="font-mono text-primary leading-short text-sm font-bold">
        {tps.toLocaleString()}
      </span>
    </div>
  );
});

export function TopNav() {
  const [solEarned, setSolEarned] = useState(0); // eslint-disable-line @typescript-eslint/no-unused-vars

  const { wallet, connect, disconnect } = useWalletValues();
  const { cluster, getExplorerUrl } = useCluster();
  const client = useSolanaClient();
  const status = useAuthStore((state) => state.walletStatus);
  const user = useAuthStore((state) => state.user);
  usePlayerProfile();

  const address = wallet?.account.address;
  const balance = useBalance(address);
  const [copied, setCopied] = useState(false);

  // console.log(user);

  const handleCopy = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAirdrop = async () => {
    if (!address) return;
    try {
      toast.info("Requesting airdrop...");
      const sig = await client.airdrop(address, sol(1_000_000_000n));
      toast.success("Airdrop received!", {
        description: sig ? (
          <a
            href={getExplorerUrl(`/tx/${sig}`)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            View transaction
          </a>
        ) : undefined,
      });
    } catch (err) {
      console.error("Airdrop failed:", err);
      const msg = err instanceof Error ? err.message : String(err);
      const isRateLimited =
        msg.includes("429") || msg.includes("Internal JSON-RPC error");
      toast.error(
        isRateLimited
          ? "Devnet faucet rate-limited. Use the web faucet instead."
          : "Airdrop failed. Try again later.",
        isRateLimited
          ? {
              description: (
                <a
                  href="https://faucet.solana.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  Open faucet.solana.com
                </a>
              ),
            }
          : undefined
      );
    }
  };

  const handleWalletConnection = async () => {
    try {
      await connect();
    } catch (error) {}
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-chess-bg/90 backdrop-blur-md border-b border-primary/30">
      <div className="flex items-center justify-between px-8 h-16 max-w-7xl mx-auto">
        {/* Logo + stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary flex items-center justify-center rounded-sm">
              <span className="material-symbols-outlined text-chess-bg font-bold text-base">
                grid_view
              </span>
            </div>
            <span
              className="font-bold text-primary tracking-widest uppercase text-sm leading-short"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              ZOLCHESS
            </span>
          </div>

          <div className="h-6 w-px bg-primary/20 mx-2" />

          <div className="flex gap-6 items-center">
            <TpsDisplay />
          </div>
        </div>

        {/* Right: wallet + button */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:flex items-center gap-3 bg-chess-container px-4 py-2 border border-primary/30">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono text-primary text-sm leading-short">
              {user?.nft_count} REWARDS EARNED
            </span>
            <span className="font-mono text-chess-muted text-sm">|</span>
            <span className="font-mono text-foreground uppercase text-sm leading-short">
              Player #{user?.player_rating}
            </span>
          </div>
          <button
            className="bg-primary text-chess-bg px-6 py-2 font-bold hover:shadow-[0_0_15px_rgba(20,241,149,0.5)] cursor-pointer transition-all uppercase font-mono text-xs tracking-widest leading-short flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            onClick={
              status === "disconnected" || status === "error"
                ? handleWalletConnection
                : disconnect
            }
            disabled={status === "connecting"}
          >
            {status === "connecting" && (
              <span className="w-3 h-3 border-2 border-chess-bg border-t-transparent rounded-full animate-spin" />
            )}
            {(status && WalletConnectionState[status]) ?? "Connect Wallet"}
          </button>
        </div>
      </div>
    </header>
  );
}
