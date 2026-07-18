import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit';

const FALLBACK = {
  review: '',
  score: 0,
  categoryScores: { correctness: 0, readability: 0, performance: 0, security: 0, maintainability: 0, bestPractices: 0 },
};

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const { code, language } = await req.json();

    if (!code?.trim()) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        ...FALLBACK,
        review: 'Gemini API key is not configured. Ask the dev to add `GEMINI_API_KEY` to `.env.local`.',
      });
    }

    const { codeReviewAssistant } = await import('@/ai/flows/code-review-assistant-flow');
    const result = await codeReviewAssistant({ code, language: language || 'javascript' });
    return Response.json(result);
  } catch (error) {
    console.error('AI code review error:', error);
    return Response.json({
      ...FALLBACK,
      review: 'Code review failed. Make sure `GEMINI_API_KEY` is set in `.env.local` and try again.',
    });
  }
}
