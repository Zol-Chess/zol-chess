import { RewardsDashboard } from "@/components/rewards/rewards-dashboard";

export default function RewardsPage() {
  return (
    <main className="ml-64 pt-24 px-8 pb-32 max-w-360 relative">
      <div className="scanline" />
      <div className="relative z-20">
        <RewardsDashboard />
      </div>
    </main>
  );
}
