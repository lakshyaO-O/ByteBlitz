'use client';

import type { Judge, JudgeRequest, JudgeResult, JudgeProgress } from './judge';
import { getAuth } from 'firebase/auth';
import { initializeFirebase } from '@/firebase';

const EXECUTE_URL = '/api/judge/execute';

async function getIdToken(): Promise<string> {
  const { auth } = initializeFirebase();
  if (!auth) throw new Error('Firebase Auth not initialized');
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  return user.getIdToken();
}

async function callJudgeApi(request: JudgeRequest): Promise<JudgeResult> {
  const idToken = await getIdToken();

  const response = await fetch(EXECUTE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      code: request.code,
      language: request.language,
      testCases: request.testCases.map(tc => ({
        input: tc.input,
        expected: tc.expected || '',
        isHidden: tc.isHidden || false,
      })),
      timeLimitMs: request.timeLimitMs,
      memoryLimitKb: request.memoryLimitKb,
      problemId: request.problemId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(errorData.error || `Judge API returned ${response.status}`);
  }

  return response.json();
}

export function createApiJudge(): Judge {
  return {
    async execute(
      request: JudgeRequest,
      onProgress?: (progress: JudgeProgress) => void,
    ): Promise<JudgeResult> {
      const totalCases = request.testCases.length;

      onProgress?.({
        phase: 'compiling',
        message: 'Submitting code for execution...',
      });

      try {
        const result = await callJudgeApi(request);

        onProgress?.({
          phase: 'finished',
          message: 'Execution complete',
        });

        return result;
      } catch (err: any) {
        onProgress?.({
          phase: 'error',
          message: err.message || 'Execution failed',
        });

        return {
          verdict: 'Runtime Error',
          passedTestCases: 0,
          totalTestCases: totalCases,
          executionTimeMs: 0,
          memoryUsedKb: -1,
          compileTimeMs: -1,
          codeSize: new TextEncoder().encode(request.code).length,
          testCaseResults: [{
            passed: false,
            verdict: 'Runtime Error',
            input: '',
            expectedOutput: '',
            actualOutput: '',
            executionTimeMs: 0,
            memoryUsedKb: -1,
            exitCode: 1,
            error: err.message || 'Execution failed',
          }],
          stderr: err.message,
        };
      }
    },
  };
}
