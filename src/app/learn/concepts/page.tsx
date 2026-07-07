import type { Metadata } from 'next';
import { ConceptsIndex } from './concepts-index';

export const metadata: Metadata = {
  title: 'Concept Encyclopedia',
  description: 'Learn data structures and algorithms with visual explanations, complexity analysis, and code examples.',
};

export default function ConceptsPage() {
  return <ConceptsIndex />;
}
