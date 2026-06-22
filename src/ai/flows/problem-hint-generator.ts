'use server';
/**
 * @fileOverview A Genkit flow for generating subtle hints for coding problems.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateProblemHintInputSchema = z.object({
  problemStatement: z.string().describe('The full problem description, including input/output formats, constraints, and examples.'),
  userCode: z.string().describe('The student\'s submitted code that failed a test case.'),
  failureMessage: z.string().describe('The message indicating why the test case failed.'),
  language: z.string().describe('The programming language of the user\'s code.'),
});
export type GenerateProblemHintInput = z.infer<typeof GenerateProblemHintInputSchema>;

const GenerateProblemHintOutputSchema = z.object({
  hint: z.string().describe('A subtle AI-generated hint about the logical error in the code.'),
});
export type GenerateProblemHintOutput = z.infer<typeof GenerateProblemHintOutputSchema>;

export async function generateProblemHint(input: GenerateProblemHintInput): Promise<GenerateProblemHintOutput> {
  return problemHintGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'problemHintGeneratorPrompt',
  input: { schema: GenerateProblemHintInputSchema },
  output: { schema: GenerateProblemHintOutputSchema },
  prompt: `You are an experienced coding tutor. Provide a subtle hint about a logical error in their code.

Problem Statement:
{{{problemStatement}}}

User Code ({{{language}}}):
\`\`\`
{{{userCode}}}
\`\`\`

Failure Message:
{{{failureMessage}}}`,
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
