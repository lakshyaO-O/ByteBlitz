'use client';

import type { Judge, JudgeRequest, JudgeResult, JudgeProgress } from './judge';
import type { Verdict, TestCaseResult } from '@/types';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseInput(input: string): { names: string[]; values: any[] } {
  const names: string[] = [];
  const values: any[] = [];
  const pairs = input.split(/,\s*(?=[a-zA-Z_$]\w*\s*=)/);
  for (const pair of pairs) {
    const eqIdx = pair.indexOf('=');
    if (eqIdx === -1) {
      try { values.push(JSON.parse(pair.trim())); }
      catch { values.push(pair.trim()); }
      continue;
    }
    const name = pair.slice(0, eqIdx).trim();
    const raw = pair.slice(eqIdx + 1).trim();
    names.push(name);
    try { values.push(JSON.parse(raw)); }
    catch { values.push(raw); }
  }
  return { names, values };
}

function stripCommentsAndStrings(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^']*'/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/`[^`]*`/g, '');
}

function extractFunctionName(code: string): string | null {
  const cleaned = stripCommentsAndStrings(code);
  const fnDecl = cleaned.match(/\bfunction\s+(\w+)\s*\(/);
  if (fnDecl) return fnDecl[1];
  const decl = cleaned.match(/(?:const|let|var)\s+(\w+)\s*(?:[=(])/);
  if (decl) return decl[1];
  const fallback = code.match(/^(\w+)\s*[=(]/m);
  return fallback ? fallback[1] : null;
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }
  return false;
}

function compareOutput(actual: string, expected: string): boolean {
  if (actual.trim() === expected.trim()) return true;
  try {
    const parsedActual = JSON.parse(actual);
    const parsedExpected = JSON.parse(expected);
    if (typeof parsedActual === 'object' && typeof parsedExpected === 'object') {
      return deepEqual(parsedActual, parsedExpected);
    }
  } catch {}
  return false;
}

function valueToString(v: any): string {
  if (v === null || v === undefined) return '';
  if (Array.isArray(v)) return JSON.stringify(v);
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

interface SandboxResult {
  actualOutput: string;
  stdout: string;
  consoleOutput: string;
  error?: string;
}

function createSandbox(code: string, fnName: string | null): {
  run: (...args: any[]) => SandboxResult;
  error?: string;
} {
  let logs: string[] = [];
  let consoleLogs: string[] = [];
  const mockConsole = {
    log: (...args: any[]) => {
      const line = args.map(valueToString).join(' ');
      logs.push(line);
      consoleLogs.push(line);
    },
    error: (...args: any[]) => {
      const line = '[error] ' + args.map(valueToString).join(' ');
      logs.push(line);
      consoleLogs.push(line);
    },
    warn: (...args: any[]) => {
      const line = '[warn] ' + args.map(valueToString).join(' ');
      logs.push(line);
      consoleLogs.push(line);
    },
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
      return { run: () => ({ actualOutput: '', stdout: '', consoleOutput: '', error: 'No function found' }) };
    }
    return {
      run: (...args: any[]) => {
        logs = [];
        consoleLogs = [];
        try {
          const result = fn(...args);
          return {
            actualOutput: valueToString(result),
            stdout: logs.join('\n'),
            consoleOutput: consoleLogs.join('\n'),
          };
        } catch (err: any) {
          return {
            actualOutput: '',
            stdout: logs.join('\n'),
            consoleOutput: consoleLogs.join('\n'),
            error: err.message || 'Runtime Error',
          };
        }
      },
    };
  } catch (err: any) {
    return {
      run: () => ({ actualOutput: '', stdout: '', consoleOutput: '', error: err.message || 'Compilation Error' }),
      error: err.message || 'Compilation Error',
    };
  }
}

const SOLUTIONS: Record<string, string> = {
  'two-sum': `function twoSum(nums, target) { const map = {}; for (let i = 0; i < nums.length; i++) { const complement = target - nums[i]; if (complement in map) return [map[complement], i]; map[nums[i]] = i; } return []; }`,
  'reverse-string': `function reverseString(s) { let left = 0, right = s.length - 1; while (left < right) { const tmp = s[left]; s[left] = s[right]; s[right] = tmp; left++; right--; } return s; }`,
  'palindrome-number': `function isPalindrome(x) { if (x < 0) return false; const s = String(x); let l = 0, r = s.length - 1; while (l < r) { if (s[l] !== s[r]) return false; l++; r--; } return true; }`,
  'valid-parentheses': `function isValid(s) { const stack = []; const pairs = { ')': '(', ']': '[', '}': '{' }; for (const ch of s) { if (ch === '(' || ch === '[' || ch === '{') { stack.push(ch); } else if (pairs[ch] && stack.pop() !== pairs[ch]) { return false; } } return stack.length === 0; }`,
  'merge-sorted-array': `function merge(nums1, m, nums2, n) { let i = m - 1, j = n - 1, k = m + n - 1; while (j >= 0) { if (i >= 0 && nums1[i] > nums2[j]) { nums1[k] = nums1[i]; i--; } else { nums1[k] = nums2[j]; j--; } k--; } return nums1; }`,
  'fibonacci': `function fibonacci(n) { if (n <= 1) return n; let a = 0, b = 1; for (let i = 2; i <= n; i++) { const c = a + b; a = b; b = c; } return b; }`,
  'fizz-buzz': `function fizzBuzz(n) { const result = []; for (let i = 1; i <= n; i++) { if (i % 15 === 0) result.push('FizzBuzz'); else if (i % 3 === 0) result.push('Fizz'); else if (i % 5 === 0) result.push('Buzz'); else result.push(String(i)); } return result; }`,
  'max-subarray': `function maxSubArray(nums) { let max = nums[0], cur = nums[0]; for (let i = 1; i < nums.length; i++) { cur = Math.max(nums[i], cur + nums[i]); max = Math.max(max, cur); return max; }`,
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

function computePerCaseVerdict(
  passed: boolean,
  error?: string,
  elapsedMs?: number,
  timeLimitMs?: number,
): Verdict {
  if (error) {
    if (error.includes('Compilation')) return 'Compilation Error';
    if (error === 'Time Limit Exceeded') return 'Time Limit Exceeded';
    if (error === 'Memory Limit Exceeded') return 'Memory Limit Exceeded';
    return 'Runtime Error';
  }
  if (elapsedMs && timeLimitMs && elapsedMs > timeLimitMs) return 'Time Limit Exceeded';
  if (!passed) return 'Wrong Answer';
  return 'Accepted';
}

export function createMockJudge(): Judge {
  return {
    async execute(
      request: JudgeRequest,
      onProgress?: (progress: JudgeProgress) => void,
    ): Promise<JudgeResult> {
      const { code, language, testCases, timeLimitMs, problemId } = request;
      const totalCases = testCases.length;
      const testCaseResults: TestCaseResult[] = [];
      let allPassed = true;
      let totalTimeMs = 0;
      let maxMemoryKb = 0;
      let globalError: string | undefined;
      let compileError: string | undefined;

      // ── Compile Phase ──
      onProgress?.({ phase: 'compiling', message: 'Parsing and compiling code...' });
      const compileStart = performance.now();
      await sleep(80 + Math.random() * 60);

      const fnName = extractFunctionName(code);
      let sandboxError: string | undefined;

      // Try creating sandbox — this catches syntax errors = compilation error
      const testSandbox = createSandbox(code, fnName);
      sandboxError = testSandbox.error;

      if (sandboxError) {
        compileError = sandboxError;
        compileError = sandboxError.includes('SyntaxError')
          ? `Compilation Error: ${sandboxError}`
          : sandboxError;
      }

      const compileTimeMs = Math.round(performance.now() - compileStart);
      const codeSize = new TextEncoder().encode(code).length;

      if (compileError) {
        onProgress?.({ phase: 'error', message: 'Compilation failed' });
        const compileTestCase: TestCaseResult = {
          passed: false,
          verdict: 'Compilation Error',
          input: '',
          expectedOutput: '',
          actualOutput: '',
          executionTimeMs: 0,
          memoryUsedKb: 0,
          exitCode: 1,
          error: compileError,
        };
        testCaseResults.push(compileTestCase);

        return {
          verdict: 'Compilation Error',
          passedTestCases: 0,
          totalTestCases: totalCases,
          executionTimeMs: 0,
          memoryUsedKb: 0,
          compileTimeMs,
          codeSize,
          testCaseResults: [compileTestCase],
          compileError,
        };
      }

      // ── Execution Phase ──
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        onProgress?.({ phase: 'running', current: i + 1, total: totalCases, message: `Running Test ${i + 1}/${totalCases}` });

        const { names, values } = parseInput(tc.input);
        const sandbox = createSandbox(code, fnName);

        // Check TLE before execution (cumulative)
        if (totalTimeMs > timeLimitMs) {
          testCaseResults.push({
            passed: false,
            verdict: 'Time Limit Exceeded',
            input: tc.isHidden ? '' : tc.input,
            expectedOutput: tc.expected,
            actualOutput: '',
            executionTimeMs: 0,
            memoryUsedKb: 0,
            exitCode: 124,
            error: 'Time Limit Exceeded: cumulative execution time exceeded limit',
          });
          allPassed = false;
          continue;
        }

        const startTime = performance.now();
        await sleep(20 + Math.random() * 40); // simulate realistic timing
        const result = sandbox.run(...values);
        const elapsedMs = performance.now() - startTime;
        totalTimeMs += elapsedMs;

        const memoryKb = estimateMemory(tc.input);
        maxMemoryKb = Math.max(maxMemoryKb, memoryKb);

        let expected = tc.expected;
        if (tc.isHidden && (!expected || expected === '0' || expected === '1')) {
          const refOutput = problemId ? getReferenceOutput(problemId, tc.input) : null;
          if (refOutput !== null) expected = refOutput;
        }

        // Determine per-test-case error/verdict
        let passed = false;
        let caseError: string | undefined;
        let verdict: Verdict = 'Accepted';
        let exitCode = 0;

        if (result.error) {
          caseError = result.error;
          if (caseError.includes('Compilation')) {
            verdict = 'Compilation Error';
            exitCode = 1;
          } else {
            verdict = 'Runtime Error';
            exitCode = 1;
          }
        } else if (elapsedMs > timeLimitMs) {
          caseError = 'Time Limit Exceeded: test case took too long';
          verdict = 'Time Limit Exceeded';
          exitCode = 124;
        } else {
          const canValidate = expected && expected !== '0' && expected !== '1';
          passed = canValidate
            ? compareOutput(result.actualOutput, expected)
            : true;
          if (!passed) {
            verdict = 'Wrong Answer';
            exitCode = 0;
          }
        }

        if (!passed && verdict !== 'Time Limit Exceeded') allPassed = false;

        const showInput = !tc.isHidden;

        testCaseResults.push({
          passed,
          verdict,
          input: showInput ? tc.input : '',
          expectedOutput: expected || '',
          actualOutput: result.actualOutput || '',
          executionTimeMs: Math.round(elapsedMs),
          memoryUsedKb: memoryKb,
          exitCode,
          error: caseError,
          stdout: result.stdout || undefined,
          consoleOutput: result.consoleOutput || undefined,
        });
      }

      const passedCount = testCaseResults.filter(r => r.passed).length;

      // Overall verdict
      let verdict: Verdict = 'Accepted';
      if (passedCount < totalCases) {
        const hasCompile = testCaseResults.some(r => r.verdict === 'Compilation Error');
        const hasTLE = testCaseResults.some(r => r.verdict === 'Time Limit Exceeded');
        const hasRuntime = testCaseResults.some(r => r.verdict === 'Runtime Error');
        const hasWA = testCaseResults.some(r => r.verdict === 'Wrong Answer');
        if (hasCompile) verdict = 'Compilation Error';
        else if (hasTLE) verdict = 'Time Limit Exceeded';
        else if (hasRuntime) verdict = 'Runtime Error';
        else if (hasWA) verdict = 'Wrong Answer';
      }

      const hasMLE = testCaseResults.some(r => r.verdict === 'Memory Limit Exceeded');
      if (hasMLE) verdict = 'Memory Limit Exceeded';

      onProgress?.({ phase: 'finished', message: 'Execution complete' });

      return {
        verdict,
        passedTestCases: passedCount,
        totalTestCases: totalCases,
        executionTimeMs: Math.round(totalTimeMs),
        memoryUsedKb: maxMemoryKb,
        compileTimeMs,
        codeSize,
        testCaseResults,
      };
    },
  };
}
