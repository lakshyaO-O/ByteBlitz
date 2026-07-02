export const dynamic = 'force-dynamic';

import { Shell } from '@/components/layout/Shell';
import CongratsContentWrapper from './congrats-content';

export default function CongratsPage() {
  return (
    <Shell>
      <CongratsContentWrapper />
    </Shell>
  );
}
