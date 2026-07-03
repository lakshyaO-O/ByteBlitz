'use client';

import { initializeFirebase } from '@/firebase';
import { collection, doc, getDocs, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { PRACTICE_PROBLEMS } from '@/data/practice-problems';
import { enrichProblem } from '@/lib/problem-utils';

export async function seedProblemsToFirestore(): Promise<{ created: number; skipped: number }> {
  const { firestore: db } = initializeFirebase();
  if (!db) return { created: 0, skipped: 0 };

  const existing = await getDocs(collection(db, 'problems'));
  const existingIds = new Set(existing.docs.map(d => d.id));

  let created = 0;
  let skipped = 0;

  for (const raw of PRACTICE_PROBLEMS) {
    if (existingIds.has(raw.id)) { skipped++; continue; }

    const enriched = enrichProblem(raw);

    const meta = {
      title: enriched.title,
      difficulty: enriched.difficulty,
      category: enriched.category,
      points: enriched.points,
      topics: enriched.topics,
      companyTags: enriched.companyTags || [],
      acceptanceRate: enriched.acceptanceRate || 75,
      totalSubmissions: 0,
      totalAccepted: 0,
      isPremium: false,
      isPublished: true,
      estimatedTime: enriched.estimatedTime || 15,
      difficultyRating: enriched.difficultyRating || 1,
      prerequisites: enriched.prerequisites || [],
      relatedProblems: enriched.relatedProblems || [],
      searchTokens: (enriched.searchTokens || []).length > 0
        ? enriched.searchTokens
        : generateSearchTokens(enriched.title, enriched.topics, enriched.category),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const content = {
      description: enriched.description,
      constraints: enriched.constraints || [],
      examples: enriched.examples || [],
      testCases: enriched.testCases || [],
      hints: enriched.hints || [],
      editorial: enriched.editorial || '',
      solutionCode: enriched.solutionCode || {},
      starterCode: enriched.starterCode || {},
      timeLimitMs: enriched.timeLimitMs || 2000,
      memoryLimitKb: enriched.memoryLimitKb || 256000,
    };

    const batch = writeBatch(db);
    batch.set(doc(db, 'problems', raw.id), meta);
    batch.set(doc(db, 'problemContent', raw.id), content);
    await batch.commit();
    created++;
  }

  return { created, skipped };
}

function generateSearchTokens(title: string, topics: string[], category: string): string[] {
  const tokens = new Set<string>();
  const words = title.toLowerCase().split(/[\s-]+/);
  words.forEach(w => {
    if (w.length >= 2) {
      for (let i = 1; i <= w.length; i++) tokens.add(w.slice(0, i));
    }
  });
  topics.forEach(t => tokens.add(t.toLowerCase()));
  if (category) tokens.add(category.toLowerCase());
  return [...tokens];
}
