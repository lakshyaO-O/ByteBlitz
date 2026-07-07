'use client';

export type MentorLevel = 'beginner' | 'intermediate' | 'expert';

export interface MentorExplanation {
  intuition: string;
  whyItWorks: string;
  approach: string;
  alternatives: string[];
  mathematicalReasoning?: string;
  complexity: ComplexityAnalysis;
  edgeCases: string[];
  interviewPerspective?: string;
  realWorldApplications?: string[];
  commonMistakes: string[];
  optimizationOpportunities: string[];
  codeSnippet?: string;
}

export interface ComplexityAnalysis {
  timeWorst: string;
  timeAverage: string;
  timeBest: string;
  spaceWorst: string;
  spaceAverage: string;
  spaceBest: string;
  explanation: string;
  time?: string;
  space?: string;
}

export interface AlgorithmStep {
  description: string;
  array: number[];
  variables: Record<string, unknown>;
  highlight: number[];
  state?: 'idle' | 'comparing' | 'swapping' | 'selected' | 'found' | 'done' | 'compare';
  pointers?: Record<string, number>;
}

export interface VisualizationConfig {
  type: 'array' | 'tree' | 'graph' | 'matrix' | 'linked-list';
  data: unknown[];
  steps: AlgorithmStep[];
  description: string;
}

export interface PatternMatch {
  primary: string;
  secondary: string[];
  confidence: number;
  reasoning: string;
  requiredKnowledge: string[];
}

export interface Hint {
  level: number;
  title: string;
  content: string;
  revealCode?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'gentle' | 'detailed' | 'explicit';
}

export interface MistakePrediction {
  category: string;
  likelihood: 'high' | 'medium' | 'low';
  explanation: string;
  prevention: string;
  relatedTopic: string;
}

export interface CodeReviewResult {
  summary: string;
  strengths: string[];
  issues: ReviewIssue[];
  improvements: string[];
  score: number;
  complexity: ComplexityAnalysis;
}

export interface ReviewIssue {
  line: number;
  severity: 'critical' | 'warning' | 'suggestion';
  message: string;
  suggestion: string;
}

export interface DebugWalkthrough {
  variableEvolution: Record<string, unknown[]>;
  loopIterations: Array<{ step: number; variables: Record<string, unknown>; condition: string }>;
  callStack: Array<{ function: string; args: unknown[]; line: number }>;
  potentialBugs: Array<{ line: number; reason: string; fix: string }>;
}

export interface ConceptEntry {
  slug: string;
  title: string;
  category: string;
  definition: string;
  visualExplanation: string;
  complexity: ComplexityAnalysis;
  whenToUse: string[];
  whenNotToUse: string[];
  pitfalls: string[];
  relatedConcepts: string[];
  codeExample?: string;
  prerequisites?: string[];
}

export interface InterviewContext {
  whyAsked: string;
  companies: string[];
  variations: string[];
  followUpQuestions: string[];
  difficultyProgression: string[];
}

export interface RevisionCard {
  type: 'flashcard' | 'mcq' | 'true-false' | 'fill-blank';
  question: string;
  answer: string;
  options?: string[];
  explanation: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface KnowledgeEntry {
  id: string;
  type: 'note' | 'bookmark' | 'highlight' | 'saved-explanation';
  problemId?: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningAnalytics {
  strongTopics: Array<{ topic: string; mastery: number }>;
  weakTopics: Array<{ topic: string; mastery: number }>;
  learningSpeed: number;
  patternsMastered: string[];
  revisionScore: number;
  confidenceScore: number;
  totalTimeSpent: number;
  problemsSolved: number;
  recommendedNext: string[];
}

export interface LearningProgress {
  problemId: string;
  status: 'not-started' | 'reading' | 'hints-used' | 'mentor-consulted' | 'solved' | 'mastered';
  timeSpent: number;
  hintsRevealed: number;
  mentorQuestions: number;
  revisionsCompleted: number;
  notesCount: number;
  confidenceRating: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category: 'milestone' | 'mastery' | 'streak' | 'learning';
}

export interface ProblemPattern {
  name: string;
  description: string;
  detectionRules: string[];
  relatedPatterns: string[];
  commonProblems: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface SimilarProblemGroup {
  easier: Array<{ id: string; title: string; difficulty: string; topic: string }>;
  similar: Array<{ id: string; title: string; difficulty: string; topic: string }>;
  harder: Array<{ id: string; title: string; difficulty: string; topic: string }>;
}
