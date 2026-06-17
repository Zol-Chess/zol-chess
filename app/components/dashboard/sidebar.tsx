"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuthStore } from "@/state/auth";
import { difficultyLabel } from "@/utils/resolvers";

const NAV_ITEMS = [
  { icon: "dashboard", label: "DASHBOARD", route: "/" },
  { icon: "extension", label: "PUZZLES", route: "/puzzles" },
  { icon: "workspace_premium", label: "REWARDS", route: "/rewards" },
  { icon: "leaderboard", label: "LEADERBOARD", route: "/leaderboard" },
  // { icon: "token", label: "NFT COLLECTION", route: "/nft_collection" },
] as const;

const PROFILE_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAaK5NsNyA8cPvbHFL-KkSEIH9Qpm4OaCx09AzzBKtgqupbojAeJl88_vewYpvd92YE7th9y_FjrX2Ek40hJolZRDEXkgFB4_NsIH_xcLOXgQhkrVXrHvB8FVkbBk8sxiJQM9CBh-gB8Hkg1ssDVBLwBQNzSBvTWwh6wRnYJ_dMJ_hprx01rN4t3WoJ66BMXdFPttwurgWw8fJT4PJiK2tWQfpQdgtbk5wRKs-ZdTIdV9Yd16ewebvcndMnNkwDVrkyeWL8d3u-oYU";

export function Sidebar() {
  const pathname = usePathname();

  const user = useAuthStore((state) => state.user);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-chess-container/50 border-r border-primary/20 flex flex-col py-6 backdrop-blur-sm z-40">
      {/* Profile */}
      <div className="px-6 mb-8 border-b border-primary/10 pb-6 shrink-0">
        <div className="relative w-16 h-16 mb-4 border border-primary/30 p-1">
          <img
            alt="Tactician Profile"
            className="w-full h-full grayscale hover:grayscale-0 transition-all object-cover"
            src={PROFILE_IMG}
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-chess-bg" />
        </div>
        <h3
          className="font-bold text-md text-primary uppercase leading-short mb-1"
          style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
        >
          PLAYER #{user?.player_rating}
        </h3>
        <p className="font-mono text-xs text-chess-muted uppercase tracking-widest flex items-center gap-1 leading-short">
          <span className="w-1 h-1 bg-primary rounded-full capitalize" />
          {difficultyLabel(user?.player_rating ?? 400)}
        </p>
      </div>

      {/* Navigation — flex-1 + min-h-0 lets overflow-y-auto actually scroll */}
      <nav className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.route}
              className={`flex items-center gap-4 px-6 py-4 font-mono text-xs uppercase tracking-wider leading-short transition-colors ${
                pathname === item.route
                  ? "bg-primary/10 text-primary border-r-4 border-primary"
                  : "text-chess-muted hover:text-primary hover:bg-primary/5"
              }`}
            >
              <span className="material-symbols-outlined text-xl">
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Inventory button */}
      <div className="px-6 mt-6 mb-4 shrink-0">
        <button className="w-full border border-primary/50 text-primary font-bold py-2 hover:bg-primary hover:text-chess-bg transition-all uppercase font-mono text-xs tracking-widest leading-short">
          Inventory
        </button>
      </div>

      {/* Footer links */}
      <footer className="border-t border-primary/10 pt-4 px-6 space-y-3 shrink-0">
        {[
          { icon: "settings", label: "Settings" },
          { icon: "help", label: "Support" },
        ].map((link) => (
          <Link
            key={link.label}
            href="#"
            className="flex items-center gap-4 text-chess-muted hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">
              {link.icon}
            </span>
            <span className="font-mono text-xs uppercase tracking-widest leading-short">
              {link.label}
            </span>
          </Link>
        ))}
      </footer>
    </aside>
  );
}
