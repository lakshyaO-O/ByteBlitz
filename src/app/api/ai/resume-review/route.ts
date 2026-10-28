import { verifyAuth } from '@/lib/verify-auth';
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'; import { enforceAiQuota, aiQuotaResponse } from '@/lib/ai-quota-server';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const rateCheck = checkRateLimit(auth.uid, req);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.retryAfterMs);
    const quotaCheck = await enforceAiQuota(auth.uid, 'resumeReview');
    if (!quotaCheck.allowed) {
      return Response.json(aiQuotaResponse(quotaCheck, 'resumeReview'), { status: 429 });
    }
    const { resumeText, jobDescription, targetRole, yearsOfExperience } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        overallScore: 0,
        summary: 'I need a Gemini API key to review your resume. Ask the dev to add `GEMINI_API_KEY` to `.env.local`.',
        strengths: [],
        weaknesses: [],
        suggestions: [],
        keywords: [],
        formattingIssues: [],
        actionItems: [],
      });
    }

    const { aiResumeReviewer } = await import('@/ai/flows/ai-resume-reviewer-flow');
    const result = await aiResumeReviewer({ resumeText, jobDescription, targetRole, yearsOfExperience });
    return Response.json(result);
  } catch (error) {
    console.error('AI resume review error:', error);
    return Response.json({
      overallScore: 0,
      summary: 'Resume review failed. Make sure `GEMINI_API_KEY` is set in `.env.local`.',
      strengths: [],
      weaknesses: [],
      suggestions: [],
      keywords: [],
      formattingIssues: [],
      actionItems: [],
    });
  }
}
