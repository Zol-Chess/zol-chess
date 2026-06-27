"use client";

import { useState, useRef, useEffect } from "react";
import { useCluster, CLUSTERS } from "./cluster-context";

const clusterDotColor = {
  mainnet: "#14f195",
  devnet: "#3b82f6",
  testnet: "#eab308",
  localnet: "#9ca3af",
};

export function ClusterSelect() {
  const { cluster, setCluster } = useCluster();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className="flex h-9 cursor-pointer items-center gap-2 border border-primary/50 bg-primary/5 px-3 font-mono text-[11px] font-bold uppercase tracking-normal text-primary transition-all hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(20,241,149,0.25)] sm:h-8 sm:px-4 sm:text-xs sm:tracking-widest"
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: clusterDotColor[cluster] }}
        />
        <span className="hidden xs:inline">{cluster}</span>
        <span className="material-symbols-outlined text-sm leading-none">
          expand_more
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 border border-primary/30 bg-chess-bg p-2 shadow-[0_0_20px_rgba(20,241,149,0.18)]">
          <div className="mb-2 border-b border-primary/20 px-2 pb-2 font-mono text-[10px] uppercase tracking-widest text-chess-muted">
            Select cluster
          </div>
          <div className="space-y-1">
            {CLUSTERS.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCluster(c);
                  setIsOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center justify-between border px-3 py-2 text-left font-mono text-xs font-bold uppercase tracking-widest transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary ${
                  c === cluster
                    ? "border-primary/50 bg-primary/10 text-primary"
                    : "border-transparent text-chess-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: clusterDotColor[c] }}
                  />
                  {c}
                </span>
                {c === cluster && (
                  <span className="material-symbols-outlined text-sm leading-none">
                    check
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
