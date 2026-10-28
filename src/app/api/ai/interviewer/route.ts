import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'; import { enforceAiQuota, aiQuotaResponse } from '@/lib/ai-quota-server';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const quotaCheck = await enforceAiQuota(auth.uid, 'aiInterviewer');
    if (!quotaCheck.allowed) {
      return Response.json(aiQuotaResponse(quotaCheck, 'aiInterviewer'), { status: 429 });
    }
    const { topic, difficulty, questionCount, previousAnswers } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        questions: [],
        feedback: "I need a Gemini API key to generate interview questions. Ask the dev to add `GEMINI_API_KEY` to `.env.local`.",
      });
    }

    const { aiInterviewer } = await import('@/ai/flows/ai-interviewer-flow');
    const result = await aiInterviewer({ topic, difficulty, questionCount, previousAnswers });
    return Response.json(result);
  } catch (error) {
    console.error('AI interviewer error:', error);
    return Response.json({
      questions: [],
      feedback: "Interviewer is unavailable. Make sure `GEMINI_API_KEY` is set in `.env.local`.",
    });
  }
}
