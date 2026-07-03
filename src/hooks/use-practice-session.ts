'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import type { CodingLanguage, PracticeProblemDocument, TestCaseResult, Verdict, SubmissionStatus } from '@/types';
import { saveCode, loadSavedCode, submitSolution } from '@/services/practice';

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
  lastSaved: Date | null;
  isDirty: boolean;
  executionTimeMs: number;
  memoryUsedKb: number;
}

export function usePracticeSession(userId: string | null, problem: PracticeProblemDocument | null) {
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
    lastSaved: null,
    isDirty: false,
    executionTimeMs: 0,
    memoryUsedKb: 0,
  });

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const prevProblemRef = useRef<string | null>(null);
  const languageRef = useRef<CodingLanguage>(state.language);
  const codeRef = useRef<string>(state.code);

  useEffect(() => {
    if (!problem) return;
    if (prevProblemRef.current !== problem.id) {
      prevProblemRef.current = problem.id;
      const starter = problem.starterCode[state.language] || problem.starterCode.javascript || '';
      setState(s => ({ ...s, code: starter, testResults: [], verdict: null }));
      if (userId) {
        loadSavedCode(userId, problem.id).then(saved => {
          if (saved) setState(s => ({ ...s, code: saved }));
        });
      }
    }
  }, [problem?.id, userId]);

  useEffect(() => {
    languageRef.current = state.language;
  }, [state.language]);
  useEffect(() => {
    codeRef.current = state.code;
  }, [state.code]);

  const setCode = useCallback((code: string) => {
    codeRef.current = code;
    setState(s => ({ ...s, code, isDirty: true }));
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      if (userId && problem) {
        saveCode(userId, problem.id, languageRef.current, code);
        setState(s => ({ ...s, lastSaved: new Date(), isDirty: false }));
      }
    }, 2000);
  }, [userId, problem]);

  const setLanguage = useCallback((language: CodingLanguage) => {
    setState(s => {
      const starter = problem?.starterCode[language] || s.code;
      return { ...s, language, code: starter };
    });
  }, [problem]);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const runTests = useCallback(async () => {
    if (!problem || !userId) return;
    setState(s => ({ ...s, isRunning: true, testResults: [], verdict: null }));

    const visibleTestCases = problem.testCases.filter(tc => !tc.isHidden).slice(0, 3);
    const { results } = await submitSolution(
      userId, '', problem.id, languageRef.current, codeRef.current,
      visibleTestCases.map(tc => ({ input: tc.input, expected: tc.expected })),
    );

    setState(s => ({
      ...s, isRunning: false, testResults: results,
      passedTestCases: results.filter(r => r.passed).length,
      totalTestCases: results.length,
    }));
  }, [problem, userId]);

  const submit = useCallback(async () => {
    if (!problem || !userId) return;
    setState(s => ({ ...s, isSubmitting: true, submissionStatus: 'running', testResults: [] }));

    const { submission, results } = await submitSolution(
      userId, '', problem.id, languageRef.current, codeRef.current,
      problem.testCases.map(tc => ({ input: tc.input, expected: tc.expected, isHidden: tc.isHidden })),
    );

    setState(s => ({
      ...s, isSubmitting: false, submissionStatus: 'completed',
      testResults: results, verdict: submission.verdict,
      passedTestCases: submission.passedTestCases,
      totalTestCases: submission.totalTestCases,
      executionTimeMs: submission.executionTimeMs,
      memoryUsedKb: submission.memoryUsedKb,
    }));

    return submission;
  }, [problem, userId]);

  const resetCode = useCallback(() => {
    if (!problem) return;
    setState(s => ({
      ...s,
      code: problem.starterCode[s.language] || problem.starterCode.javascript || '',
      testResults: [],
      verdict: null,
      isDirty: false,
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
