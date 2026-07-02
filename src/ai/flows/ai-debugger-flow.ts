'use server';
/**
 * @fileOverview A Genkit flow for an AI debugger that analyzes code for bugs.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiDebuggerInputSchema = z.object({
  code: z.string().describe('The code snippet to analyze for bugs.'),
  language: z.string().describe('The programming language of the code.'),
  errorMessage: z.string().optional().describe('Any error message produced by the code.'),
  expectedBehavior: z.string().optional().describe('What the code is expected to do.'),
});
export type AiDebuggerInput = z.infer<typeof AiDebuggerInputSchema>;

const AiDebuggerOutputSchema = z.object({
  errorType: z.string().describe('The category of the error (e.g., syntax, logic, runtime, off-by-one).'),
  rootCause: z.string().describe('The underlying root cause of the bug.'),
  explanation: z.string().describe('A clear explanation of WHAT the bug is and WHY it happens.'),
  fix: z.string().optional().describe('A suggested fix for the bug.'),
  prevention: z.string().describe('How to prevent this type of bug in the future.'),
});
export type AiDebuggerOutput = z.infer<typeof AiDebuggerOutputSchema>;

export async function aiDebugger(input: AiDebuggerInput): Promise<AiDebuggerOutput> {
  return aiDebuggerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiDebuggerPrompt',
  input: {schema: AiDebuggerInputSchema},
  output: {schema: AiDebuggerOutputSchema},
  prompt: `You are an expert debugger who carefully analyzes code to find and explain bugs.

Your approach:
1. First, identify WHAT the bug is and WHY it occurs.
2. Explain the root cause in a clear, educational way.
3. Only after explaining the issue, suggest a concrete fix.
4. Conclude with advice on preventing similar bugs.

Be thorough in your explanation of the bug before presenting the fix. Do not jump straight to the solution.

Code ({{{language}}}):
\`\`\`
{{{code}}}
\`\`\`

Error message: {{{errorMessage}}}
Expected behavior: {{{expectedBehavior}}}
`,
});

const aiDebuggerFlow = ai.defineFlow(
  {
    name: 'aiDebuggerFlow',
    inputSchema: AiDebuggerInputSchema,
    outputSchema: AiDebuggerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
