'use server';
/**
 * @fileOverview A Genkit flow for generating subtle hints for coding problems.
 *
 * - generateProblemHint - A function that generates a subtle AI-powered hint for a coding problem solution.
 * - GenerateProblemHintInput - The input type for the generateProblemHint function.
 * - GenerateProblemHintOutput - The return type for the generateProblemHint function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProblemHintInputSchema = z.object({
  problemStatement: z.string().describe('The full problem description, including input/output formats, constraints, and examples.'),
  userCode: z.string().describe('The student\'s submitted code that failed a test case.'),
  failureMessage: z.string().describe('The message indicating why the test case failed (e.g., "Wrong Answer", "Time Limit Exceeded", actual vs. expected output).'),
  language: z.string().describe('The programming language of the user\'s code (e.g., Python, Java, C++, JavaScript).'),
});
export type GenerateProblemHintInput = z.infer<typeof GenerateProblemHintInputSchema>;

const GenerateProblemHintOutputSchema = z.object({
  hint: z.string().describe('A subtle AI-generated hint about the logical error in the code, without giving the direct answer.'),
});
export type GenerateProblemHintOutput = z.infer<typeof GenerateProblemHintOutputSchema>;

export async function generateProblemHint(input: GenerateProblemHintInput): Promise<GenerateProblemHintOutput> {
  return problemHintGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'problemHintGeneratorPrompt',
  input: { schema: GenerateProblemHintInputSchema },
  output: { schema: GenerateProblemHintOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
    ],
  },
  prompt: `You are an experienced coding tutor. A student has submitted code for a problem, and it failed a test case. Your task is to provide a *subtle hint* about a *logical error* in their code, helping them to debug it themselves without giving them the direct answer or the corrected code. Focus on guiding questions or pointing towards a concept they might have overlooked. The hint should be concise and constructive.

Here is the problem statement:
Problem:
\`\`\`
{{{problemStatement}}}
\`\`\`

Here is the student's code (Language: {{{language}}}):
\`\`\`
{{{userCode}}}
\`\`\`

Here is the test case failure message:
\`\`\`
{{{failureMessage}}}
\`\`\`

What subtle hint can you provide to help the student find the logical error? Remember, do not give the direct solution or correct code.`,
});

const problemHintGeneratorFlow = ai.defineFlow(
  {
    name: 'problemHintGeneratorFlow',
    inputSchema: GenerateProblemHintInputSchema,
    outputSchema: GenerateProblemHintOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
