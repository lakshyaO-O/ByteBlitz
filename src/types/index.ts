export type Tier = 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
export type GameMode = 'rated' | 'practice' | 'sprint';
export type RoomStatus = 'waiting' | 'in-progress' | 'finished';
export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';
export type OnlineStatus = 'online' | 'offline' | 'in-game';
export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';
export type NotificationType = 'friend_request' | 'friend_online' | 'match_invitation' | 'match_started' | 'match_finished';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface UserProfile {
  id: string;
  uid: string;
  username: string;
  email: string;
  photoURL: string;
  coins: number;
  xp: number;
  level: number;
  rating: number;
  highestRating: number;
  wins: number;
  losses: number;
  draws: number;
  tier: Tier;
  rank: number;
  lastActive: string;
  onlineStatus: OnlineStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GameRoom {
  id: string;
  roomCode: string;
  hostId: string;
  hostName: string;
  players: string[];
  playerNames: Record<string, string>;
  status: RoomStatus;
  gameMode: GameMode;
  maxPlayers: number;
  problemId?: string;
  problemTitle?: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface MatchRecord {
  id: string;
  roomId?: string;
  players: Array<{
    uid: string;
    username: string;
    score: number;
    timeUsed: number;
    result: MatchResult;
    eloChange: number;
    newRating: number;
  }>;
  winnerIds: string[];
  problem: { id: string; title: string };
  duration: number;
  gameMode: GameMode;
  timestamp: string;
}

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  photoURL: string;
  rating: number;
  wins: number;
  tier: Tier;
  period: 'weekly' | 'monthly' | 'all-time';
  periodStart: string;
  periodEnd: string;
}

export interface FriendDoc {
  friendId: string;
  username: string;
  photoURL: string;
  tier: Tier;
  rating: number;
  onlineStatus: OnlineStatus;
  addedAt: string;
}

export interface FriendRequest {
  id: string;
  fromUserId: string;
  fromUsername: string;
  fromPhotoURL: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export type Notification = AppNotification;

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export interface Problem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  points: number;
  description: string;
  constraints?: string[];
  inputFormat?: string;
  outputFormat?: string;
  examples?: Array<{ input: string; output: string; explanation?: string }>;
  tags?: string[];
  starterCode?: Record<string, string>;
}

export interface BattleState {
  id: string;
  roomId?: string;
  opponent: Partial<UserProfile>;
  problem: Problem;
  status: 'searching' | 'countdown' | 'in-progress' | 'finished';
  winner?: string;
  timeRemaining: number;
  playerProgress: number;
  opponentProgress: number;
  gameMode: GameMode;
}

export interface GlobalStats {
  totalPlayers: number;
  totalBattles: number;
  avgExecutionTime: number;
  activeBattles: number;
}

export interface Opponent {
  id: string;
  username: string;
  rating: number;
  tier: string;
}
