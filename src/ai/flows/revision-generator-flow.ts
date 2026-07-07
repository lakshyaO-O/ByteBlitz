'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const RevisionInputSchema = z.object({
  problemTitle: z.string().describe('The solved problem title.'),
  problemDescription: z.string().describe('The problem statement.'),
  solutionApproach: z.string().describe('The solution approach used.'),
  code: z.string().optional().describe('The solved code.'),
  topics: z.array(z.string()).describe('Problem topics.'),
  count: z.number().optional().describe('Number of revision items to generate (default 5).'),
});

const RevisionOutputSchema = z.object({
  cards: z.array(z.object({
    type: z.enum(['flashcard', 'mcq', 'true-false', 'fill-blank']),
    question: z.string(),
    answer: z.string(),
    options: z.array(z.string()).optional(),
    explanation: z.string(),
    topic: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
  })),
});

export async function aiRevisionGenerator(input: z.infer<typeof RevisionInputSchema>) {
  const { output } = await revisionPrompt(input);
  return output!;
}

const revisionPrompt = ai.definePrompt({
  name: 'revisionGenerator',
  input: { schema: RevisionInputSchema },
  output: { schema: RevisionOutputSchema },
  prompt: `You are an expert educator creating revision materials.

Problem: {{{problemTitle}}}
{{{problemDescription}}}
Solution: {{{solutionApproach}}}
Topics: {{{topics}}}

Create {{{count}}} revision items that test understanding of the key concepts.
Mix different types: flashcards (Q&A), multiple choice, true/false, fill-in-blanks.

Each item should:
- Test DEEP understanding, not recall
- Have clear, unambiguous answers
- Include explanations that teach
- Be appropriate difficulty based on the problem

Focus on: the core algorithm, time/space complexity tradeoffs, edge cases, pattern recognition.`,
});
