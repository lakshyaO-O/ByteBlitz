import { verifyAuth } from '@/lib/verify-auth';

export async function POST(req: Request) {
  try {
    const auth = await verifyAuth(req);
    if (auth instanceof Response) return auth;
    const { code, language } = await req.json();

    if (!code?.trim()) {
      return Response.json({ error: 'Code is required' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        summary: 'Gemini API key is not configured. Ask the dev to add `GEMINI_API_KEY` to `.env.local`.',
        strengths: [],
        issues: [],
        improvements: [],
        score: 0,
      });
    }

    const { codeReviewAssistant } = await import('@/ai/flows/code-review-assistant-flow');
    const result = await codeReviewAssistant({ code, language: language || 'javascript' });
    return Response.json(result);
  } catch (error) {
    console.error('AI code review error:', error);
    return Response.json({
      summary: 'Code review failed. Make sure `GEMINI_API_KEY` is set in `.env.local` and try again.',
      strengths: [],
      issues: [],
      improvements: [],
      score: 0,
    });
  }
}
