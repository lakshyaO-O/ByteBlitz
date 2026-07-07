import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ConceptDetail } from './concept-detail';
import { CONCEPTS } from '@/data/concepts';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return Object.keys(CONCEPTS).map(slug => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const entry = CONCEPTS[params.slug];
  if (!entry) return { title: 'Concept Not Found' };
  return {
    title: `${entry.title} — Concept Encyclopedia`,
    description: entry.definition,
  };
}

export default function ConceptPage({ params }: Props) {
  const entry = CONCEPTS[params.slug];
  if (!entry) notFound();
  return <ConceptDetail entry={entry} />;
}
