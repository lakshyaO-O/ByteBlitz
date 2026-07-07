import type { ProblemPattern } from '@/types/learning';

export const PATTERNS: Record<string, ProblemPattern> = {
  'two-pointers': {
    name: 'Two Pointers',
    description: 'Use two indices to traverse a linear structure from different positions.',
    detectionRules: [
      'Sorted or nearly sorted array',
      'Find pair with given sum or condition',
      'Palindrome checking',
      'In-place array manipulation',
      'Subarray or subsequence problems',
    ],
    relatedPatterns: ['sliding-window', 'binary-search', 'prefix-sum'],
    commonProblems: ['Two Sum II', 'Container With Most Water', '3Sum', 'Remove Duplicates'],
    difficulty: 'medium',
  },
  'sliding-window': {
    name: 'Sliding Window',
    description: 'Maintain a subarray window that expands and contracts while tracking properties.',
    detectionRules: [
      'Contiguous subarray or substring',
      'Maximum/minimum of something within a window',
      'Fixed or variable window size',
      'Optimization over consecutive elements',
    ],
    relatedPatterns: ['two-pointers', 'prefix-sum'],
    commonProblems: ['Longest Substring Without Repeating', 'Minimum Window Substring', 'Max Sum Subarray'],
    difficulty: 'medium',
  },
  'binary-search': {
    name: 'Binary Search',
    description: 'Divide the search space in half repeatedly to find a target efficiently.',
    detectionRules: [
      'Sorted array or monotonic function',
      'Search for a value or boundary',
      'Find min/max satisfying a condition',
      'Logarithmic time requirement',
    ],
    relatedPatterns: ['divide-and-conquer', 'two-pointers'],
    commonProblems: ['Binary Search', 'Search in Rotated Array', 'Find Peak Element'],
    difficulty: 'easy',
  },
  'depth-first-search': {
    name: 'Depth-First Search',
    description: 'Explore as far as possible along each branch before backtracking.',
    detectionRules: [
      'Tree or graph traversal',
      'Path existence between nodes',
      'Permutations/combinations generation',
      'Backtracking with state exploration',
    ],
    relatedPatterns: ['backtracking', 'breadth-first-search', 'recursion'],
    commonProblems: ['Number of Islands', 'Clone Graph', 'Path Sum', 'Permutations'],
    difficulty: 'medium',
  },
  'breadth-first-search': {
    name: 'Breadth-First Search',
    description: 'Explore all neighbors at the current depth before moving deeper.',
    detectionRules: [
      'Shortest path in unweighted graph',
      'Level-order traversal of tree',
      'Minimum steps to reach destination',
      'Topological ordering',
    ],
    relatedPatterns: ['depth-first-search', 'topological-sort'],
    commonProblems: ['Binary Tree Level Order', 'Word Ladder', 'Rotting Oranges'],
    difficulty: 'medium',
  },
  'dynamic-programming': {
    name: 'Dynamic Programming',
    description: 'Break a problem into overlapping subproblems and store their results.',
    detectionRules: [
      'Optimal substructure',
      'Overlapping subproblems',
      'Maximize/minimize something over choices',
      'Counting number of ways',
      'Decision with future consequences',
    ],
    relatedPatterns: ['recursion', 'greedy', 'backtracking'],
    commonProblems: ['Coin Change', 'Longest Common Subsequence', 'Knapsack', 'House Robber'],
    difficulty: 'hard',
  },
  'greedy': {
    name: 'Greedy',
    description: 'Make the locally optimal choice at each step to reach a global optimum.',
    detectionRules: [
      'Local optimal leads to global optimal',
      'Matroid-like structure',
      'Interval scheduling',
      'Minimum spanning tree',
    ],
    relatedPatterns: ['dynamic-programming', 'sorting'],
    commonProblems: ['Activity Selection', 'Huffman Coding', 'Jump Game'],
    difficulty: 'medium',
  },
  'backtracking': {
    name: 'Backtracking',
    description: 'Build candidates incrementally and abandon them when they cannot lead to a solution.',
    detectionRules: [
      'Generate all possibilities',
      'Constraint satisfaction',
      'N-Queens like problems',
      'Subset/Permutation/Combination generation',
    ],
    relatedPatterns: ['depth-first-search', 'recursion'],
    commonProblems: ['N-Queens', 'Sudoku Solver', 'Subsets', 'Combination Sum'],
    difficulty: 'hard',
  },
  'hash-map': {
    name: 'Hash Map / Hashing',
    description: 'Use a hash-based data structure for O(1) lookups and frequency counting.',
    detectionRules: [
      'Count frequencies of elements',
      'Check for existence or duplicates',
      'Map elements to indices or values',
      'Cache previously computed results',
    ],
    relatedPatterns: ['two-pointers', 'sliding-window'],
    commonProblems: ['Two Sum', 'Group Anagrams', 'Contains Duplicate'],
    difficulty: 'easy',
  },
  'heap': {
    name: 'Heap / Priority Queue',
    description: 'Use a heap to efficiently track the minimum or maximum of a dynamic set.',
    detectionRules: [
      'Kth largest/smallest element',
      'Top K elements',
      'Median in a stream',
      'Merging sorted lists',
      'Event scheduling',
    ],
    relatedPatterns: ['sorting', 'queue'],
    commonProblems: ['Kth Largest Element', 'Merge K Sorted Lists', 'Find Median from Stream'],
    difficulty: 'medium',
  },
  'recursion': {
    name: 'Recursion',
    description: 'Solve a problem by solving smaller instances of the same problem.',
    detectionRules: [
      'Problem can be divided into identical subproblems',
      'Tree-like structure',
      'Mathematical induction pattern',
      'Divide and conquer approach',
    ],
    relatedPatterns: ['dynamic-programming', 'divide-and-conquer', 'backtracking'],
    commonProblems: ['Fibonacci', 'Tower of Hanoi', 'Merge Sort', 'Tree Traversals'],
    difficulty: 'medium',
  },
  'divide-and-conquer': {
    name: 'Divide and Conquer',
    description: 'Divide the problem into independent subproblems, solve recursively, combine results.',
    detectionRules: [
      'Merge sort or quick sort style',
      'Independent subproblems (no overlap)',
      'Binary splitting of input',
      'Range query decomposition',
    ],
    relatedPatterns: ['recursion', 'segment-tree', 'merge-sort'],
    commonProblems: ['Merge Sort', 'Quick Sort', 'Maximum Subarray', 'Closest Pair'],
    difficulty: 'medium',
  },
  'prefix-sum': {
    name: 'Prefix Sum / Cumulative Sum',
    description: 'Precompute cumulative sums to answer range sum queries in O(1).',
    detectionRules: [
      'Range sum or product queries',
      'Subarray sum equal to target',
      'Cumulative calculations',
      'Difference array technique',
    ],
    relatedPatterns: ['sliding-window', 'two-pointers', 'segment-tree'],
    commonProblems: ['Range Sum Query', 'Subarray Sum Equals K', 'Product of Array Except Self'],
    difficulty: 'easy',
  },
  'trie': {
    name: 'Trie / Prefix Tree',
    description: 'Tree data structure for efficient string prefix operations.',
    detectionRules: [
      'String prefix matching',
      'Autocomplete suggestions',
      'Dictionary word search',
      'IP routing or pattern matching',
    ],
    relatedPatterns: ['hash-map', 'depth-first-search'],
    commonProblems: ['Implement Trie', 'Word Search II', 'Autocomplete System'],
    difficulty: 'hard',
  },
  'union-find': {
    name: 'Union Find / Disjoint Set Union',
    description: 'Track elements partitioned into disjoint subsets with merge operations.',
    detectionRules: [
      'Graph connectivity queries',
      'Detect cycles in undirected graph',
      'Dynamic connectivity problems',
      'Number of connected components',
    ],
    relatedPatterns: ['graph', 'depth-first-search', 'breadth-first-search'],
    commonProblems: ['Number of Connected Components', 'Graph Valid Tree', 'Accounts Merge'],
    difficulty: 'medium',
  },
  'segment-tree': {
    name: 'Segment Tree',
    description: 'Tree structure for answering range queries and updating array elements.',
    detectionRules: [
      'Range queries with updates',
      'Range min/max/sum/gcd',
      'Multiple range operations',
      'Large dataset with online queries',
    ],
    relatedPatterns: ['prefix-sum', 'divide-and-conquer', 'fenwick-tree'],
    commonProblems: ['Range Sum Query Mutable', 'Count of Smaller Numbers After Self'],
    difficulty: 'hard',
  },
  'topological-sort': {
    name: 'Topological Sort',
    description: 'Linear ordering of DAG vertices where each node appears before its dependencies.',
    detectionRules: [
      'Dependency resolution',
      'Task scheduling with prerequisites',
      'Build order determination',
      'Course schedule problems',
    ],
    relatedPatterns: ['breadth-first-search', 'graph'],
    commonProblems: ['Course Schedule', 'Alien Dictionary', 'Task Scheduling'],
    difficulty: 'medium',
  },
  'kadane': {
    name: 'Kadane\'s Algorithm',
    description: 'Find maximum subarray sum by tracking running sum and resetting when negative.',
    detectionRules: [
      'Maximum subarray sum',
      'Best time to buy and sell stock',
      'Maximum product subarray',
      'Circular array optimization',
    ],
    relatedPatterns: ['dynamic-programming', 'greedy', 'prefix-sum'],
    commonProblems: ['Maximum Subarray', 'Maximum Product Subarray', 'Best Time to Buy Stock'],
    difficulty: 'medium',
  },
  'sorting': {
    name: 'Sorting',
    description: 'Arrange elements in a specific order using comparison or distribution methods.',
    detectionRules: [
      'Ordered output required',
      'Preprocessing before search',
      'Merge/merge-like operation',
      'Anagram grouping',
    ],
    relatedPatterns: ['two-pointers', 'binary-search', 'divide-and-conquer'],
    commonProblems: ['Sort Colors', 'Merge Intervals', 'Kth Largest Element in Array'],
    difficulty: 'easy',
  },
};

export function detectPatterns(title: string, description: string, topics: string[]): {
  primary: string;
  secondary: string[];
  confidence: number;
  reasoning: string;
} {
  const text = `${title} ${description} ${topics.join(' ')}`.toLowerCase();
  const matches: Array<{ slug: string; score: number }> = [];

  for (const [slug, pattern] of Object.entries(PATTERNS)) {
    let score = 0;
    for (const topic of topics) {
      if (pattern.name.toLowerCase().includes(topic.toLowerCase())) score += 3;
      if (topic.toLowerCase() === slug.replace('-', ' ')) score += 5;
    }
    for (const rule of pattern.detectionRules) {
      const keywords = rule.toLowerCase().split(/\s+/);
      const matchCount = keywords.filter(k => text.includes(k)).length;
      score += (matchCount / keywords.length) * 2;
    }
    if (score > 0) matches.push({ slug, score });
  }

  matches.sort((a, b) => b.score - a.score);
  const top = matches[0];
  if (!top) {
    return { primary: 'general', secondary: [], confidence: 0, reasoning: 'Could not detect a specific pattern.' };
  }

  const primary = top.slug;
  const confidence = Math.min(100, Math.round((top.score / 10) * 100));
  const secondary = matches.slice(1, 3).map(m => m.slug);
  const pattern = PATTERNS[primary];
  const reasoning = `Classified as "${pattern.name}" with ${confidence}% confidence. ${pattern.description}`;

  return { primary, secondary, confidence, reasoning };
}
