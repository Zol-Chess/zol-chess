export interface AuthState {
  isWalletConnected: boolean;
  user?: User;
  error?: string;
  loading?: boolean;
  // getUser: () => Promise<void>;
  connectWallet: VoidFunction;
  disconnectWallet: VoidFunction;
}

export interface User {
  id: string;
  wallet_address?: string;
  profile_photo?: string | null;
  player_rating: number;
  puzzle_rating: number;
  highest_rating: number;
  global_rank?: number;
  level: number;
  next_difficulty?: number;
  puzzles_solved: number;
  puzzles_attempted: number;
  success_rate: number;
  current_streak: number;
  longest_streak: number;
  average_solve_time?: number;
  total_sol_earned: number;
  claimable_sol: number;
  nft_count: number;
  achievements: string[];

  // Referral System
  //   referral_code?: string
  //   referred_by?: string | null

  // Activity
  last_seen?: string | null;
}
