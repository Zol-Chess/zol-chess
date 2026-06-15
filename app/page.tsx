import { TopNav } from "@/components/dashboard/top-nav";
import { Sidebar } from "@/components/dashboard/sidebar";

import Ranking from "./components/dashboard/ranking";
import PlayerProfile from "./components/dashboard/player-profile";
import NeuralAchievements from "./components/dashboard/neural-achievements";
import DailyPuzzles from "./components/dashboard/daily-puzzles";
import StatContent from "./components/dashboard/stat-content";
import LiveActivity from "./components/dashboard/live-activity";

/* ── Static data ────────────────────────────────────────────────── */

const FOOTER_LINKS = [
  { label: "X Twitter", href: "#" },
  { label: "Discord Node", href: "#" },
  { label: "Manifesto Docs", href: "#" },
  { label: "Privacy Policy", href: "#" },
] as const;

export default function DashboardPage() {
  return (
    <div className="circuit-bg min-h-screen">
      <TopNav />
      <Sidebar />

      {/* Main content */}
      <main className="ml-64 pt-24 px-8 pb-32 max-w-360 relative">
        <div className="scanline" />

        {/* Page header */}
        <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6 relative z-20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-px w-8 bg-primary" />
              <p className="text-primary font-mono text-xs tracking-[0.3em] uppercase leading-short">
                Welcome to ZolChess
              </p>
            </div>
            <h1
              className="text-3xl text-foreground font-bold uppercase tracking-tight leading-short"
              style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
            >
              Player Dashboard
            </h1>
            <p className="font-mono text-xs text-chess-muted uppercase tracking-widest mt-1 leading-short">
              Complete Puzzles to Earn Rewards
            </p>
          </div>

          {/* ELO + rank */}
          <Ranking />
        </header>

        {/* Bento grid */}
        <div className="grid grid-cols-12 gap-6 relative z-20">
          {/* ── Left column (8 cols) ──────────────────────────── */}
          <div className="col-span-8 flex flex-col gap-6">
            {/* Dossier + achievements */}
            <div className="grid grid-cols-2 gap-6">
              {/* Tactical Dossier */}
              <PlayerProfile />
              {/* Neural Achievement Grid */}
              <NeuralAchievements />
            </div>

            {/* Stat cards */}
            <StatContent />
          </div>

          {/* ── Right column (4 cols) — Daily Tactics ─────────── */}
          <DailyPuzzles />
        </div>

        {/* ── Live Activity Feed ────────────────────────────────── */}
        <LiveActivity />
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer className="ml-64 border-t border-primary/20 bg-chess-bg/80 backdrop-blur-sm w-[calc(100%-256px)]">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 py-8 max-w-7xl mx-auto font-mono text-xs text-chess-muted tracking-widest">
          <div className="mb-4 md:mb-0">
            <span className="text-primary font-bold block mb-1 leading-short">
              ZolChess // PROTOCOL V1.0.0
            </span>
            <span className="leading-short">
              © 2024 SYSTEM GRID STRATEGY. [POWERED BY SOLANA]
            </span>
          </div>
          <div className="flex gap-8 uppercase">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="hover:text-primary transition-colors leading-short"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
