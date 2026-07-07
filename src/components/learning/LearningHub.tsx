'use client';

import { useState, useCallback, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain, Lightbulb, BarChart3, AlertTriangle, BookOpen,
  Building2, Layers, FileText, Sparkles, Loader2, ChevronLeft,
  Eye, MessageSquare, Network,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { JudgeStatus } from './JudgeStatus';
import { AIExplainer } from './AIExplainer';
import { ProgressiveHints } from './ProgressiveHints';
import { PatternBadge } from './PatternBadge';
import { MistakePredictor } from './MistakePredictor';
import { ComplexityCard } from './ComplexityCard';
import { AlgorithmVisualizer } from './AlgorithmVisualizer';
import { InterviewContextCard } from './InterviewContext';
import { SimilarProblems } from './SimilarProblems';
import { KnowledgeBase } from './KnowledgeBase';
import { RevisionCards } from './RevisionCards';
import type {
  PracticeProblemDocument, CodingLanguage,
} from '@/types';
import type {
  MentorLevel, PatternMatch, MistakePrediction,
  ComplexityAnalysis, Hint, MentorExplanation,
  RevisionCard, KnowledgeEntry, SimilarProblemGroup, InterviewContext,
  AlgorithmStep,
} from '@/types/learning';
import { detectPatterns } from '@/data/patterns';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  problem: PracticeProblemDocument;
  onBack: () => void;
  userId: string | null;
}

type HubTab = 'learn' | 'mentor' | 'hints' | 'patterns' | 'mistakes' | 'complexity' |
  'visualize' | 'interview' | 'similar' | 'revision' | 'knowledge';

const SIDEBAR_TABS: Array<{ id: HubTab; icon: typeof Brain; label: string }> = [
  { id: 'learn', icon: BookOpen, label: 'Learn' },
  { id: 'mentor', icon: Brain, label: 'Mentor' },
  { id: 'hints', icon: Lightbulb, label: 'Hints' },
  { id: 'patterns', icon: Network, label: 'Patterns' },
  { id: 'mistakes', icon: AlertTriangle, label: 'Mistakes' },
  { id: 'complexity', icon: BarChart3, label: 'Complexity' },
  { id: 'visualize', icon: Eye, label: 'Visualize' },
  { id: 'interview', icon: Building2, label: 'Interview' },
  { id: 'similar', icon: Layers, label: 'Similar' },
  { id: 'revision', icon: Sparkles, label: 'Revision' },
  { id: 'knowledge', icon: FileText, label: 'Notes' },
];

export function LearningHub({ problem, onBack, userId }: Props) {
  const [activeTab, setActiveTab] = useState<HubTab>('learn');
  const [mentorLevel, setMentorLevel] = useState<MentorLevel>('intermediate');
  const [mentorExplanation, setMentorExplanation] = useState<MentorExplanation | undefined>();
  const [mentorLoading, setMentorLoading] = useState(false);
  const [hints, setHints] = useState<Hint[]>([]);
  const [pattern, setPattern] = useState<PatternMatch | undefined>();
  const [mistakes, setMistakes] = useState<MistakePrediction[]>([]);
  const [mistakesLoading, setMistakesLoading] = useState(false);
  const [complexity, setComplexity] = useState<ComplexityAnalysis | undefined>();
  const [complexityLoading, setComplexityLoading] = useState(false);
  const [vizSteps, setVizSteps] = useState<AlgorithmStep[]>([]);
  const [vizLoading, setVizLoading] = useState(false);
  const [revisionCards, setRevisionCards] = useState<RevisionCard[]>([]);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [code, setCode] = useState(problem.starterCode?.javascript || '');

  useEffect(() => {
    const result = detectPatterns(problem.title, problem.description, problem.topics);
    setPattern({ ...result, requiredKnowledge: [] });
  }, [problem]);

  const generateHints = useCallback(() => {
    const h: Hint[] = [
      {
        level: 1, title: 'Observation',
        content: `Look at the input constraints. ${problem.constraints?.[0] || 'Think about what size of input you are dealing with.'}`,
        difficulty: 'easy',
      },
      {
        level: 2, title: 'Data Structure',
        content: `Based on the topics (${problem.topics.slice(0, 3).join(', ')}), consider which data structure would be most appropriate.`,
        difficulty: 'easy',
      },
      {
        level: 3, title: 'Algorithm Pattern',
        content: `This problem follows the "${pattern?.primary || 'general'}" pattern. Think about how that pattern applies here.`,
        difficulty: 'medium',
      },
      {
        level: 4, title: 'Key Insight',
        content: 'Try working through the examples manually and identify what changes between each step.',
        difficulty: 'medium' as const,
      },
      {
        level: 5, title: 'Implementation',
        content: 'Start with the simplest version that could work, then optimize. Handle edge cases like empty input or single elements.',
        difficulty: 'hard',
      },
    ];
    setHints(h);
  }, [problem, pattern]);

  useEffect(() => {
    if (hints.length === 0) generateHints();
  }, [generateHints, hints.length]);

  const requestMentorExplanation = useCallback(async () => {
    setMentorLoading(true);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/ai/mentor-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          problemTitle: problem.title,
          problemDescription: problem.description,
          constraints: problem.constraints?.join('\n') || '',
          topics: problem.topics,
          level: mentorLevel,
          userCode: code,
        }),
      });
      const data = await res.json();
      setMentorExplanation(data);
    } catch (e) {
      console.error('Mentor error:', e);
    } finally {
      setMentorLoading(false);
    }
  }, [problem, mentorLevel, code]);

  const requestMistakeAnalysis = useCallback(async () => {
    setMistakesLoading(true);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/ai/mistake-predictor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          problemTitle: problem.title,
          problemDescription: problem.description,
          constraints: problem.constraints?.join('\n') || '',
          topics: problem.topics,
          difficulty: problem.difficulty,
          userCode: code,
        }),
      });
      const data = await res.json();
      setMistakes(data.predictions || []);
    } catch (e) {
      console.error('Mistake analysis error:', e);
    } finally {
      setMistakesLoading(false);
    }
  }, [problem, code]);

  const requestComplexityAnalysis = useCallback(async (userCode: string) => {
    setComplexityLoading(true);
    setCode(userCode);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/ai/complexity-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: userCode, language: 'javascript', problemDescription: problem.title }),
      });
      const data = await res.json();
      setComplexity({
        timeWorst: data.timeComplexity,
        timeAverage: data.averageCase,
        timeBest: data.bestCase,
        spaceWorst: data.spaceComplexity,
        spaceAverage: '',
        spaceBest: '',
        explanation: data.explanation,
      });
    } catch (e) {
      console.error('Complexity analysis error:', e);
    } finally {
      setComplexityLoading(false);
    }
  }, [problem]);

  const generateRevisionCards = useCallback(async () => {
    setRevisionLoading(true);
    try {
      const token = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken();
      const res = await fetch('/api/ai/revision-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          problemTitle: problem.title,
          problemDescription: problem.description,
          solutionApproach: mentorExplanation?.approach || 'Standard approach',
          topics: problem.topics,
          count: 5,
        }),
      });
      const data = await res.json();
      setRevisionCards(data.cards || []);
    } catch (e) {
      console.error('Revision generator error:', e);
    } finally {
      setRevisionLoading(false);
    }
  }, [problem, mentorExplanation]);

  const generateVisualization = useCallback(() => {
    setVizLoading(true);
    setTimeout(() => {
      const data = Array.from({ length: 10 }, () => Math.floor(Math.random() * 50) + 5);
      const steps: AlgorithmStep[] = [];
      const arr = [...data];
      steps.push({
        description: 'Starting array. Ready to begin search.',
        array: arr,
        variables: { target: 42 },
        highlight: [] as number[],
        state: 'idle',
      });
      const target = 42;
      let low = 0, high = arr.length - 1;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const isLast = low === high;
        steps.push({
          description: `Searching range [${low}..${high}], mid = ${mid} (value ${arr[mid]})`,
          array: arr,
          variables: { low, high, mid, target, current: arr[mid] },
          highlight: [mid],
          state: arr[mid] === target ? 'found' : 'compare',
        });
        if (arr[mid] === target) break;
        if (arr[mid] < target) low = mid + 1;
        else high = mid - 1;
        if (isLast) break;
      }
      if (low > high) {
        steps.push({
          description: `Target ${target} not found. Low (${low}) crossed high (${high}).`,
          array: arr,
          variables: { low, high, target },
          highlight: [] as number[],
          state: 'done',
        });
      }
      setVizSteps(steps);
      setVizLoading(false);
    }, 300);
  }, []);

  const interviewContext: InterviewContext = {
    whyAsked: `This "${problem.title}" problem tests your ability to work with ${problem.topics.slice(0, 2).join(' and ')}. Interviewers want to see if you can recognize the optimal pattern and handle edge cases correctly.`,
    companies: problem.companyTags && problem.companyTags.length > 0 ? [...problem.companyTags] : ['Google', 'Amazon', 'Microsoft', 'Meta'],
    variations: [
      `Solve it with ${problem.difficulty === 'Easy' ? 'O(1) extra space' : 'a different data structure'}`,
      `Handle input with ${problem.difficulty === 'Hard' ? 'cyclic dependencies' : 'duplicates'}`,
      `Modify to return all valid solutions instead of just one`,
    ],
    followUpQuestions: [
      'What is the time and space complexity of your solution?',
      'Can you optimize it further?',
      'How would you handle very large inputs that don\'t fit in memory?',
      'What test cases would you write for this problem?',
    ],
    difficultyProgression: [problem.difficulty, problem.difficulty === 'Easy' ? 'Medium' : problem.difficulty === 'Medium' ? 'Hard' : 'Expert'],
  };

  const similarProblems: SimilarProblemGroup = {
    easier: problem.topics.slice(0, 2).map((t, i) => ({
      id: `${t.toLowerCase()}-intro`,
      title: `${t} Fundamentals`,
      difficulty: 'Easy',
      topic: t,
    })),
    similar: [{
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      topic: problem.topics[0] || '',
    }],
    harder: problem.topics.slice(0, 2).map((t, i) => ({
      id: `${t.toLowerCase()}-advanced`,
      title: `Advanced ${t}`,
      difficulty: 'Hard',
      topic: t,
    })),
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar */}
      <div className="w-12 border-r border-border/30 flex flex-col items-center py-2 gap-0.5 bg-background/50">
        {SIDEBAR_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'w-9 h-9 rounded-lg flex items-center justify-center transition-all relative',
              activeTab === tab.id
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/10',
            )}
            title={tab.label}
          >
            <tab.icon className="w-4 h-4" />
            {activeTab === tab.id && (
              <motion.div layoutId="active-tab" className="absolute left-0 w-0.5 h-4 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center gap-2 px-4 h-10 border-b border-border/20 shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7 -ml-1" onClick={onBack}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold truncate">{problem.title}</h2>
            <Badge variant="outline" className={cn(
              'text-[9px] px-1.5 py-0',
              problem.difficulty === 'Easy' && 'border-emerald-500/30 text-emerald-400',
              problem.difficulty === 'Medium' && 'border-amber-500/30 text-amber-400',
              problem.difficulty === 'Hard' && 'border-red-500/30 text-red-400',
            )}>
              {problem.difficulty}
            </Badge>
            <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
              {problem.topics.slice(0, 3).join(' · ')}
            </span>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 max-w-3xl mx-auto space-y-4">
            {/* Judge Status Banner */}
            <JudgeStatus />

            {/* Problem Description (always visible) */}
            <div className="prose prose-invert prose-sm max-w-none">
              <div className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>
            </div>

            {problem.constraints && problem.constraints.length > 0 && (
              <div className="p-3 rounded-lg bg-muted/10 border border-border/30">
                <p className="text-[10px] font-medium text-foreground mb-1.5">Constraints</p>
                <ul className="space-y-0.5">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground font-mono">{c}</li>
                  ))}
                </ul>
              </div>
            )}

            {problem.examples && problem.examples.length > 0 && (
              <div className="space-y-2">
                {problem.examples.map((ex, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/10 border border-border/30">
                    <p className="text-[9px] font-medium text-muted-foreground uppercase mb-1.5">Example {i + 1}</p>
                    <div className="space-y-1 text-[11px]">
                      <div><span className="text-muted-foreground">Input:</span> <span className="font-mono">{ex.input}</span></div>
                      <div><span className="text-muted-foreground">Output:</span> <span className="font-mono">{ex.output}</span></div>
                      {ex.explanation && <div><span className="text-muted-foreground">Explanation:</span> {ex.explanation}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Active Tab Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
              >
                {activeTab === 'mentor' && (
                  <AIExplainer
                    explanation={mentorExplanation}
                    loading={mentorLoading}
                    level={mentorLevel}
                    onLevelChange={setMentorLevel}
                    onRequestExplanation={requestMentorExplanation}
                  />
                )}

                {activeTab === 'hints' && (
                  <ProgressiveHints hints={hints} />
                )}

                {activeTab === 'patterns' && pattern && (
                  <PatternBadge pattern={pattern} />
                )}

                {activeTab === 'mistakes' && (
                  <MistakePredictor
                    predictions={mistakes}
                    loading={mistakesLoading}
                    onAnalyze={requestMistakeAnalysis}
                  />
                )}

                {activeTab === 'complexity' && (
                  <ComplexityCard
                    complexity={complexity}
                    loading={complexityLoading}
                    onAnalyze={requestComplexityAnalysis}
                    code={code}
                  />
                )}

                {activeTab === 'visualize' && (
                  <AlgorithmVisualizer
                    steps={vizSteps}
                    title="Binary Search Visualization"
                    onRequestSteps={generateVisualization}
                    loading={vizLoading}
                  />
                )}

                {activeTab === 'interview' && (
                  <InterviewContextCard context={interviewContext} />
                )}

                {activeTab === 'similar' && (
                  <SimilarProblems problems={similarProblems} />
                )}

                {activeTab === 'revision' && (
                  <RevisionCards
                    cards={revisionCards}
                    loading={revisionLoading}
                    onGenerate={generateRevisionCards}
                  />
                )}

                {activeTab === 'knowledge' && (
                  <KnowledgeBase
                    entries={knowledgeEntries}
                    onAddEntry={entry => {
                      const newEntry: KnowledgeEntry = {
                        ...entry,
                        id: `entry-${Date.now()}`,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      };
                      setKnowledgeEntries(prev => [newEntry, ...prev]);
                    }}
                    onDeleteEntry={id => setKnowledgeEntries(prev => prev.filter(e => e.id !== id))}
                    isBookmarked={isBookmarked}
                    onToggleBookmark={() => setIsBookmarked(!isBookmarked)}
                  />
                )}

                {activeTab === 'learn' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setActiveTab('mentor')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Brain className="w-5 h-5 text-violet-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">AI Mentor</h4>
                        <p className="text-[10px] text-muted-foreground">Get a level-based explanation tailored to you</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('hints')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Lightbulb className="w-5 h-5 text-amber-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Progressive Hints</h4>
                        <p className="text-[10px] text-muted-foreground">Reveal hints one at a time, from gentle to explicit</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('patterns')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Network className="w-5 h-5 text-indigo-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Pattern Analysis</h4>
                        <p className="text-[10px] text-muted-foreground">See what algorithm pattern this problem uses</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('mistakes')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Common Mistakes</h4>
                        <p className="text-[10px] text-muted-foreground">Learn what to watch out for before you code</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('complexity')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <BarChart3 className="w-5 h-5 text-rose-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Complexity Analyzer</h4>
                        <p className="text-[10px] text-muted-foreground">Time and space analysis of your approach</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('visualize')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Eye className="w-5 h-5 text-emerald-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Algorithm Visualizer</h4>
                        <p className="text-[10px] text-muted-foreground">Watch the algorithm work step by step</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('interview')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Building2 className="w-5 h-5 text-blue-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Interview Context</h4>
                        <p className="text-[10px] text-muted-foreground">Why this problem matters in interviews</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('similar')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Layers className="w-5 h-5 text-indigo-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Similar Problems</h4>
                        <p className="text-[10px] text-muted-foreground">Easier, similar, and harder problems</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('revision')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <Sparkles className="w-5 h-5 text-violet-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Revision</h4>
                        <p className="text-[10px] text-muted-foreground">Flashcards and quizzes generated from this problem</p>
                      </button>
                      <button
                        onClick={() => setActiveTab('knowledge')}
                        className="p-4 rounded-xl border border-border/30 hover:border-primary/30 hover:bg-muted/10 transition-all text-left group"
                      >
                        <FileText className="w-5 h-5 text-amber-400 mb-2" />
                        <h4 className="text-xs font-semibold mb-0.5">Knowledge Base</h4>
                        <p className="text-[10px] text-muted-foreground">Save notes, bookmark, and track progress</p>
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
