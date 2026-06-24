"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type PropsWithChildren,
} from "react";
import type { Address, TransactionSigner } from "@solana/kit";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useWallet,
} from "@solana/wallet-adapter-react";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { WalletName } from "@solana/wallet-adapter-base";
import { clusterApiUrl, VersionedTransaction } from "@solana/web3.js";
import { useAuthStore } from "@/state/auth";
import { WALLET_STATUS } from "@/state/auth/auth.types";

import type { WalletSession } from "./types";
import { createWalletSigner } from "./signer";
import { useCluster } from "../../components/cluster-context";
import { showToast } from "../toast";
import WalletPicker, { AllowedWallet } from "@/components/wallet-picker";
import { sign } from "crypto";

export type WalletStatus = (typeof WALLET_STATUS)[keyof typeof WALLET_STATUS];

type WalletContextValue = {
  wallet: WalletSession | undefined;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  error: unknown;
  isReady: boolean;
};

const WalletContext = createContext<WalletContextValue | null>(null);

function WalletContextBridge({ children }: PropsWithChildren) {
  const { cluster } = useCluster();
  const chain = `solana:${cluster}`;

  const [error, setError] = useState<unknown>();
  const [showPicker, setShowPicker] = useState(false);
  // const []
  const isReady = typeof window !== "undefined";

  const {
    disconnect,
    connect: adapterConnect,
    select,
    publicKey,
    connected,
    connecting,
    wallet: adapterWallet,
    signTransaction: adapterSignTransaction,
  } = useWallet();

  const setWallet = useAuthStore((state) => state.setWalletSession);
  const session = useAuthStore((state) => state.walletSession);
  const wasConnected = useRef(false);
  const didMount = useRef(false);

  console.log(publicKey);

  // Sync session from the adapter whenever the connection state changes.
  useEffect(() => {
    if (connected && publicKey && adapterWallet) {
      wasConnected.current = true;
      const address = publicKey.toBase58() as Address;
      const newSession: WalletSession = {
        account: {
          address,
          publicKey: publicKey.toBytes(),
          label: adapterWallet.adapter.name,
        },
        connector: {
          id: adapterWallet.adapter.name,
          name: adapterWallet.adapter.name,
          icon: adapterWallet.adapter.icon,
        },
        disconnect: async () => {
          await disconnect();
        },
        signTransaction: adapterSignTransaction
          ? async (wireBytes: Uint8Array) => {
              const tx = VersionedTransaction.deserialize(wireBytes);
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const signed = await adapterSignTransaction(tx as any);
              return (signed as VersionedTransaction).serialize();
            }
          : undefined,
      };

      setWallet({
        walletAddress: address,
        walletSession: newSession,
        walletStatus: WALLET_STATUS.CONNECTED,
      });
    } else if (!connected && wasConnected.current) {
      wasConnected.current = false;

      setWallet({
        walletAddress: undefined,
        walletSession: undefined,
        walletStatus: WALLET_STATUS.DISCONNECTED,
      });
    }
  }, [
    connected,
    publicKey,
    adapterWallet,
    disconnect,
    setWallet,
    adapterSignTransaction,
  ]);

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    if (adapterWallet && !connected && !connecting) {
      adapterConnect()
        .then(() => setWallet({ walletStatus: WALLET_STATUS.CONNECTED }))
        .catch(() => setWallet({ walletStatus: WALLET_STATUS.DISCONNECTED }));
    }
  }, [adapterWallet?.adapter.name]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectWallet = useCallback(
    (name: AllowedWallet) => {
      setShowPicker(false);
      if (adapterWallet?.adapter.name === name) {
        // Same wallet already selected — the name-change effect won't fire.
        adapterConnect()
          .then(() => setWallet({ walletStatus: WALLET_STATUS.CONNECTED }))
          .catch(() => setWallet({ walletStatus: WALLET_STATUS.DISCONNECTED }));
      } else {
        select(name as WalletName);
      }
    },
    [select, adapterWallet, adapterConnect, setWallet]
  );

  const connectWallet = useCallback(async () => {
    setError(undefined);
    setWallet({ walletStatus: WALLET_STATUS.CONNECTING });
    setShowPicker(true);
  }, []);

  const disconnectWallet = useCallback(async () => {
    try {
      await disconnect();
    } catch {
      // ignore disconnect errors
    }
    setWallet({
      walletAddress: undefined,
      walletSession: undefined,
      walletStatus: WALLET_STATUS.DISCONNECTED,
    });
  }, [disconnect, setWallet]);

  const signer = useMemo(() => {
    if (!session?.signTransaction && !session?.sendTransaction)
      return undefined;
    return createWalletSigner(session, chain);
  }, [session, chain]);

  const value = useMemo<WalletContextValue>(
    () => ({
      connect: connectWallet,
      disconnect: disconnectWallet,
      wallet: session,
      signer,
      error,
      isReady,
    }),
    [connectWallet, disconnectWallet, session, signer, error, isReady]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
      {showPicker && (
        <WalletPicker
          onSelect={handleSelectWallet}
          onClose={() => {
            setShowPicker(false);
            setWallet({ walletStatus: WALLET_STATUS.DISCONNECTED });
          }}
        />
      )}
    </WalletContext.Provider>
  );
}

export function WalletProvider({ children }: PropsWithChildren) {
  const { cluster } = useCluster();

  const endpoint = useMemo(() => {
    if (cluster === "localnet") return "http://localhost:8899";
    return clusterApiUrl(cluster as any);
  }, [cluster]);

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider
        wallets={wallets}
        autoConnect={false}
        onError={(err) => {
          showToast(err.message);
          console.warn("[wallet-adapter]", err.message);
        }}
      >
        <WalletContextBridge>{children}</WalletContextBridge>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}

export function useWalletValues() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used within WalletProvider");
  return ctx;
}
