import { WalletConnector, WalletSession } from "@/lib/wallet/types";

export type UserWalletSession = {
  walletAddress?: string;
  walletSession?: WalletSession;
  walletStatus?: (typeof WALLET_STATUS)[keyof typeof WALLET_STATUS];
};

export interface AuthState extends UserWalletSession {
  // isWalletConnected: boolean;
  user?: User;
  error?: string;
  loading?: boolean;
  setUser: (user: User) => void;
  updateUser: (user: User) => void;
  setWalletSession: (details: UserWalletSession) => void;
}

export interface User {
  id?: string;
  profile_photo?: string | null;
  player_rating?: number;
  puzzle_rating?: number;
  highest_rating?: number;
  global_rank?: number;
  next_difficulty?: number;
  puzzles_solved?: number;
  puzzles_attempted?: number;
  success_rate?: number;
  current_streak?: number;
  longest_streak?: number;
  average_solve_time?: number;
  total_sol_earned?: number;
  claimable_sol?: number;
  nft_count?: number;
  achievements?: string[];
  achievementsMask?: number;

  // Referral System
  //   referral_code?: string
  //   referred_by?: string | null

  last_seen?: string | null;
}

export const WALLET_STATUS = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
} as const;
