export type AchievementTone = "green" | "locked";

export type Achievement = {
  label: string;
  icon: string;
  tone: AchievementTone;
  title: string;
};

export type RewardActivity = {
  puzzleId: string;
  timestamp: string;
  threatLevel: "Grandmaster" | "Expert" | "Intermediate";
  credit: string;
};

export type RewardSummary = {
  totalSol: string;
  estimatedUsd: string;
  settlementStatus: string;
};

export type StreakSummary = {
  days: number;
  progressPercent: number;
  activeSegments: number;
  totalSegments: number;
  requirement: string;
};

export const rewardSummary: RewardSummary = {
  totalSol: "12.845",
  estimatedUsd: "$1,894.20 USD",
  settlementStatus:
    "Transmission Protocol: Real-time settlement pending. Assets route after puzzle verification and reward authority approval.",
};

export const streakSummary: StreakSummary = {
  days: 14,
  progressPercent: 86,
  activeSegments: 5,
  totalSegments: 7,
  requirement: "Data_Requirement: 1 successful resolution to reach Phase 15.",
};

export const achievements: Achievement[] = [
  {
    label: "G_CENTURION",
    icon: "military_tech",
    tone: "green",
    title: "Solve 100 Puzzles",
  },
  {
    label: "BLITZ_MSTR",
    icon: "bolt",
    tone: "green",
    title: "Win under 1 minute",
  },
  {
    label: "ROYAL_KNGT",
    icon: "diamond",
    tone: "locked",
    title: "Locked achievement",
  },
  {
    label: "WHALE_INIT",
    icon: "workspace_premium",
    tone: "green",
    title: "Claim 5 SOL total",
  },
  {
    label: "TOURN_#1",
    icon: "trophy",
    tone: "locked",
    title: "Locked achievement",
  },
  {
    label: "CONSISTENT",
    icon: "local_fire_department",
    tone: "green",
    title: "10 Day Streak",
  },
];

export const rewardActivity: RewardActivity[] = [
  {
    puzzleId: "#PX_8821",
    timestamp: "02_M_AGO",
    threatLevel: "Grandmaster",
    credit: "+0.042 SOL",
  },
  {
    puzzleId: "#PX_7201",
    timestamp: "15_M_AGO",
    threatLevel: "Expert",
    credit: "+0.015 SOL",
  },
  {
    puzzleId: "#PX_4592",
    timestamp: "01_H_AGO",
    threatLevel: "Intermediate",
    credit: "+0.008 SOL",
  },
  {
    puzzleId: "#PX_1102",
    timestamp: "03_H_AGO",
    threatLevel: "Expert",
    credit: "+0.012 SOL",
  },
  {
    puzzleId: "#PX_9904",
    timestamp: "06_H_AGO",
    threatLevel: "Grandmaster",
    credit: "+0.038 SOL",
  },
];
