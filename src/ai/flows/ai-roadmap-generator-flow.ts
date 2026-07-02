'use server';
/**
 * @fileOverview A Genkit flow for generating personalized learning roadmaps.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiRoadmapGeneratorInputSchema = z.object({
  currentLevel: z.string().describe('The user\'s current skill level.'),
  goal: z.string().describe('The learning goal the user wants to achieve.'),
  languages: z.array(z.string()).describe('Programming languages the user wants to learn or use.'),
  timeCommitment: z.string().describe('How much time the user can commit per week.'),
  topics: z.array(z.string()).describe('Specific topics the user wants to cover.'),
});
export type AiRoadmapGeneratorInput = z.infer<typeof AiRoadmapGeneratorInputSchema>;

const ResourceSchema = z.object({
  title: z.string().describe('The title of the resource.'),
  type: z.string().describe('The type of resource (e.g., article, video, course, book).'),
  url: z.string().optional().describe('A URL to the resource if available.'),
});

const PhaseSchema = z.object({
  name: z.string().describe('The name of this learning phase.'),
  duration: z.string().describe('The duration of this phase.'),
  topics: z.array(z.string()).describe('Topics covered in this phase.'),
  resources: z.array(ResourceSchema).describe('Recommended resources for this phase.'),
  milestones: z.array(z.string()).describe('Concrete milestones to track progress.'),
});

const WeeklyScheduleSchema = z.object({
  week: z.number().describe('The week number.'),
  focus: z.string().describe('The main focus for this week.'),
  tasks: z.array(z.string()).describe('Specific tasks for this week.'),
});

const AiRoadmapGeneratorOutputSchema = z.object({
  title: z.string().describe('The title of the learning roadmap.'),
  description: z.string().describe('An overview of the roadmap.'),
  estimatedDuration: z.string().describe('The estimated total duration to achieve the goal.'),
  phases: z.array(PhaseSchema).describe('The phases of the learning roadmap.'),
  weeklySchedule: z.array(WeeklyScheduleSchema).describe('A week-by-week breakdown of tasks.'),
  tips: z.array(z.string()).describe('General tips for success.'),
});
export type AiRoadmapGeneratorOutput = z.infer<typeof AiRoadmapGeneratorOutputSchema>;

export async function aiRoadmapGenerator(input: AiRoadmapGeneratorInput): Promise<AiRoadmapGeneratorOutput> {
  return aiRoadmapGeneratorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiRoadmapGeneratorPrompt',
  input: {schema: AiRoadmapGeneratorInputSchema},
  output: {schema: AiRoadmapGeneratorOutputSchema},
  prompt: `You are a expert learning path designer who creates personalized, structured learning roadmaps.

Create a comprehensive learning roadmap that:
- Breaks the journey into clear weekly phases with concrete milestones.
- Adapts to the user's current level ({{{currentLevel}}}) and goals.
- Recommends specific resources for each phase.
- Includes a week-by-week schedule with actionable tasks.

Be realistic about timelines based on the user's time commitment ({{{timeCommitment}}}).

Current level: {{{currentLevel}}}
Goal: {{{goal}}}
Languages: {{{languages}}}
Time commitment: {{{timeCommitment}}}
Topics to cover: {{{topics}}}
`,
});

const aiRoadmapGeneratorFlow = ai.defineFlow(
  {
    name: 'aiRoadmapGeneratorFlow',
    inputSchema: AiRoadmapGeneratorInputSchema,
    outputSchema: AiRoadmapGeneratorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
