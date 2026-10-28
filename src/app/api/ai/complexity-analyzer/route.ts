import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'; import { enforceAiQuota, aiQuotaResponse } from '@/lib/ai-quota-server';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const quotaCheck = await enforceAiQuota(auth.uid, 'aiComplexity');
    if (!quotaCheck.allowed) {
      return Response.json(aiQuotaResponse(quotaCheck, 'aiComplexity'), { status: 429 });
    }

    const body = await req.json();
    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        timeComplexity: 'N/A', spaceComplexity: 'N/A',
        worstCase: '', bestCase: '', averageCase: '',
        explanation: 'AI requires a configured GEMINI_API_KEY.',
        bottlenecks: [], optimizationSuggestions: [],
      });
    }

    const { aiComplexityAnalyzer } = await import('@/ai/flows/complexity-analyzer-flow');
    const result = await aiComplexityAnalyzer(body);
    return Response.json(result);
  } catch (error) {
    console.error('Complexity analyzer error:', error);
    return Response.json({
      timeComplexity: 'N/A', spaceComplexity: 'N/A',
      worstCase: 'Analysis unavailable.', bestCase: '', averageCase: '',
      explanation: '', bottlenecks: [], optimizationSuggestions: [],
    });
  }
}
