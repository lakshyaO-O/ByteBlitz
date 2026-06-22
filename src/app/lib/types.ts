export type Tier = 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';

export interface UserStats {
  rating: number;
  highestRating: number;
  wins: number;
  losses: number;
  draws: number;
  xp: number;
  level: number;
  rank: number;
  username: string;
  tier: Tier;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  tags: string[];
}

export interface BattleState {
  id: string;
  opponent: Partial<UserStats>;
  problem: Problem;
  status: 'searching' | 'countdown' | 'in-progress' | 'finished';
  winner?: string;
  timeRemaining: number;
  playerProgress: number;
  opponentProgress: number;
}
