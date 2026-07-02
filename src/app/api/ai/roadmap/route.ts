export async function POST(req: Request) {
  try {
    const { currentLevel, goal, languages, timeCommitment, topics } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        title: 'Roadmap Unavailable',
        description: 'I need a Gemini API key to generate your roadmap. Ask the dev to add `GEMINI_API_KEY` to `.env.local`.',
        estimatedDuration: '',
        phases: [],
        weeklySchedule: [],
        tips: [],
      });
    }

    const { aiRoadmapGenerator } = await import('@/ai/flows/ai-roadmap-generator-flow');
    const result = await aiRoadmapGenerator({ currentLevel, goal, languages, timeCommitment, topics });
    return Response.json(result);
  } catch (error) {
    console.error('AI roadmap error:', error);
    return Response.json({
      title: 'Error',
      description: 'Roadmap generation failed. Check that `GEMINI_API_KEY` is set in `.env.local`.',
      estimatedDuration: '',
      phases: [],
      weeklySchedule: [],
      tips: [],
    });
  }
}
