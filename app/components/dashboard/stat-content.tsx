"use client";

import { useAuthStore } from "@/state/auth";

import { StatCard } from "./stat-card";

function StatContent() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
      <StatCard
        icon="timer"
        badge="+12.4% EFFICIENCY"
        label="Avg Solve Time"
        value={
          user?.average_solve_time ? `${user?.average_solve_time} SECS` : "0"
        }
      />
      <StatCard
        icon="verified"
        badge="ELITE STATUS"
        label="Solve Rate"
        value={user?.success_rate ? `${user.success_rate}%` : "0"}
      />
    </div>
  );
}

export default StatContent;
