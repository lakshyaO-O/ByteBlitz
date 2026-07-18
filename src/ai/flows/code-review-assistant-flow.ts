'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CategoryScoresSchema = z.object({
  correctness: z.number().describe('Score out of 10.'),
  readability: z.number().describe('Score out of 10.'),
  performance: z.number().describe('Score out of 10.'),
  security: z.number().describe('Score out of 10.'),
  maintainability: z.number().describe('Score out of 10.'),
  bestPractices: z.number().describe('Score out of 10.'),
});

const CodeReviewAssistantInputSchema = z.object({
  code: z.string().describe('The code submitted by the user for review.'),
  language: z.string().describe('The programming language of the submitted code.'),
});
export type CodeReviewAssistantInput = z.infer<typeof CodeReviewAssistantInputSchema>;

const CodeReviewAssistantOutputSchema = z.object({
  review: z.string().describe('The full markdown-formatted code review. Concise and well-structured.'),
  score: z.number().describe('An overall code quality score from 0 to 100.'),
  categoryScores: CategoryScoresSchema.describe('Per-category scores for the score visualization bars.'),
});
export type CodeReviewAssistantOutput = z.infer<typeof CodeReviewAssistantOutputSchema>;

export async function codeReviewAssistant(
  input: CodeReviewAssistantInput
): Promise<CodeReviewAssistantOutput> {
  return codeReviewAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'codeReviewAssistantPrompt',
  input: {schema: CodeReviewAssistantInputSchema},
  output: {schema: CodeReviewAssistantOutputSchema},
  prompt: `You are an expert code reviewer. Be concise, direct, and helpful. Analyze the given code and produce a review.

You MUST return valid JSON with exactly these fields:
- "review": concise markdown string (see template below)
- "score": overall quality 0-100
- "categoryScores": { correctness, readability, performance, security, maintainability, bestPractices } each out of 10

FORMATTING RULES:
- Every code snippet MUST be inside fenced markdown code blocks with language
  Correct: \`\`\`javascript\\ncode\\n\`\`\`
  Wrong: No inline code or indented code for multi-line snippets
- Never put "Copy" in the text — the UI adds copy buttons automatically
- Bug explanations: max 2-3 short paragraphs per issue. Format: **Cause** / **Impact** / **Fix**
- For code changes, use: ❌ Original → \`\`\` \\n ↓ \\n ✅ Recommended Fix → \`\`\` \\n ↓ \\n 💡 Why This Is Better
- Refactored code section: show only changed functions/classes, not the whole file (unless >80% changed)
- Next steps: use ☐ (☐ Fix bug, ☐ Add tests)
- Confidence: use 🟢 High, 🟡 Medium, or 🔵 Low

REVIEW STRUCTURE:

# ⭐ Overall Score
{score}/100

Category scores:
Correctness: {categoryScores.correctness}/10
Readability: {categoryScores.readability}/10
Performance: {categoryScores.performance}/10
Security: {categoryScores.security}/10
Maintainability: {categoryScores.maintainability}/10
Best Practices: {categoryScores.bestPractices}/10

---

# 📝 Executive Summary

1 short paragraph: what the code does, main strength, biggest issue.

---

# ✅ Strengths

- Bullet list of things done well (max 5)

---

# ❌ Bugs

## 🔴 Critical

**Cause:** what, why
**Impact:** real-world effect
\`\`\`{{{language}}}
fix
\`\`\`

## 🟠 High

Same compact format.

## 🟡 Medium

Same compact format.

## 🔵 Low

Same compact format.

---

# ⚠ Edge Cases

✓ Handled: case1, case2
✗ Missed: case3 (add guard)

---

# ⚡ Complexity

Time: O(?)
Space: O(?)
Reason: one-liner

---

# 🔒 Security Review

One line. "No security vulnerabilities detected." or specific issue.

---

# 💡 Best Practices

- Point with one-liner why

---

# 🔄 Refactored Code

\`\`\`{{{language}}}
// only changed parts
\`\`\`

---

# 🎯 AI Confidence

🟢 High / 🟡 Medium / 🔵 Low — one-line reason.

---

# 🚀 Next Steps

☐ Action item 1
☐ Action item 2

---

Language: {{{language}}}
Code:
\`\`\`{{{language}}}
{{{code}}}
\`\`\`

Produce the complete JSON. Keep the review concise — no essays.`,
});

const codeReviewAssistantFlow = ai.defineFlow(
  {
    name: 'codeReviewAssistantFlow',
    inputSchema: CodeReviewAssistantInputSchema,
    outputSchema: CodeReviewAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
