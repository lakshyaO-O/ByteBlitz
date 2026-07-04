'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CodingLanguage, PracticeProblemDocument, TestCaseResult, Verdict, SubmissionStatus, ExecutionPhase } from '@/types';
import { submitSolution } from '@/services/practice';
import type { JudgeProgress } from '@/features/practice/services/judge';

interface SessionState {
  code: string;
  language: CodingLanguage;
  isRunning: boolean;
  isSubmitting: boolean;
  submissionStatus: SubmissionStatus;
  testResults: TestCaseResult[];
  verdict: Verdict | null;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  compileTimeMs: number;
  codeSize: number;
  phase: ExecutionPhase;
  currentTest: number;
  totalTests: number;
  phaseMessage: string;
}

export function usePracticeSession(
  userId: string | null,
  username: string,
  problem: PracticeProblemDocument | null,
) {
  const [state, setState] = useState<SessionState>({
    code: '',
    language: 'javascript',
    isRunning: false,
    isSubmitting: false,
    submissionStatus: 'pending',
    testResults: [],
    verdict: null,
    passedTestCases: 0,
    totalTestCases: 0,
    executionTimeMs: 0,
    memoryUsedKb: 0,
    compileTimeMs: 0,
    codeSize: 0,
    phase: 'idle',
    currentTest: 0,
    totalTests: 0,
    phaseMessage: '',
  });

  const prevProblemRef = useRef<string | null>(null);
  const languageRef = useRef<CodingLanguage>(state.language);
  const codeRef = useRef<string>(state.code);

  useEffect(() => {
    if (!problem) return;
    if (prevProblemRef.current !== problem.id) {
      prevProblemRef.current = problem.id;
      const starter = problem.starterCode[state.language] || problem.starterCode.javascript || '';
      setState(s => ({ ...s, code: starter, testResults: [], verdict: null, phase: 'idle' }));
    }
  }, [problem?.id]);

  useEffect(() => {
    languageRef.current = state.language;
  }, [state.language]);
  useEffect(() => {
    codeRef.current = state.code;
  }, [state.code]);

  const setCode = useCallback((code: string) => {
    codeRef.current = code;
    setState(s => ({ ...s, code }));
  }, []);

  const setLanguage = useCallback((language: CodingLanguage) => {
    setState(s => {
      const starter = problem?.starterCode[language] || s.code;
      return { ...s, language, code: starter };
    });
  }, [problem]);

  const handleProgress = useCallback((progress: JudgeProgress) => {
    setState(s => ({
      ...s,
      phase: progress.phase,
      currentTest: progress.current ?? s.currentTest,
      totalTests: progress.total ?? s.totalTests,
      phaseMessage: progress.message ?? s.phaseMessage,
    }));
  }, []);

  const runTests = useCallback(async () => {
    if (!problem || !userId) return;
    setState(s => ({
      ...s, isRunning: true, testResults: [], verdict: null,
      phase: 'compiling', currentTest: 0, totalTests: 0, phaseMessage: 'Compiling...',
    }));

    const visibleTestCases = problem.testCases.filter(tc => !tc.isHidden).slice(0, 3);
    const { results, compileTimeMs, codeSize } = await submitSolution(
      userId, username, problem.id, languageRef.current, codeRef.current,
      visibleTestCases.map(tc => ({ input: tc.input, expected: tc.expected })),
      handleProgress,
    );

    setState(s => ({
      ...s, isRunning: false, testResults: results,
      passedTestCases: results.filter(r => r.passed).length,
      totalTestCases: results.length,
      compileTimeMs: compileTimeMs ?? 0,
      codeSize: codeSize ?? 0,
      phase: 'finished',
      phaseMessage: 'Run complete',
    }));
  }, [problem, userId, username, handleProgress]);

  const submit = useCallback(async () => {
    if (!problem || !userId) return;
    setState(s => ({
      ...s, isSubmitting: true, submissionStatus: 'running', testResults: [],
      phase: 'compiling', currentTest: 0, totalTests: 0, phaseMessage: 'Compiling...',
    }));

    const { submission, results, compileTimeMs, codeSize } = await submitSolution(
      userId, username, problem.id, languageRef.current, codeRef.current,
      problem.testCases.map(tc => ({ input: tc.input, expected: tc.expected, isHidden: tc.isHidden })),
      handleProgress,
    );

    setState(s => ({
      ...s, isSubmitting: false, submissionStatus: 'completed',
      testResults: results, verdict: submission.verdict,
      passedTestCases: submission.passedTestCases,
      totalTestCases: submission.totalTestCases,
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
      compileTimeMs: compileTimeMs ?? 0,
      codeSize: codeSize ?? 0,
      phase: 'finished',
      currentTest: results.length,
      phaseMessage: submission.verdict === 'Accepted' ? 'Accepted' : 'Failed',
    }));

    return submission;
  }, [problem, userId, username, handleProgress]);

  const resetCode = useCallback(() => {
    if (!problem) return;
    setState(s => ({
      ...s,
      code: problem.starterCode[s.language] || problem.starterCode.javascript || '',
      testResults: [],
      verdict: null,
      phase: 'idle',
      currentTest: 0,
      totalTests: 0,
      phaseMessage: '',
    }));
  }, [problem]);

  return {
    ...state,
    setCode,
    setLanguage,
    runTests,
    submit,
    resetCode,
  };
}
