'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ComplexityInputSchema = z.object({
  code: z.string().describe('The user code to analyze.'),
  language: z.string().describe('Programming language.'),
  problemDescription: z.string().optional().describe('Problem context.'),
});

const ComplexityOutputSchema = z.object({
  timeComplexity: z.string().describe('Time complexity in Big O notation.'),
  spaceComplexity: z.string().describe('Space complexity in Big O notation.'),
  worstCase: z.string().describe('Detailed worst-case analysis.'),
  bestCase: z.string().describe('Detailed best-case analysis.'),
  averageCase: z.string().describe('Detailed average-case analysis.'),
  explanation: z.string().describe('Full explanation of why.'),
  bottlenecks: z.array(z.string()).describe('Performance bottlenecks.'),
  optimizationSuggestions: z.array(z.string()).describe('Ways to improve.'),
});

export async function aiComplexityAnalyzer(input: z.infer<typeof ComplexityInputSchema>) {
  const { output } = await complexityPrompt(input);
  return output!;
}

const complexityPrompt = ai.definePrompt({
  name: 'complexityAnalyzer',
  input: { schema: ComplexityInputSchema },
  output: { schema: ComplexityOutputSchema },
  prompt: `You are an expert algorithms professor analyzing code complexity.

Code ({{{language}}}):
{{{code}}}
Problem context: {{{problemDescription}}}

Analyze the time and space complexity in Big O notation.

For each case (worst, best, average), identify:
- Which inputs cause that case
- The mathematical derivation
- The growth rate

Consider:
- Loop nesting and iterations
- Recursive calls and branching factor
- Data structure operation costs
- Recursion stack depth
- Memory allocations
- Input size parameters

Provide clear, pedagogically sound explanations.`,
});
