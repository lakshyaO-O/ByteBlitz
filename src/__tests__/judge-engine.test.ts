import { describe, it, expect } from 'vitest';

// Test pure utility functions extracted from judge-engine.ts
// These are duplicated here for isolated testing without Firebase dependencies

const SUPPORTED_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp'];

function isLanguageSupported(language: string): boolean {
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

function extractFunctionName(code: string, language: string): string | null {
  const cleaned = stripCommentsAndStrings(code);
  if (language === 'javascript' || language === 'typescript') {
    const fnDecl = cleaned.match(/\bfunction\s+(\w+)\s*\(/);
    if (fnDecl) return fnDecl[1];
    const arrow = cleaned.match(/(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(/);
    if (arrow) return arrow[1];
    return null;
  }
  if (language === 'python') {
    const match = cleaned.match(/^def\s+(\w+)\s*\(/m);
    return match ? match[1] : null;
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

describe('judge-engine', () => {
  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(isLanguageSupported('javascript')).toBe(true);
      expect(isLanguageSupported('typescript')).toBe(true);
      expect(isLanguageSupported('python')).toBe(true);
      expect(isLanguageSupported('java')).toBe(true);
      expect(isLanguageSupported('cpp')).toBe(true);
    });

    it('should return false for unsupported languages', () => {
      expect(isLanguageSupported('ruby')).toBe(false);
      expect(isLanguageSupported('go')).toBe(false);
      expect(isLanguageSupported('rust')).toBe(false);
    });
  });

  describe('stripCommentsAndStrings', () => {
    it('should remove single-line comments', () => {
      const result = stripCommentsAndStrings('const x = 1; // this is a comment\nreturn x;');
      expect(result).not.toContain('comment');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('return x;');
    });

    it('should remove multi-line comments', () => {
      const result = stripCommentsAndStrings('/* multi\nline\ncomment */ const x = 1;');
      expect(result).not.toContain('multi');
      expect(result).toContain('const x = 1;');
    });

    it('should remove string literals', () => {
      const result = stripCommentsAndStrings('const msg = "hello world";');
      expect(result).not.toContain('hello');
    });
  });

  describe('extractFunctionName', () => {
    it('should extract function name from JS function declaration', () => {
      const result = extractFunctionName('function solve() { return 42; }', 'javascript');
      expect(result).toBe('solve');
    });

    it('should extract function name from JS arrow function', () => {
      const result = extractFunctionName('const solve = () => { return 42; }', 'javascript');
      expect(result).toBe('solve');
    });

    it('should extract function name from Python function', () => {
      const result = extractFunctionName('def solve():\n    return 42', 'python');
      expect(result).toBe('solve');
    });

    it('should extract method name from Java class', () => {
      const code = 'class Solution { public int solve() { return 42; } }';
      const result = extractFunctionName(code, 'java');
      expect(result).toBe('solve');
    });

    it('should return null for code with no function', () => {
      const result = extractFunctionName('const x = 42;', 'javascript');
      expect(result).toBeNull();
    });
  });
});
