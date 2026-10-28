export type AiFeature =
  | 'aiMentor'
  | 'aiDebugger'
  | 'aiCodeReview'
  | 'aiHints'
  | 'aiEditorial'
  | 'aiInterviewer'
  | 'resumeReview'
  | 'roadmapGenerator'
  | 'aiComplexity'
  | 'aiMistakePredictor'
  | 'aiFeed';

export interface AiFeatureLimit {
  daily: number | null;
  monthly: number | null;
}

export type AiLimitsConfig = Record<AiFeature, AiFeatureLimit>;

export type SubscriptionTier = 'free' | 'pro' | 'elite';

export const AI_FEATURES: AiFeature[] = [
  'aiMentor',
  'aiDebugger',
  'aiCodeReview',
  'aiHints',
  'aiEditorial',
  'aiInterviewer',
  'resumeReview',
  'roadmapGenerator',
  'aiComplexity',
  'aiMistakePredictor',
  'aiFeed',
];

export const AI_FEATURE_LABELS: Record<AiFeature, string> = {
  aiMentor: 'AI Mentor',
  aiDebugger: 'AI Debugger',
  aiCodeReview: 'Code Review',
  aiHints: 'AI Hints',
  aiEditorial: 'AI Editorial',
  aiInterviewer: 'AI Interviewer',
  resumeReview: 'Resume Review',
  roadmapGenerator: 'Roadmap Generator',
  aiComplexity: 'Complexity Analyzer',
  aiMistakePredictor: 'Mistake Predictor',
  aiFeed: 'AI Feed',
};

export const DEFAULT_AI_LIMITS: AiLimitsConfig = {
  aiMentor: { daily: 20, monthly: null },
  aiDebugger: { daily: 10, monthly: null },
  aiCodeReview: { daily: 5, monthly: null },
  aiHints: { daily: 15, monthly: null },
  aiEditorial: { daily: 10, monthly: null },
  aiInterviewer: { daily: 1, monthly: null },
  resumeReview: { daily: null, monthly: 1 },
  roadmapGenerator: { daily: null, monthly: 3 },
  aiComplexity: { daily: 10, monthly: null },
  aiMistakePredictor: { daily: 10, monthly: null },
  aiFeed: { daily: 5, monthly: null },
};

export const PREMIUM_UNLIMITED_FEATURES: AiFeature[] = [
  'aiMentor',
  'aiDebugger',
  'aiCodeReview',
  'aiHints',
  'aiEditorial',
  'aiInterviewer',
  'resumeReview',
  'roadmapGenerator',
  'aiComplexity',
  'aiMistakePredictor',
  'aiFeed',
];

export function isPremiumTier(tier: SubscriptionTier): boolean {
  return tier === 'pro' || tier === 'elite';
}

export function getLimitForTier(
  feature: AiFeature,
  tier: SubscriptionTier,
  configOverride?: Partial<AiLimitsConfig>,
): AiFeatureLimit | null {
  if (isPremiumTier(tier)) return null;
  const config = configOverride?.[feature] || DEFAULT_AI_LIMITS[feature];
  return config || null;
}

export function getPeriodKey(feature: AiFeature): 'daily' | 'monthly' {
  const limit = DEFAULT_AI_LIMITS[feature];
  if (limit?.monthly !== null && limit?.daily === null) return 'monthly';
  return 'daily';
}

export function getCurrentPeriodKey(feature: AiFeature): string {
  const period = getPeriodKey(feature);
  const now = new Date();
  if (period === 'monthly') {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
  return now.toISOString().slice(0, 10);
}

export function getNextResetTime(feature: AiFeature): Date {
  const now = new Date();
  const period = getPeriodKey(feature);
  if (period === 'monthly') {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return next;
  }
  const next = new Date(now);
  next.setDate(next.getDate() + 1);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Firestore path for per-feature usage docs: config/aiQuotas
 * Overrides DEFAULT_AI_LIMITS at runtime.
 */
export const AI_QUOTAS_CONFIG_DOC = 'config/aiQuotas';
