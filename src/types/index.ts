export type Tier = 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
export type GameMode = 'rated' | 'practice' | 'sprint';
export type RoomStatus = 'waiting' | 'in-progress' | 'finished';
export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';
export type OnlineStatus = 'online' | 'offline' | 'in-game';
export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';
export type NotificationType = 'friend_request' | 'friend_online' | 'match_invitation' | 'match_started' | 'match_finished' | 'contest_reminder' | 'challenge_invitation' | 'achievement_unlock' | 'rank_change' | 'announcement';
export type LearningGoal = 'DSA' | 'Competitive Programming' | 'Interviews' | 'Web Development' | 'AI/ML';
export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black' | 'monokai' | 'dracula' | 'nord';
export type CodingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'go' | 'rust';
export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type FeatureFlag = 'premium_editor' | 'analytics_dashboard' | 'admin_panel' | 'spectator_mode' | 'ai_code_review' | 'daily_login_rewards' | 'activity_feed';
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
  bio?: string;
  title?: string;
  badge?: string;
  learningGoals?: LearningGoal[];
  emailVerified?: boolean;
  isAdmin?: boolean;
  subscriptionTier?: SubscriptionTier;
  referralCode?: string;
  referredBy?: string;
  aiCredits?: number;
  dailyLoginStreak?: number;
  streak?: number;
  lastLoginDate?: string;
  preferredLanguage?: CodingLanguage;
  editorTheme?: EditorTheme;
  editorFontSize?: number;
  highContrast?: boolean;
  totalCodingTime?: number;
  problemsSolved?: number;
  accuracy?: number;
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

export interface ActivityEvent {
  id: string;
  userId: string;
  type: 'match_won' | 'match_lost' | 'match_draw' | 'achievement_unlocked' | 'level_up' | 'challenge_completed' | 'contest_entered' | 'login_streak' | 'friend_added' | 'rank_up';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DailyReward {
  day: number;
  coins: number;
  xp: number;
  claimed: boolean;
}

export interface SavedCode {
  id: string;
  problemId: string;
  problemTitle: string;
  language: CodingLanguage;
  code: string;
  lastModified: string;
  userId: string;
}

export interface MatchReplay {
  id: string;
  matchId: string;
  players: Array<{
    uid: string;
    username: string;
    rating: number;
    tier: string;
  }>;
  problem: { id: string; title: string };
  timeline: Array<{
    time: number;
    player: string;
    event: 'code_update' | 'test_run' | 'submit' | 'hint_used';
    detail?: string;
  }>;
  finalScores: Record<string, number>;
  winnerIds: string[];
  duration: number;
  gameMode: GameMode;
  timestamp: string;
}

export interface WeeklySummary {
  weekStart: string;
  totalCodingTime: number;
  problemsSolved: number;
  matchesPlayed: number;
  winRate: number;
  accuracy: number;
  xpEarned: number;
  rankChange: number;
  topTopics: string[];
  weakTopics: string[];
}

export interface LearningPath {
  goals: LearningGoal[];
  currentTopic: string;
  nextChallenges: string[];
  weakTopics: string[];
  strongTopics: string[];
  recommendedFocus: string;
  progress: number;
}

export interface CodingSession {
  id: string;
  userId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  language: CodingLanguage;
  problemsAttempted: string[];
  problemsSolved: number;
  xpEarned: number;
}

export interface LoginHistoryEntry {
  id: string;
  userId: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  device?: string;
  success: boolean;
  method: 'email' | 'google' | 'guest';
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

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high';
  active: boolean;
  createdAt: string;
  createdBy: string;
  expiresAt?: string;
}

export interface FeatureFlags {
  id: string;
  [key: string]: boolean | string;
}

export interface ReferralReward {
  code: string;
  userId: string;
  uses: number;
  xpReward: number;
  coinReward: number;
}
