'use client';
import { useState, useEffect, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { searchGroups, createGroup, joinGroup } from '@/services/study-groups';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Users, Search, Plus, Lock, Globe, Clock, Loader2, BookOpen, UserPlus,
} from 'lucide-react';
import type { StudyGroup } from '@/types';

const TOPICS = ['DSA', 'Competitive Programming', 'Web Dev', 'AI/ML', 'Python', 'Java', 'C++', 'React', 'System Design'];

export default function StudyGroupsPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [allGroups, setAllGroups] = useState<StudyGroup[]>([]);
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formTopic, setFormTopic] = useState('DSA');
  const [formMax, setFormMax] = useState('10');
  const [formPublic, setFormPublic] = useState(true);
  const [formTags, setFormTags] = useState('');
  const [formSchedule, setFormSchedule] = useState('');

  const loadGroups = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (topicFilter) filters.topic = topicFilter;
      const groups = await searchGroups(searchQuery, filters);
      setAllGroups(groups);
      if (user) {
        const { firestore: db2 } = await import('@/firebase').then(m => m.initializeFirebase());
        if (db2) {
          const q = query(collection(db2, 'studyGroups'), where('memberIds', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
          const snap = await getDocs(q);
          setMyGroups(snap.docs.map(d => ({ id: d.id, ...d.data() } as StudyGroup)));
        }
      }
    } catch { /* fallback empty */ }
    setLoading(false);
  }, [searchQuery, topicFilter, user]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const handleCreateGroup = async () => {
    if (!user || !formName.trim() || !formDesc.trim()) return;
    setSubmitting(true);
    try {
      const id = await createGroup({
        name: formName,
        description: formDesc,
        topic: formTopic,
        createdBy: user.uid,
        adminIds: [user.uid],
        memberIds: [user.uid],
        maxMembers: parseInt(formMax),
        isPublic: formPublic,
        tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
        schedule: formSchedule,
        resources: [],
        coverImage: '',
      });
      if (id) {
        toast({ title: 'Group created!' });
        setCreateOpen(false);
        setFormName(''); setFormDesc(''); setFormTags(''); setFormSchedule('');
        loadGroups();
      }
    } catch { toast({ variant: 'destructive', title: 'Failed to create group' }); }
    setSubmitting(false);
  };

  const handleJoin = async (groupId: string) => {
    if (!user) return;
    await joinGroup(groupId, user.uid);
    toast({ title: 'Joined group!' });
    loadGroups();
  };

  const isMember = (group: StudyGroup) => user && group.memberIds?.includes(user.uid);

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-headline font-black uppercase tracking-tighter">Study Groups</h1>
            <p className="text-muted-foreground">Learn together, grow together.</p>
          </div>
          <Button className="gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" /> Create Group
          </Button>
        </div>

        {myGroups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-headline font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" /> My Groups
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myGroups.map(group => (
                <GroupCard key={group.id} group={group} isMember onJoin={handleJoin} />
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <Tabs value={topicFilter} onValueChange={setTopicFilter} className="w-full sm:w-auto">
            <TabsList className="bg-muted/50 flex-nowrap overflow-x-auto">
              <TabsTrigger value="">All</TabsTrigger>
              {TOPICS.slice(0, 6).map(t => (
                <TabsTrigger key={t} value={t} className="text-xs">{t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative flex-1 max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search groups..." className="pl-10 bg-muted/50 border-border" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-card/50 border-border">
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : allGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allGroups.filter(g => !isMember(g)).map(group => (
              <GroupCard key={group.id} group={group} isMember={false} onJoin={handleJoin} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>No study groups found. Create one!</p>
          </div>
        )}

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-primary" /> Create Study Group</DialogTitle>
              <DialogDescription>Create a group for collaborative learning.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Group Name</Label>
                <Input value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. DSA Warriors" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="What will you study?" />
              </div>
              <div className="space-y-2">
                <Label>Topic</Label>
                <Select value={formTopic} onValueChange={setFormTopic}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TOPICS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Members</Label>
                  <Input type="number" value={formMax} onChange={e => setFormMax(e.target.value)} min={2} max={100} />
                </div>
                <div className="space-y-2">
                  <Label>Public</Label>
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={formPublic} onCheckedChange={setFormPublic} />
                    <span className="text-xs text-muted-foreground">{formPublic ? 'Anyone can join' : 'Invite only'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tags (comma separated)</Label>
                <Input value={formTags} onChange={e => setFormTags(e.target.value)} placeholder="e.g. sorting, algorithms" />
              </div>
              <div className="space-y-2">
                <Label>Schedule</Label>
                <Input value={formSchedule} onChange={e => setFormSchedule(e.target.value)} placeholder="e.g. Mon/Wed 6PM EST" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateGroup} disabled={submitting || !formName.trim() || !formDesc.trim()}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}

function GroupCard({ group, isMember, onJoin }: { group: StudyGroup; isMember: boolean; onJoin: (id: string) => void }) {
  return (
    <Card className="bg-card/50 border-border hover:border-primary/30 transition-all cursor-pointer group" onClick={() => window.location.href = `/study-groups/${group.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {group.isPublic ? <Globe className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-muted-foreground" />}
            <Badge variant="outline" className="text-[9px] uppercase tracking-widest">{group.topic}</Badge>
          </div>
          {isMember && <Badge className="text-[9px] uppercase tracking-widest bg-primary/10 text-primary border-primary/30">Member</Badge>}
        </div>
        <h3 className="font-bold">{group.name}</h3>
        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{group.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {group.memberCount}/{group.maxMembers}</span>
          {group.schedule && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {group.schedule}</span>}
        </div>
        {group.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {group.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[8px] uppercase tracking-widest">{tag}</Badge>
            ))}
          </div>
        )}
        {!isMember && (
          <Button variant="outline" size="sm" className="w-full mt-3 gap-1" onClick={(e) => { e.stopPropagation(); onJoin(group.id); }}>
            <UserPlus className="w-3 h-3" /> Join Group
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
