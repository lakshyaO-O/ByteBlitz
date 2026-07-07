'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MentorV2InputSchema = z.object({
  problemTitle: z.string().describe('The title of the problem.'),
  problemDescription: z.string().describe('The full problem statement.'),
  constraints: z.string().describe('The problem constraints.'),
  topics: z.array(z.string()).describe('The problem topics/categories.'),
  level: z.enum(['beginner', 'intermediate', 'expert']).describe('The user requested explanation depth.'),
  userCode: z.string().optional().describe('The user code attempt, if any.'),
});

const MentorV2OutputSchema = z.object({
  intuition: z.string().describe('Core intuition behind the solution.'),
  whyItWorks: z.string().describe('Why the approach is correct.'),
  approach: z.string().describe('Step-by-step approach.'),
  alternatives: z.array(z.string()).describe('Alternative approaches with pros/cons.'),
  mathematicalReasoning: z.string().optional().describe('Mathematical foundation.'),
  complexity: z.object({
    time: z.string().describe('Time complexity.'),
    space: z.string().describe('Space complexity.'),
    explanation: z.string().describe('Why this complexity.'),
  }),
  edgeCases: z.array(z.string()).describe('Edge cases to consider.'),
  interviewPerspective: z.string().optional().describe('Why interviewers ask this.'),
  realWorldApplications: z.array(z.string()).optional().describe('Real-world uses.'),
  commonMistakes: z.array(z.string()).describe('Common mistakes to avoid.'),
  optimizationOpportunities: z.array(z.string()).describe('Ways to optimize further.'),
  codeSnippet: z.string().optional().describe('Brief illustrative code (no full solution).'),
});

const beginnerPrompt = ai.definePrompt({
  name: 'mentorV2Beginner',
  input: { schema: MentorV2InputSchema },
  output: { schema: MentorV2OutputSchema },
  prompt: `You are an expert competitive programming mentor teaching a BEGINNER.

Problem: {{{problemTitle}}}
{{{problemDescription}}}
Constraints: {{{constraints}}}
Topics: {{{topics}}}

TEACHING RULES:
- Use simple analogies and real-world examples.
- Explain like you're teaching someone who knows basic syntax but no algorithms.
- Define every technical term before using it.
- Use concrete examples with small inputs.
- NEVER provide the complete solution code.
- Focus on BUILDING INTUITION, not giving answers.

Structure your response with ALL required fields. For codeSnippet, show only 3-5 lines illustrating one small concept.`,
});

const intermediatePrompt = ai.definePrompt({
  name: 'mentorV2Intermediate',
  input: { schema: MentorV2InputSchema },
  output: { schema: MentorV2OutputSchema },
  prompt: `You are an expert competitive programming mentor teaching an INTERMEDIATE student.

Problem: {{{problemTitle}}}
{{{problemDescription}}}
Constraints: {{{constraints}}}
Topics: {{{topics}}}

TEACHING RULES:
- Assume knowledge of standard DSA concepts and common patterns.
- Focus on the SPECIFIC insight needed for this problem.
- Compare and contrast alternative approaches.
- Include complexity analysis with reasoning.
- Discuss edge cases and proof of correctness.
- NEVER provide the complete solution code.
- Show code snippets only for non-obvious implementation details.

Structure your response with ALL required fields.`,
});

const expertPrompt = ai.definePrompt({
  name: 'mentorV2Expert',
  input: { schema: MentorV2InputSchema },
  output: { schema: MentorV2OutputSchema },
  prompt: `You are an expert competitive programming mentor teaching an EXPERT.

Problem: {{{problemTitle}}}
{{{problemDescription}}}
Constraints: {{{constraints}}}
Topics: {{{topics}}}

TEACHING RULES:
- Assume deep knowledge of algorithms, data structures, and problem-solving patterns.
- Focus on mathematical reasoning, lower bounds, and optimization.
- Discuss theoretical foundations and advanced variants.
- Analyze time-space tradeoffs in depth.
- Reference specific research papers or advanced techniques where applicable.
- NEVER provide the complete solution code.
- Use code only to illustrate highly nuanced implementation choices.

Structure your response with ALL required fields (except optionally realWorldApplications).`,
});

async function mentorV2Flow(input: z.infer<typeof MentorV2InputSchema>): Promise<z.infer<typeof MentorV2OutputSchema>> {
  const promptMap = { beginner: beginnerPrompt, intermediate: intermediatePrompt, expert: expertPrompt };
  const prompt = promptMap[input.level];
  const { output } = await prompt(input);
  return output!;
}

export async function aiMentorV2(input: z.infer<typeof MentorV2InputSchema>): Promise<z.infer<typeof MentorV2OutputSchema>> {
  return mentorV2Flow(input);
}

export { MentorV2InputSchema, MentorV2OutputSchema };
