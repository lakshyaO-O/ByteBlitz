'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MistakePredictorInputSchema = z.object({
  problemTitle: z.string().describe('The problem title.'),
  problemDescription: z.string().describe('The full problem statement.'),
  constraints: z.string().describe('The problem constraints.'),
  topics: z.array(z.string()).describe('Problem topics.'),
  difficulty: z.string().describe('Problem difficulty.'),
  userCode: z.string().optional().describe('User code, if any.'),
  language: z.string().optional().describe('Programming language.'),
});

const MistakePredictorOutputSchema = z.object({
  predictions: z.array(z.object({
    category: z.string().describe('Error category e.g., Overflow, Off-by-one.'),
    likelihood: z.enum(['high', 'medium', 'low']).describe('How likely this mistake is.'),
    explanation: z.string().describe('Why users make this mistake for this problem.'),
    prevention: z.string().describe('How to avoid this mistake.'),
    relatedTopic: z.string().describe('Related DSA topic.'),
  })),
  mostLikelyMistake: z.string().describe('The single most likely mistake to watch for.'),
});

export async function aiMistakePredictor(input: z.infer<typeof MistakePredictorInputSchema>) {
  const { output } = await mistakePredictorPrompt(input);
  return output!;
}

const mistakePredictorPrompt = ai.definePrompt({
  name: 'mistakePredictor',
  input: { schema: MistakePredictorInputSchema },
  output: { schema: MistakePredictorOutputSchema },
  prompt: `You are an expert competitive programming educator who predicts mistakes students will make.

Problem: {{{problemTitle}}}
{{{problemDescription}}}
Constraints: {{{constraints}}}
Topics: {{{topics}}}
Difficulty: {{{difficulty}}}
User code: {{{userCode}}}
Language: {{{language}}}

Analyze the problem and predict the most common mistakes, ordered by likelihood.

Categories to consider:
- Overflow (integer overflow, buffer overflow)
- Off-by-one (boundary conditions, loop indices)
- Infinite loops (termination conditions)
- Wrong comparator (sorting, ordering, comparisons)
- Recursion depth (stack overflow, missing base case)
- Duplicate handling (set vs multiset, duplicates in input)
- Integer division (truncation, rounding)
- Floating point errors (precision, equality)
- Boundary conditions (empty input, single element, edge of range)
- Null/undefined handling (missing values)
- Memory limit (excessive allocation)
- Time limit (inefficient algorithm)

For each prediction, explain WHY this mistake is common for THIS specific problem.`,
});
