import type { ConceptEntry } from '@/types/learning';

export const CONCEPTS: Record<string, ConceptEntry> = {
  'binary-search': {
    slug: 'binary-search',
    title: 'Binary Search',
    category: 'searching',
    definition: 'An efficient algorithm that finds a target value in a sorted array by repeatedly dividing the search interval in half.',
    visualExplanation: 'Start with two pointers at the ends of the array. Compare the middle element with the target. If equal, found. If target is smaller, search the left half. If larger, search the right half. Repeat until the pointers cross.',
    complexity: {
      timeWorst: 'O(log n)',
      timeAverage: 'O(log n)',
      timeBest: 'O(1)',
      spaceWorst: 'O(1)',
      spaceAverage: 'O(1)',
      spaceBest: 'O(1)',
      explanation: 'Each comparison eliminates half of the remaining elements, giving logarithmic time. Space is constant for iterative version; recursive uses O(log n) call stack.',
    },
    whenToUse: [
      'Array or range is sorted',
      'Need efficient search in large dataset',
      'Finding boundaries or insertion points',
      'Monotonic predicate functions',
    ],
    whenNotToUse: [
      'Unsorted data (must sort first)',
      'Single-element lookups in small arrays (linear is simpler)',
      'Frequent insertions/deletions',
      'When hash table provides O(1) average lookup',
    ],
    pitfalls: [
      'Off-by-one errors in boundary handling',
      'Infinite loops when low and mid don\'t progress',
      'Integer overflow in mid calculation (use low + (high - low) / 2)',
      'Not checking for empty array',
    ],
    relatedConcepts: ['two-pointers', 'divide-and-conquer', 'exponential-search', 'ternary-search'],
    codeExample: `function binarySearch(arr: number[], target: number): number {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = low + (high - low) / 2 | 0;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`,
    prerequisites: ['Sorting', 'Arrays'],
  },
  'two-pointers': {
    slug: 'two-pointers',
    title: 'Two Pointers',
    category: 'technique',
    definition: 'A technique that uses two pointers to traverse a data structure from different positions or speeds.',
    visualExplanation: 'Two indices traverse the array simultaneously. Depending on the problem, they may start from both ends (opposite direction) or same end (same direction with different speeds).',
    complexity: {
      timeWorst: 'O(n)',
      timeAverage: 'O(n)',
      timeBest: 'O(1)',
      spaceWorst: 'O(1)',
      spaceAverage: 'O(1)',
      spaceBest: 'O(1)',
      explanation: 'Each pointer traverses the array at most once, giving linear time. Constant extra space.',
    },
    whenToUse: [
      'Sorted array pair problems',
      'Palindrome checking',
      'In-place array reversal',
      'Removing duplicates from sorted array',
      'Three sum and related problems',
    ],
    whenNotToUse: [
      'Problems requiring random access patterns',
      'When hash map provides simpler solution',
      'Unsorted data without sorting first',
    ],
    pitfalls: [
      'Not handling pointer movement correctly',
      'Infinite loops when pointers cross',
      'Forgetting to sort when required',
    ],
    relatedConcepts: ['sliding-window', 'binary-search', 'hash-map'],
    codeExample: `function twoSumSorted(arr: number[], target: number): [number, number] {
  let left = 0, right = arr.length - 1;
  while (left < right) {
    const sum = arr[left] + arr[right];
    if (sum === target) return [left, right];
    if (sum < target) left++;
    else right--;
  }
  return [-1, -1];
}`,
  },
  'sliding-window': {
    slug: 'sliding-window',
    title: 'Sliding Window',
    category: 'technique',
    definition: 'A technique that maintains a subset of data as a window that slides across the data structure.',
    visualExplanation: 'A window (defined by left and right boundaries) expands and contracts while maintaining certain invariants. The window slides one element at a time, updating the computation incrementally.',
    complexity: {
      timeWorst: 'O(n)',
      timeAverage: 'O(n)',
      timeBest: 'O(n)',
      spaceWorst: 'O(k)',
      spaceAverage: 'O(k)',
      spaceBest: 'O(1)',
      explanation: 'Each element enters and leaves the window at most once, giving linear time. Space depends on window contents.',
    },
    whenToUse: [
      'Subarray or substring problems',
      'Finding maximum/minimum of all subarrays of size k',
      'Longest substring with K distinct characters',
      'Problems where brute force is O(n)',
    ],
    whenNotToUse: [
      'When all subarrays must be considered independently',
      'Simple prefix-sum suffices',
      'Non-contiguous subset problems',
    ],
    pitfalls: [
      'Fixed vs variable window confusion',
      'Not updating window state correctly on shrink',
      'Wrong boundary conditions',
    ],
    relatedConcepts: ['two-pointers', 'prefix-sum', 'hash-map'],
  },
  'depth-first-search': {
    slug: 'depth-first-search',
    title: 'Depth-First Search (DFS)',
    category: 'graph',
    definition: 'A traversal algorithm that explores as far as possible along each branch before backtracking.',
    visualExplanation: 'Start at a root node, mark it visited, then recursively visit each unvisited neighbor. Uses a stack (implicitly via recursion or explicitly). Backtrack when no unvisited neighbors remain.',
    complexity: {
      timeWorst: 'O(V + E)',
      timeAverage: 'O(V + E)',
      timeBest: 'O(V + E)',
      spaceWorst: 'O(V)',
      spaceAverage: 'O(V)',
      spaceBest: 'O(log V)',
      explanation: 'Visits each vertex once and traverses each edge once. Space is the recursion stack depth which can be O(V) in worst case (skewed tree).',
    },
    whenToUse: [
      'Exploring all possible paths',
      'Checking connectivity',
      'Topological sorting',
      'Detecting cycles',
      'Finding connected components',
      'Maze and puzzle solving',
    ],
    whenNotToUse: [
      'Shortest path in weighted graphs (use Dijkstra)',
      'Very deep graphs (stack overflow risk)',
      'When BFS gives simpler solution',
    ],
    pitfalls: [
      'Stack overflow on deep recursion',
      'Not marking visited nodes (infinite loops)',
      'Confusing pre-order vs post-order processing',
    ],
    relatedConcepts: ['breadth-first-search', 'backtracking', 'topological-sort'],
  },
  'breadth-first-search': {
    slug: 'breadth-first-search',
    title: 'Breadth-First Search (BFS)',
    category: 'graph',
    definition: 'A traversal algorithm that explores all vertices at the current depth before moving deeper.',
    visualExplanation: 'Start at a root node, explore all immediate neighbors, then their neighbors, level by level. Uses a queue to maintain traversal order.',
    complexity: {
      timeWorst: 'O(V + E)',
      timeAverage: 'O(V + E)',
      timeBest: 'O(V + E)',
      spaceWorst: 'O(V)',
      spaceAverage: 'O(V)',
      spaceBest: 'O(1)',
      explanation: 'Visits each vertex once and traverses each edge once. Queue size can be O(V) in worst case.',
    },
    whenToUse: [
      'Shortest path in unweighted graphs',
      'Level-order traversal of trees',
      'Finding minimum steps to reach target',
      'Web crawling',
      'Social network friend suggestions',
    ],
    whenNotToUse: [
      'Very wide graphs (memory intensive)',
      'Weighted shortest paths (use Dijkstra)',
      'When DFS provides more natural solution',
    ],
    pitfalls: [
      'Memory usage on wide graphs',
      'Not marking visited when enqueuing (duplicate processing)',
      'Infinite loop in graphs with cycles',
    ],
    relatedConcepts: ['depth-first-search', 'dijkstra', 'topological-sort'],
  },
  'dynamic-programming': {
    slug: 'dynamic-programming',
    title: 'Dynamic Programming (DP)',
    category: 'optimization',
    definition: 'A method for solving complex problems by breaking them into overlapping subproblems and storing their results.',
    visualExplanation: 'Identify base cases. Build a table (1D, 2D, or 3D) where each cell represents the answer to a subproblem. Fill the table bottom-up, using previously computed values to compute new ones. Alternatively, use top-down recursion with memoization.',
    complexity: {
      timeWorst: 'Depends on state space',
      timeAverage: 'O(states × transitions)',
      timeBest: 'Depends on problem',
      spaceWorst: 'O(states)',
      spaceAverage: 'O(states)',
      spaceBest: 'O(1) with space optimization',
      explanation: 'The time and space complexity depends entirely on the number of states and transitions per state.',
    },
    whenToUse: [
      'Optimal substructure present',
      'Overlapping subproblems',
      'Maximization or minimization',
      'Counting problems',
      'Decision-making over time',
      'Probability calculations',
    ],
    whenNotToUse: [
      'Greedy algorithm works (simpler and faster)',
      'No overlapping subproblems (divide-and-conquer is better)',
      'State space is too large to store',
      'Simple mathematical formula exists',
    ],
    pitfalls: [
      'Wrong state definition (most common)',
      'Missing base case or wrong initialization',
      'Recursive stack overflow in memoization',
      'Integer overflow in large DP tables',
      'Not considering all transitions',
    ],
    relatedConcepts: ['recursion', 'greedy', 'memoization', 'backtracking'],
    prerequisites: ['Recursion', 'Arrays'],
  },
  'greedy': {
    slug: 'greedy',
    title: 'Greedy Algorithms',
    category: 'optimization',
    definition: 'Algorithms that make the locally optimal choice at each step, hoping to find the global optimum.',
    visualExplanation: 'At each decision point, evaluate all options and pick the one that seems best right now. The key is proving that local optimality leads to global optimality.',
    complexity: {
      timeWorst: 'O(n log n) usually (sorting dominates)',
      timeAverage: 'O(n log n)',
      timeBest: 'O(n)',
      spaceWorst: 'O(1)',
      spaceAverage: 'O(1)',
      spaceBest: 'O(1)',
      explanation: 'Typically dominated by sorting step, or O(n) if already sorted.',
    },
    whenToUse: [
      'Optimal substructure with greedy choice property',
      'Matroid optimization problems',
      'Interval scheduling',
      'Activity selection',
      'Fractional knapsack',
      'Minimum spanning tree',
      'Huffman coding',
    ],
    whenNotToUse: [
      'Local optimum does not lead to global optimum',
      'DP is required (overlapping subproblems)',
      'Problem requires exploring multiple branches',
    ],
    pitfalls: [
      'Assuming greedy works without proof',
      'Wrong sorting criteria',
      'Not handling ties correctly',
    ],
    relatedConcepts: ['dynamic-programming', 'sorting', 'minimum-spanning-tree'],
  },
  'backtracking': {
    slug: 'backtracking',
    title: 'Backtracking',
    category: 'searching',
    definition: 'A recursive technique that incrementally builds candidates and abandons them (backtracks) when they cannot lead to a valid solution.',
    visualExplanation: 'Systematically explore all candidate solutions. At each step, make a choice, recurse, then undo the choice (backtrack). Prune branches that cannot lead to a solution using constraints.',
    complexity: {
      timeWorst: 'O(branchingFactor^depth)',
      timeAverage: 'Depends on pruning effectiveness',
      timeBest: 'Depends on problem',
      spaceWorst: 'O(depth)',
      spaceAverage: 'O(depth)',
      spaceBest: 'O(depth)',
      explanation: 'Exponential in worst case, but pruning can make it much faster. Space is recursion depth.',
    },
    whenToUse: [
      'Constraint satisfaction problems',
      'Generating all permutations, combinations, subsets',
      'N-Queens, Sudoku, crosswords',
      'Scheduling with constraints',
      'Hamiltonian path',
    ],
    whenNotToUse: [
      'Only one or few solutions needed (heuristics better)',
      'Large search space with no effective pruning',
      'Simple iterative solution exists',
    ],
    pitfalls: [
      'Inefficient pruning (exponential explosion)',
      'Stack overflow on deep recursion',
      'Not resetting state correctly after backtracking',
      'Modifying shared mutable state',
    ],
    relatedConcepts: ['depth-first-search', 'recursion', 'dynamic-programming'],
  },
  'hash-map': {
    slug: 'hash-map',
    title: 'Hash Maps / Hash Tables',
    category: 'data-structure',
    definition: 'A data structure that maps keys to values using a hash function for O(1) average access.',
    visualExplanation: 'Keys are passed through a hash function to determine their storage bucket. Collisions are handled via chaining or open addressing.',
    complexity: {
      timeWorst: 'O(n)',
      timeAverage: 'O(1)',
      timeBest: 'O(1)',
      spaceWorst: 'O(n)',
      spaceAverage: 'O(n)',
      spaceBest: 'O(n)',
      explanation: 'Average O(1) for insert, delete, lookup. Worst case O(n) when many collisions occur.',
    },
    whenToUse: [
      'Fast lookups by key',
      'Counting frequencies',
      'Removing duplicates',
      'Caching/memoization',
      'Finding pairs or complements',
    ],
    whenNotToUse: [
      'Ordered data required (use TreeMap)',
      'Memory constrained environment',
      'Small dataset (array is faster)',
      'Range queries needed',
    ],
    pitfalls: [
      'Hash collision attacks',
      'Poor hash function causing clustering',
      'Not handling null keys',
      'Concurrent modification without synchronization',
    ],
    relatedConcepts: ['set', 'object', 'map'],
  },
  'heap': {
    slug: 'heap',
    title: 'Heap / Priority Queue',
    category: 'data-structure',
    definition: 'A complete binary tree where each parent is either >= (max-heap) or <= (min-heap) its children.',
    visualExplanation: 'Elements are arranged in a binary tree shape. For a min-heap, the smallest element is always at the root. Insertions bubble up, deletions bubble down.',
    complexity: {
      timeWorst: 'O(log n)',
      timeAverage: 'O(log n)',
      timeBest: 'O(1)',
      spaceWorst: 'O(n)',
      spaceAverage: 'O(n)',
      spaceBest: 'O(n)',
      explanation: 'Insert and extract operations take O(log n) because the tree height is log n. Peek is O(1).',
    },
    whenToUse: [
      'Need quick access to min/max',
      'Kth largest/smallest element',
      'Median in a data stream',
      'Dijkstra\'s algorithm',
      'Task scheduling',
      'Merge K sorted lists',
    ],
    whenNotToUse: [
      'Need arbitrary element access',
      'Small dataset (linear scan is simpler)',
      'Frequent searches for non-extreme values',
    ],
    pitfalls: [
      'Not a binary search tree (cannot search for arbitrary values)',
      '0-index vs 1-index child calculations',
      'Heap property violation after updates',
    ],
    relatedConcepts: ['tree', 'sorting', 'binary-search-tree'],
  },
  'prefix-sum': {
    slug: 'prefix-sum',
    title: 'Prefix Sum / Cumulative Sum',
    category: 'technique',
    definition: 'An array where each element at index i stores the sum of all elements from 0 to i in the original array.',
    visualExplanation: 'Compute prefix[i] = prefix[i-1] + arr[i]. Range sum from L to R = prefix[R] - prefix[L-1].',
    complexity: {
      timeWorst: 'O(n) precompute, O(1) query',
      timeAverage: 'O(n) precompute, O(1) query',
      timeBest: 'O(n) precompute, O(1) query',
      spaceWorst: 'O(n)',
      spaceAverage: 'O(n)',
      spaceBest: 'O(n)',
      explanation: 'Linear preprocessing, constant-time range queries.',
    },
    whenToUse: [
      'Multiple range sum queries',
      'Subarray sum problems',
      'Balancing and equilibrium problems',
      'Difference array for range updates',
      '2D grid range sum queries',
    ],
    whenNotToUse: [
      'Single query (just compute directly)',
      'Frequent array updates (use segment tree)',
      'Large memory constraints',
    ],
    pitfalls: [
      'Integer overflow for large arrays',
      'Off-by-one in prefix boundaries',
      'Negative index access in range queries',
    ],
    relatedConcepts: ['sliding-window', 'segment-tree', 'fenwick-tree'],
  },
  'trie': {
    slug: 'trie',
    title: 'Trie / Prefix Tree',
    category: 'data-structure',
    definition: 'A tree data structure where each node represents a character, and paths from root to leaf spell out strings.',
    visualExplanation: 'Each node has up to 26 (or alphabet size) children. Starting from root, follow characters of a string to check existence. Share common prefixes to save space.',
    complexity: {
      timeWorst: 'O(L)',
      timeAverage: 'O(L)',
      timeBest: 'O(L)',
      spaceWorst: 'O(N × L)',
      spaceAverage: 'O(N × L)',
      spaceBest: 'O(N × L)',
      explanation: 'Insert and search take O(L) where L is string length. Space is O(N × L) for N strings of average length L.',
    },
    whenToUse: [
      'String prefix matching',
      'Autocomplete and suggestions',
      'Spell checking',
      'IP routing (longest prefix match)',
      'Dictionary word search',
    ],
    whenNotToUse: [
      'Small set of strings (hash set is simpler)',
      'Exact string matching only',
      'Memory severely constrained',
    ],
    pitfalls: [
      'Memory overhead from child pointers',
      'Not tracking end-of-word correctly',
      'Case sensitivity handling',
    ],
    relatedConcepts: ['hash-map', 'depth-first-search', 'string'],
    codeExample: `class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isEnd = false;
}

class Trie {
  root = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch))
        node.children.set(ch, new TrieNode());
      node = node.children.get(ch)!;
    }
    node.isEnd = true;
  }

  search(word: string): boolean {
    let node = this.root;
    for (const ch of word) {
      if (!node.children.has(ch)) return false;
      node = node.children.get(ch)!;
    }
    return node.isEnd;
  }
}`,
    prerequisites: ['Trees', 'Hash Maps'],
  },
  'union-find': {
    slug: 'union-find',
    title: 'Union-Find / Disjoint Set Union (DSU)',
    category: 'data-structure',
    definition: 'A data structure that tracks elements partitioned into disjoint subsets, supporting union and find operations.',
    visualExplanation: 'Each element points to a parent. The root of a tree represents the set identifier. Path compression (pointing to root) and union by rank (attaching shorter tree to taller) keep operations fast.',
    complexity: {
      timeWorst: 'O(α(n))',
      timeAverage: 'O(α(n))',
      timeBest: 'O(α(n))',
      spaceWorst: 'O(n)',
      spaceAverage: 'O(n)',
      spaceBest: 'O(n)',
      explanation: 'Almost constant time due to inverse Ackermann function. Space is proportional to elements.',
    },
    whenToUse: [
      'Dynamic connectivity',
      'Cycle detection in undirected graphs',
      'Number of connected components',
      'Kruskal\'s MST algorithm',
      'Image processing (connected pixels)',
    ],
    whenNotToUse: [
      'Directed graph connectivity (use DFS)',
      'Path queries between nodes',
      'Simple adjacency checks',
    ],
    pitfalls: [
      'Forgetting path compression',
      'Wrong union logic (not checking roots first)',
      'Not handling 0 vs 1-indexing',
    ],
    relatedConcepts: ['graph', 'minimum-spanning-tree', 'depth-first-search'],
    codeExample: `class UnionFind {
  parent: number[];
  rank: number[];

  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = new Array(n).fill(0);
  }

  find(x: number): number {
    if (this.parent[x] !== x)
      this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }

  union(x: number, y: number): void {
    const px = this.find(x), py = this.find(y);
    if (px === py) return;
    if (this.rank[px] < this.rank[py])
      [px, py] = [py, px];
    this.parent[py] = px;
    if (this.rank[px] === this.rank[py])
      this.rank[px]++;
  }
}`,
    prerequisites: ['Trees', 'Recursion'],
  },
  'topological-sort': {
    slug: 'topological-sort',
    title: 'Topological Sort',
    category: 'graph',
    definition: 'A linear ordering of DAG vertices where every directed edge u -> v means u appears before v.',
    visualExplanation: 'Use DFS: append node to result after visiting all descendants (post-order). Or use Kahn\'s algorithm: repeatedly remove nodes with in-degree 0.',
    complexity: {
      timeWorst: 'O(V + E)',
      timeAverage: 'O(V + E)',
      timeBest: 'O(V + E)',
      spaceWorst: 'O(V)',
      spaceAverage: 'O(V)',
      spaceBest: 'O(V)',
      explanation: 'Visits each vertex and edge once. Linear in input size.',
    },
    whenToUse: [
      'Task scheduling with dependencies',
      'Course prerequisite ordering',
      'Build system compilation order',
      'Dependency resolution',
      'Finding cycles in directed graphs',
    ],
    whenNotToUse: [
      'Graph has cycles (not a DAG)',
      'Only need branch-level ordering',
    ],
    pitfalls: [
      'Forgetting graph must be a DAG',
      'Not detecting cycles',
      'Ordering depends on algorithm variant',
    ],
    relatedConcepts: ['depth-first-search', 'breadth-first-search', 'graph'],
  },
  'kadane': {
    slug: 'kadane',
    title: 'Kadane\'s Algorithm',
    category: 'optimization',
    definition: 'Find the maximum subarray sum by iterating once, tracking the best sum ending at each position.',
    visualExplanation: 'Maintain current_sum (sum of subarray ending here) and max_sum (best seen). For each element, decide: extend current subarray or start fresh. max_sum = max(max_sum, current_sum).',
    complexity: {
      timeWorst: 'O(n)',
      timeAverage: 'O(n)',
      timeBest: 'O(n)',
      spaceWorst: 'O(1)',
      spaceAverage: 'O(1)',
      spaceBest: 'O(1)',
      explanation: 'Single pass through the array with constant extra space.',
    },
    whenToUse: [
      'Maximum subarray sum',
      'Maximum product subarray',
      'Best time to buy/sell stock',
      'Maximum sum circular subarray',
      'Maximum subarray with at most K deletions',
    ],
    whenNotToUse: [
      'Need the actual subarray (not just sum)',
      'Non-contiguous subsets',
      'Minimum subarray (just negate)',
    ],
    pitfalls: [
      'Handling all-negative arrays',
      'Resetting current_sum at wrong point',
      'Integer overflow for large sums',
    ],
    relatedConcepts: ['dynamic-programming', 'greedy', 'prefix-sum'],
    codeExample: `function maxSubarraySum(arr: number[]): number {
  let maxSum = arr[0], currentSum = arr[0];
  for (let i = 1; i < arr.length; i++) {
    currentSum = Math.max(arr[i], currentSum + arr[i]);
    maxSum = Math.max(maxSum, currentSum);
  }
  return maxSum;
}`,
  },
};
