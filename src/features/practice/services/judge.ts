'use client';

import type { Verdict, CodingLanguage, TestCaseResult, ExecutionPhase } from '@/types';

export interface JudgeProgress {
  phase: ExecutionPhase;
  current?: number;
  total?: number;
  message?: string;
}

export interface JudgeResult {
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  compileTimeMs: number;
  codeSize: number;
  testCaseResults: TestCaseResult[];
  stdout?: string;
  stderr?: string;
  compileError?: string;
}

export interface JudgeRequest {
  code: string;
  language: CodingLanguage;
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>;
  timeLimitMs: number;
  memoryLimitKb: number;
  problemId?: string;
}

export interface Judge {
  execute(
    request: JudgeRequest,
    onProgress?: (progress: JudgeProgress) => void,
  ): Promise<JudgeResult>;
}
