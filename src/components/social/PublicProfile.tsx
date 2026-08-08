'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { UserProfile, FriendDoc, ActivityEvent, MatchRecord, PrivacySettings } from '@/app/lib/types';
import { useUser } from '@/firebase/auth/use-user';
import { useSendFriendRequest } from '@/hooks/use-friends';
import { useRouter } from 'next/navigation';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { FriendActions } from './FriendActions';
import { PrivacyGate } from './PrivacyGate';
import {
  Trophy, Swords, Users, Star, Calendar, Code2, Medal,
  Loader2, Zap, Target, Flame,
  CheckCircle2, XCircle, MinusCircle, TrendingUp, Activity,
  Github, Linkedin, Globe, Twitter, BookOpen,
  Award, BarChart3, EyeOff,
} from 'lucide-react';

interface PublicProfileProps {
  profileId: string;
}

export function PublicProfile({ profileId }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendDoc[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const { user } = useUser();
  const { sendRequest, loading: sendingRequest } = useSendFriendRequest();
  const router = useRouter();
  const isOwnProfile = user?.uid === profileId;

  const privacy: PrivacySettings = profile?.privacySettings || {
    showActivity: true, showRating: true, showStats: true, showAchievements: true,
    showFriends: true, showSocialLinks: true, showMatchHistory: true,
    showTopicMastery: true, showBadges: true,
  };

  const loadProfile = useCallback(async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const userDoc = await getDoc(doc(db, 'users', profileId));
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        setProfile(data);
      }

      const [friendsSnap, activitySnap, matchSnap] = await Promise.all([
        getDocs(query(collection(db, 'users', profileId, 'friends'), limit(9))),
        getDocs(query(collection(db, 'users', profileId, 'activity'), orderBy('timestamp', 'desc'), limit(10))),
        getDocs(query(collection(db, 'users', profileId, 'matchHistory'), orderBy('timestamp', 'desc'), limit(10))),
      ]);

      setFriends(friendsSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as unknown as FriendDoc)));
      setActivities(activitySnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as unknown as ActivityEvent)));
      setMatchHistory(matchSnap.docs.map((d: QueryDocumentSnapshot<DocumentData>) => ({ id: d.id, ...d.data() } as unknown as MatchRecord)));

      if (user && user.uid !== profileId) {
        const myFriendsSnap = await getDocs(collection(db, 'users', user.uid, 'friends'));
        const isFriend = myFriendsSnap.docs.some((d: QueryDocumentSnapshot<DocumentData>) => d.id === profileId);
        if (isFriend) setFriendStatus('friends');
      }

      setLoading(false);
    } catch { setLoading(false); }
  }, [profileId, user]);

  useEffect(() => {
    loadProfile();
  }, [profileId, loadProfile]);

  const handleSendRequest = async () => {
    if (!user || !profile) return;
    const success = await sendRequest({
      fromUserId: user.uid,
      fromUsername: user.displayName || 'Player',
      fromPhotoURL: user.photoURL || '',
      toUserId: profileId,
      toUsername: profile.username,
    });
    if (success) setFriendStatus('pending');
  };

  const handleMessage = () => {
    router.push(`/chat?userId=${profileId}`);
  };

  const handleInviteArena = () => {
    router.push(`/arena?invite=${profileId}`);
  };

  const handleInviteStudyRoom = () => {
    router.push(`/arena/custom-study?invite=${profileId}`);
  };

  const handleReport = () => {
    router.push(`/report?userId=${profileId}`);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-48 bg-card/50 rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-card/50 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-card/50 rounded-xl" />
          <div className="h-64 bg-card/50 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
        <EyeOff className="w-16 h-16" />
        <h2 className="text-xl font-headline font-bold">User Not Found</h2>
        <p className="text-sm">This profile doesn&apos;t exist or has been removed.</p>
      </div>
    );
  }

  const tier = getTier(profile.rating);
  const tierColor = getTierColor(tier);
  const totalGames = profile.wins + profile.losses + profile.draws;
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;
  const initials = (profile.username || '?')[0]?.toUpperCase() || '?';
  const level = profile.level || Math.floor((profile.xp || 0) / 500) + 1;

  const allBadges = profile.badges || [
    ...(profile.wins >= 1 ? ['First Blood'] : []),
    ...(profile.wins >= 10 ? ['10 Wins'] : []),
    ...((profile.xp || 0) >= 100 ? ['100 XP'] : []),
    ...((profile.xp || 0) >= 500 ? ['500 XP'] : []),
    ...((profile.xp || 0) >= 1000 ? ['1000 XP'] : []),
    ...(profile.rating >= 1500 ? ['Elite'] : []),
  ];

  const allAchievements = profile.achievements || allBadges.map((_, i) => `Achievement ${i + 1}`);

  const socialLinks: { label: string; url?: string; icon: React.ReactNode }[] = [
    ...(profile.githubUrl ? [{ label: 'GitHub', url: profile.githubUrl, icon: <Github className="w-4 h-4" /> }] : []),
    ...(profile.linkedinUrl ? [{ label: 'LinkedIn', url: profile.linkedinUrl, icon: <Linkedin className="w-4 h-4" /> }] : []),
    ...(profile.twitterUrl ? [{ label: 'Twitter', url: profile.twitterUrl, icon: <Twitter className="w-4 h-4" /> }] : []),
    ...(profile.websiteUrl ? [{ label: 'Website', url: profile.websiteUrl, icon: <Globe className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="space-y-6">
      <Card className="bg-card/80 border-border overflow-hidden">
        <div className="h-32 bg-primary/20" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary/30 shrink-0">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="text-2xl bg-primary/20">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-14 sm:pt-0 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-headline font-bold truncate">{profile.username}</h1>
                <Badge className={cn(
                  'text-xs uppercase tracking-widest',
                  tierColor === 'text-red-500 font-bold' ? 'bg-red-500/10 text-red-400' :
                  tierColor.replace('text-', 'bg-').replace(/\s+\w+-\w+$/, '/10')
                )}>
                  {tier}
                </Badge>
                {profile.title && (
                  <Badge variant="outline" className="text-[11px] uppercase tracking-wider">{profile.title}</Badge>
                )}
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> {profile.preferredLanguage || 'N/A'}</span>
                <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {profile.streak || 0} day streak</span>
              </div>
            </div>
          </div>

          {!isOwnProfile && user && (
            <div className="mt-4">
              <FriendActions
                friendStatus={friendStatus}
                sendingRequest={sendingRequest}
                onAddFriend={handleSendRequest}
                onMessage={handleMessage}
                onInviteArena={handleInviteArena}
                onInviteStudyRoom={handleInviteStudyRoom}
                onReport={handleReport}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <PrivacyGate section="showStats" privacySettings={privacy}>
          <Card className="bg-card/50 border-border p-4 text-center">
            <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
            <p className="text-xl font-bold font-headline">{profile.wins}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Wins</p>
          </Card>
        </PrivacyGate>
        <PrivacyGate section="showStats" privacySettings={privacy}>
          <Card className="bg-card/50 border-border p-4 text-center">
            <Swords className="w-5 h-5 text-destructive mx-auto mb-1" />
            <p className="text-xl font-bold font-headline">{profile.losses}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Losses</p>
          </Card>
        </PrivacyGate>
        <PrivacyGate section="showStats" privacySettings={privacy}>
          <Card className="bg-card/50 border-border p-4 text-center">
            <Target className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold font-headline">{winRate}%</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Win Rate</p>
          </Card>
        </PrivacyGate>
        <PrivacyGate section="showRating" privacySettings={privacy}>
          <Card className="bg-card/50 border-border p-4 text-center">
            <TrendingUp className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="text-xl font-bold font-headline">{profile.rating}</p>
            <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Rating</p>
          </Card>
        </PrivacyGate>
      </div>

      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid grid-cols-5 gap-2 h-auto bg-muted/50 p-1 mb-4">
          <TabsTrigger value="stats" className="text-xs gap-1"><BarChart3 className="w-3 h-3" /> Stats</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs gap-1"><Award className="w-3 h-3" /> Achievements</TabsTrigger>
          <TabsTrigger value="activity" className="text-xs gap-1"><Activity className="w-3 h-3" /> Activity</TabsTrigger>
          <TabsTrigger value="friends" className="text-xs gap-1"><Users className="w-3 h-3" /> Friends</TabsTrigger>
          <TabsTrigger value="links" className="text-xs gap-1"><Globe className="w-3 h-3" /> Links</TabsTrigger>
        </TabsList>

        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PrivacyGate section="showStats" privacySettings={privacy}>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Medal className="w-4 h-4 text-primary" /> Detailed Stats
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="font-bold">{profile.rating}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Highest Rating</span>
                      <span className="font-bold">{profile.highestRating || profile.rating}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">XP</span>
                      <span className="font-bold">{(profile.xp || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Level</span>
                      <span className="font-bold">{level}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Coins</span>
                      <span className="font-bold">{(profile.coins || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Draws</span>
                      <span className="font-bold">{profile.draws}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Problems Solved</span>
                      <span className="font-bold">{profile.problemsSolved || 0}</span>
                    </div>
                    {profile.accuracy !== undefined && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-bold">{profile.accuracy}%</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total Games</span>
                      <span className="font-bold">{totalGames}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </PrivacyGate>

            <PrivacyGate section="showMatchHistory" privacySettings={privacy}>
              <Card className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Swords className="w-4 h-4 text-destructive" /> Match History
                  </h3>
                  {matchHistory.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {matchHistory.map((match) => {
                        const playerEntry = match.players?.find(p => p.uid === profileId || p.uid === profile.uid);
                        const isWin = match.winnerIds?.includes(profileId) || match.winnerIds?.includes(profile.uid);
                        const isLoss = playerEntry && !isWin && !match.winnerIds?.includes('draw');
                        return (
                          <div key={match.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              {isWin ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              ) : isLoss ? (
                                <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                              ) : (
                                <MinusCircle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                              )}
                              <span className="truncate">{match.problem?.title || 'Match'}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-muted-foreground">
                                {match.timestamp ? new Date(match.timestamp).toLocaleDateString() : ''}
                              </span>
                              {playerEntry && (
                                <span className={cn(
                                  'font-bold',
                                  playerEntry.eloChange > 0 ? 'text-emerald-400' :
                                  playerEntry.eloChange < 0 ? 'text-destructive' : 'text-muted-foreground'
                                )}>
                                  {playerEntry.eloChange > 0 ? '+' : ''}{playerEntry.eloChange}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No matches played yet</p>
                  )}
                </CardContent>
              </Card>
            </PrivacyGate>
          </div>
        </TabsContent>

        <TabsContent value="achievements">
          <PrivacyGate section="showAchievements" privacySettings={privacy}>
            <div className="space-y-6">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Award className="w-4 h-4 text-secondary" /> Badges
                  </h3>
                  {allBadges.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allBadges.map((badge, i) => (
                        <Badge key={i} variant="secondary" className="text-[10px] px-3 py-1.5 gap-1">
                          <Medal className="w-3 h-3 text-secondary" /> {badge}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No badges yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-card/50 border-border">
                <CardContent className="p-5">
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-yellow-400" /> Achievements
                  </h3>
                  {allAchievements.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {allAchievements.map((achievement, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-muted/20 border border-border/50 text-center">
                          <Star className={cn('w-6 h-6', i < 3 ? 'text-yellow-400' : 'text-muted-foreground')} />
                          <span className="text-[11px] font-medium uppercase tracking-wider">{achievement}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No achievements yet</p>
                  )}
                </CardContent>
              </Card>

              <PrivacyGate section="showTopicMastery" privacySettings={privacy}>
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Topic Mastery
                    </h3>
                    {profile.topicMastery && Object.keys(profile.topicMastery).length > 0 ? (
                      <div className="space-y-3">
                        {Object.entries(profile.topicMastery).map(([topic, data]) => (
                          <div key={topic}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium">{topic}</span>
                              <span className="text-muted-foreground">{data.solved}/{data.total}</span>
                            </div>
                            <Progress value={data.total > 0 ? (data.solved / data.total) * 100 : 0} className="h-1.5" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-6">No topic data available</p>
                    )}
                  </CardContent>
                </Card>
              </PrivacyGate>
            </div>
          </PrivacyGate>
        </TabsContent>

        <TabsContent value="activity">
          <PrivacyGate section="showActivity" privacySettings={privacy}>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5">
                <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary" /> Recent Activity
                </h3>
                {activities.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {activities.map((event) => (
                      <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                        <div className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                          event.type === 'match_won' ? 'bg-emerald-500/10' :
                          event.type === 'match_lost' ? 'bg-destructive/10' :
                          event.type === 'level_up' ? 'bg-primary/10' :
                          event.type === 'achievement_unlocked' ? 'bg-yellow-500/10' :
                          'bg-muted/30'
                        )}>
                          {event.type === 'match_won' || event.type === 'match_lost' || event.type === 'match_draw' ? (
                            <Swords className={cn('w-4 h-4',
                              event.type === 'match_won' ? 'text-emerald-400' :
                              event.type === 'match_lost' ? 'text-destructive' : 'text-yellow-400'
                            )} />
                          ) : event.type === 'level_up' ? (
                            <TrendingUp className="w-4 h-4 text-primary" />
                          ) : event.type === 'achievement_unlocked' ? (
                            <Star className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Zap className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{event.description || event.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {event.timestamp ? formatTimeAgo(event.timestamp) : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No recent activity</p>
                )}
              </CardContent>
            </Card>
          </PrivacyGate>
        </TabsContent>

        <TabsContent value="friends">
          <PrivacyGate section="showFriends" privacySettings={privacy}>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5">
                <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Friends ({friends.length})
                </h3>
                {friends.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {friends.map((friend) => (
                      <button
                        key={friend.friendId}
                        onClick={() => router.push(`/profile/${friend.friendId}`)}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors text-left"
                      >
                        <Avatar className="w-8 h-8 border border-border">
                          <AvatarImage src={friend.photoURL} />
                          <AvatarFallback className="text-[10px] bg-primary/10">
                            {(friend.username || '?')[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{friend.username}</p>
                          <p className={cn(
                            'text-[10px]',
                            friend.onlineStatus === 'online' ? 'text-emerald-400' : 'text-muted-foreground'
                          )}>
                            {friend.onlineStatus === 'online' ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No friends yet</p>
                )}
              </CardContent>
            </Card>
          </PrivacyGate>
        </TabsContent>

        <TabsContent value="links">
          <PrivacyGate section="showSocialLinks" privacySettings={privacy}>
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5">
                <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-primary" /> Social Links
                </h3>
                {socialLinks.length > 0 ? (
                  <div className="space-y-2">
                    {socialLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                      >
                        {link.icon}
                        <span className="text-sm font-medium">{link.label}</span>
                        <span className="text-xs text-muted-foreground ml-auto truncate">{link.url}</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No social links shared</p>
                )}
              </CardContent>
            </Card>
          </PrivacyGate>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}
