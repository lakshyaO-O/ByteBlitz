'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  collection, doc, getDocs, updateDoc, deleteDoc, addDoc, query, orderBy, limit, serverTimestamp, setDoc, getDoc, writeBatch,
} from 'firebase/firestore';
import { cn } from '@/lib/utils';
import {
  Shield, Users, Swords, Calendar, Bell, BarChart3, Flag, AlertTriangle,
  CheckCircle, XCircle, Search, Trash2, Plus, Edit3, Eye, EyeOff, Loader2,
  Zap, Trophy, Target, UserCheck, UserX, Crown, Ban, Upload,
} from 'lucide-react';
import { useUser } from '@/firebase/auth/use-user';
import { UserProfile } from '@/app/lib/types';
import { seedProblemsToFirestore } from '@/services/seed-data';

function generateSearchTokens(title: string, topics: string[], category: string): string[] {
  const tokens = new Set<string>();
  const words = title.toLowerCase().split(/[\s-]+/);
  words.forEach(w => {
    if (w.length >= 2) {
      for (let i = 1; i <= w.length; i++) tokens.add(w.slice(0, i));
    }
  });
  topics.forEach(t => tokens.add(t.toLowerCase()));
  if (category) tokens.add(category.toLowerCase());
  return [...tokens];
}

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
        <TabsList className="grid grid-cols-2 md:grid-cols-8 gap-2 h-auto bg-muted/50 p-1">
          <TabsTrigger value="users" className="text-xs gap-1"><Users className="w-3 h-3" /> Users</TabsTrigger>
          <TabsTrigger value="problems" className="text-xs gap-1"><Zap className="w-3 h-3" /> Problems</TabsTrigger>
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
        <TabsContent value="problems" className="mt-4">
          <ProblemManagement />
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

const ALL_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust'];
const ALL_TOPIC_OPTIONS = [
  'Arrays', 'Strings', 'Math', 'Loops', 'Functions', 'Recursion',
  'Sorting', 'Searching', 'Hashing', 'Stack', 'Queue', 'Linked List',
  'Trees', 'Graphs', 'Heap', 'Greedy', 'Dynamic Programming',
  'Backtracking', 'Bit Manipulation', 'Binary Search', 'Two Pointers',
  'Sliding Window', 'Prefix Sum', 'Tries', 'Union Find', 'Segment Tree', 'SQL',
];

function ProblemManagement() {
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadProblems(); }, []);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const { firestore: db } = initializeFirebase();
      if (!db) return;
      const q = query(collection(db, 'problems'), orderBy('title', 'asc'));
      const snap = await getDocs(q);
      setProblems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.warn('[Admin] Failed to load problems:', e); }
    setLoading(false);
  };

  const [form, setForm] = useState({
    title: '', difficulty: 'Easy', category: '', points: 100,
    topics: [] as string[], companyTags: '' as string,
    isPremium: false, isPublished: true, estimatedTime: 15,
    description: '', constraints: '' as string,
    examples: '' as string, hints: '' as string, editorial: '',
    starterCode: '{}' as string, testCases: '' as string,
  });

  const resetForm = () => {
    setForm({
      title: '', difficulty: 'Easy', category: '', points: 100,
      topics: [], companyTags: '', isPremium: false, isPublished: true, estimatedTime: 15,
      description: '', constraints: '', examples: '', hints: '', editorial: '',
      starterCode: '{}', testCases: '',
    });
  };

  const startEdit = (p: any) => {
    setForm({
      title: p.title || '', difficulty: p.difficulty || 'Easy', category: p.category || '', points: p.points || 100,
      topics: p.topics || [], companyTags: (p.companyTags || []).join(', '),
      isPremium: p.isPremium || false, isPublished: p.isPublished !== false, estimatedTime: p.estimatedTime || 15,
      description: p.description || '', constraints: (p.constraints || []).join('\n'),
      examples: JSON.stringify(p.examples || [], null, 2),
      hints: (p.hints || []).join('\n'), editorial: p.editorial || '',
      starterCode: JSON.stringify(p.starterCode || {}, null, 2),
      testCases: JSON.stringify(p.testCases || [], null, 2),
    });
    setEditing(p.id);
    setShowNew(false);
  };

  const saveProblem = async () => {
    const { firestore: db } = initializeFirebase();
    if (!db) return;

    let examples: any[] = [];
    let testCases: any[] = [];
    let starterCode: Record<string, string> = {};
    try { examples = JSON.parse(form.examples || '[]'); } catch {}
    try { testCases = JSON.parse(form.testCases || '[]'); } catch {}
    try { starterCode = JSON.parse(form.starterCode || '{}'); } catch {}

    const meta = {
      title: form.title,
      difficulty: form.difficulty,
      category: form.category,
      points: Number(form.points),
      topics: form.topics,
      companyTags: form.companyTags.split(',').map(t => t.trim()).filter(Boolean),
      isPremium: form.isPremium,
      isPublished: form.isPublished,
      estimatedTime: Number(form.estimatedTime),
      acceptanceRate: 75,
      totalSubmissions: 0,
      totalAccepted: 0,
      difficultyRating: form.difficulty === 'Easy' ? 1 : form.difficulty === 'Medium' ? 3 : 5,
      prerequisites: [],
      relatedProblems: [],
      searchTokens: generateSearchTokens(form.title, form.topics, form.category),
      updatedAt: serverTimestamp(),
    };

    const content = {
      description: form.description,
      constraints: form.constraints.split('\n').filter(Boolean),
      examples,
      testCases,
      hints: form.hints.split('\n').filter(Boolean),
      editorial: form.editorial,
      solutionCode: starterCode,
      starterCode,
      timeLimitMs: form.difficulty === 'Easy' ? 1000 : form.difficulty === 'Medium' ? 2000 : 3000,
      memoryLimitKb: form.difficulty === 'Easy' ? 256000 : form.difficulty === 'Medium' ? 512000 : 1024000,
    };

    try {
      if (editing) {
        await setDoc(doc(db, 'problems', editing), meta, { merge: true });
        await setDoc(doc(db, 'problemContent', editing), content, { merge: true });
      } else {
        const ref = await addDoc(collection(db, 'problems'), { ...meta, createdAt: serverTimestamp() });
        await setDoc(doc(db, 'problemContent', ref.id), content);
      }
      resetForm();
      setEditing(null);
      setShowNew(false);
      loadProblems();
    } catch (e) { console.warn('[Admin] Failed to save problem:', e); }
  };

  const deleteProblem = async (id: string) => {
    const { firestore: db } = initializeFirebase();
    if (!db || !confirm('Delete this problem?')) return;
    try {
      await deleteDoc(doc(db, 'problems', id));
      await deleteDoc(doc(db, 'problemContent', id));
      loadProblems();
    } catch (e) { console.warn('[Admin] Failed to delete problem:', e); }
  };

  const toggleTopic = (topic: string) => {
    setForm(f => ({
      ...f,
      topics: f.topics.includes(topic) ? f.topics.filter(t => t !== topic) : [...f.topics, topic],
    }));
  };

  if (loading) return <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></div>;

  if (showNew || editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold">{editing ? 'Edit Problem' : 'New Problem'}</h3>
          <Button variant="ghost" size="sm" onClick={() => { setShowNew(false); setEditing(null); resetForm(); }}>
            Back
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            <Select value={form.difficulty} onValueChange={v => setForm(f => ({ ...f, difficulty: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Easy">Easy</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Hard">Hard</SelectItem>
              </SelectContent>
            </Select>
            <Input placeholder="Category" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
            <Input type="number" placeholder="Points" value={form.points} onChange={e => setForm(f => ({ ...f, points: Number(e.target.value) }))} />
            <Input type="number" placeholder="Est. time (min)" value={form.estimatedTime} onChange={e => setForm(f => ({ ...f, estimatedTime: Number(e.target.value) }))} />
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs"><Switch checked={form.isPremium} onCheckedChange={v => setForm(f => ({ ...f, isPremium: v }))} /> Premium</label>
              <label className="flex items-center gap-2 text-xs"><Switch checked={form.isPublished} onCheckedChange={v => setForm(f => ({ ...f, isPublished: v }))} /> Published</label>
            </div>
          </div>
          <div className="space-y-3 col-span-2">
            <Textarea placeholder="Description (markdown)" className="min-h-[120px]" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <Textarea placeholder="Constraints (one per line)" className="min-h-[60px]" value={form.constraints} onChange={e => setForm(f => ({ ...f, constraints: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Topics</p>
            <div className="flex flex-wrap gap-1">
              {ALL_TOPIC_OPTIONS.map(t => (
                <button key={t} onClick={() => toggleTopic(t)}
                  className={cn(
                    'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest transition-colors',
                    form.topics.includes(t) ? 'bg-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground border border-border',
                  )}>
                  {t}
                </button>
              ))}
            </div>
            <Input placeholder="Company tags (comma separated)" value={form.companyTags} onChange={e => setForm(f => ({ ...f, companyTags: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Starter Code (JSON)</p>
            <Textarea className="min-h-[80px] font-mono text-xs" value={form.starterCode} onChange={e => setForm(f => ({ ...f, starterCode: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Examples (JSON array)</p>
            <Textarea className="min-h-[80px] font-mono text-xs" value={form.examples} onChange={e => setForm(f => ({ ...f, examples: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Test Cases (JSON array)</p>
            <Textarea className="min-h-[80px] font-mono text-xs" value={form.testCases} onChange={e => setForm(f => ({ ...f, testCases: e.target.value }))} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Textarea placeholder="Hints (one per line)" className="min-h-[60px]" value={form.hints} onChange={e => setForm(f => ({ ...f, hints: e.target.value }))} />
          <Textarea placeholder="Editorial (markdown)" className="min-h-[60px]" value={form.editorial} onChange={e => setForm(f => ({ ...f, editorial: e.target.value }))} />
        </div>

        <Button onClick={saveProblem} className="gap-2"><Plus className="w-4 h-4" /> {editing ? 'Update' : 'Create'} Problem</Button>
      </div>
    );
  }

  const handleSeed = useCallback(async () => {
    setSeeding(true);
    try {
      const result = await seedProblemsToFirestore();
      alert(`Seeded ${result.created} problems. ${result.skipped} already existed.`);
      loadProblems();
    } catch (e) { console.warn('[Admin] Seed failed:', e); }
    setSeeding(false);
  }, []);

  const handleImportJSON = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const problems = Array.isArray(data) ? data : data.problems || [];
      const { firestore: db } = initializeFirebase();
      if (!db) { alert('Firebase not available'); setImporting(false); return; }
      let created = 0, skipped = 0;
      for (let i = 0; i < problems.length; i += 20) {
        const batch = writeBatch(db);
        const slice = problems.slice(i, i + 20);
        for (const p of slice) {
          if (!p.id || !p.title) { skipped++; continue; }
          const existing = await getDoc(doc(db, 'problems', p.id));
          if (existing.exists()) { skipped++; continue; }
          const meta = {
            title: p.title, difficulty: p.difficulty || 'Easy',
            category: p.category || p.topics?.[0] || 'General',
            points: p.points || 10, topics: p.topics || [],
            companyTags: p.companyTags || [],
            acceptanceRate: p.acceptanceRate || 75,
            totalSubmissions: 0, totalAccepted: 0,
            isPremium: p.isPremium || false, isPublished: p.isPublished !== false,
            estimatedTime: p.estimatedTime || 15,
            difficultyRating: p.difficulty === 'Easy' ? 1 : p.difficulty === 'Medium' ? 3 : 5,
            prerequisites: p.prerequisites || [], relatedProblems: p.relatedProblems || [],
            searchTokens: generateSearchTokens(p.title, p.topics || [], p.category || ''),
            createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
          };
          const content = {
            description: p.description || '', constraints: p.constraints || [],
            examples: p.examples || [], testCases: p.testCases || [],
            hints: p.hints || [], editorial: p.editorial || '',
            solutionCode: p.solutionCode || p.starterCode || {},
            starterCode: p.starterCode || {},
            timeLimitMs: p.timeLimitMs || 2000, memoryLimitKb: p.memoryLimitKb || 256000,
          };
          batch.set(doc(db, 'problems', p.id), meta);
          batch.set(doc(db, 'problemContent', p.id), content);
          created++;
        }
        await batch.commit();
      }
      alert(`Imported ${created} problems. ${skipped} skipped.`);
      loadProblems();
    } catch (e) { console.warn('[Admin] Import failed:', e); alert('Import failed: ' + e); }
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{problems.length} problems</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={handleSeed} disabled={seeding} className="gap-2">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {seeding ? 'Seeding...' : 'Seed 55'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportJSON}
          />
          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-2">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {importing ? 'Importing...' : 'Import JSON'}
          </Button>
          <Button size="sm" onClick={() => { resetForm(); setShowNew(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> New Problem
          </Button>
        </div>
      </div>

      {problems.length === 0 ? (
        <Card className="bg-card/50 border-border">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No problems in Firestore yet. Create one.</p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Difficulty</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Topics</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {problems.map(p => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.title}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={cn(
                    'text-[10px]',
                    p.difficulty === 'Easy' ? 'text-emerald-400' : p.difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive',
                  )}>{p.difficulty}</Badge>
                </TableCell>
                <TableCell>{p.points}</TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    {(p.topics || []).slice(0, 2).map((t: string) => (
                      <Badge key={t} variant="secondary" className="text-[8px]">{t}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {p.isPremium && <Badge className="text-[8px] bg-amber-500/10 text-amber-400">Premium</Badge>}
                    {!p.isPublished && <Badge variant="outline" className="text-[8px]">Draft</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(p)}>
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteProblem(p.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
