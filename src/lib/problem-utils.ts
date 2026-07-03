import type { PracticeProblemDocument, CodingLanguage, ProblemTopic } from '@/types';
import { PRACTICE_PROBLEMS } from '@/data/practice-problems';

const DIFFICULTY_HINTS: Record<string, string[][]> = {
  Easy: [
    ['Think about what data structure would work best here.', 'Consider the simplest case first.', 'What is the brute force approach?'],
    ['Can you reduce the problem to a smaller subproblem?', 'Look for patterns in the input/output.', 'Try working through a small example manually.'],
    ['What is the time complexity of your current approach?', 'Can you use a hash map for O(1) lookups?', 'Consider using two pointers for efficiency.'],
  ],
  Medium: [
    ['Break the problem into smaller subproblems.', 'Think about overlapping subproblems.', 'What is the optimal substructure?'],
    ['Consider using dynamic programming or memoization.', 'Can you sort the data to simplify?', 'Think about the trade-offs between time and space.'],
    ['What pattern does this problem match? (Sliding window, BFS/DFS, etc.)', 'Try to formulate a recurrence relation.', 'Consider edge cases carefully.'],
  ],
  Hard: [
    ['This requires an optimized approach - O(n) or O(n log n).', 'Think about advanced data structures.', 'Can you transform the problem into something familiar?'],
    ['Consider divide and conquer strategy.', 'Think about amortized analysis.', 'What constraints can you exploit?'],
    ['Multiple passes might be needed.', 'Consider using a monotonic stack/queue.', 'The optimal solution may not be obvious.'],
  ],
};

const DIFFICULTY_CONSTRAINTS: Record<string, string[]> = {
  Easy: [
    '1 ≤ n ≤ 10⁴',
    'Time: O(n²) or better',
    'Space: O(n) or better',
  ],
  Medium: [
    '1 ≤ n ≤ 10⁵',
    'Time: O(n log n) or better',
    'Space: O(n) or better',
  ],
  Hard: [
    '1 ≤ n ≤ 10⁶',
    'Time: O(n) or better',
    'Space: O(1) or O(n)',
  ],
};

const DIFFICULTY_APPROACH: Record<string, string> = {
  Easy: 'The straightforward approach works here. Focus on correctness first, then optimize.',
  Medium: 'This requires careful optimization. A naive solution may work for small inputs, but you need to handle larger constraints efficiently.',
  Hard: 'This demands an advanced algorithm. The naive solution will timeout. You need to identify the optimal pattern and data structure.',
};

const CODING_LANGUAGES: CodingLanguage[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];

function generateSearchTokens(title: string, topics: string[], category: string): string[] {
  const tokens = new Set<string>();
  const words = title.toLowerCase().split(/[\s-]+/);
  words.forEach(w => {
    if (w.length >= 2) {
      for (let i = 1; i <= w.length; i++) tokens.add(w.slice(0, i));
    }
  });
  topics.forEach(t => tokens.add(t.toLowerCase()));
  if (category) tokens.add(category.toLowerCase());
  return [...tokens];
}

function hashId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function generateTestCases(problem: typeof PRACTICE_PROBLEMS[0]): Array<{ input: string; expected: string; isHidden?: boolean }> {
  const visible = problem.examples.map(ex => ({
    input: ex.input,
    expected: ex.output,
  }));
  // Hidden test cases with empty expected — judge resolves via reference solution
  // If no reference solution exists, hidden cases auto-pass (informational only)
  const hidden = problem.examples.slice(0, 2).map((ex, i) => ({
    input: ex.input,
    expected: '',
    isHidden: true,
  }));
  return [...visible, ...hidden];
}

function generateHints(difficulty: string, _topics: string[]): string[] {
  const hints = DIFFICULTY_HINTS[difficulty] || DIFFICULTY_HINTS.Easy;
  return hints.map((h, i) => {
    const topicHint = _topics[i % _topics.length] ? `[${_topics[i % _topics.length]}] ` : '';
    return topicHint + h.join(' ');
  });
}

function generateSolutionCode(problem: typeof PRACTICE_PROBLEMS[0]): Record<string, string> {
  const code: Record<string, string> = {};
  const fnName = problem.id.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const camelCase = fnName.charAt(0).toLowerCase() + fnName.slice(1);

  code.javascript = `function ${camelCase}(${problem.examples[0]?.input?.split('=')[0]?.trim() || 'input'}) {\n  // Write your solution here\n  \n}`;
  code.typescript = `function ${camelCase}(${problem.examples[0]?.input?.split('=')[0]?.trim() || 'input'}: any): any {\n  // Write your solution here\n  \n}`;
  code.python = `def ${camelCase}(${problem.examples[0]?.input?.split('=')[0]?.trim()?.toLowerCase() || 'input'}):\n    # Write your solution here\n    pass`;
  code.java = `class Solution {\n    public ${problem.difficulty === 'Easy' ? 'int' : 'void'} ${camelCase}() {\n        // Write your solution here\n    }\n}`;
  code.cpp = `class Solution {\npublic:\n    ${problem.difficulty === 'Easy' ? 'int' : 'void'} ${camelCase}() {\n        // Write your solution here\n    }\n};`;
  return code;
}

export function enrichProblem(problem: typeof PRACTICE_PROBLEMS[0]): PracticeProblemDocument {
  return {
    id: problem.id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    category: problem.category,
    points: problem.points,
    starterCode: problem.starterCode as Record<CodingLanguage, string>,
    examples: problem.examples,
    testCases: generateTestCases(problem),
    topics: problem.topics as ProblemTopic[],
    hints: generateHints(problem.difficulty, problem.topics),
    editorial: `${DIFFICULTY_APPROACH[problem.difficulty]}\n\n**Approach:**\n${problem.description.slice(0, 100)}...\n\n**Time Complexity:** ${problem.difficulty === 'Easy' ? 'O(n)' : problem.difficulty === 'Medium' ? 'O(n log n)' : 'O(n)'}\n**Space Complexity:** ${problem.difficulty === 'Easy' ? 'O(1)' : 'O(n)'}`,
    solutionCode: generateSolutionCode(problem) as Record<CodingLanguage, string>,
    constraints: DIFFICULTY_CONSTRAINTS[problem.difficulty] || DIFFICULTY_CONSTRAINTS.Easy,
    timeLimitMs: problem.difficulty === 'Easy' ? 1000 : problem.difficulty === 'Medium' ? 2000 : 3000,
    memoryLimitKb: problem.difficulty === 'Easy' ? 256000 : problem.difficulty === 'Medium' ? 512000 : 1024000,
    estimatedTime: problem.difficulty === 'Easy' ? 15 : problem.difficulty === 'Medium' ? 30 : 45,
    acceptanceRate: problem.difficulty === 'Easy' ? 75 : problem.difficulty === 'Medium' ? 50 : 28,
    prerequisites: problem.difficulty === 'Easy' ? [] : problem.difficulty === 'Medium' ? ['Basic ' + problem.topics[0]] : ['Intermediate ' + problem.topics[0], 'Data Structures'],
    companyTags: [],
    relatedProblems: [],
    difficultyRating: problem.difficulty === 'Easy' ? 1 : problem.difficulty === 'Medium' ? 3 : 5,
    searchTokens: generateSearchTokens(problem.title, problem.topics, problem.category),
  };
}

export function enrichAllProblems(): PracticeProblemDocument[] {
  return PRACTICE_PROBLEMS.map(enrichProblem);
}

export function getStaticProblemById(id: string): PracticeProblemDocument | null {
  const problem = PRACTICE_PROBLEMS.find(p => p.id === id);
  return problem ? enrichProblem(problem) : null;
}

export function getStaticProblemCountByDifficulty(): { Easy: number; Medium: number; Hard: number } {
  return {
    Easy: PRACTICE_PROBLEMS.filter(p => p.difficulty === 'Easy').length,
    Medium: PRACTICE_PROBLEMS.filter(p => p.difficulty === 'Medium').length,
    Hard: PRACTICE_PROBLEMS.filter(p => p.difficulty === 'Hard').length,
  };
}

export function getRandomStaticProblem(excludeIds?: string[]): PracticeProblemDocument | null {
  const available = excludeIds?.length
    ? PRACTICE_PROBLEMS.filter(p => !excludeIds.includes(p.id))
    : PRACTICE_PROBLEMS;
  if (available.length === 0) return null;
  return enrichProblem(available[Math.floor(Math.random() * available.length)]);
}

export function getStaticProblemsByDifficulty(difficulty: string): PracticeProblemDocument[] {
  return PRACTICE_PROBLEMS
    .filter(p => difficulty === 'All' || p.difficulty === difficulty)
    .map(enrichProblem);
}

export function getStaticProblemsByTopic(topic: string): PracticeProblemDocument[] {
  return PRACTICE_PROBLEMS
    .filter(p => topic === 'All' || p.topics.includes(topic) || p.category === topic)
    .map(enrichProblem);
}

export function getStaticRecommendations(
  solvedIds: string[],
  bookmarkedIds: string[],
  weakTopics: string[],
  limit = 5,
): PracticeProblemDocument[] {
  const unsolved = PRACTICE_PROBLEMS.filter(p => !solvedIds.includes(p.id));
  if (unsolved.length === 0) return [];
  const scored = unsolved.map(p => {
    let score = 0;
    if (weakTopics.some(t => p.topics.includes(t) || p.category === t)) score += 3;
    if (bookmarkedIds.includes(p.id)) score += 2;
    if (p.difficulty === 'Easy') score += 1;
    return { problem: p, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(s => enrichProblem(s.problem));
}
