export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-muted/30 ${className}`}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-10 h-10 rounded-lg" />
        <div className="space-y-2 flex-1">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonBlock className="h-3 w-full" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-40 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => <SkeletonBlock key={i} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <SkeletonBlock className="h-32 rounded-xl" />
          <CardSkeleton />
        </div>
      </div>
    </div>
  );
}

export function ArenaSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <div className="flex items-center gap-6">
        <SkeletonBlock className="w-20 h-20 rounded-full" />
        <div className="space-y-2">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-32" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
      </div>
      <CardSkeleton />
    </div>
  );
}

export function LearningSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-56" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
            <SkeletonBlock className="w-8 h-8 rounded-full" />
            <SkeletonBlock className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
            <SkeletonBlock className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FriendsSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
            <SkeletonBlock className="w-12 h-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-32" />
              <SkeletonBlock className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationsSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-56" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/50">
            <SkeletonBlock className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-4 w-48" />
              <SkeletonBlock className="h-3 w-64" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RoomsSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function PracticeSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-48" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function ContestsSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}

export function ChallengesSkeleton() {
  return (
    <div className="min-h-screen bg-[#05070f] p-6 space-y-6">
      <SkeletonBlock className="h-10 w-52" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}
