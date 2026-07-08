import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConceptDetail } from './concept-detail';
import { CONCEPTS } from '@/data/concepts';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return Object.keys(CONCEPTS).map(slug => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const entry = CONCEPTS[slug];
  if (!entry) return { title: 'Concept Not Found' };
  return {
    title: `${entry.title} — Concept Encyclopedia`,
    description: entry.definition,
  };
}

export default async function ConceptPage({ params }: Props) {
  const { slug } = await params;
  const entry = CONCEPTS[slug];
  if (!entry) notFound();
  return <ConceptDetail entry={entry} />;
}
