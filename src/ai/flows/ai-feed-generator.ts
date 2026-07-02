'use server';
/**
 * @fileOverview A Genkit flow for generating a personalized AI feed of tips and recommendations.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiFeedGeneratorInputSchema = z.object({
  userInterests: z.array(z.string()).describe('The user\'s areas of interest.'),
  skillLevel: z.string().describe('The user\'s current skill level.'),
  recentActivity: z.array(z.string()).describe('Recent user activity for context.'),
});
export type AiFeedGeneratorInput = z.infer<typeof AiFeedGeneratorInputSchema>;

const TipSchema = z.object({
  title: z.string().describe('A short title for the tip.'),
  content: z.string().describe('The tip content or advice.'),
  category: z.string().describe('The category this tip belongs to.'),
});

const RecommendationSchema = z.object({
  type: z.string().describe('The type of recommendation (e.g., article, course, project, tool).'),
  title: z.string().describe('The title of the recommended item.'),
  reason: z.string().describe('Why this is recommended based on the user\'s profile.'),
});

const AiFeedGeneratorOutputSchema = z.object({
  tips: z.array(TipSchema).describe('Personalized tips for the user.'),
  recommendations: z.array(RecommendationSchema).describe('Personalized recommendations for the user.'),
});
export type AiFeedGeneratorOutput = z.infer<typeof AiFeedGeneratorOutputSchema>;

export async function aiFeedGenerator(input: AiFeedGeneratorInput): Promise<AiFeedGeneratorOutput> {
  return aiFeedGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiFeedGeneratorPrompt',
  input: {schema: AiFeedGeneratorInputSchema},
  output: {schema: AiFeedGeneratorOutputSchema},
  prompt: `You are a personalized learning curator who generates a tailored feed of tips and recommendations.

Based on the user's interests, skill level, and recent activity, provide:
- Actionable tips that help the user improve and stay motivated.
- Curated recommendations for articles, courses, projects, and tools.

Ensure all content is relevant to the user's skill level ({{{skillLevel}}}) and interests.

User interests: {{{userInterests}}}
Recent activity: {{{recentActivity}}}
`,
});

const aiFeedGeneratorFlow = ai.defineFlow(
  {
    name: 'aiFeedGeneratorFlow',
    inputSchema: AiFeedGeneratorInputSchema,
    outputSchema: AiFeedGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
