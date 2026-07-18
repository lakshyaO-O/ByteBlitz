import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const { userInterests, skillLevel, recentActivity } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        tips: [],
        recommendations: [],
      });
    }

    const { aiFeedGenerator } = await import('@/ai/flows/ai-feed-generator');
    const result = await aiFeedGenerator({ userInterests, skillLevel, recentActivity });
    return Response.json(result);
  } catch (error) {
    console.error('AI feed error:', error);
    return Response.json({
      tips: [],
      recommendations: [],
    });
  }
}
