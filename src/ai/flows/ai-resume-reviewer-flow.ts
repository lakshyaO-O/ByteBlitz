'use server';
/**
 * @fileOverview A Genkit flow for reviewing resumes and providing detailed feedback.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiResumeReviewerInputSchema = z.object({
  resumeText: z.string().describe('The full text of the resume to review.'),
  jobDescription: z.string().optional().describe('The target job description for alignment.'),
  targetRole: z.string().optional().describe('The specific role the user is applying for.'),
  yearsOfExperience: z.number().optional().describe('The user\'s years of experience.'),
});
export type AiResumeReviewerInput = z.infer<typeof AiResumeReviewerInputSchema>;

const WeaknessSchema = z.object({
  issue: z.string().describe('The identified issue or weakness.'),
  severity: z.enum(['low', 'medium', 'high']).describe('The severity of the issue.'),
  suggestion: z.string().describe('A suggestion to address this issue.'),
});

const SuggestionSchema = z.object({
  section: z.string().describe('The resume section this suggestion applies to.'),
  original: z.string().describe('The original text from the resume.'),
  improved: z.string().describe('The improved version of the text.'),
  reason: z.string().describe('Why the improved version is better.'),
});

const AiResumeReviewerOutputSchema = z.object({
  overallScore: z.number().describe('An overall score from 0 to 100.'),
  summary: z.string().describe('A brief summary of the resume review.'),
  strengths: z.array(z.string()).describe('Key strengths of the resume.'),
  weaknesses: z.array(WeaknessSchema).describe('Identified weaknesses in the resume.'),
  suggestions: z.array(SuggestionSchema).describe('Specific before-and-after suggestions for improvement.'),
  keywords: z.array(z.string()).describe('Important keywords found or recommended.'),
  formattingIssues: z.array(z.string()).describe('Any formatting or structural issues.'),
  actionItems: z.array(z.string()).describe('Actionable next steps for the user.'),
});
export type AiResumeReviewerOutput = z.infer<typeof AiResumeReviewerOutputSchema>;

export async function aiResumeReviewer(input: AiResumeReviewerInput): Promise<AiResumeReviewerOutput> {
  return aiResumeReviewerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiResumeReviewerPrompt',
  input: {schema: AiResumeReviewerInputSchema},
  output: {schema: AiResumeReviewerOutputSchema},
  prompt: `You are an expert resume reviewer and career coach.

Provide a thorough resume review with:
- An overall score from 0 to 100 based on industry best practices.
- Specific, constructive feedback on what works and what doesn't.
- Concrete before-and-after rewrites for each suggestion.
- A focus on being helpful and actionable, not just critical.

Score strictly between 0 and 100. Be constructive and specific in all suggestions.

Resume text:
{{{resumeText}}}

Target role: {{{targetRole}}}
Job description: {{{jobDescription}}}
Years of experience: {{{yearsOfExperience}}}
`,
});

const aiResumeReviewerFlow = ai.defineFlow(
  {
    name: 'aiResumeReviewerFlow',
    inputSchema: AiResumeReviewerInputSchema,
    outputSchema: AiResumeReviewerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
