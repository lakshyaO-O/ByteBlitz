import { verifyAuth } from '@/lib/verify-auth';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;

    const body = await req.json();
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        intuition: 'AI Mentor needs a configured Gemini API key.',
        whyItWorks: '',
        approach: 'Ask the developer to set GEMINI_API_KEY in .env.local',
        alternatives: [],
        complexity: { time: 'N/A', space: 'N/A', explanation: 'AI unavailable' },
        edgeCases: [],
        commonMistakes: [],
        optimizationOpportunities: [],
      });
    }

    const { aiMentorV2 } = await import('@/ai/flows/ai-mentor-v2-flow');
    const result = await aiMentorV2(body);
    return Response.json(result);
  } catch (error) {
    console.error('AI mentor v2 error:', error);
    return Response.json({
      intuition: 'Unable to generate explanation at this time.',
      whyItWorks: '',
      approach: 'Please try again later.',
      alternatives: [],
      complexity: { time: 'N/A', space: 'N/A', explanation: '' },
      edgeCases: [],
      commonMistakes: [],
      optimizationOpportunities: [],
    });
  }
}
