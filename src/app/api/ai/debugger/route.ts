import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'; import { enforceAiQuota, aiQuotaResponse } from '@/lib/ai-quota-server';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const quotaCheck = await enforceAiQuota(auth.uid, 'aiDebugger');
    if (!quotaCheck.allowed) {
      return Response.json(aiQuotaResponse(quotaCheck, 'aiDebugger'), { status: 429 });
    }
    const { code, language, errorMessage, expectedBehavior } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        explanation: "I need a Gemini API key to debug your code. Ask the dev to add `GEMINI_API_KEY` to `.env.local`.",
      });
    }

    const { aiDebugger } = await import('@/ai/flows/ai-debugger-flow');
    const result = await aiDebugger({ code, language, errorMessage, expectedBehavior });
    return Response.json(result);
  } catch (error) {
    console.error('AI debugger error:', error);
    return Response.json({
      explanation: "Debugger is unavailable right now. Check that `GEMINI_API_KEY` is set in `.env.local`.",
    });
  }
}
