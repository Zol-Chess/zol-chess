"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";
import { PropsWithChildren } from "react";
import { ClusterProvider } from "./cluster-context";
import { WalletProvider } from "../lib/wallet/context";
import { SolanaClientProvider } from "../lib/solana-client-context";

// next-themes injects a <script> for FOUC prevention; React 19 warns about
// script tags in client components. This is harmless — the script runs
// server-side before hydration. Suppress until next-themes ships a fix.
if (typeof window !== "undefined") {
  const _consoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("script tag")) return;
    _consoleError(...args);
  };
}

export function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark">
      <ClusterProvider>
        <SolanaClientProvider>
          <WalletProvider>{children}</WalletProvider>
        </SolanaClientProvider>
        <Toaster position="bottom-right" richColors />
      </ClusterProvider>
    </ThemeProvider>
  );
}
