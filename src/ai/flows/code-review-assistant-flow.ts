'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ReviewIssueSchema = z.object({
  line: z.number().describe('The line number where the issue occurs.'),
  severity: z.enum(['critical', 'warning', 'suggestion']).describe('The severity of the issue.'),
  message: z.string().describe('A description of the issue.'),
  suggestion: z.string().describe('A suggestion for fixing or improving the issue.'),
});

const CodeReviewAssistantInputSchema = z.object({
  code: z.string().describe('The code submitted by the user for review.'),
  language: z.string().describe('The programming language of the submitted code.'),
});
export type CodeReviewAssistantInput = z.infer<typeof CodeReviewAssistantInputSchema>;

const CodeReviewAssistantOutputSchema = z.object({
  summary: z.string().describe('A short executive summary of the code quality and review findings.'),
  strengths: z.array(z.string()).describe('List of strengths or things done well in the code.'),
  issues: z.array(ReviewIssueSchema).describe('List of issues found in the code, ordered by severity.'),
  improvements: z.array(z.string()).describe('List of improvement suggestions including optimization, readability, best practices, and security.'),
  score: z.number().describe('An overall code quality score from 0 to 100.'),
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
  prompt: `You are an expert code reviewer. Analyze the given code and provide structured feedback covering:

1. **Bug Detection** – Identify any logic errors, runtime issues, or potential crashes.
2. **Code Quality** – Assess readability, naming conventions, structure, and adherence to language idioms.
3. **Best Practices** – Check for modern patterns, error handling, and industry standards.
4. **Time & Space Complexity** – Analyze algorithmic complexity and suggest improvements.
5. **Optimization** – Spot performance bottlenecks and inefficient operations.
6. **Readability** – Suggest ways to make the code clearer and more maintainable.
7. **Security** – Flag any insecure patterns (e.g. injection risks, unsafe eval, hardcoded secrets).

Return a structured review with:
- A short executive summary.
- A list of strengths (things done well).
- A list of specific issues, each with line number, severity (critical/warning/suggestion), description, and a concrete suggestion.
- A list of improvement opportunities (optimization, best practices, readability, security).
- An overall score from 0-100.

Language: {{{language}}}
Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`
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
