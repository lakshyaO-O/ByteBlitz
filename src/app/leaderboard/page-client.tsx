'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Loader2, Medal, Crown, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/premium/EmptyState';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { collection, query, orderBy, limit } from 'firebase/firestore';

const MEDAL_ICONS = [Crown, Medal, Star];
const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-orange-400'];

export default function LeaderboardPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();

  const leadersQuery = React.useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('rating', 'desc'), limit(50));
  }, [db]);

  const { data: leaders, loading } = useCollection(leadersQuery);

  return (
    <Shell>
      <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-secondary/30 bg-secondary/5 text-secondary text-xs font-headline font-bold uppercase tracking-widest">
            <Trophy className="w-3.5 h-3.5" />
            Hall of Legends
          </div>
          <h1 className="text-5xl font-headline font-black uppercase tracking-tighter text-foreground">
            GLOBAL <span className="text-primary neon-text">RANKINGS</span>
          </h1>
          <p className="text-muted-foreground">The top architects currently dominating the arena.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : !leaders || leaders.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="No Rankings Available"
            description="The leaderboard will populate once battles are played. Start competing to claim the top spot!"
            className="max-w-lg mx-auto"
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              {leaders.length > 1 && <TopPlayerCard rank={2} name={leaders[1].username} rating={leaders[1].rating} userId={leaders[1].id} />}
              {leaders.length > 0 && <TopPlayerCard rank={1} name={leaders[0].username} rating={leaders[0].rating} userId={leaders[0].id} />}
              {leaders.length > 2 && <TopPlayerCard rank={3} name={leaders[2].username} rating={leaders[2].rating} userId={leaders[2].id} />}
            </div>

            <Card className="bg-card/50 border-border overflow-hidden">
              <div className="bg-muted/50 p-4 border-b border-border grid grid-cols-12 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <div className="col-span-1">Rank</div>
                <div className="col-span-5 px-4">Architect</div>
                <div className="col-span-3 text-center">ELO</div>
                <div className="col-span-3 text-right px-4">Wins</div>
              </div>
              <div className="divide-y divide-border">
                {leaders.map((player: any, index: number) => {
                  const isCurrentUser = user?.uid === player.id;
                  const isTop3 = index < 3;
                  return (
                    <LeaderRow
                      key={player.id}
                      rank={index + 1}
                      userId={player.id}
                      name={player.username}
                      rating={player.rating}
                      wins={player.wins}
                      games={player.wins + player.losses}
                      isCurrentUser={isCurrentUser}
                      isTop3={isTop3}
                      onViewProfile={() => router.push(`/profile/${player.id}`)}
                    />
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>
    </Shell>
  );
}

function TopPlayerCard({ rank, name, rating, userId }: { rank: number; name: string; rating: number; userId?: string }) {
  const router = useRouter();
  const isFirst = rank === 1;
  const tier = getTier(rating);
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const MedalIcon = MEDAL_ICONS[rank - 1];
  const medalColor = MEDAL_COLORS[rank - 1];

  return (
    <Card
      onClick={() => userId && router.push(`/profile/${userId}`)}
      className={cn(
      'relative border-border bg-card/50 overflow-hidden group cursor-pointer',
      isFirst ? 'order-first md:order-none scale-110 z-10 border-primary/40 bg-primary/5 neon-border shadow-2xl' : 'scale-95 opacity-80'
    )}>
      <CardContent className="p-8 text-center space-y-4">
        <div className="absolute top-4 left-4 font-headline font-black text-2xl opacity-10 italic">#0{rank}</div>
        <div className="relative mx-auto w-24 h-24">
          <div className={cn(
            'w-full h-full rounded-full border-4 p-1 flex items-center justify-center',
            isFirst ? 'border-primary neon-glow' : 'border-secondary'
          )}>
            <Avatar className="w-full h-full rounded-full">
              <AvatarImage />
              <AvatarFallback className="bg-muted text-2xl font-headline font-bold text-primary rounded-full">
                {initials || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className={cn(
            'absolute -top-3 left-1/2 -translate-x-1/2',
            medalColor
          )}>
            <MedalIcon className={cn('w-7 h-7', medalColor)} />
          </div>
        </div>
        <div>
          <h3 className="text-xl font-headline font-bold uppercase tracking-tight">{name}</h3>
          <p className={cn('text-xs font-bold uppercase tracking-widest mt-1', getTierColor(tier))}>{tier}</p>
        </div>
        <div className="text-3xl font-headline font-black text-foreground tracking-tighter">
          {rating} <span className="text-sm font-mono text-muted-foreground align-middle">ELO</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LeaderRow({ rank, name, rating, wins, games, isCurrentUser, isTop3, userId, onViewProfile }: { rank: number; name: string; rating: number; wins: number; games: number; isCurrentUser: boolean; isTop3: boolean; userId?: string; onViewProfile?: () => void }) {
  const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
  const tier = getTier(rating);
  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const RankIcon = isTop3 ? MEDAL_ICONS[rank - 1] : null;

  return (
    <div
      onClick={onViewProfile}
      className={cn(
      'grid grid-cols-12 p-4 items-center transition-colors group',
      isCurrentUser ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted/30 cursor-pointer border-l-2 border-transparent'
    )}>
      <div className="col-span-1 flex items-center gap-1">
        {isTop3 && RankIcon ? (
          <span className={cn('font-headline font-black text-sm', MEDAL_COLORS[rank - 1])}>
            <RankIcon className="w-4 h-4" />
          </span>
        ) : (
          <span className="font-headline font-black text-sm italic opacity-30 group-hover:opacity-100 transition-opacity">#{rank}</span>
        )}
      </div>
      <div className="col-span-5 px-4 flex items-center gap-3 min-w-0">
        <Avatar className={cn(
          'w-9 h-9 shrink-0',
          isCurrentUser && 'ring-2 ring-primary'
        )}>
          <AvatarImage />
          <AvatarFallback className={cn(
            'text-xs font-headline font-bold',
            isCurrentUser ? 'bg-primary/20 text-primary' : 'bg-muted text-primary'
          )}>
            {initials || '?'}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className={cn(
            'font-bold uppercase tracking-tight truncate',
            isCurrentUser && 'text-primary'
          )}>
            {name}
            {isCurrentUser && <span className="ml-2 text-[10px] font-normal text-muted-foreground">(you)</span>}
          </p>
          <p className={cn('text-[10px] font-bold uppercase tracking-widest truncate', getTierColor(tier))}>{tier}</p>
        </div>
      </div>
      <div className="col-span-3 text-center">
        <span className={cn('text-lg font-headline font-bold', isCurrentUser ? 'text-primary' : 'text-foreground')}>{rating}</span>
      </div>
      <div className="col-span-3 text-right px-4">
        <span className="text-sm font-bold text-primary">{wins} W<span className="hidden sm:inline">INS</span></span>
        <span className="text-[10px] text-muted-foreground ml-1">({winRate}%)</span>
      </div>
    </div>
  );
}
