"use client";

import { AchievementNodes } from "./achievement-nodes";
import { ActivityStream } from "./activity-stream";
import { BoostMultiplier } from "./boost-multiplier";
import { RewardsTotalCard } from "./rewards-total-card";
import { StreakCard } from "./streak-card";
import { useRewards } from "@/lib/hooks/use-rewards";

export function RewardsDashboard() {
  const rewards = useRewards();

  if (!rewards.connected) {
    return (
      <div className="glass-panel p-10 border-primary/30 font-mono text-sm text-chess-muted uppercase">
        Connect your wallet to load on-chain rewards.
      </div>
    );
  }

  if (rewards.isLoading) {
    return (
      <div className="glass-panel p-10 border-primary/30 font-mono text-sm text-primary uppercase animate-pulse">
        Loading on-chain reward state...
      </div>
    );
  }

  if (rewards.error) {
    return (
      <div className="glass-panel p-10 border-destructive/30 font-mono text-sm text-destructive uppercase">
        Unable to load on-chain rewards.
      </div>
    );
  }

  return (
    <>
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 mb-8 lg:mb-12">
        <RewardsTotalCard
          totalPoints={rewards.profile?.totalPoints ?? 0}
          claimedPoints={rewards.profile?.claimedPoints ?? 0}
          tokenBalance={rewards.tokenBalance ?? 0}
          claimablePoints={rewards.claimablePoints}
          paused={rewards.config?.paused ?? false}
          initialized={rewards.tokenInitialized ?? false}
          isClaiming={rewards.isSending}
          onClaim={rewards.claimTokens}
        />
        <StreakCard
          currentStreak={rewards.historySummary?.currentStreak ?? 0}
          longestStreak={rewards.historySummary?.longestStreak ?? 0}
          solved={rewards.historySummary?.solved ?? 0}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-4 space-y-4 lg:space-y-6">
          <AchievementNodes
            achievements={rewards.achievements ?? []}
            isClaiming={rewards.isSending}
            onClaim={rewards.claimAchievement}
          />
          <BoostMultiplier nftCount={rewards.profile?.nftCount ?? 0} />
        </div>
        <ActivityStream entries={rewards.history ?? []} />
      </section>
    </>
  );
}
