'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { initializeFirebase } from '@/firebase';
import {
  collection, doc, getDocs, updateDoc, deleteDoc, addDoc, query, orderBy, limit, serverTimestamp, setDoc, getDoc,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Shield, Users, Swords, Calendar, Bell, BarChart3, Flag, AlertTriangle,
  CheckCircle, XCircle, Search, Trash2, Plus, Edit3, Eye, EyeOff, Loader2,
  Zap, Trophy, Target, UserCheck, UserX, Crown, Ban,
} from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { UserProfile } from '@/app/lib/types';

export function AdminPanel() {
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    checkAdmin();
  }, [user]);

  const checkAdmin = async () => {
    if (!user) { setChecking(false); return; }
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) { setChecking(false); return; }
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const data = userDoc.data();
      setIsAdmin(data?.isAdmin === true);
    } catch (e) { console.warn('[Admin] Failed to check admin:', e); }
    setChecking(false);
  };

  if (checking) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <Shield className="w-16 h-16 text-destructive/50" />
        <h2 className="text-xl font-headline font-bold">Access Denied</h2>
        <p className="text-muted-foreground">You do not have admin privileges.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-headline font-bold">Admin Panel</h1>
        </div>
        <Badge className="bg-primary/10 text-primary border-primary/30">Admin</Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2 h-auto bg-muted/50 p-1">
          <TabsTrigger value="users" className="text-xs gap-1"><Users className="w-3 h-3" /> Users</TabsTrigger>
          <TabsTrigger value="challenges" className="text-xs gap-1"><Target className="w-3 h-3" /> Challenges</TabsTrigger>
          <TabsTrigger value="contests" className="text-xs gap-1"><Swords className="w-3 h-3" /> Contests</TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs gap-1"><Bell className="w-3 h-3" /> Announcements</TabsTrigger>
          <TabsTrigger value="flags" className="text-xs gap-1"><Flag className="w-3 h-3" /> Features</TabsTrigger>
          <TabsTrigger value="moderation" className="text-xs gap-1"><AlertTriangle className="w-3 h-3" /> Moderation</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs gap-1"><BarChart3 className="w-3 h-3" /> Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <UserManagement />
        </TabsContent>
        <TabsContent value="challenges" className="mt-4">
          <ChallengeManagement />
        </TabsContent>
        <TabsContent value="contests" className="mt-4">
          <ContestManagement />
        </TabsContent>
        <TabsContent value="announcements" className="mt-4">
          <AnnouncementSystem />
        </TabsContent>
        <TabsContent value="flags" className="mt-4">
          <FeatureFlagsPanel />
        </TabsContent>
        <TabsContent value="moderation" className="mt-4">
          <ContentModeration />
        </TabsContent>
        <TabsContent value="reports" className="mt-4">
          <ReportsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const q = query(collection(db, 'users'), orderBy('rating', 'desc'), limit(100));
      const snap = await getDocs(q);
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('[Admin] Failed to load users:', e); }
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await updateDoc(doc(db, 'users', userId), { isAdmin: !currentStatus });
      loadUsers();
    } catch (e) { console.warn('[Admin] Failed to toggle admin:', e); }
  };

  const toggleBan = async (userId: string, currentStatus: boolean) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await updateDoc(doc(db, 'users', userId), { banned: !currentStatus });
      loadUsers();
    } catch (e) { console.warn('[Admin] Failed to toggle ban:', e); }
  };

  const filteredUsers = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm text-muted-foreground">{filteredUsers.length} users</span>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>W/L</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Banned</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.slice(0, 50).map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={u.photoURL} />
                      <AvatarFallback className="text-[10px]">{(u.username || '?')[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{u.username}</p>
                      <p className="text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-bold">{u.rating}</TableCell>
                <TableCell>{u.level}</TableCell>
                <TableCell>{u.wins}/{u.losses}</TableCell>
                <TableCell>
                  <Switch checked={u.isAdmin} onCheckedChange={() => toggleAdmin(u.id, u.isAdmin)} />
                </TableCell>
                <TableCell>
                  <Switch checked={u.banned} onCheckedChange={() => toggleBan(u.id, u.banned)} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleAdmin(u.id, u.isAdmin)}>
                      {u.isAdmin ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => toggleBan(u.id, u.banned)}>
                      {u.banned ? <Eye className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ChallengeManagement() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [saving, setSaving] = useState(false);

  const createChallenge = async () => {
    if (!title) return;
    setSaving(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await addDoc(collection(db, 'challenges'), {
        title,
        description,
        difficulty,
        active: true,
        createdAt: serverTimestamp(),
        points: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200,
      });
      setTitle('');
      setDescription('');
    } catch (e) { console.warn('[Admin] Failed to create challenge:', e); }
    setSaving(false);
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-headline font-bold">Create Challenge</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Challenge title" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Medium">Medium</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={createChallenge} disabled={saving || !title} className="gap-2">
          <Plus className="w-4 h-4" /> Create Challenge
        </Button>
      </CardContent>
    </Card>
  );
}

function ContestManagement() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [saving, setSaving] = useState(false);

  const createContest = async () => {
    if (!title) return;
    setSaving(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7);
      await addDoc(collection(db, 'contests'), {
        title,
        description,
        prize,
        status: 'upcoming',
        startDate: startDate.toISOString(),
        endDate: new Date(startDate.getTime() + 86400000).toISOString(),
        participantCount: 0,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setDescription('');
      setPrize('');
    } catch (e) { console.warn('[Admin] Failed to create contest:', e); }
    setSaving(false);
  };

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-headline font-bold">Create Contest</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Contest title" value={title} onChange={e => setTitle(e.target.value)} />
        <Textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
        <Input placeholder="Prize info" value={prize} onChange={e => setPrize(e.target.value)} />
        <Button onClick={createContest} disabled={saving || !title} className="gap-2">
          <Plus className="w-4 h-4" /> Create Contest
        </Button>
      </CardContent>
    </Card>
  );
}

function AnnouncementSystem() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('medium');
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAnnouncements(); }, []);

  const loadAnnouncements = async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
      const snap = await getDocs(q);
      setAnnouncements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('[Admin] Failed to load announcements:', e); }
  };

  const createAnnouncement = async () => {
    if (!title || !content) return;
    setSaving(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await addDoc(collection(db, 'announcements'), {
        title,
        content,
        priority,
        active: true,
        createdAt: serverTimestamp(),
      });
      setTitle('');
      setContent('');
      loadAnnouncements();
    } catch (e) { console.warn('[Admin] Failed to create announcement:', e); }
    setSaving(false);
  };

  const toggleAnnouncement = async (id: string, active: boolean) => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await updateDoc(doc(db, 'announcements', id), { active: !active });
      loadAnnouncements();
    } catch (e) { console.warn('[Admin] Failed to toggle announcement:', e); }
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-headline font-bold">New Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} />
          <Textarea placeholder="Content" value={content} onChange={e => setContent(e.target.value)} />
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={createAnnouncement} disabled={saving || !title || !content} className="gap-2">
            <Plus className="w-4 h-4" /> Post Announcement
          </Button>
        </CardContent>
      </Card>
      {announcements.map(a => (
        <Card key={a.id} className={cn('bg-card/50 border-border', a.priority === 'high' && 'border-yellow-400/30')}>
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-sm">{a.title}</p>
                <Badge className={cn(
                  'text-[10px]',
                  a.priority === 'high' ? 'bg-destructive/10 text-destructive' :
                  a.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-muted text-muted-foreground'
                )}>{a.priority}</Badge>
                {!a.active && <Badge variant="outline" className="text-[10px]">Inactive</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{a.content}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => toggleAnnouncement(a.id, a.active)}>
              {a.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function FeatureFlagsPanel() {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadFlags(); }, []);

  const loadFlags = async () => {
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const snap = await getDoc(doc(db, 'config', 'featureFlags'));
      if (snap.exists()) {
        const data = snap.data();
        const flagData: Record<string, boolean> = {};
        Object.entries(data).forEach(([key, val]) => {
          if (key !== 'id') flagData[key] = Boolean(val);
        });
        setFlags(flagData);
      } else {
        setFlags({
          premium_editor: true, analytics_dashboard: true, admin_panel: true,
          spectator_mode: false, ai_code_review: true, daily_login_rewards: true, activity_feed: true,
        });
      }
    } catch (e) { console.warn('[Admin] Failed to load feature flags:', e); }
    setLoading(false);
  };

  const toggleFlag = async (key: string) => {
    const newValue = !flags[key];
    setFlags(prev => ({ ...prev, [key]: newValue }));
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      await setDoc(doc(db, 'config', 'featureFlags'), { ...flags, [key]: newValue }, { merge: true });
    } catch (e) { console.warn('[Admin] Failed to toggle feature flag:', e); }
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  return (
    <Card className="bg-card/50 border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-headline font-bold">Feature Flags</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(flags).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="text-xs text-muted-foreground">
                  {value ? 'Enabled' : 'Disabled'}
                </p>
              </div>
              <Switch checked={value} onCheckedChange={() => toggleFlag(key)} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ContentModeration() {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-8 text-center">
        <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Content moderation tools ready. Add reported content and user reports here.</p>
      </CardContent>
    </Card>
  );
}

function ReportsAnalytics() {
  return (
    <Card className="bg-card/50 border-border">
      <CardContent className="p-8 text-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Platform analytics and reports dashboard.</p>
      </CardContent>
    </Card>
  );
}
