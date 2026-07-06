'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Zap, Trophy, Flame, Star, Code2, Github, Linkedin,
  Twitter, Globe, MapPin, Calendar, Medal, Target, Swords,
  BookOpen, Eye, Heart, GitFork, CheckCircle2, Loader2,
  MessageCircle, UserPlus, Activity, Flag,
} from 'lucide-react';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { useUser } from '@/firebase/auth/use-user';
import { ReportButton } from '@/components/admin/ReportButton';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs, where, setDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import type { UserProfile } from '@/types';

export default function PublicProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const router = useRouter();
  const { user: currentUser } = useUser();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      try {
        const { firestore: db } = initializeFirebase();
        if (!db) { setLoading(false); return; }
        const q = query(collection(db, 'users'), where('username', '==', username), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const data = { id: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile;
          setProfile(data);

          if (currentUser && currentUser.uid !== data.uid) {
            const friendRef = doc(db, 'users', currentUser.uid, 'friends', data.uid);
            const friendSnap = await getDoc(friendRef);
            setFollowing(friendSnap.exists());
          }
        }
      } catch { /* ignore */ }
      setLoading(false);
    };
    load();
  }, [username, currentUser]);

  const handleFollow = async () => {
    if (!currentUser || !profile) return;
    setFriendActionLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      if (following) {
        await setDoc(doc(db, 'users', currentUser.uid, 'friends', profile.uid), {}, { merge: true });
        await setDoc(doc(db, 'users', profile.uid, 'friends', currentUser.uid), {}, { merge: true });
      } else {
        await setDoc(doc(db, 'users', currentUser.uid, 'friends', profile.uid), {}, { merge: true });
      }
      setFollowing(!following);
    } catch { /* ignore */ }
    setFriendActionLoading(false);
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  if (!profile) {
    return (
      <Shell>
        <div className="text-center py-20 text-muted-foreground">
          <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">User not found</p>
          <p className="text-sm mt-1">The user "{username}" does not exist.</p>
        </div>
      </Shell>
    );
  }

  const tier = getTier(profile.rating || 1200);
  const tierColor = getTierColor(tier);
  const winRate = (profile.wins + profile.losses) > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;
  const initials = (profile.username || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  const level = profile.level || Math.floor((profile.xp || 0) / 500) + 1;

  return (
    <Shell>
      <div className="space-y-8">
        <Card className="border-primary/20 bg-primary/5 overflow-hidden">
          <CardContent className="p-6 md:p-8 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="relative">
                <Avatar className="w-24 h-24 md:w-28 md:h-28 border-4 border-primary/30">
                  <AvatarImage src={profile.photoURL} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-secondary px-3 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider text-white">
                  LVL {level}
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-headline font-bold">{profile.username}</h1>
                  <Badge variant="outline" className={cn('text-[11px] uppercase tracking-wider', tierColor)}>
                    <Medal className="w-3 h-3 mr-1" /> {tier}
                  </Badge>
                  <Badge variant="outline" className="text-[11px] uppercase tracking-wider">
                    @{profile.username}
                  </Badge>
                </div>
                {profile.title && <p className="text-sm text-foreground">{profile.title}</p>}
                {profile.bio && <p className="text-sm text-muted-foreground max-w-xl">{profile.bio}</p>}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> {(profile.xp || 0).toLocaleString()} XP</span>
                  <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" /> {profile.streak || 0} day streak</span>
                  <span className="flex items-center gap-1"><Target className="w-3 h-3" /> {(profile.problemsSolved || 0)} solved</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {currentUser && currentUser.uid !== profile.uid && (
                    <>
                      <Button onClick={handleFollow} variant={following ? 'outline' : 'default'} className="gap-2" disabled={friendActionLoading}>
                        <UserPlus className="w-4 h-4" /> {following ? 'Friends' : 'Add Friend'}
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => router.push(`/chats?userId=${profile.uid}`)}>
                        <MessageCircle className="w-3 h-3" /> Message
                      </Button>
                      <ReportButton targetType="user" targetId={profile.uid} targetLabel={profile.username} variant="text" />
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-2">
                  {profile.githubUrl && (
                    <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {profile.linkedinUrl && (
                    <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {profile.twitterUrl && (
                    <a href={profile.twitterUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {profile.websiteUrl && (
                    <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatBox label="Rating" value={profile.rating || 1200} color="text-primary" />
          <StatBox label="Wins" value={profile.wins || 0} color="text-emerald-400" />
          <StatBox label="Losses" value={profile.losses || 0} color="text-destructive" />
          <StatBox label="Win Rate" value={`${winRate}%`} color="text-secondary" />
          <StatBox label="Streak" value={profile.streak || 0} color="text-orange-400" />
          <StatBox label="XP" value={(profile.xp || 0).toLocaleString()} color="text-yellow-400" />
          <StatBox label="Solved" value={profile.problemsSolved || 0} color="text-cyan-400" />
        </div>

        <Tabs defaultValue="stats">
          <TabsList className="grid grid-cols-3 gap-2 h-auto bg-muted/50 p-1">
            <TabsTrigger value="stats" className="text-xs gap-1"><Activity className="w-3 h-3" /> Stats</TabsTrigger>
            <TabsTrigger value="achievements" className="text-xs gap-1"><Trophy className="w-3 h-3" /> Achievements</TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1"><Activity className="w-3 h-3" /> Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card/50 border-border">
                <CardContent className="p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">Level</span><span className="font-bold">{level}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Rating</span><span className="font-bold">{profile.rating || 1200}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Highest Rating</span><span className="font-bold">{profile.highestRating || profile.rating || 1200}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Draws</span><span className="font-bold">{profile.draws || 0}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Problems Solved</span><span className="font-bold">{profile.problemsSolved || 0}</span></div>
                </CardContent>
              </Card>
              {profile.preferredLanguage && (
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-4 text-sm">
                    <span className="text-muted-foreground">Preferred Language</span>
                    <p className="font-bold mt-1">{profile.preferredLanguage}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                {profile.badges && profile.badges.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {profile.badges.map((badge, i) => (
                      <Badge key={i} variant="outline" className="text-xs font-mono bg-muted/30 px-3 py-1.5">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-6">No achievements yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground text-center py-6">Activity feed coming soon.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
}

function StatBox({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-4 text-center space-y-1">
        <div className={cn('text-xl md:text-2xl font-headline font-bold', color)}>{value}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
