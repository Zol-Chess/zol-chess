import Ranking from "@/components/dashboard/ranking";
import PlayerProfile from "@/components/dashboard/player-profile";
import NeuralAchievements from "@/components/dashboard/neural-achievements";
import DailyPuzzles from "@/components/dashboard/daily-puzzles";
import StatContent from "@/components/dashboard/stat-content";
import LiveActivity from "@/components/dashboard/live-activity";

export default function DashboardPage() {
  return (
    <main className="relative px-4 pb-16 pt-28 sm:px-6 lg:ml-64 lg:px-8 lg:pb-32 lg:pt-24 max-w-360">
      <div className="scanline" />

      <header className="mb-8 lg:mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative z-20">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-px w-8 bg-primary" />
            <p className="text-primary font-mono text-xs tracking-normal sm:tracking-[0.3em] uppercase leading-short">
              Welcome to ZolChess
            </p>
          </div>
          <h1
            className="text-2xl sm:text-3xl text-foreground font-bold uppercase tracking-tight leading-short"
            style={{ fontFamily: "var(--font-space-grotesk, sans-serif)" }}
          >
            Player Dashboard
          </h1>
          <p className="font-mono text-xs text-chess-muted uppercase tracking-widest mt-1 leading-short">
            Complete Puzzles to Earn Rewards
          </p>
        </div>

        <Ranking />
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 relative z-20">
        <div className="xl:col-span-8 flex flex-col gap-4 lg:gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <PlayerProfile />
            <NeuralAchievements />
          </div>

          <StatContent />
        </div>

        <DailyPuzzles />
      </div>

      {/* <LiveActivity /> */}
    </main>
  );
}
