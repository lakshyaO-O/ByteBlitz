export type Tier = 'Beginner' | 'Learner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
export type GameMode = 'rated' | 'practice' | 'sprint';
export type RoomStatus = 'waiting' | 'in-progress' | 'finished';
export type MatchResult = 'WIN' | 'LOSS' | 'DRAW';
export type OnlineStatus = 'online' | 'offline' | 'in-game';
export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'friends';
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

// ===== NEW ECOSYSTEM TYPES =====

export type PostType = 'code_share' | 'project_showcase' | 'discussion' | 'achievement' | 'question' | 'tip' | 'mentorship';
export type ReactionType = 'like' | 'love' | 'fire' | 'clap' | 'rocket';

export interface CommunityPost {
  id: string;
  userId: string;
  username: string;
  photoURL: string;
  type: PostType;
  title: string;
  content: string;
  code?: string;
  codeLanguage?: CodingLanguage;
  tags: string[];
  likes: number;
  comments: number;
  likedBy?: string[];
  userReaction?: ReactionType;
  createdAt: string;
  updatedAt: string;
  isPinned?: boolean;
  isEdited?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  photoURL: string;
  content: string;
  likes: number;
  createdAt: string;
  parentId?: string;
  isEdited?: boolean;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  topic: string;
  coverImage?: string;
  createdBy: string;
  adminIds: string[];
  memberIds: string[];
  memberCount: number;
  maxMembers: number;
  isPublic: boolean;
  joinCode?: string;
  tags: string[];
  schedule: string;
  resources: Array<{ title: string; url: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface StudyGroupMessage {
  id: string;
  groupId: string;
  userId: string;
  username: string;
  photoURL: string;
  content: string;
  code?: string;
  codeLanguage?: CodingLanguage;
  createdAt: string;
}

export interface MentorProfile {
  id: string;
  userId: string;
  username: string;
  photoURL: string;
  title: string;
  bio: string;
  expertise: string[];
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  available: boolean;
  availability: Array<{ day: string; slots: string[] }>;
  languages: CodingLanguage[];
  menteeCount: number;
  totalSessions: number;
  createdAt: string;
  githubUrl?: string;
  linkedinUrl?: string;
  websiteUrl?: string;
}

export interface MentorReview {
  id: string;
  mentorId: string;
  userId: string;
  username: string;
  photoURL: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface CodeShare {
  id: string;
  userId: string;
  username: string;
  photoURL: string;
  title: string;
  description: string;
  code: string;
  language: CodingLanguage;
  tags: string[];
  likes: number;
  forks: number;
  views: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  forkedFrom?: string;
}

export interface Hackathon {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bannerUrl?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  organizer: string;
  organizerLogo?: string;
  prizePool: string;
  prizes: Array<{ rank: string; reward: string }>;
  sponsors: Array<{ name: string; logo?: string }>;
  rules: string[];
  judgingCriteria: string[];
  categories: string[];
  maxTeamSize: number;
  minTeamSize: number;
  participants: number;
  status: 'upcoming' | 'active' | 'completed';
  difficulty: Difficulty;
  tags: string[];
  createdAt: string;
}

export interface HackathonTeam {
  id: string;
  hackathonId: string;
  name: string;
  leaderId: string;
  members: Array<{ userId: string; username: string; photoURL: string }>;
  projectName?: string;
  projectDescription?: string;
  projectUrl?: string;
  createdAt: string;
}

export interface CareerListing {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: 'full-time' | 'part-time' | 'internship' | 'contract' | 'remote';
  category: 'internship' | 'job' | 'freelance';
  description: string;
  requirements: string[];
  responsibilities: string[];
  skills: string[];
  salaryRange?: string;
  experienceLevel: 'entry' | 'mid' | 'senior' | 'lead';
  applyUrl: string;
  postedAt: string;
  expiresAt?: string;
  featured: boolean;
  createdAt: string;
}

export interface CompanyPrep {
  id: string;
  company: string;
  companyLogo?: string;
  description: string;
  difficulty: Difficulty;
  process: string[];
  topics: string[];
  averageRating: number;
  totalReviews: number;
  problems: Array<{ id: string; title: string; difficulty: Difficulty }>;
  tips: string[];
  salaryRange?: string;
  interviewQuestions: Array<{ question: string; category: string }>;
  createdAt: string;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  type: 'practice' | 'arena' | 'learning' | 'social' | 'streak' | 'challenge';
  requirement: number;
  progress: number;
  xpReward: number;
  coinReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  expiresAt: string;
  completed: boolean;
  claimed: boolean;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'theme' | 'badge' | 'title' | 'avatar' | 'boost' | 'cosmetic';
  price: number;
  currency: 'coins' | 'xp' | 'gems';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  imageUrl?: string;
  color?: string;
  effect?: string;
  available: boolean;
  limited?: boolean;
  expiresAt?: string;
}

export interface UserInventory {
  userId: string;
  items: string[];
  equipped: Record<string, string>;
}

export interface ProjectShowcase {
  id: string;
  userId: string;
  username: string;
  photoURL: string;
  title: string;
  description: string;
  technologies: string[];
  screenshots: string[];
  liveUrl?: string;
  githubUrl?: string;
  featured: boolean;
  likes: number;
  views: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GitHubIntegration {
  connected: boolean;
  githubUsername?: string;
  accessToken?: string;
  repos: Array<{
    name: string;
    description: string;
    url: string;
    language: string;
    stars: number;
    forks: number;
    updatedAt: string;
  }>;
  lastSynced: string;
}

export interface AIUsage {
  mentor: { daily: number; total: number; lastUsed: string };
  codeReview: { daily: number; total: number; lastUsed: string };
  debugger: { daily: number; total: number; lastUsed: string };
  interviewer: { daily: number; total: number; lastUsed: string };
  roadmap: { daily: number; total: number; lastUsed: string };
  resumeReview: { daily: number; total: number; lastUsed: string };
}

export interface DailyFeed {
  entries: Array<{
    id: string;
    type: 'news' | 'coding_tip' | 'community_post' | 'challenge' | 'achievement' | 'contest';
    title: string;
    description: string;
    url?: string;
    source?: string;
    imageUrl?: string;
    createdAt: string;
  }>;
}

export interface ContestCalendarEntry {
  id: string;
  title: string;
  platform: 'codeforces' | 'codechef' | 'leetcode' | 'atcoder' | 'hackerrank' | 'other';
  url: string;
  startDate: string;
  endDate: string;
  duration: string;
  type: 'contest' | 'hackathon' | 'meetup';
  registrationUrl?: string;
  description?: string;
}

export interface DiscussionForum {
  id: string;
  title: string;
  content: string;
  userId: string;
  username: string;
  photoURL: string;
  category: string;
  tags: string[];
  views: number;
  replies: number;
  lastActivity: string;
  isPinned: boolean;
  isSolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ForumReply {
  id: string;
  threadId: string;
  userId: string;
  username: string;
  photoURL: string;
  content: string;
  code?: string;
  codeLanguage?: CodingLanguage;
  isSolution: boolean;
  likes: number;
  createdAt: string;
  updatedAt: string;
  parentId?: string;
}

export interface PublicProfile {
  userId: string;
  username: string;
  photoURL: string;
  bio: string;
  title: string;
  badges: string[];
  rating: number;
  tier: Tier;
  level: number;
  xp: number;
  wins: number;
  losses: number;
  draws: number;
  streak: number;
  memberSince: string;
  githubUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  skills: string[];
  projects: ProjectShowcase[];
  achievements: string[];
  learningGoals: LearningGoal[];
  preferredLanguage: CodingLanguage;
  isMentor: boolean;
  socialLinks: Array<{ platform: string; url: string }>;
}

export interface LearningStreakReward {
  day: number;
  xp: number;
  coins: number;
  reward: string;
  claimed: boolean;
}

export const AI_DAILY_LIMITS: Record<string, { free: number; pro: number; elite: number }> = {
  mentor: { free: 5, pro: 20, elite: 50 },
  codeReview: { free: 3, pro: 15, elite: 40 },
  debugger: { free: 5, pro: 25, elite: 60 },
  interviewer: { free: 1, pro: 5, elite: 15 },
  roadmap: { free: 2, pro: 10, elite: 30 },
  resumeReview: { free: 1, pro: 5, elite: 20 },
};

export const STREAK_REWARDS: Record<number, LearningStreakReward> = {
  1: { day: 1, xp: 10, coins: 5, reward: 'Bronze Streak Badge', claimed: false },
  3: { day: 3, xp: 30, coins: 15, reward: '3-Day Streak Badge', claimed: false },
  7: { day: 7, xp: 75, coins: 30, reward: 'Weekly Warrior Badge', claimed: false },
  14: { day: 14, xp: 150, coins: 75, reward: 'Fortnight Fighter Badge', claimed: false },
  30: { day: 30, xp: 400, coins: 200, reward: 'Monthly Master Badge', claimed: false },
  60: { day: 60, xp: 1000, coins: 500, reward: 'Iron Will Badge', claimed: false },
  100: { day: 100, xp: 2500, coins: 1000, reward: 'Century Legend Badge', claimed: false },
};

export type NotificationType = 'friend_request' | 'friend_online' | 'match_invitation' | 'match_started' | 'match_finished' | 'contest_reminder' | 'challenge_invitation' | 'achievement_unlock' | 'rank_change' | 'announcement' | 'room_invite' | 'xp_gained' | 'mentor_request' | 'study_group_invite' | 'hackathon_reminder' | 'comment_post' | 'like_post' | 'career_alert' | 'mission_complete' | 'streak_milestone' | 'forum_reply';

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
