'use server';
/**
 * @fileOverview An AI assistant that provides feedback on code submissions.
 *
 * - codeReviewAssistant - A function that generates AI-powered code review feedback.
 * - CodeReviewAssistantInput - The input type for the codeReviewAssistant function.
 * - CodeReviewAssistantOutput - The return type for the codeReviewAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CodeReviewAssistantInputSchema = z.object({
  code: z.string().describe('The code submitted by the user for review.'),
  language: z.string().optional().describe('The programming language of the submitted code.'),
});
export type CodeReviewAssistantInput = z.infer<typeof CodeReviewAssistantInputSchema>;

const CodeReviewAssistantOutputSchema = z.object({
  feedback: z.string().describe('AI-generated feedback on code style, potential inefficiencies, and common pitfalls.'),
});
export type CodeReviewAssistantOutput = z.infer<typeof CodeReviewAssistantOutputSchema>;

export async function codeReviewAssistant(
  input: CodeReviewAssistantInput
): Promise<CodeReviewAssistantOutput> {
  return codeReviewAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeReviewAssistantPrompt',
  input: {schema: CodeReviewAssistantInputSchema},
  output: {schema: CodeReviewAssistantOutputSchema},
  prompt: `You are an expert code reviewer specializing in best practices, efficiency, and common pitfalls for competitive programming. Review the following code snippet and provide constructive feedback.

Focus on:
-   **Style**: Readability, naming conventions, and adherence to common practices for the given language.
-   **Efficiency**: Identify potential performance bottlenecks, algorithmic complexity issues, or opportunities for optimization.
-   **Common Pitfalls**: Point out typical mistakes beginners or even experienced coders might make, such as off-by-one errors, unhandled edge cases, or insecure patterns.

Do not provide a solution or fix the code directly. Instead, guide the user to improve their own code.

Here is the code to review:
Language: {{{language}}}
```{{{language}}}
{{{code}}}
```
`,
});

const codeReviewAssistantFlow = ai.defineFlow(
  {
    name: 'codeReviewAssistantFlow',
    inputSchema: CodeReviewAssistantInputSchema,
    outputSchema: CodeReviewAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
