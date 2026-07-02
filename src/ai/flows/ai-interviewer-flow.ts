'use server';
/**
 * @fileOverview A Genkit flow for an AI coding interview assistant.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PreviousAnswerSchema = z.object({
  question: z.string().describe('The interview question asked.'),
  answer: z.string().describe('The user\'s answer to the question.'),
});

const AiInterviewerInputSchema = z.object({
  topic: z.string().describe('The topic area for the interview questions.'),
  difficulty: z.string().describe('The difficulty level (easy, medium, hard).'),
  questionCount: z.number().describe('The number of questions to generate.'),
  previousAnswers: z.array(PreviousAnswerSchema).optional().describe('Previous answers from the user for feedback.'),
});
export type AiInterviewerInput = z.infer<typeof AiInterviewerInputSchema>;

const InterviewQuestionSchema = z.object({
  id: z.string().describe('A unique identifier for the question.'),
  question: z.string().describe('The interview question.'),
  category: z.string().describe('The category (e.g., DSA, system design, behavioral).'),
  difficulty: z.string().describe('The difficulty of this specific question.'),
  tips: z.string().describe('Tips for answering this question well.'),
});

const AiInterviewerOutputSchema = z.object({
  questions: z.array(InterviewQuestionSchema).describe('The generated interview questions.'),
  feedback: z.string().optional().describe('Feedback on the user\'s previous answers.'),
});
export type AiInterviewerOutput = z.infer<typeof AiInterviewerOutputSchema>;

export async function aiInterviewer(input: AiInterviewerInput): Promise<AiInterviewerOutput> {
  return aiInterviewerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiInterviewerPrompt',
  input: {schema: AiInterviewerInputSchema},
  output: {schema: AiInterviewerOutputSchema},
  prompt: `You are an experienced technical interviewer at a top tech company.

Generate coding interview questions that cover:
- Data Structures and Algorithms (DSA)
- System Design
- Behavioral topics

Adapt the difficulty to {{{difficulty}}} level. Provide helpful tips for each question on how to approach and answer it effectively.

If previous answers are provided, give constructive feedback on them before generating new questions.

Topic: {{{topic}}}
Number of questions: {{{questionCount}}}
${'{{#previousAnswers}}'}
Previous answers:
${'{{#.}}'}
Q: {{{question}}}
A: {{{answer}}}
${'{{/.}}'}
${'{{/previousAnswers}}'}
`,
});

const aiInterviewerFlow = ai.defineFlow(
  {
    name: 'aiInterviewerFlow',
    inputSchema: AiInterviewerInputSchema,
    outputSchema: AiInterviewerOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
