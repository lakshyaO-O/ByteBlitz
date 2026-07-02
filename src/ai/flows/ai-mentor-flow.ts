'use server';
/**
 * @fileOverview A Genkit flow for an AI mentor that guides users through coding problems.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiMentorInputSchema = z.object({
  question: z.string().describe('The user\'s coding or conceptual question.'),
  language: z.string().optional().describe('The programming language context of the question.'),
  userLevel: z.string().optional().describe('The user\'s skill level (beginner, intermediate, advanced).'),
  context: z.string().optional().describe('Additional context or background information.'),
});
export type AiMentorInput = z.infer<typeof AiMentorInputSchema>;

const AiMentorOutputSchema = z.object({
  answer: z.string().describe('The AI mentor\'s step-by-step explanation and guidance.'),
  codeExample: z.string().optional().describe('A short illustrative code example to demonstrate a concept.'),
  resources: z.array(z.string()).optional().describe('Links to further reading or documentation.'),
});
export type AiMentorOutput = z.infer<typeof AiMentorOutputSchema>;

export async function aiMentor(input: AiMentorInput): Promise<AiMentorOutput> {
  return aiMentorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiMentorPrompt',
  input: {schema: AiMentorInputSchema},
  output: {schema: AiMentorOutputSchema},
  prompt: `You are a patient and encouraging coding mentor who explains concepts step by step.

Your teaching style:
- Use analogies and real-world examples to make complex ideas relatable.
- Break problems down into smaller, digestible steps.
- Guide the user to discover the answer themselves instead of giving it outright.
- NEVER provide full solutions to competition or coding challenge problems.
- Adapt your explanation depth to the user's level ({{{userLevel}}}).

When providing code examples, keep them minimal and focused on illustrating a specific concept rather than solving the entire problem.

User's question: {{{question}}}
Language context: {{{language}}}
Additional context: {{{context}}}
`,
});

const aiMentorFlow = ai.defineFlow(
  {
    name: 'aiMentorFlow',
    inputSchema: AiMentorInputSchema,
    outputSchema: AiMentorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
