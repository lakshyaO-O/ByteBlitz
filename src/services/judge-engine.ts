import type { Verdict, CodingLanguage, TestCaseResult } from '@/types';
import { getAdminFirestore } from '@/firebase/admin';

interface TestCase {
  input: string;
  expected: string;
  isHidden?: boolean;
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
  compileError?: string;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  signal: string | null;
  compileOutput: string | null;
  compileCode: number | null;
  time: number | null;
  memory: number | null;
}

const SUPPORTED_LANGUAGES: CodingLanguage[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];

export function isLanguageSupported(language: CodingLanguage): boolean {
  return SUPPORTED_LANGUAGES.includes(language);
}

function stripCommentsAndStrings(code: string): string {
  return code
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^']*'/g, '')
    .replace(/"[^"]*"/g, '')
    .replace(/`[^`]*`/g, '');
}

function extractFunctionName(code: string, language: CodingLanguage): string | null {
  const cleaned = stripCommentsAndStrings(code);
  if (language === 'javascript' || language === 'typescript') {
    const fnDecl = cleaned.match(/\bfunction\s+(\w+)\s*\(/);
    if (fnDecl) return fnDecl[1];
    const arrow = cleaned.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
    if (arrow) return arrow[1];
    const fallback = code.match(/^(\w+)\s*[=(]/m);
    return fallback ? fallback[1] : null;
  }
  if (language === 'python') {
    const match = cleaned.match(/^def\s+(\w+)\s*\(/m);
    if (match) return match[1];
    return null;
  }
  if (language === 'java') {
    const classMatch = cleaned.match(/class\s+(\w+)/);
    if (classMatch) {
      const body = cleaned.slice(classMatch.index! + classMatch[0].length);
      const methodMatch = body.match(/(?:public\s+)?(?:\w+(?:\[\])?\s+)+\s*(\w+)\s*\(/);
      return methodMatch ? methodMatch[1] : null;
    }
    const methodMatch = cleaned.match(/(?:\w+(?:\[\])?\s+)+(\w+)\s*\(/);
    return methodMatch ? methodMatch[1] : null;
  }
  if (language === 'cpp') {
    const classMatch = cleaned.match(/class\s+(\w+)/);
    if (classMatch) {
      const body = cleaned.slice(classMatch.index! + classMatch[0].length);
      const methodMatch = body.match(/(?:\w+(?:<[^>]*>)?(?:\s*&)?\s+)+(\w+)\s*\(/);
      return methodMatch ? methodMatch[1] : null;
    }
    const methodMatch = cleaned.match(/(?:\w+(?:<[^>]*>)?(?:\s*&)?\s+)+(\w+)\s*\(/);
    return methodMatch ? methodMatch[1] : null;
  }
  return null;
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

function inferTypeName(value: any): string {
  if (value === null || value === undefined) return 'int';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'int[]';
    const elemType = inferTypeName(value[0]);
    return elemType + '[]';
  }
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return Number.isInteger(value) ? 'int' : 'double';
  if (typeof value === 'string') return 'string';
  return 'int';
}

function javaType(typeName: string): string {
  const map: Record<string, string> = {
    'int': 'int', 'double': 'double', 'boolean': 'boolean', 'string': 'String',
    'int[]': 'int[]', 'double[]': 'double[]', 'boolean[]': 'boolean[]', 'string[]': 'String[]',
    'int[][]': 'int[][]', 'string[][]': 'String[][]',
  };
  return map[typeName] || 'Object';
}

function pyValue(value: any): string {
  if (value === null) return 'None';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number' || typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(v => pyValue(v)).join(', ') + ']';
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([k, v]) => `${JSON.stringify(k)}: ${pyValue(v)}`);
    return '{' + entries.join(', ') + '}';
  }
  return String(value);
}

function javaValue(value: any): string {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return String(value);
  if (typeof value === 'number') {
    if (Number.isInteger(value) && Math.abs(value) <= 2147483647) return String(value);
    return String(value) + (Number.isInteger(value) ? 'L' : 'd');
  }
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return `new int[0]`;
    const elemType = inferTypeName(value[0]);
    const inner = value.map(v => javaValue(v)).join(', ');
    return `new ${javaType(elemType + '[]')}{${inner}}`;
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function cppValue(value: any): string {
  if (value === null) return '0';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string') return JSON.stringify(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return '{}';
    return '{' + value.map(v => cppValue(v)).join(', ') + '}';
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function valueToCode(value: any, language: CodingLanguage): string {
  switch (language) {
    case 'javascript':
    case 'typescript':
      return JSON.stringify(value);
    case 'python':
      return pyValue(value);
    case 'java':
      return javaValue(value);
    case 'cpp':
      return cppValue(value);
    default:
      return JSON.stringify(value);
  }
}

function hasReturnStatement(code: string): boolean {
  return /\breturn\b/.test(stripCommentsAndStrings(code));
}

function determineIsVoid(code: string, fnName: string | null, _language: CodingLanguage): boolean {
  if (!fnName) return false;
  if (_language === 'java' || _language === 'cpp') {
    const cleaned = stripCommentsAndStrings(code);
    const escapedName = fnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const voidPattern = new RegExp(`(?:\\w+\\s+)*void\\s+${escapedName}\\s*\\(`);
    return voidPattern.test(cleaned);
  }
  return !hasReturnStatement(code);
}

function generateTestHarness(
  code: string,
  fnName: string | null,
  args: any[],
  language: CodingLanguage,
): string {
  const fn = fnName || 'solution';
  const isVoid = determineIsVoid(code, fnName, language);

  switch (language) {
    case 'javascript':
    case 'typescript': {
      const values = args.map(v => valueToCode(v, language));
      const call = `${fn}(${values.join(', ')})`;
      if (values.length === 0) {
        return `${code}\nconst __result = ${fn}();\nconsole.log(JSON.stringify(__result === undefined ? null : __result));`;
      }
      return `${code}\nconst __args = [${values.join(', ')}];\nconst __result = ${fn}(...__args);\nconsole.log(JSON.stringify(__result === undefined ? (__args.length === 1 ? __args[0] : __args) : __result));`;
    }

    case 'python': {
      const values = args.map(v => valueToCode(v, language));
      const codeLines = code.split('\n');
      const hasImport = codeLines.some(l => /^import\s+\w/.test(l) || /^from\s+\w/.test(l));
      const importBlock = 'import json\n';
      if (args.length === 0) {
        return `${importBlock}${code}\n__result = ${fn}()\nprint(json.dumps(__result))`;
      }
      return `${importBlock}${code}\n__args = [${values.join(', ')}]\n__result = ${fn}(*__args)\nif __result is None:\n    print(json.dumps(__args if len(__args) > 1 else __args[0]))\nelse:\n    print(json.dumps(__result))`;
    }

    case 'java': {
      const values = args.map(v => valueToCode(v, 'java'));
      const methodCall = `${fn}(${values.join(', ')})`;
      const returnType = isVoid ? 'void' : 'Object';

      if (code.includes('class Solution') || code.includes('class Solution ')) {
        const lines = code.split('\n');
        const userCode = lines.join('\n');
        const arrayToString = '    static String arrayToString(Object o) {\n        if (o == null) return "null";\n        if (o instanceof int[]) return Arrays.toString((int[])o);\n        if (o instanceof long[]) return Arrays.toString((long[])o);\n        if (o instanceof double[]) return Arrays.toString((double[])o);\n        if (o instanceof boolean[]) return Arrays.toString((boolean[])o);\n        if (o instanceof char[]) return Arrays.toString((char[])o);\n        if (o instanceof String[]) return Arrays.toString((String[])o);\n        if (o instanceof Object[]) return Arrays.deepToString((Object[])o);\n        return String.valueOf(o);\n    }';
        if (isVoid) {
          const argDecls = args.map((v, i) => `        ${javaType(inferTypeName(v))} __arg${i} = ${values[i]};`).join('\n');
          const argRefs = args.map((_, i) => `__arg${i}`).join(', ');
          return `import java.util.*;\nimport java.util.stream.*;\n\n${userCode}\n\nclass Main {\n    public static void main(String[] args) {\n        Solution __s = new Solution();\n${argDecls}\n        __s.${fn}(${argRefs});\n        System.out.println(arrayToString(${args.length === 1 ? '__arg0' : `new Object[]{${argRefs}}`}));\n    }\n\n${arrayToString}\n}`;
        }
        return `import java.util.*;\nimport java.util.stream.*;\n\n${userCode}\n\nclass Main {\n    public static void main(String[] args) {\n        Solution __s = new Solution();\n        Object __res = __s.${methodCall};\n        System.out.println(arrayToString(__res));\n    }\n\n${arrayToString}\n}`;
      }

      {
        const funcReturnType = isVoid ? 'void' : 'Object';
        const argDecls = args.map((v, i) => `        ${javaType(inferTypeName(v))} __arg${i} = ${values[i]};`).join('\n');
        const argRefs = args.map((_, i) => `__arg${i}`).join(', ');
        const methodParams = args.map((v, i) => `${javaType(inferTypeName(v))} __p${i}`).join(', ');
        const arrayToString = '    static String arrayToString(Object o) {\n        if (o == null) return "null";\n        if (o instanceof int[]) return Arrays.toString((int[])o);\n        if (o instanceof long[]) return Arrays.toString((long[])o);\n        if (o instanceof double[]) return Arrays.toString((double[])o);\n        if (o instanceof boolean[]) return Arrays.toString((boolean[])o);\n        if (o instanceof char[]) return Arrays.toString((char[])o);\n        if (o instanceof String[]) return Arrays.toString((String[])o);\n        if (o instanceof Object[]) return Arrays.deepToString((Object[])o);\n        return String.valueOf(o);\n    }';
        return `import java.util.*;\n\nclass Main {\n    static ${funcReturnType} ${fn}(${methodParams}) {\n${code.split('\n').map(l => '        ' + l).join('\n')}\n    }\n\n    public static void main(String[] args) {\n${argDecls}\n        ${isVoid ? '' : 'Object __res = '}${fn}(${argRefs});\n        System.out.println(arrayToString(${isVoid ? (args.length === 1 ? '__arg0' : `new Object[]{${argRefs}}`) : '__res'}));\n    }\n\n${arrayToString}\n}`;
      }
    }

    case 'cpp': {
      const values = args.map(v => valueToCode(v, 'cpp'));
      const valueDecls = args.map((v, i) => {
        const type = inferTypeName(v);
        if (type === 'int' || type === 'double' || type === 'boolean') {
          return `    auto __v${i} = ${values[i]};`;
        }
        if (type.endsWith('[]')) {
          const baseType = type.slice(0, -2);
          const cppType = baseType === 'string' ? 'string' : baseType === 'double' ? 'double' : baseType === 'boolean' ? 'bool' : 'int';
          return `    vector<${cppType}> __v${i} = ${values[i]};`;
        }
        return `    auto __v${i} = ${values[i]};`;
      }).join('\n');
      const callArgs = args.map((_, i) => `__v${i}`).join(', ');
      const call = `${fn}(${callArgs})`;

      let includes = '#include <iostream>\n#include <vector>\n#include <string>\n#include <sstream>\nusing namespace std;\n\n';
      let harness = includes + code + '\n\nint main() {\n';
      harness += valueDecls + '\n';

      function cppArrayOutput(varName: string, elemType: string): string {
        const quote = elemType === 'string' ? '"\\"" << ' : '';
        const quoteEnd = elemType === 'string' ? ' << "\\""' : '';
        return `    cout << "[";\n    for (size_t __i = 0; __i < ${varName}.size(); __i++) {\n        if (__i > 0) cout << ",";\n        cout << ${quote}${varName}[__i]${quoteEnd};\n    }\n    cout << "]";\n`;
      }

      if (isVoid) {
        harness += `    ${call};\n`;
        const firstArgVar = args.length > 0 ? '__v0' : '0';
        if (args.length > 0) {
          const type = inferTypeName(args[0]);
          if (type.endsWith('[]')) {
            const baseType = type.slice(0, -2);
            harness += cppArrayOutput(firstArgVar, baseType);
          } else {
            harness += `    cout << ${firstArgVar};\n`;
          }
        }
      } else {
        const type = inferTypeName(args[0]);
        if (type.endsWith('[]') || code.includes('vector<')) {
          const baseType = type.endsWith('[]') ? type.slice(0, -2) : 'int';
          harness += `    auto __res = ${call};\n`;
          harness += cppArrayOutput('__res', baseType);
        } else {
          harness += `    cout << ${call};\n`;
        }
      }

      harness += '    return 0;\n}\n';
      return harness;
    }

    default:
      return code;
  }
}

const PISTON_API_URL = process.env.PISTON_API_URL || '';
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || '';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY || '';

const PISTON_LANGUAGE: Record<CodingLanguage, { language: string; version: string }> = {
  javascript: { language: 'javascript', version: '18' },
  typescript: { language: 'typescript', version: '5.0' },
  python: { language: 'python', version: '3.10' },
  java: { language: 'java', version: '17' },
  cpp: { language: 'c++', version: '10.2.0' },
  go: { language: 'go', version: '1.18' },
  rust: { language: 'rust', version: '1.68' },
};

const JUDGE0_LANGUAGE_ID: Record<CodingLanguage, number> = {
  javascript: 63,
  typescript: 63,
  python: 71,
  java: 62,
  cpp: 54,
  go: 60,
  rust: 73,
};

async function callExecutionApi(code: string, language: CodingLanguage, timeLimitMs: number, memoryLimitKb: number): Promise<ExecutionResult> {
  let pistonError: Error | null = null;

  if (PISTON_API_URL) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const info = PISTON_LANGUAGE[language];
    const extMap: Record<string, string> = { 'c++': 'cpp', 'javascript': 'js', 'typescript': 'ts', 'python': 'py', 'java': 'java', 'go': 'go', 'rust': 'rs' };
    const ext = extMap[info.language] || info.language;
    try {
      const response = await fetch(PISTON_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: info.language,
          version: info.version,
          files: [{ name: `main.${ext}`, content: code }],
          stdin: '',
          compile_timeout: Math.min(timeLimitMs + 2000, 30000),
          run_timeout: Math.min(timeLimitMs + 1000, 20000),
          compile_memory_limit: Math.min(memoryLimitKb * 1024, 512 * 1024 * 1024),
          run_memory_limit: Math.min(memoryLimitKb * 1024, 512 * 1024 * 1024),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Piston API returned ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const compile = data.compile;
      const run = data.run;
      return {
        stdout: run?.stdout ?? '',
        stderr: run?.stderr ?? '',
        exitCode: run?.code ?? 0,
        signal: run?.signal ?? null,
        compileOutput: compile?.stderr ?? compile?.output ?? null,
        compileCode: compile?.code ?? null,
        time: run?.time ?? null,
        memory: null,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') pistonError = new Error('Piston API request timed out');
      else pistonError = err as Error;
      // Fall through to Judge0 if configured
    }
  }

  if (JUDGE0_API_URL) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (JUDGE0_API_KEY) headers['X-Auth-Token'] = JUDGE0_API_KEY;
    try {
      const response = await fetch(`${JUDGE0_API_URL}/submissions?base64_encoded=false&wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_code: code,
          language_id: JUDGE0_LANGUAGE_ID[language],
          stdin: '',
          cpu_time_limit: Math.ceil(timeLimitMs / 1000),
          memory_limit: Math.ceil(memoryLimitKb / 1024),
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Judge0 API returned ${response.status}: ${await response.text()}`);
      const data = await response.json();
      const statusId = data.status?.id ?? 0;
      const isCompileError = statusId === 6;
      return {
        stdout: data.stdout ?? '',
        stderr: data.stderr ?? '',
        exitCode: data.exit_code ?? (statusId === 3 ? 0 : 1),
        signal: null,
        compileOutput: isCompileError ? (data.compile_output ?? data.message ?? null) : null,
        compileCode: isCompileError ? 1 : null,
        time: data.time != null ? parseFloat(data.time) : null,
        memory: data.memory != null ? data.memory : null,
      };
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') throw new Error('Judge0 API request timed out');
      throw err;
    }
  }

  if (pistonError) throw pistonError;
  throw new Error(
    'No execution backend configured. Set PISTON_API_URL or JUDGE0_API_URL in your .env.local file.',
  );
}

function detectMemoryLimit(signal: string | null, stderr: string): boolean {
  if (signal === 'SIGKILL' || signal === 'SIGSEGV' || signal === 'SIGABRT') {
    const msg = stderr.toLowerCase();
    if (msg.includes('memory') || msg.includes('out of') || msg.includes('alloc') || msg.includes('new') || msg.includes('bad_alloc')) {
      return true;
    }
  }
  return false;
}

async function fetchProblemTestCases(problemId: string): Promise<TestCase[] | null> {
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('problemContent').doc(problemId).get();
    if (snap.exists) {
      const data = snap.data();
      if (data?.testCases && Array.isArray(data.testCases)) {
        return data.testCases as TestCase[];
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function executeTestCases(
  code: string,
  language: CodingLanguage,
  testCases: TestCase[],
  timeLimitMs: number,
  memoryLimitKb: number,
  problemId?: string,
  onTestCase?: (index: number, total: number) => void,
): Promise<JudgeResult> {
  const codeSize = new TextEncoder().encode(code).length;

  if (!isLanguageSupported(language)) {
    return {
      verdict: 'Compilation Error',
      passedTestCases: 0,
      totalTestCases: testCases.length,
      executionTimeMs: 0,
      memoryUsedKb: -1,
      compileTimeMs: -1,
      codeSize,
      testCaseResults: [{
        passed: false, verdict: 'Compilation Error',
        input: '', expectedOutput: '', actualOutput: '',
        executionTimeMs: 0, memoryUsedKb: -1, exitCode: 1,
        error: `Language '${language}' not supported. Supported: ${SUPPORTED_LANGUAGES.join(', ')}`,
      }],
      compileError: `Language '${language}' not supported`,
    };
  }

  if (testCases.length === 0) {
    return {
      verdict: 'Accepted', passedTestCases: 0, totalTestCases: 0,
      executionTimeMs: 0, memoryUsedKb: -1, compileTimeMs: -1, codeSize, testCaseResults: [],
    };
  }

  let resolvedTestCases = [...testCases];
  if (problemId) {
    const storedTestCases = await fetchProblemTestCases(problemId);
    if (storedTestCases && storedTestCases.length > 0 && storedTestCases.length >= testCases.length) {
      resolvedTestCases = testCases.map((tc, i) => {
        const stored = storedTestCases[i];
        if (stored && stored.expected) {
          return { ...tc, expected: stored.expected, isHidden: stored.isHidden ?? tc.isHidden };
        }
        return tc;
      });
    }
  }

  const fnName = extractFunctionName(code, language);
  const testCaseResults: TestCaseResult[] = [];
  let allPassed = true;
  let totalExecutionMs = 0;
  let maxMemoryKb = 0;
  let globalCompileError: string | undefined;

  for (let i = 0; i < resolvedTestCases.length; i++) {
    const tc = resolvedTestCases[i];
    onTestCase?.(i + 1, resolvedTestCases.length);

    const { values } = parseInput(tc.input);
    const harness = generateTestHarness(code, fnName, values, language);

    const startTime = Date.now();
    let execResult: ExecutionResult;

    try {
      execResult = await callExecutionApi(harness, language, timeLimitMs, memoryLimitKb);
    } catch (err: any) {
      const elapsedMs = Date.now() - startTime;
      totalExecutionMs += elapsedMs;
      const errorMsg = err.message || 'Execution failed';
      testCaseResults.push({
        passed: false, verdict: 'Runtime Error',
        input: tc.isHidden ? '' : tc.input,
        expectedOutput: tc.isHidden ? '' : tc.expected,
        actualOutput: '', executionTimeMs: elapsedMs, memoryUsedKb: -1, exitCode: 1, error: errorMsg,
      });
      allPassed = false;
      continue;
    }

    const elapsedMs = Date.now() - startTime;
    if (execResult.time != null) {
      totalExecutionMs += Math.round(execResult.time * 1000);
    } else {
      totalExecutionMs += elapsedMs;
    }

    if (execResult.compileCode != null && execResult.compileCode !== 0) {
      const compileErrMsg = execResult.compileOutput || 'Compilation failed';
      globalCompileError = compileErrMsg;
      for (let j = i; j < resolvedTestCases.length; j++) {
        testCaseResults.push({
          passed: false, verdict: 'Compilation Error',
          input: resolvedTestCases[j].isHidden ? '' : resolvedTestCases[j].input,
          expectedOutput: resolvedTestCases[j].isHidden ? '' : resolvedTestCases[j].expected,
          actualOutput: '', executionTimeMs: 0, memoryUsedKb: -1,
          exitCode: execResult.compileCode, error: compileErrMsg,
        });
      }
      allPassed = false;
      break;
    }

    const stdout = execResult.stdout.trim();
    const stderr = execResult.stderr || '';
    const exitCode = execResult.exitCode;
    const signal = execResult.signal;

    if (signal) {
      if (detectMemoryLimit(signal, stderr)) {
        testCaseResults.push({
          passed: false, verdict: 'Memory Limit Exceeded',
          input: tc.isHidden ? '' : tc.input,
          expectedOutput: tc.isHidden ? '' : tc.expected,
          actualOutput: stdout, executionTimeMs: elapsedMs,
          memoryUsedKb: -1, exitCode, error: 'Memory Limit Exceeded',
        });
        allPassed = false;
        continue;
      }
      testCaseResults.push({
        passed: false, verdict: 'Time Limit Exceeded',
        input: tc.isHidden ? '' : tc.input,
        expectedOutput: tc.isHidden ? '' : tc.expected,
        actualOutput: stdout, executionTimeMs: elapsedMs,
        memoryUsedKb: -1, exitCode: 124, error: 'Time Limit Exceeded',
      });
      allPassed = false;
      continue;
    }

    if (exitCode !== 0) {
      testCaseResults.push({
        passed: false, verdict: 'Runtime Error',
        input: tc.isHidden ? '' : tc.input,
        expectedOutput: tc.isHidden ? '' : tc.expected,
        actualOutput: stdout, executionTimeMs: elapsedMs,
        memoryUsedKb: -1, exitCode, error: stderr || `Exit code ${exitCode}`,
      });
      allPassed = false;
      continue;
    }

    if (execResult.memory != null) {
      maxMemoryKb = Math.max(maxMemoryKb, execResult.memory);
    }

    const expected = tc.expected;
    if (expected) {
      const passed = compareOutput(stdout, expected);
      if (passed) {
        testCaseResults.push({
          passed: true, verdict: 'Accepted',
          input: tc.isHidden ? '' : tc.input,
          expectedOutput: tc.isHidden ? '' : expected,
          actualOutput: stdout, executionTimeMs: elapsedMs, memoryUsedKb: execResult.memory ?? -1, exitCode: 0,
        });
      } else {
        testCaseResults.push({
          passed: false, verdict: 'Wrong Answer',
          input: tc.isHidden ? '' : tc.input,
          expectedOutput: tc.isHidden ? '' : expected,
          actualOutput: stdout, executionTimeMs: elapsedMs, memoryUsedKb: execResult.memory ?? -1, exitCode: 0,
        });
        allPassed = false;
      }
    } else {
      testCaseResults.push({
        passed: true, verdict: 'Accepted',
        input: tc.isHidden ? '' : tc.input,
        expectedOutput: '', actualOutput: stdout,
        executionTimeMs: elapsedMs, memoryUsedKb: execResult.memory ?? -1, exitCode: 0,
      });
    }
  }

  const passedCount = testCaseResults.filter(r => r.passed).length;
  const totalCases = testCaseResults.length;

  let verdict: Verdict = 'Accepted';
  if (passedCount < totalCases) {
    const hasCompile = testCaseResults.some(r => r.verdict === 'Compilation Error');
    const hasMLE = testCaseResults.some(r => r.verdict === 'Memory Limit Exceeded');
    const hasTLE = testCaseResults.some(r => r.verdict === 'Time Limit Exceeded');
    const hasRuntime = testCaseResults.some(r => r.verdict === 'Runtime Error');
    const hasWA = testCaseResults.some(r => r.verdict === 'Wrong Answer');
    if (hasCompile) verdict = 'Compilation Error';
    else if (hasMLE) verdict = 'Memory Limit Exceeded';
    else if (hasTLE) verdict = 'Time Limit Exceeded';
    else if (hasRuntime) verdict = 'Runtime Error';
    else if (hasWA) verdict = 'Wrong Answer';
  }

  return {
    verdict,
    passedTestCases: passedCount,
    totalTestCases: totalCases,
    executionTimeMs: Math.round(totalExecutionMs),
    memoryUsedKb: maxMemoryKb > 0 ? Math.round(maxMemoryKb) : -1,
    compileTimeMs: -1,
    codeSize,
    testCaseResults,
    compileError: globalCompileError,
  };
}

export async function executeBattleCode(
  code: string,
  language: CodingLanguage,
  problemId: string,
  testCases: TestCase[],
  timeLimitMs: number,
  memoryLimitKb: number,
): Promise<{ passed: number; total: number }> {
  const result = await executeTestCases(code, language, testCases, timeLimitMs, memoryLimitKb, problemId);
  return { passed: result.passedTestCases, total: result.totalTestCases };
}
