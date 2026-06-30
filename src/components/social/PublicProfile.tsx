'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { UserProfile, FriendDoc } from '@/app/lib/types';
import { useUser } from '@/firebase/auth/use-user';
import { useSendFriendRequest } from '@/hooks/use-friends';
import { cn, getTier, getTierColor } from '@/lib/utils';
import { Trophy, Swords, Users, Star, Calendar, Code2, Medal, Shield, UserPlus, UserCheck, Loader2, Clock, Zap, Target } from 'lucide-react';

interface PublicProfileProps {
  profileId: string;
}

export function PublicProfile({ profileId }: PublicProfileProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friends, setFriends] = useState<FriendDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none');
  const { user } = useUser();
  const { sendRequest, loading: sendingRequest } = useSendFriendRequest();
  const isOwnProfile = user?.uid === profileId;

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  const loadProfile = async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setLoading(false); return; }
      const userDoc = await getDoc(doc(db, 'users', profileId));
      if (userDoc.exists()) {
        setProfile(userDoc.data() as UserProfile);
      }
      const friendsSnap = await getDocs(query(collection(db, 'users', profileId, 'friends'), limit(6)));
      setFriends(friendsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)) as FriendDoc[]);

      if (user && user.uid !== profileId) {
        const myFriendsSnap = await getDocs(collection(db, 'users', user.uid, 'friends'));
        const isFriend = myFriendsSnap.docs.some(d => d.id === profileId);
        if (isFriend) setFriendStatus('friends');
      }

      setLoading(false);
    } catch { setLoading(false); }
  };

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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!profile) return <div className="text-center py-12 text-muted-foreground">User not found</div>;

  const tier = getTier(profile.rating);
  const tierColor = getTierColor(tier);
  const totalGames = profile.wins + profile.losses + profile.draws;
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-card/80 to-card/50 border-border overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/10 to-primary/5" />
        <CardContent className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-16">
            <Avatar className="w-24 h-24 border-4 border-background ring-2 ring-primary/30">
              <AvatarImage src={profile.photoURL} />
              <AvatarFallback className="text-2xl bg-primary/20">
                {(profile.username || '?')[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 pt-14 sm:pt-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-headline font-bold">{profile.username}</h1>
                <Badge className={cn('text-xs', tierColor.includes('text') ? tierColor.replace('text-', 'bg-').replace('font-bold', '') : '')}>
                  {tier}
                </Badge>
                {profile.title && (
                  <Badge variant="outline" className="text-xs">
                    {profile.title}
                  </Badge>
                )}
              </div>
              {profile.bio && <p className="text-sm text-muted-foreground mt-1">{profile.bio}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Code2 className="w-3 h-3" /> {profile.preferredLanguage || 'N/A'}</span>
              </div>
            </div>
            {!isOwnProfile && user && (
              <Button
                onClick={handleSendRequest}
                disabled={sendingRequest || friendStatus !== 'none'}
                className="gap-2"
              >
                {friendStatus === 'friends' ? <UserCheck className="w-4 h-4" /> :
                 friendStatus === 'pending' ? <Loader2 className="w-4 h-4 animate-spin" /> :
                 <UserPlus className="w-4 h-4" />}
                {friendStatus === 'friends' ? 'Friends' : friendStatus === 'pending' ? 'Pending' : 'Add Friend'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card/50 border-border p-4 text-center">
          <Trophy className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-2xl font-bold font-headline">{profile.wins}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Wins</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <Swords className="w-6 h-6 text-destructive mx-auto mb-1" />
          <p className="text-2xl font-bold font-headline">{profile.losses}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Losses</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <Target className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
          <p className="text-2xl font-bold font-headline">{winRate}%</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Win Rate</p>
        </Card>
        <Card className="bg-card/50 border-border p-4 text-center">
          <Zap className="w-6 h-6 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold font-headline">{profile.level}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Level</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Medal className="w-4 h-4 text-primary" /> Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rating</span>
                <span className="font-bold">{profile.rating}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Highest Rating</span>
                <span className="font-bold">{profile.highestRating}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP</span>
                <span className="font-bold">{profile.xp.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Coins</span>
                <span className="font-bold">{profile.coins.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Draws</span>
                <span className="font-bold">{profile.draws}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-4">
            <h3 className="text-sm font-headline font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> Friends ({friends.length})
            </h3>
            {friends.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {friends.map((friend) => (
                  <div key={friend.friendId} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={friend.photoURL} />
                      <AvatarFallback className="text-[8px]">{(friend.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium">{friend.username}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">No friends yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
