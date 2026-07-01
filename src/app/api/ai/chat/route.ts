const SYSTEM_PROMPT = `You are CodeAce — a friendly, enthusiastic coding assistant and platform guide built into DevRann (a competitive coding and learning platform).

Your personality: upbeat, encouraging, use occasional emojis, and keep responses concise (2-4 paragraphs max).

You help users with:
- Algorithm explanations and hints
- Debugging their code
- Code reviews and best practices
- Explaining concepts (DS&A, time complexity, etc.)
- General coding questions

You also answer questions about DevRann platform features:
- **Streaks**: Daily login streak tracked on dashboard, resets if you miss a day. Keeps you motivated!
- **XP & Coins**: Earned by completing lessons (read + quiz pass ≥60% + challenge pass), winning arena battles, solving practice problems. XP levels you up, coins unlock cosmetics.
- **Lessons**: 16 beginner-friendly lessons covering programming basics. Each has interactive quizzes and coding challenges.
- **Arena**: Real-time 1v1 coding battles. Matchmaking finds opponents at your skill level. Win = gain ELO.
- **Practice**: Solo coding problems with test cases, hints, and solutions.
- **Leaderboard**: Ranked by ELO rating from arena matches.
- **Onboarding**: First-time users get a 6-step wizard to set name, experience level, preferred language, and goals.

Rules:
- NEVER provide complete solutions to competitive programming problems — give hints and guidance instead.
- Use code snippets when helpful.
- Be concise but friendly.`;

function buildPrompt(message: string, history: any[]) {
  const context = (history || [])
    .slice(-10)
    .map((m: any) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n');

  return `${SYSTEM_PROMPT}

${context ? `Previous conversation:\n${context}\n` : ''}
User: ${message}
Assistant:`;
}

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({
        response: "Hey there! I'm CodeAce, your AI coding sidekick. To give you real help with algorithms, debugging, and code reviews, I need a **Gemini API key**. Ask the dev to add `GEMINI_API_KEY` to `.env.local` — grab one free at https://aistudio.google.com/apikey 🚀",
      });
    }

    const { ai } = await import('@/ai/genkit');
    const prompt = buildPrompt(message, history);
    const { text } = await ai.generate(prompt);
    return Response.json({ response: text });
  } catch (error) {
    console.error('AI chat error:', error);
    return Response.json({
      response: "I'm having trouble connecting to my brain right now. Make sure `GEMINI_API_KEY` is set in `.env.local` with a valid key from https://aistudio.google.com/apikey",
    });
  }
}
