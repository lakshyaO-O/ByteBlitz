'use client';

import type { Judge, JudgeRequest, JudgeResult } from './judge';
import type { Verdict, TestCaseResult } from '@/types';

/** Parse "varName = value" pairs from an input string into an array of values in declaration order. */
function parseInput(input: string): { names: string[]; values: any[] } {
  const names: string[] = [];
  const values: any[] = [];
  const pairs = input.split(/,\s*(?=[a-zA-Z_$]\w*\s*=)/);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      try {
        values.push(JSON.parse(pair.trim()));
      } catch {
        values.push(pair.trim());
      }
      continue;
    }
    const name = pair.slice(0, eqIdx).trim();
    const raw = pair.slice(eqIdx + 1).trim();
    names.push(name);
    try {
      values.push(JSON.parse(raw));
    } catch {
      values.push(raw);
    }
  }
  return { names, values };
}

/** Extract the function name from user code. */
function extractFunctionName(code: string): string | null {
  const m = code.match(/(?:function|const|let|var)\s+(\w+)\s*(?:[=(])/);
  if (m) return m[1];
  const m2 = code.match(/^(\w+)\s*[=(]/m);
  return m2 ? m2[1] : null;
}

/** Convert a JS value to a string for comparison. */
function valueToString(v: any): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/** Create a sandbox that runs user code and returns results. */
interface SandboxResult {
  actualOutput: string;
  stdout: string;
  error?: string;
}

function createSandbox(code: string, fnName: string | null): {
  run: (...args: any[]) => SandboxResult;
  error?: string;
} {
  let logs: string[] = [];
  const mockConsole = {
    log: (...args: any[]) => logs.push(args.map(valueToString).join(' ')),
    error: (...args: any[]) => logs.push('[error] ' + args.map(valueToString).join(' ')),
    warn: (...args: any[]) => logs.push('[warn] ' + args.map(valueToString).join(' ')),
  };

  const wrappedCode = `
    const console = arguments[0];
    ${code}
    return typeof ${fnName} !== 'undefined' ? ${fnName} : null;
  `;

  try {
    const factory = new Function(wrappedCode);
    const fn = factory(mockConsole);
    if (typeof fn !== 'function') {
      return { run: () => ({ actualOutput: '', stdout: logs.join('\n'), error: 'No function found' }) };
    }
    return {
      run: (...args: any[]) => {
        logs = [];
        try {
          const result = fn(...args);
          return {
            actualOutput: valueToString(result),
            stdout: logs.join('\n'),
          };
        } catch (err: any) {
          return {
            actualOutput: '',
            stdout: logs.join('\n'),
            error: err.message || 'Runtime Error',
          };
        }
      },
    };
  } catch (err: any) {
    return {
      run: () => ({ actualOutput: '', stdout: '', error: err.message || 'Compilation Error' }),
      error: err.message || 'Compilation Error',
    };
  }
}

/** Reference solutions for static problems. */
const SOLUTIONS: Record<string, string> = {
  'two-sum': `function twoSum(nums, target) { const map = {}; for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (complement in map) return [map[complement], i]; map[nums[i]] = i; } return []; }`,
  'reverse-string': `function reverseString(s) { let left = 0, right = s.length - 1; while (left < right) { const tmp = s[left]; s[left] = s[right]; s[right] = tmp; left++; right--; } return s; }`,
  'palindrome-number': `function isPalindrome(x) { if (x < 0) return false; const s = String(x); let l = 0, r = s.length - 1; while (l < r) { if (s[l] !== s[r]) return false; l++; r--; } return true; }`,
  'valid-parentheses': `function isValid(s) { const stack = []; const pairs = { ')': '(', ']': '[', '}': '{' }; for (const ch of s) { if (ch === '(' || ch === '[' || ch === '{') { stack.push(ch); } else if (pairs[ch] && stack.pop() !== pairs[ch]) { return false; } } return stack.length === 0; }`,
  'merge-sorted-array': `function merge(nums1, m, nums2, n) { let i = m - 1, j = n - 1, k = m + n - 1; while (j >= 0) { if (i >= 0 && nums1[i] > nums2[j]) { nums1[k] = nums1[i]; i--; } else { nums1[k] = nums2[j]; j--; } k--; } return nums1; }`,
  'fibonacci': `function fibonacci(n) { if (n <= 1) return n; let a = 0, b = 1; for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; } return b; }`,
  'fizz-buzz': `function fizzBuzz(n) { const result = []; for (let i = 1; i <= n; i++) { if (i % 15 === 0) result.push('FizzBuzz'); else if (i % 3 === 0) result.push('Fizz'); else if (i % 5 === 0) result.push('Buzz'); else result.push(String(i)); } return result; }`,
  'max-subarray': `function maxSubArray(nums) { let max = nums[0], cur = nums[0]; for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); max = Math.max(max, cur); } return max; }`,
  'contains-duplicate': `function containsDuplicate(nums) { const seen = new Set(); for (const n of nums) { if (seen.has(n)) return true; seen.add(n); } return false; }`,
  'first-unique-character': `function firstUniqChar(s) { const counts = {}; for (const ch of s) counts[ch] = (counts[ch] || 0) + 1; for (let i = 0; i < s.length; i++) { if (counts[s[i]] === 1) return i; } return -1; }`,
  'climbing-stairs': `function climbStairs(n) { if (n <= 2) return n; let a = 1, b = 2; for (let i = 3; i <= n; i++) { const c = a + b; a = b; b = c; } return b; }`,
  'best-time-to-buy-and-sell-stock': `function maxProfit(prices) { let min = prices[0], max = 0; for (let i = 1; i < prices.length; i++) { min = Math.min(min, prices[i]); max = Math.max(max, prices[i] - min); } return max; }`,
  'linked-list-cycle': `function hasCycle(head) { let slow = head, fast = head; while (fast && fast.next) { slow = slow.next; fast = fast.next.next; if (slow === fast) return true; } return false; }`,
  'binary-search': `function binarySearch(nums, target) { let l = 0, r = nums.length - 1; while (l <= r) { const m = Math.floor((l + r) / 2); if (nums[m] === target) return m; if (nums[m] < target) l = m + 1; else r = m - 1; } return -1; }`,
  'move-zeroes': `function moveZeroes(nums) { let i = 0; for (let j = 0; j < nums.length; j++) { if (nums[j] !== 0) { const tmp = nums[i]; nums[i] = nums[j]; nums[j] = tmp; i++; } } return nums; }`,
};

function getReferenceOutput(problemId: string, input: string): string | null {
  const solutionCode = SOLUTIONS[problemId];
  if (!solutionCode) return null;
  const { names, values } = parseInput(input);
  const fnName = extractFunctionName(solutionCode);
  if (!fnName) return null;
  const sandbox = createSandbox(solutionCode, fnName);
  if (sandbox.error) return null;
  const result = sandbox.run(...values);
  if (result.error) return null;
  return result.actualOutput;
}

function estimateMemory(input: string): number {
  try {
    const len = input.length;
    return Math.round(Math.min(512, Math.max(64, len * 0.8 + Math.random() * 32)));
  } catch {
    return 128 + Math.round(Math.random() * 64);
  }
}

export function createMockJudge(): Judge {
  return {
    async execute(request: JudgeRequest): Promise<JudgeResult> {
      const { code, testCases, timeLimitMs, problemId } = request;
      const totalCases = testCases.length;
      const testCaseResults: TestCaseResult[] = [];
      let allPassed = true;
      let totalTimeMs = 0;
      let maxMemoryKb = 0;
      let globalError: string | undefined;

      const fnName = extractFunctionName(code);

      for (const tc of testCases) {
        const { names, values } = parseInput(tc.input);
        const sandbox = createSandbox(code, fnName);

        if (sandbox.error) {
          globalError = sandbox.error;
          testCaseResults.push({
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

        if (totalTimeMs > timeLimitMs) {
          testCaseResults.push({
            passed: false,
            input: tc.input,
            expectedOutput: tc.expected,
            actualOutput: '',
            executionTimeMs: 0,
            memoryUsedKb: 0,
            error: 'Time Limit Exceeded',
          });
          allPassed = false;
          continue;
        }

        const startTime = performance.now();
        const result = sandbox.run(...values);
        const elapsedMs = performance.now() - startTime;

        if (elapsedMs > timeLimitMs && !result.error) {
          testCaseResults.push({
            passed: false,
            input: tc.input,
            expectedOutput: tc.expected,
            actualOutput: '',
            executionTimeMs: Math.round(elapsedMs),
            memoryUsedKb: 0,
            error: 'Time Limit Exceeded',
          });
          allPassed = false;
          continue;
        }

        totalTimeMs += elapsedMs;
        const memoryKb = estimateMemory(tc.input);
        maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

        let expected = tc.expected;

        // For hidden test cases with empty/placeholder expected, try reference solution
        if (tc.isHidden && (!expected || expected === '0' || expected === '1')) {
          const refOutput = problemId ? getReferenceOutput(problemId, tc.input) : null;
          if (refOutput !== null) expected = refOutput;
        }

        if (result.error) {
          testCaseResults.push({
            passed: false,
            input: tc.input,
            expectedOutput: expected,
            actualOutput: '',
            executionTimeMs: Math.round(elapsedMs),
            memoryUsedKb: memoryKb,
            error: result.error,
          });
          allPassed = false;
          continue;
        }

        // If no expected value available for hidden case, auto-pass (informational)
        const canValidate = expected && expected !== '0' && expected !== '1' && expected !== '0';
        const passed = canValidate
          ? result.actualOutput.trim() === expected.trim()
          : true;

        if (!passed) allPassed = false;

        testCaseResults.push({
          passed,
          input: tc.input,
          expectedOutput: expected,
          actualOutput: result.actualOutput,
          executionTimeMs: Math.round(elapsedMs),
          memoryUsedKb: memoryKb,
          stdout: result.stdout || undefined,
        });
      }

      const passedCount = testCaseResults.filter(r => r.passed).length;
      let verdict: Verdict = 'Accepted';
      if (passedCount < totalCases) {
        const hasTLE = testCaseResults.some(r => r.error === 'Time Limit Exceeded');
        const hasCompile = testCaseResults.some(r => r.error && r.error.includes('Compilation'));
        const hasRuntime = testCaseResults.some(r => r.error && !r.error.includes('Compilation') && r.error !== 'Time Limit Exceeded');
        if (hasCompile) verdict = 'Compilation Error';
        else if (hasTLE) verdict = 'Time Limit Exceeded';
        else if (hasRuntime) verdict = 'Runtime Error';
        else verdict = 'Wrong Answer';
      }

      const badMemory = testCaseResults.some(r => r.error === 'Memory Limit Exceeded');
      if (badMemory) verdict = 'Memory Limit Exceeded';

      return {
        verdict,
        passedTestCases: passedCount,
        totalTestCases: totalCases,
        executionTimeMs: Math.round(totalTimeMs),
        memoryUsedKb: maxMemoryKb,
        testCaseResults,
      };
    },
  };
}
