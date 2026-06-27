import { RewardsDashboard } from "@/components/rewards/rewards-dashboard";

export default function RewardsPage() {
  return (
    <main className="relative px-4 pb-16 pt-28 sm:px-6 lg:ml-64 lg:px-8 lg:pb-32 lg:pt-24 max-w-360">
      <div className="scanline" />
      <div className="relative z-20">
        <RewardsDashboard />
      </div>
    </main>
  );
}
