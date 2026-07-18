import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);

    const body = await req.json();
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ cards: [] });
    }

    const { aiRevisionGenerator } = await import('@/ai/flows/revision-generator-flow');
    const result = await aiRevisionGenerator(body);
    return Response.json(result);
  } catch (error) {
    console.error('Revision generator error:', error);
    return Response.json({ cards: [] });
  }
}
