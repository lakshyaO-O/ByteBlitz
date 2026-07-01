const SYSTEM_PROMPT = `You are a friendly coding assistant called CodeAce built into DevRann — a competitive coding platform.

You help users with:
- Algorithm explanations and hints
- Debugging their code
- Code reviews and best practices
- Explaining concepts (DS&A, time complexity, etc.)
- General coding questions

Keep answers concise (2-4 paragraphs max), use code snippets when helpful, and NEVER provide complete solutions to competitive programming problems — give hints and guidance instead.`;

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
