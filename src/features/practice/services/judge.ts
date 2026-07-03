'use client';

import type { Verdict, CodingLanguage, TestCaseResult } from '@/types';

export interface JudgeResult {
  verdict: Verdict;
  passedTestCases: number;
  totalTestCases: number;
  executionTimeMs: number;
  memoryUsedKb: number;
  testCaseResults: TestCaseResult[];
  stdout?: string;
  stderr?: string;
}

export interface JudgeRequest {
  code: string;
  language: CodingLanguage;
  testCases: Array<{ input: string; expected: string; isHidden?: boolean }>;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface Judge {
  execute(request: JudgeRequest): Promise<JudgeResult>;
}
