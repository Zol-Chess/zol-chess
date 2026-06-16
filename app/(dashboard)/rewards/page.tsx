import { AchievementNodes } from "@/components/rewards/achievement-nodes";
import { ActivityStream } from "@/components/rewards/activity-stream";
import { BoostMultiplier } from "@/components/rewards/boost-multiplier";
import { RewardsTotalCard } from "@/components/rewards/rewards-total-card";
import { StreakCard } from "@/components/rewards/streak-card";

export default function RewardsPage() {
  return (
    <main className="ml-64 pt-24 px-8 pb-32 max-w-360 relative">
      <div className="scanline" />
      <div className="relative z-20">
        {/* Totals and streak render on the server. */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <RewardsTotalCard />
          <StreakCard />
        </section>

        {/* Achievement grid and activity stream stay server-rendered. */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 space-y-6">
            <AchievementNodes />
            <BoostMultiplier />
          </div>
          <ActivityStream />
        </section>
      </div>
    </main>
  );
}
