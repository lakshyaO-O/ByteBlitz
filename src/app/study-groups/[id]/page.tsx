'use client';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { doc, getDoc, collection, query, orderBy, getDocs, addDoc, serverTimestamp, onSnapshot, limit } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import { useUser } from '@/firebase/auth/use-user';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Users, MessageSquare, BookOpen, Calendar, Clock, Send,
  Loader2, Globe, Lock, UserPlus, Check,
} from 'lucide-react';
import type { StudyGroup, StudyGroupMessage } from '@/types';

export default function StudyGroupDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user } = useUser();
  const { toast } = useToast();
  const [group, setGroup] = useState<StudyGroup | null>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [messages, setMessages] = useState<StudyGroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    const { firestore: db } = initializeFirebase();
    if (!db) return;

    getDoc(doc(db, 'studyGroups', id)).then(snap => {
      if (snap.exists()) {
        setGroup({ id: snap.id, ...snap.data() } as StudyGroup);
        const memberIds = snap.data().memberIds || [];
        Promise.all(memberIds.map(async (uid: string) => {
          const u = await getDoc(doc(db, 'users', uid));
          if (u.exists()) return { uid, ...u.data() };
          return { uid, username: 'Unknown', photoURL: '' };
        })).then(setMembers);
      }
      setLoading(false);
    });

    const q = query(collection(db, 'studyGroups', id, 'messages'), orderBy('createdAt', 'asc'), limit(100));
    const unsub = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyGroupMessage)));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [id]);

  const handleSendMessage = async () => {
    if (!user || !group || !messageText.trim()) return;
    setSending(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const msgData = {
        groupId: group.id,
        userId: user.uid,
        username: user.displayName || 'Anonymous',
        photoURL: user.photoURL || '',
        content: messageText,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'studyGroups', group.id, 'messages'), msgData);
      setMessageText('');
    } catch { toast({ variant: 'destructive', title: 'Failed to send message' }); }
    setSending(false);
  };

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
      </Shell>
    );
  }

  if (!group) {
    return (
      <Shell>
        <div className="text-center py-20 text-muted-foreground">Group not found.</div>
      </Shell>
    );
  }

  const isMember = user && group.memberIds?.includes(user.uid);

  return (
    <Shell>
      <div className="space-y-6 max-w-5xl">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => window.history.back()}>
          <ArrowLeft className="w-4 h-4" /> Back to Study Groups
        </Button>

        <Card className="bg-gradient-to-br from-primary/10 to-secondary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {group.isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{group.topic}</Badge>
                </div>
                <h1 className="text-2xl font-headline font-bold">{group.name}</h1>
                <p className="text-sm text-muted-foreground">{group.description}</p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {group.memberCount}/{group.maxMembers} members</span>
                  {group.schedule && <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {group.schedule}</span>}
                </div>
                {group.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {group.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-[8px] uppercase tracking-widest">{tag}</Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="chat" className="gap-2"><MessageSquare className="w-4 h-4" /> Chat</TabsTrigger>
                <TabsTrigger value="resources" className="gap-2"><BookOpen className="w-4 h-4" /> Resources</TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2"><Calendar className="w-4 h-4" /> Schedule</TabsTrigger>
              </TabsList>

              <TabsContent value="chat" className="mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-0">
                    <ScrollArea className="h-[500px] p-4">
                      <div className="space-y-4">
                        {messages.map(msg => (
                          <div key={msg.id} className={cn('flex gap-3', msg.userId === user?.uid && 'flex-row-reverse')}>
                            <Avatar className="h-8 w-8 border border-muted shrink-0">
                              <AvatarImage src={msg.photoURL} />
                              <AvatarFallback className="bg-muted text-[10px]">{(msg.username || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <div className={cn('max-w-[75%]', msg.userId === user?.uid && 'items-end')}>
                              <div className={cn('rounded-xl px-3 py-2 text-sm', msg.userId === user?.uid ? 'bg-primary text-primary-foreground' : 'bg-muted/30')}>
                                {msg.content}
                              </div>
                              <p className="text-[9px] text-muted-foreground mt-0.5 px-1">{msg.username}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                    <div className="p-4 border-t border-border">
                      <div className="flex gap-2">
                        <Input
                          placeholder={isMember ? "Type a message..." : "Join to chat..."}
                          value={messageText}
                          onChange={e => setMessageText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                          disabled={!isMember}
                          className="flex-1"
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={!isMember || sending || !messageText.trim()}>
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resources" className="mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    {group.resources?.length > 0 ? (
                      <div className="space-y-3">
                        {group.resources.map((res, i) => (
                          <a key={i} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border hover:border-primary/30 transition-all">
                            <BookOpen className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{res.title}</span>
                          </a>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No resources shared yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="mt-4">
                <Card className="bg-card/50 border-border">
                  <CardContent className="p-6">
                    {group.schedule ? (
                      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/20 border border-border">
                        <Calendar className="w-8 h-8 text-primary" />
                        <div>
                          <p className="font-bold">Schedule</p>
                          <p className="text-sm text-muted-foreground">{group.schedule}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-8">No schedule set.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-4">
            <Card className="bg-card/50 border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" /> Members ({members.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.uid} className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border border-muted">
                      <AvatarImage src={m.photoURL || ''} />
                      <AvatarFallback className="bg-muted text-[10px]">{(m.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium truncate">{m.username}</span>
                    {group.adminIds?.includes(m.uid) && (
                      <Badge variant="outline" className="text-[8px] uppercase tracking-widest ml-auto">Admin</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {!isMember && (
              <Button className="w-full gap-2">
                <UserPlus className="w-4 h-4" /> Join Group
              </Button>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
