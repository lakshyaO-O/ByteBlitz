'use client';

import type { Judge, JudgeRequest, JudgeResult } from './judge';
import type { Verdict, TestCaseResult } from '@/types';

function createSandbox(code: string, input: string): { execute: () => string; error?: string } {
  try {
    const fn = new Function('input', `
      const lines = input.trim().split('\\n');
      const parse = (line) => {
        try { return JSON.parse(line); } catch { return line; }
      };
      const parsed = lines.map(parse);
      const result = (function() {
        ${code}
      }).apply(null, parsed.length === 1 ? [parsed[0]] : parsed);
      return typeof result === 'object' ? JSON.stringify(result) : String(result);
    `);
    return { execute: () => fn(input) };
  } catch (err: any) {
    return { execute: () => '', error: err.message || 'Compilation Error' };
  }
}

export function createMockJudge(): Judge {
  return {
    async execute(request: JudgeRequest): Promise<JudgeResult> {
      const { code, testCases, timeLimitMs } = request;
      const totalCases = testCases.length;
      const results: TestCaseResult[] = [];
      let allPassed = true;
      let totalTimeMs = 0;
      let maxMemoryKb = 0;

      for (const tc of testCases) {
        const startTime = performance.now();
        const sandbox = createSandbox(code, tc.input);

        if (sandbox.error) {
          results.push({
            passed: false,
            input: tc.input,
            expectedOutput: tc.expected,
            actualOutput: '',
            executionTimeMs: 0,
            memoryUsedKb: 0,
            error: sandbox.error,
          });
          allPassed = false;
          continue;
        }

        try {
          const actualOutput = sandbox.execute();
          const elapsedMs = performance.now() - startTime;
          totalTimeMs += elapsedMs;
          const memoryKb = Math.round(Math.random() * 512 + 128);
          maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

          const passed = actualOutput.trim() === tc.expected.trim();
          if (!passed) allPassed = false;

          results.push({
            passed,
            input: tc.input,
            expectedOutput: tc.expected,
            actualOutput,
            executionTimeMs: Math.round(elapsedMs),
            memoryUsedKb: memoryKb,
          });
        } catch (err: any) {
          allPassed = false;
          results.push({
            passed: false,
            input: tc.input,
            expectedOutput: tc.expected,
            actualOutput: '',
            executionTimeMs: 0,
            memoryUsedKb: 0,
            error: err.message || 'Runtime Error',
          });
        }

        if (totalTimeMs > timeLimitMs) break;
      }

      const passedCount = results.filter(r => r.passed).length;
      let verdict: Verdict = 'Accepted';
      if (passedCount < totalCases) {
        const hasError = results.some(r => r.error);
        if (hasError) verdict = 'Runtime Error';
        else verdict = 'Wrong Answer';
      }

      return {
        verdict,
        passedTestCases: passedCount,
        totalTestCases: totalCases,
        executionTimeMs: Math.round(totalTimeMs),
        memoryUsedKb: maxMemoryKb,
        testCaseResults: results,
      };
    },
  };
}
