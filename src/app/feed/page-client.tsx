'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getFeed, getNews, getCodingTips } from '@/services/feed';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { cn } from '@/lib/utils';
import {
  Newspaper, Lightbulb, Users, Target, Trophy, Loader2, Clock, ArrowDown,
} from 'lucide-react';
import type { DailyFeed } from '@/types';

const TABS = [
  { value: 'for-you', label: 'For You', icon: Trophy },
  { value: 'news', label: 'News', icon: Newspaper },
  { value: 'tips', label: 'Tips', icon: Lightbulb },
  { value: 'community', label: 'Community', icon: Users },
  { value: 'challenges', label: 'Challenges', icon: Target },
];

export default function FeedPage() {
  const { user } = useUser();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState('for-you');
  const [feedEntries, setFeedEntries] = useState<DailyFeed['entries']>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (reset = false) => {
    setLoading(true);
    try {
      const result = await getFeed(user?.uid || '', reset ? null : lastDoc);
      if (reset) {
        setFeedEntries(result.feed);
      } else {
        setFeedEntries(prev => [...prev, ...result.feed]);
      }
      setLastDoc(result.lastDoc);
      setHasMore(result.feed.length === 20);
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [user, lastDoc]);

  const loadTabContent = useCallback(async (tab: string) => {
    setLoading(true);
    setFeedEntries([]);
    try {
      if (tab === 'news') {
        const data = await getNews();
        setFeedEntries(data);
      } else if (tab === 'tips') {
        const data = await getCodingTips();
        setFeedEntries(data);
      } else {
        const result = await getFeed(user?.uid || '');
        setFeedEntries(result.feed);
        setLastDoc(result.lastDoc);
        setHasMore(result.feed.length === 20);
      }
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab, loadTabContent]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const result = await getFeed(user?.uid || '', lastDoc);
      setFeedEntries(prev => [...prev, ...result.feed]);
      setLastDoc(result.lastDoc);
      setHasMore(result.feed.length === 20);
    } catch { /* fallback empty */ }
    setLoadingMore(false);
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const typeConfig: Record<string, { label: string; color: string }> = {
    news: { label: 'News', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    coding_tip: { label: 'Tip', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
    community_post: { label: 'Community', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
    challenge: { label: 'Challenge', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
    achievement: { label: 'Achievement', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' },
    contest: { label: 'Contest', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  };

  return (
    <Shell>
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Feed</h1>
          <p className="text-muted-foreground">Daily coding news, tips, and community highlights.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 w-full sm:w-auto flex-nowrap overflow-x-auto">
            {TABS.map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {TABS.map(tab => (
            <TabsContent key={tab.value} value={tab.value} className="mt-6 space-y-4">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Card key={i} className="bg-card/50 border-border">
                    <CardContent className="p-5 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-5 w-20" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : feedEntries.length > 0 ? (
                feedEntries.map((entry) => (
                  <Card key={entry.id} className="bg-card/50 border-border hover:border-primary/30 transition-all group cursor-pointer" onClick={() => entry.url && window.open(entry.url, '_blank')}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        {entry.imageUrl && (
                          <img src={entry.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover shrink-0 hidden sm:block" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="outline" className={cn('text-[9px] uppercase tracking-widest font-bold border', typeConfig[entry.type]?.color || '')}>
                              {typeConfig[entry.type]?.label || entry.type}
                            </Badge>
                            {entry.source && (
                              <span className="text-[10px] text-muted-foreground">{entry.source}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1 ml-auto">
                              <Clock className="w-3 h-3" /> {getTimeAgo(entry.createdAt)}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm sm:text-base leading-snug">{entry.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{entry.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 text-muted-foreground">
                  <Newspaper className="w-12 h-12 mx-auto mb-4 opacity-60" />
                  <p>No entries yet. Check back soon!</p>
                </div>
              )}

              {activeTab === 'for-you' && hasMore && !loading && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                    className="gap-2"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDown className="w-4 h-4" />}
                    Load More
                  </Button>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Shell>
  );
}
