export type BugReportCategory =
  | 'bug'
  | 'ui_issue'
  | 'performance_issue'
  | 'judge_issue'
  | 'ai_issue'
  | 'security_vulnerability'
  | 'other';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type BugReportStatus = 'open' | 'assigned' | 'resolved' | 'closed' | 'spam';

export interface BugReport {
  id?: string;
  category: BugReportCategory;
  title: string;
  description: string;
  stepsToReproduce: string;
  expectedResult: string;
  actualResult: string;
  severity: Severity;
  currentPage: string;
  browser: string;
  os: string;
  device: string;
  screenshotUrl: string | null;
  contactEmail: string;
  uid: string | null;
  username: string | null;
  appVersion: string;
  status: BugReportStatus;
  assignedTo: string | null;
  resolution: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type FeatureRequestStatus = 'pending' | 'planned' | 'in_progress' | 'completed' | 'rejected' | 'duplicate';

export interface FeatureRequest {
  id?: string;
  title: string;
  description: string;
  category: string;
  uid: string;
  username: string;
  upvotes: number;
  upvotedBy: string[];
  commentCount: number;
  status: FeatureRequestStatus;
  adminNotes: string | null;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FeatureComment {
  id?: string;
  featureId: string;
  uid: string;
  username: string;
  photoURL: string;
  content: string;
  createdAt: string;
}

export type ContactCategory =
  | 'general_question'
  | 'business_inquiry'
  | 'partnership'
  | 'report_abuse'
  | 'technical_support';

export interface ContactMessage {
  id?: string;
  category: ContactCategory;
  name: string;
  email: string;
  subject: string;
  message: string;
  uid: string | null;
  status: 'open' | 'read' | 'replied';
  assignedTo: string | null;
  createdAt: string;
}

export type EventType =
  | 'hackathon'
  | 'coding_competition'
  | 'community_meetup'
  | 'workshop'
  | 'webinar'
  | 'live_stream';

export type EventStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';

export interface HubEvent {
  id?: string;
  title: string;
  banner: string;
  description: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  registrationLink: string | null;
  discordLink: string | null;
  prizePool: string | null;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'all';
  participantLimit: number | null;
  rules: string[];
  sponsors: { name: string; logo: string; url: string }[];
  status: EventStatus;
  organizedBy: string;
  organizerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export type ChallengeType = 'daily' | 'weekly' | 'monthly' | 'special' | 'company' | 'hackathon';
export type ChallengeStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export interface Challenge {
  id?: string;
  title: string;
  description: string;
  challengeType: ChallengeType;
  problemIds: string[];
  startTime: string;
  endTime: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  reward: { xp: number; coins: number; badge: string | null };
  participantCount: number;
  leaderboard: { uid: string; username: string; score: number }[];
  status: ChallengeStatus;
  rules: string[];
  createdAt: string;
}

export type CareerCategory =
  | 'hiring'
  | 'internship'
  | 'campus_ambassador'
  | 'open_source'
  | 'mentor'
  | 'volunteer'
  | 'beta_tester';

export type CareerStatus = 'open' | 'closed';

export interface CareerOpportunity {
  id?: string;
  category: CareerCategory;
  title: string;
  description: string;
  requirements: string[];
  location: string | null;
  remote: boolean;
  applicationLink: string | null;
  contactEmail: string | null;
  status: CareerStatus;
  createdAt: string;
  updatedAt: string;
}

export type HostApplicationStatus = 'pending' | 'approved' | 'rejected' | 'contacted';

export interface HostApplication {
  id?: string;
  organizationName: string;
  contactPerson: string;
  email: string;
  website: string | null;
  country: string;
  expectedParticipants: number;
  eventType: string;
  description: string;
  preferredDates: string;
  uid: string | null;
  status: HostApplicationStatus;
  adminNotes: string | null;
  createdAt: string;
}

export type RoadmapStatus = 'planned' | 'building' | 'testing' | 'released';

export interface RoadmapItem {
  id?: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  category: string;
  votes: number;
  votedBy: string[];
  subscribers: string[];
  targetRelease: string | null;
  createdAt: string;
  updatedAt: string;
}
