import { z } from 'zod';

const Categories = [
  'bug', 'ui_issue', 'performance_issue', 'judge_issue',
  'ai_issue', 'security_vulnerability', 'other',
] as const;
const Severities = ['critical', 'high', 'medium', 'low'] as const;
const ContactCategories = [
  'general_question', 'business_inquiry', 'partnership',
  'report_abuse', 'technical_support',
] as const;
const EventTypes = [
  'hackathon', 'coding_competition', 'community_meetup',
  'workshop', 'webinar', 'live_stream',
] as const;
const ChallengeTypes = ['daily', 'weekly', 'monthly', 'special', 'company', 'hackathon'] as const;
const CareerCategories = [
  'hiring', 'internship', 'campus_ambassador', 'open_source',
  'mentor', 'volunteer', 'beta_tester',
] as const;
const RoadmapStatuses = ['planned', 'building', 'testing', 'released'] as const;

export const bugReportSchema = z.object({
  category: z.enum(Categories),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  stepsToReproduce: z.string().min(5, 'Steps too short').max(5000, 'Steps too long'),
  expectedResult: z.string().min(2, 'Expected result is required').max(2000, 'Expected result too long'),
  actualResult: z.string().min(2, 'Actual result is required').max(2000, 'Actual result too long'),
  severity: z.enum(Severities),
  currentPage: z.string().max(500, 'Page URL too long').default(''),
  browser: z.string().max(200, 'Browser info too long').default(''),
  os: z.string().max(200, 'OS info too long').default(''),
  device: z.string().max(200, 'Device info too long').default(''),
  screenshotUrl: z.string().url('Invalid URL').nullable().optional(),
  contactEmail: z.string().email('Invalid email').or(z.literal('')).optional(),
});

export const featureRequestSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
});

export const featureCommentSchema = z.object({
  featureId: z.string().min(1, 'Feature ID required'),
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

export const contactSchema = z.object({
  category: z.enum(ContactCategories),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message too long'),
});

export const hostApplicationSchema = z.object({
  organizationName: z.string().min(2, 'Organization name is required').max(200, 'Name too long'),
  contactPerson: z.string().min(2, 'Contact person is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  website: z.string().url('Invalid URL').optional().or(z.literal('')),
  country: z.string().min(2, 'Country is required').max(100, 'Country name too long'),
  expectedParticipants: z.number().int().min(1, 'Must have at least 1 participant').max(100000, 'Too many participants'),
  eventType: z.string().min(1, 'Event type is required'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000, 'Description too long'),
  preferredDates: z.string().min(5, 'Preferred dates are required').max(500, 'Too long'),
});

export const roadmapItemSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  status: z.enum(RoadmapStatuses),
  category: z.string().min(1, 'Category is required'),
  targetRelease: z.string().optional().nullable(),
});

export const eventSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200, 'Title too long'),
  banner: z.string().url('Invalid banner URL').optional().or(z.literal('')),
  description: z.string().min(10, 'Description too short').max(10000, 'Description too long'),
  eventType: z.enum(EventTypes),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  registrationLink: z.string().url('Invalid URL').nullable().optional(),
  discordLink: z.string().url('Invalid URL').nullable().optional(),
  prizePool: z.string().nullable().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'all']).default('all'),
  participantLimit: z.number().int().positive().nullable().optional(),
  rules: z.array(z.string()).default([]),
  sponsors: z.array(z.object({ name: z.string(), logo: z.string(), url: z.string() })).default([]),
  status: z.enum(['draft', 'published', 'in_progress', 'completed', 'cancelled']).default('draft'),
});

export const challengeSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  challengeType: z.enum(ChallengeTypes),
  problemIds: z.array(z.string()).default([]),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  reward: z.object({ xp: z.number().int().default(0), coins: z.number().int().default(0), badge: z.string().nullable().default(null) }),
  rules: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']).default('draft'),
});

export const careerSchema = z.object({
  category: z.enum(CareerCategories),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  requirements: z.array(z.string()).default([]),
  location: z.string().nullable().optional(),
  remote: z.boolean().default(false),
  applicationLink: z.string().url().nullable().optional(),
  contactEmail: z.string().email().nullable().optional(),
  status: z.enum(['open', 'closed']).default('open'),
});
