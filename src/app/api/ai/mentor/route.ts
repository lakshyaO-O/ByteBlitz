import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const { question, language, userLevel, context } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        answer: "I need a Gemini API key to help you. Ask the dev to add `GEMINI_API_KEY` to `.env.local` — get one free at https://aistudio.google.com/apikey",
      });
    }

    const { aiMentor } = await import('@/ai/flows/ai-mentor-flow');
    const result = await aiMentor({ question, language, userLevel, context });
    return Response.json(result);
  } catch (error) {
    console.error('AI mentor error:', error);
    return Response.json({
      answer: "I'm having trouble connecting right now. Make sure `GEMINI_API_KEY` is set in `.env.local` with a valid key.",
    });
  }
}
