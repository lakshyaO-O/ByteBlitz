export type Tier = 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
export type GameMode = 'rated' | 'practice' | 'sprint';
export type RoomStatus = 'waiting' | 'in-progress' | 'finished';
export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';
export type OnlineStatus = 'online' | 'offline' | 'in-game';
export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';
export type NotificationType = 'friend_request' | 'friend_online' | 'match_invitation' | 'match_started' | 'match_finished' | 'contest_reminder' | 'challenge_invitation' | 'achievement_unlock' | 'rank_change' | 'announcement' | 'room_invite' | 'xp_gained';
export type LearningGoal = 'DSA' | 'Competitive Programming' | 'Interviews' | 'Web Development' | 'AI/ML';
export type EditorTheme = 'vs-dark' | 'vs-light' | 'hc-black' | 'monokai' | 'dracula' | 'nord';
export type CodingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'go' | 'rust';
export type SubscriptionTier = 'free' | 'pro' | 'elite';
export type FeatureFlag = 'premium_editor' | 'analytics_dashboard' | 'admin_panel' | 'spectator_mode' | 'ai_code_review' | 'daily_login_rewards' | 'activity_feed';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface UserProfile {
  id: string;
  uid: string;
  publicId: string;
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
  activeRoomId?: string;
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
  inviteCode?: string;
  blockedUserIds?: string[];
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
  publicId?: string;
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

export interface BlockDoc {
  blockedUserId: string;
  username: string;
  photoURL?: string;
  blockedAt: string;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  roomCode: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  status: 'pending' | 'accepted' | 'declined';
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
  testCases?: Array<{ input: string; expected: string }>;
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

export type Verdict = 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Compilation Error' | 'Time Limit Exceeded' | 'Memory Limit Exceeded';

export type SubmissionStatus = 'pending' | 'running' | 'completed' | 'error';

export interface TestCaseResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  executionTimeMs: number;
  memoryUsedKb: number;
  error?: string;
}

export interface SubmissionResult {
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  testCaseResults: TestCaseResult[];
  stdout?: string;
  stderr?: string;
}

export interface PracticeProblemDocument {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  category: string;
  points: number;
  starterCode: Record<CodingLanguage, string>;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>;
  topics: string[];
  hints: string[];
  editorial: string;
  solutionCode: Record<CodingLanguage, string>;
  constraints: string[];
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface PracticeSubmission {
  id: string;
  userId: string;
  problemId: string;
  language: CodingLanguage;
  code: string;
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  submittedAt: string;
}

export interface UserPracticeProgress {
  problemId: string;
  solved: boolean;
  bestSubmissionId?: string;
  submissionsCount: number;
  lastSubmittedAt?: string;
  bookmarked: boolean;
  notes?: string;
  rating?: number;
}

export interface RecentlyViewedProblem {
  problemId: string;
  title: string;
  difficulty: Difficulty;
  viewedAt: string;
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

export type BattlePhase = 'countdown' | 'coding' | 'submitting' | 'scoring' | 'finished';

export type MatchType = 'quick' | 'ranked' | 'private';

export type TimeControlPreset = '1+0' | '2+1' | '3+0' | '5+0' | '10+0';

export type Region = 'us-east' | 'us-west' | 'eu-west' | 'eu-central' | 'asia-south' | 'asia-east' | 'asia-southeast' | 'oceania' | 'auto';

export interface ArenaSettings {
  preferredLanguage: CodingLanguage;
  rated: boolean;
  difficulty: Difficulty;
  category: string;
  timeControl: TimeControlPreset;
  region: Region;
  eloRange: number;
  editorTheme: EditorTheme;
  editorFontSize: number;
  editorMinimap: boolean;
  editorWordWrap: boolean;
  editorTabSize: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  showOpponentProgress: boolean;
  autoAcceptRematch: boolean;
  confirmBeforeSubmit: boolean;
  privacyShowActivity: boolean;
  privacyShowRating: boolean;
  privacyShowStats: boolean;
  notificationsMatchFound: boolean;
  notificationsBattleStart: boolean;
  notificationsRoundEnd: boolean;
  notificationsFriendInvite: boolean;
}

export interface MatchmakingEntry {
  userId: string;
  username: string;
  rating: number;
  tier: Tier;
  preferredLanguage: CodingLanguage;
  rated: boolean;
  difficulty: Difficulty;
  category: string;
  timeControl: TimeControlPreset;
  region: Region;
  eloRange: number;
  joinedAt: string;
  status: 'searching' | 'matched';
  matchedWith?: string;
}

export interface PlayerBattleProgress {
  userId: string;
  username: string;
  rating: number;
  tier: string;
  code: string;
  language: CodingLanguage;
  passedTestCases: number;
  totalTestCases: number;
  submissionCount: number;
  lastSubmittedAt?: string;
  result: 'pending' | 'win' | 'loss' | 'draw';
  eloChange: number;
  finishedAt?: string;
}

export interface BattleDocument {
  id: string;
  roomId?: string;
  players: PlayerBattleProgress[];
  problemId: string;
  problem: Problem;
  phase: BattlePhase;
  matchType: MatchType;
  timeControl: TimeControlPreset;
  totalTimeMs: number;
  rated: boolean;
  countdownStartedAt: string;
  codingStartedAt: string;
  winnerIds: string[];
  status: 'pending' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}
