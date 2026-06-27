import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { Shell } from '@/components/layout/Shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CongratsPage() {
  return (
    <Shell>
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
        <Card className="max-w-2xl w-full p-10 text-center bg-card/70 border-border shadow-xl">
          <div className="flex items-center justify-center mb-6 text-secondary">
            <Trophy className="w-14 h-14" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Congratulations!</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Your solution passed the arena submission checks. You defeated the challenge and earned the victory.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/arena">
              <Button variant="secondary" className="w-full sm:w-auto">
                Return to arena
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button className="w-full sm:w-auto">
                View dashboard
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </Shell>
  );
}
