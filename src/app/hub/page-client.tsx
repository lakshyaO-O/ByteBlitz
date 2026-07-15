'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  Bug, Lightbulb, Mail, CalendarDays, Target, Briefcase, Building2,
  Map, Shield, Search, Loader2, ThumbsUp, MessageSquare, Plus, Check,
  Clock, ArrowUpRight, AlertTriangle, Info, ChevronRight, ExternalLink,
  Heart, Flag, Upload, X, Zap, Eye, Lock, Users, Award, Sparkles,
  Filter, SortAsc, MessageCircle, BellRing, Crown, PartyPopper,
  Timer, BookOpen, Monitor, Smartphone, Globe, Wifi, Code2,
  GraduationCap,
} from 'lucide-react';

type HubSection = 'bugs' | 'features' | 'contact' | 'events' | 'challenges' | 'careers' | 'host' | 'roadmap' | 'admin';

const SECTIONS: { id: HubSection; label: string; icon: any; description: string }[] = [
  { id: 'bugs', label: 'Report Bug', icon: Bug, description: 'Report bugs, UI issues, performance problems, and security vulnerabilities' },
  { id: 'features', label: 'Feature Requests', icon: Lightbulb, description: 'Suggest and vote on new features for DevRann' },
  { id: 'contact', label: 'Contact Team', icon: Mail, description: 'Get in touch with the DevRann team' },
  { id: 'events', label: 'Events', icon: CalendarDays, description: 'Upcoming events, hackathons, competitions, and meetups' },
  { id: 'challenges', label: 'Challenges', icon: Target, description: 'Daily, weekly, and special coding challenges' },
  { id: 'careers', label: 'Careers', icon: Briefcase, description: 'Jobs, internships, and community opportunities' },
  { id: 'host', label: 'Apply to Host', icon: Building2, description: 'Apply to host events on DevRann' },
  { id: 'roadmap', label: 'Roadmap', icon: Map, description: 'See what we are building and what is coming next' },
  { id: 'admin', label: 'Hub Admin', icon: Shield, description: 'Manage reports, features, events, and applications' },
];

export default function HubPage() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<HubSection>('bugs');
  const [userRole, setUserRole] = useState<string>('user');

  useEffect(() => {
    if (!user?.uid || !db) return;
    import('firebase/firestore').then(async ({ doc, getDoc }) => {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserRole(data.role || (data.isAdmin ? 'admin' : 'user'));
      }
    });
  }, [user?.uid, db]);

  const sectionContent = (id: HubSection) => {
    switch (id) {
      case 'bugs': return <BugReportSection user={user} toast={toast} />;
      case 'features': return <FeatureRequestsSection user={user} toast={toast} />;
      case 'contact': return <ContactSection user={user} toast={toast} />;
      case 'events': return <EventsSection user={user} />;
      case 'challenges': return <ChallengesSection />;
      case 'careers': return <CareersSection />;
      case 'host': return <HostApplicationSection user={user} toast={toast} />;
      case 'roadmap': return <RoadmapSection user={user} toast={toast} />;
      case 'admin': return <HubAdminSection user={user} toast={toast} role={userRole} />;
      default: return null;
    }
  };

  return (
    <Shell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-primary/10 border border-primary/20">
            <Bug className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Community Hub</h1>
            <p className="text-sm text-muted-foreground">The central place to interact with the DevRann team and community</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {SECTIONS.map((s) => {
            if (s.id === 'admin' && !['super_admin', 'admin', 'moderator', 'support'].includes(userRole)) return null;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  activeSection === s.id
                    ? 'bg-primary/10 border-primary/30 text-primary shadow-sm'
                    : 'bg-card border-border/50 text-muted-foreground hover:text-foreground hover:border-border hover:bg-accent/50'
                )}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            );
          })}
        </div>

        <Separator />

        {sectionContent(activeSection)}
      </div>
    </Shell>
  );
}

function BugReportSection({ user, toast }: { user: any; toast: any }) {
  const [open, setOpen] = useState(false);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    category: 'bug',
    title: '',
    description: '',
    stepsToReproduce: '',
    expectedResult: '',
    actualResult: '',
    severity: 'medium',
    contactEmail: '',
    screenshotUrl: '',
  });

  const loadReports = useCallback(async () => {
    try {
      const res = await fetch(`/api/hub/bug-reports?status=${filter === 'all' ? '' : filter}`, {
        headers: user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => { loadReports(); }, [loadReports]);

  const handleSubmit = async () => {
    if (!form.title || !form.description) {
      toast({ title: 'Validation Error', description: 'Title and description are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const body: any = { ...form };
      if (typeof window !== 'undefined') {
        body.currentPage = window.location.href;
        body.browser = navigator.userAgent.includes('Chrome') ? 'Chrome' : navigator.userAgent.includes('Firefox') ? 'Firefox' : 'Unknown';
        body.os = navigator.userAgent.includes('Windows') ? 'Windows' : navigator.userAgent.includes('Mac') ? 'macOS' : 'Unknown';
        body.device = /Mobile|Android|iP(hone|od|ad)/.test(navigator.userAgent) ? 'Mobile' : 'Desktop';
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      const res = await fetch('/api/hub/bug-reports', { method: 'POST', headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Report Submitted', description: 'Thank you for helping improve DevRann!' });
        setOpen(false);
        setForm({ category: 'bug', title: '', description: '', stepsToReproduce: '', expectedResult: '', actualResult: '', severity: 'medium', contactEmail: '', screenshotUrl: '' });
        loadReports();
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to submit', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const severityColor = (s: string) => {
    switch (s) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case 'open': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'assigned': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'closed': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bug className="w-5 h-5 text-red-400" />
            Bug Reports
          </h2>
          <p className="text-sm text-muted-foreground">Report issues and track their resolution</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Report Bug
        </Button>
      </div>

      <div className="flex gap-2">
        {['all', 'open', 'resolved', 'closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
              filter === f ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Report a Bug</DialogTitle>
            <DialogDescription>Help us improve DevRann by reporting issues you encounter.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="ui_issue">UI Issue</SelectItem>
                    <SelectItem value="performance_issue">Performance Issue</SelectItem>
                    <SelectItem value="judge_issue">Judge Issue</SelectItem>
                    <SelectItem value="ai_issue">AI Issue</SelectItem>
                    <SelectItem value="security_vulnerability">Security Vulnerability</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief description of the issue" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the issue in detail..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Steps to Reproduce</Label>
              <Textarea value={form.stepsToReproduce} onChange={(e) => setForm({ ...form, stepsToReproduce: e.target.value })} placeholder="1. Go to... 2. Click... 3. See error..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Expected Result</Label>
                <Textarea value={form.expectedResult} onChange={(e) => setForm({ ...form, expectedResult: e.target.value })} placeholder="What should happen?" rows={2} />
              </div>
              <div className="space-y-2">
                <Label>Actual Result</Label>
                <Textarea value={form.actualResult} onChange={(e) => setForm({ ...form, actualResult: e.target.value })} placeholder="What actually happened?" rows={2} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Screenshot URL (optional)</Label>
              <Input value={form.screenshotUrl} onChange={(e) => setForm({ ...form, screenshotUrl: e.target.value })} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Contact Email (optional)</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="For follow-up questions" />
            </div>
            {!user && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-500 mt-0.5" />
                <p className="text-xs text-amber-600 dark:text-amber-400">You are submitting as a guest. Sign in to track your reports.</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Shield className="w-12 h-12 text-muted-foreground/60" />
            <p className="text-muted-foreground font-medium">No bug reports yet</p>
            <p className="text-sm text-muted-foreground/60">Be the first to report an issue</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reports.map((r: any) => (
            <Card key={r.id} className="hover:border-border/80 transition-colors">
              <CardContent className="flex items-start justify-between p-4">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', severityColor(r.severity))}>{r.severity}</span>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', statusColor(r.status))}>{r.status}</span>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{r.category?.replace(/_/g, ' ')}</span>
                  </div>
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {r.username && <span>by {r.username}</span>}
                    {r.createdAt?.toDate && <span>{r.createdAt.toDate().toLocaleDateString()}</span>}
                    {r.browser && <span className="flex items-center gap-1"><Monitor className="w-3 h-3" />{r.browser}</span>}
                    {r.os && <span className="flex items-center gap-1"><Globe className="w-3 h-3" />{r.os}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureRequestsSection({ user, toast }: { user: any; toast: any }) {
  const [features, setFeatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sort, setSort] = useState('newest');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', category: 'feature' });
  const [viewFeature, setViewFeature] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');

  const loadFeatures = useCallback(async () => {
    try {
      const params = new URLSearchParams({ sort, status: filter === 'all' ? '' : filter });
      const res = await fetch(`/api/hub/features?${params}`, {
        headers: user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setFeatures(data.features || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user, sort, filter]);

  useEffect(() => { loadFeatures(); }, [loadFeatures]);

  const handleSubmit = async () => {
    if (!user) { toast({ title: 'Sign In Required', description: 'Please sign in to suggest a feature', variant: 'destructive' }); return; }
    if (!form.title || !form.description) {
      toast({ title: 'Validation Error', description: 'Title and description are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/hub/features', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Feature Submitted', description: 'Thank you for your suggestion!' });
        setOpen(false);
        setForm({ title: '', description: '', category: 'feature' });
        loadFeatures();
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {} finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (featureId: string) => {
    if (!user) { toast({ title: 'Sign In Required', description: 'Sign in to upvote', variant: 'destructive' }); return; }
    try {
      await fetch(`/api/hub/features/${featureId}/upvote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      loadFeatures();
    } catch {}
  };

  const loadComments = async (featureId: string) => {
    try {
      const res = await fetch(`/api/hub/features/${featureId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch {}
  };

  const handleComment = async (featureId: string) => {
    if (!user || !commentText.trim()) return;
    try {
      await fetch(`/api/hub/features/${featureId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ featureId, content: commentText }),
      });
      setCommentText('');
      loadComments(featureId);
    } catch {}
  };

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-muted text-muted-foreground border-border',
      planned: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      in_progress: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
      completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
      duplicate: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    };
    return colors[s] || colors.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-400" />
            Feature Requests
          </h2>
          <p className="text-sm text-muted-foreground">Suggest and vote on features</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!user}>
          <Lightbulb className="w-4 h-4 mr-2" />
          Suggest Feature
        </Button>
      </div>

      <div className="flex gap-2 items-center">
        <div className="flex gap-2">
          {['all', 'pending', 'planned', 'in_progress', 'completed'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                filter === f ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground')}
            >{f === 'in_progress' ? 'Building' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
        <div className="ml-auto">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="top">Most Votes</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest a Feature</DialogTitle>
            <DialogDescription>What would you like to see on DevRann?</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Feature name" />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature">New Feature</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="ui">UI/UX</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your idea..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!viewFeature} onOpenChange={(o) => { if (!o) setViewFeature(null); }}>
        {viewFeature && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                {viewFeature.title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium border', statusBadge(viewFeature.status))}>
                {viewFeature.status?.replace(/_/g, ' ')}
              </span>
              <p className="text-sm text-muted-foreground">{viewFeature.description}</p>
              {viewFeature.adminNotes && (
                <div className="p-3 rounded-lg bg-muted/30 border text-sm">
                  <p className="font-medium text-xs text-muted-foreground mb-1">Admin Note</p>
                  <p>{viewFeature.adminNotes}</p>
                </div>
              )}
              <Separator />
              <div className="space-y-3">
                <p className="text-sm font-medium">Comments ({comments.length})</p>
                <ScrollArea className="max-h-48">
                  {comments.map((c: any) => (
                    <div key={c.id} className="flex gap-2 py-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={c.photoURL} />
                        <AvatarFallback>{c.username?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">{c.username}</p>
                        <p className="text-sm">{c.content}</p>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
                {user && (
                  <div className="flex gap-2">
                    <Input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." className="text-sm" />
                    <Button size="sm" onClick={() => handleComment(viewFeature.id)} disabled={!commentText.trim()}>
                      <MessageSquare className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : features.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12">
            <Lightbulb className="w-12 h-12 text-muted-foreground/60" />
            <p className="text-muted-foreground font-medium">No feature requests yet</p>
            <p className="text-sm text-muted-foreground/60">Be the first to suggest an idea</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {features.map((f: any) => (
            <Card key={f.id} className="hover:border-border/80 transition-colors cursor-pointer" onClick={() => { setViewFeature(f); loadComments(f.id); }}>
              <CardContent className="flex items-start gap-4 p-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpvote(f.id); }}
                  className={cn(
                    'flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg border transition-colors min-w-[48px]',
                    f.upvotedBy?.includes(user?.uid) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
                  )}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-bold">{f.upvotes || 0}</span>
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{f.title}</p>
                    <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', statusBadge(f.status))}>
                      {f.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{f.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>by {f.username}</span>
                    <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{f.commentCount || 0}</span>
                    <span>{f.createdAt?.toDate?.()?.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ContactSection({ user, toast }: { user: any; toast: any }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ category: 'general_question', name: '', email: '', subject: '', message: '' });

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, name: user.displayName || '', email: user.email || '' }));
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast({ title: 'Validation Error', description: 'All fields are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      const res = await fetch('/api/hub/contact', { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Message Sent', description: 'We will get back to you soon!' });
        setOpen(false);
        setForm({ category: 'general_question', name: '', email: '', subject: '', message: '' });
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to send', variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const contactOptions = [
    { value: 'general_question', label: 'General Question', icon: HelpCircle },
    { value: 'business_inquiry', label: 'Business Inquiry', icon: Briefcase },
    { value: 'partnership', label: 'Partnership', icon: Handshake },
    { value: 'report_abuse', label: 'Report Abuse', icon: Flag },
    { value: 'technical_support', label: 'Technical Support', icon: Wifi },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            Contact Team
          </h2>
          <p className="text-sm text-muted-foreground">Get in touch with the DevRann team</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Mail className="w-4 h-4 mr-2" />
          Send Message
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contactOptions.map((opt) => (
          <Card key={opt.value} className="hover:border-primary/30 transition-colors cursor-pointer" onClick={() => { setForm({ ...form, category: opt.value }); setOpen(true); }}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <opt.icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{opt.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Us</DialogTitle>
            <DialogDescription>We typically respond within 24 hours.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {contactOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EventsSection({ user }: { user: any }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/hub/events?upcoming=true', {
          headers: user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch {} finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-violet-400" />
          Events & Hackathons
        </h2>
        <p className="text-sm text-muted-foreground">Upcoming events, competitions, meetups, and more</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(['hackathon', 'coding_competition', 'community_meetup', 'workshop', 'webinar', 'live_stream'] as const).map((type) => (
          <Card key={type} className="border-dashed border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm capitalize flex items-center gap-2">
                {type === 'hackathon' && <Zap className="w-4 h-4 text-orange-400" />}
                {type === 'coding_competition' && <Award className="w-4 h-4 text-yellow-400" />}
                {type === 'community_meetup' && <Users className="w-4 h-4 text-green-400" />}
                {type === 'workshop' && <BookOpen className="w-4 h-4 text-blue-400" />}
                {type === 'webinar' && <Monitor className="w-4 h-4 text-purple-400" />}
                {type === 'live_stream' && <Wifi className="w-4 h-4 text-red-400" />}
                {type.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground">No upcoming {type.replace(/_/g, ' ')} events.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : events.length > 0 ? (
        <div className="grid gap-3">
          {events.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{e.title}</p>
                    <p className="text-sm text-muted-foreground">{e.description}</p>
                  </div>
                  <Badge>{e.eventType?.replace(/_/g, ' ')}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <CalendarDays className="w-10 h-10 text-muted-foreground/60" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">No upcoming events</p>
              <p className="text-sm text-muted-foreground/60 mt-1">Stay tuned! Events and hackathons are coming soon.</p>
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground/40">
              <span>Hackathons</span>
              <span>Competitions</span>
              <span>Meetups</span>
              <span>Workshops</span>
              <span>Webinars</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const HelpCircle = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <path d="M12 17h.01" />
  </svg>
);

const Handshake = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 17a1 1 0 0 1 1 1c0 1.333-.667 2-2 2" />
    <path d="M11 17a1 1 0 0 0-1 1c0 1.333.667 2 2 2" />
    <path d="M21 17a1 1 0 0 1 1 1c0 1.333-.667 2-2 2" />
    <path d="M21 17a1 1 0 0 0-1 1c0 1.333.667 2 2 2" />
    <path d="M3.5 14 5 7h4l2 5" />
    <path d="M20.5 14 19 7h-4l-2 5" />
    <path d="M10 12 8 9h8l-2 3" />
  </svg>
);

function ChallengesSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          Challenges
        </h2>
        <p className="text-sm text-muted-foreground">Daily, weekly, and special coding challenges</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(['daily', 'weekly', 'monthly', 'special', 'company', 'hackathon'] as const).map((type) => (
          <Card key={type} className="border-dashed border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm capitalize flex items-center gap-2">
                {type === 'daily' && <Timer className="w-4 h-4 text-blue-400" />}
                {type === 'weekly' && <CalendarDays className="w-4 h-4 text-green-400" />}
                {type === 'monthly' && <Award className="w-4 h-4 text-purple-400" />}
                {type === 'special' && <Sparkles className="w-4 h-4 text-yellow-400" />}
                {type === 'company' && <Building2 className="w-4 h-4 text-orange-400" />}
                {type === 'hackathon' && <Zap className="w-4 h-4 text-red-400" />}
                {type.charAt(0).toUpperCase() + type.slice(1)} Challenges
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground">No active {type} challenges.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <Target className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-muted-foreground">No active challenges</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Challenges are being prepared. Check back soon!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CareersSection() {
  const categories = [
    { id: 'hiring', icon: Briefcase, color: 'text-blue-400' },
    { id: 'internship', icon: GraduationCap, color: 'text-green-400' },
    { id: 'campus_ambassador', icon: Users, color: 'text-purple-400' },
    { id: 'open_source', icon: Code2, color: 'text-orange-400' },
    { id: 'mentor', icon: Award, color: 'text-yellow-400' },
    { id: 'volunteer', icon: Heart, color: 'text-red-400' },
    { id: 'beta_tester', icon: Bug, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-sky-400" />
          Careers & Opportunities
        </h2>
        <p className="text-sm text-muted-foreground">Join the DevRann team and community</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="border-dashed border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm capitalize flex items-center gap-2">
                <cat.icon className={cn('w-4 h-4', cat.color)} />
                {cat.id.replace(/_/g, ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <p className="text-xs text-muted-foreground">No opportunities available.</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-16">
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <Briefcase className="w-10 h-10 text-muted-foreground/60" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-muted-foreground">No opportunities available</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Career opportunities will be posted here as they become available.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HostApplicationSection({ user, toast }: { user: any; toast: any }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    organizationName: '',
    contactPerson: '',
    email: '',
    website: '',
    country: '',
    expectedParticipants: 50,
    eventType: 'hackathon',
    description: '',
    preferredDates: '',
  });

  useEffect(() => {
    if (user) {
      setForm((f) => ({ ...f, contactPerson: user.displayName || '', email: user.email || '' }));
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!form.organizationName || !form.contactPerson || !form.email || !form.country || !form.description || !form.preferredDates) {
      toast({ title: 'Validation Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (user) headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
      const res = await fetch('/api/hub/host-applications', { method: 'POST', headers, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast({ title: 'Application Submitted', description: 'We will review your application and get back to you.' });
        setOpen(false);
        setForm({ organizationName: '', contactPerson: '', email: '', website: '', country: '', expectedParticipants: 50, eventType: 'hackathon', description: '', preferredDates: '' });
      } else {
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            Apply to Host
          </h2>
          <p className="text-sm text-muted-foreground">Universities, communities, clubs, and companies can apply to host events on DevRann</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Building2 className="w-4 h-4 mr-2" />
          Apply Now
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Universities & Colleges', desc: 'Host coding competitions for your students' },
              { icon: Globe, label: 'Communities & Clubs', desc: 'Organize meetups and workshops' },
              { icon: Building2, label: 'Companies', desc: 'Run hackathons and recruitment events' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-2 p-4 rounded-xl bg-muted/20 border border-border/50">
                <item.icon className="w-8 h-8 text-primary/60" />
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Apply to Host an Event</DialogTitle>
            <DialogDescription>Tell us about your organization and the event you want to host.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Organization Name *</Label>
                <Input value={form.organizationName} onChange={(e) => setForm({ ...form, organizationName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contact Person *</Label>
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event Type *</Label>
                <Select value={form.eventType} onValueChange={(v) => setForm({ ...form, eventType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hackathon">Hackathon</SelectItem>
                    <SelectItem value="coding_competition">Coding Competition</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="meetup">Community Meetup</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Participants *</Label>
                <Input type="number" value={form.expectedParticipants} onChange={(e) => setForm({ ...form, expectedParticipants: parseInt(e.target.value) || 1 })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your organization and the event you want to host..." rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Preferred Dates *</Label>
              <Textarea value={form.preferredDates} onChange={(e) => setForm({ ...form, preferredDates: e.target.value })} placeholder="e.g., March 2026, or specific dates" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RoadmapSection({ user, toast }: { user: any; toast: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSubscribe, setShowSubscribe] = useState<string[]>([]);

  const loadItems = useCallback(async () => {
    try {
      const params = new URLSearchParams({ status: filter === 'all' ? '' : filter });
      const res = await fetch(`/api/hub/roadmap?${params}`, {
        headers: user ? { Authorization: `Bearer ${await user.getIdToken()}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleVote = async (id: string) => {
    if (!user) { toast({ title: 'Sign In Required', description: 'Sign in to vote', variant: 'destructive' }); return; }
    try {
      await fetch('/api/hub/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ id, action: 'vote' }),
      });
      loadItems();
    } catch {}
  };

  const handleSubscribe = async (id: string) => {
    if (!user) { toast({ title: 'Sign In Required', description: 'Sign in to subscribe', variant: 'destructive' }); return; }
    try {
      await fetch('/api/hub/roadmap', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ id, action: 'subscribe' }),
      });
      loadItems();
    } catch {}
  };

  const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
    planned: { label: 'Planned', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
    building: { label: 'Building', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: Zap },
    testing: { label: 'Testing', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: Bug },
    released: { label: 'Released', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', icon: Check },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Map className="w-5 h-5 text-rose-400" />
          Community Roadmap
        </h2>
        <p className="text-sm text-muted-foreground">See what we are building and what is coming next</p>
      </div>

      <div className="flex gap-2">
        {['all', 'planned', 'building', 'testing', 'released'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
              filter === f ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground')}
          >{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-16">
            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
              <Map className="w-10 h-10 text-muted-foreground/60" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">Roadmap is being prepared</p>
              <p className="text-sm text-muted-foreground/60 mt-1">We are working on exciting things. Stay tuned!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50" />
          <div className="space-y-4">
            {items.map((item: any) => {
              const cfg = statusConfig[item.status] || statusConfig.planned;
              return (
                <Card key={item.id} className="relative ml-14 hover:border-border/80 transition-colors">
                  <div className={cn('absolute -left-8 top-4 w-4 h-4 rounded-full border-2 border-background', cfg.color.split(' ')[0])} />
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('px-2 py-0.5 rounded text-xs font-medium border flex items-center gap-1', cfg.color)}>
                            <cfg.icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          {item.category && (
                            <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">{item.category}</span>
                          )}
                        </div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {item.targetRelease && (
                          <p className="text-xs text-muted-foreground">Target: {item.targetRelease}</p>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleVote(item.id)}
                          className={cn(
                            'flex flex-col items-center px-2 py-1 rounded-lg border transition-colors',
                            item.votedBy?.includes(user?.uid) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span className="text-xs font-bold">{item.votes || 0}</span>
                        </button>
                        <button
                          onClick={() => handleSubscribe(item.id)}
                          className={cn(
                            'px-2 py-1 rounded-lg text-xs border transition-colors flex items-center gap-1',
                            item.subscribers?.includes(user?.uid) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground'
                          )}
                        >
                          <BellRing className="w-3 h-3" />
                          {item.subscribers?.includes(user?.uid) ? 'Subscribed' : 'Notify'}
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function HubAdminSection({ user, toast, role }: { user: any; toast: any; role: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const loadAdminData = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'overview') {
        const res = await fetch('/api/hub/admin', { headers });
        if (res.ok) setData(await res.json());
      } else if (activeTab === 'reports') {
        const res = await fetch('/api/hub/bug-reports', { headers });
        if (res.ok) {
          const d = await res.json();
          setReports(d.reports || []);
        }
      } else if (activeTab === 'features') {
        const res = await fetch('/api/hub/features', { headers });
        if (res.ok) {
          const d = await res.json();
          setFeatures(d.features || []);
        }
      } else if (activeTab === 'applications') {
        const res = await fetch('/api/hub/host-applications', { headers });
        if (res.ok) {
          const d = await res.json();
          setApplications(d.applications || []);
        }
      } else if (activeTab === 'events') {
        const res = await fetch('/api/hub/events', { headers });
        if (res.ok) {
          const d = await res.json();
          setEvents(d.events || []);
        }
      }
    } catch {} finally {
      setLoading(false);
    }
  }, [user, activeTab]);

  useEffect(() => { setLoading(true); loadAdminData(); }, [loadAdminData]);

  const handleUpdateBug = async (id: string, status: string) => {
    try {
      await fetch('/api/hub/bug-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user!.getIdToken()}` },
        body: JSON.stringify({ id, status }),
      });
      toast({ title: 'Updated', description: `Report marked as ${status}` });
      loadAdminData();
    } catch {}
  };

  const handleUpdateFeature = async (id: string, status: string) => {
    try {
      await fetch('/api/hub/features', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user!.getIdToken()}` },
        body: JSON.stringify({ id, status }),
      });
      toast({ title: 'Updated', description: `Feature marked as ${status}` });
      loadAdminData();
    } catch {}
  };

  const handleUpdateApplication = async (id: string, status: string) => {
    try {
      await fetch('/api/hub/host-applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user!.getIdToken()}` },
        body: JSON.stringify({ id, status }),
      });
      toast({ title: 'Updated', description: `Application ${status}` });
      loadAdminData();
    } catch {}
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'reports', label: 'Bug Reports' },
    { id: 'features', label: 'Feature Requests' },
    { id: 'applications', label: 'Host Applications' },
    { id: 'events', label: 'Events' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-sky-400" />
          Hub Administration
        </h2>
        <p className="text-sm text-muted-foreground">Manage community hub content</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
              activeTab === t.id ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-card border-border/50 text-muted-foreground hover:text-foreground')}
          >{t.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : activeTab === 'overview' && data ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Object.entries(data.counts || {}).map(([key, val]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold">{val as number}</p>
                <p className="text-xs text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'reports' ? (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No reports found</CardContent></Card>
          ) : reports.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.category} &middot; {r.severity} &middot; {r.status}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.status === 'open' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateBug(r.id, 'assigned')}>Assign</Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateBug(r.id, 'resolved')}>Resolve</Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleUpdateBug(r.id, 'spam')}>Spam</Button>
                    </>
                  )}
                  {r.status === 'assigned' && (
                    <Button size="sm" variant="outline" onClick={() => handleUpdateBug(r.id, 'resolved')}>Resolve</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => handleUpdateBug(r.id, 'closed')}>Close</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'features' ? (
        <div className="space-y-3">
          {features.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No feature requests</CardContent></Card>
          ) : features.map((f: any) => (
            <Card key={f.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{f.title}</p>
                  <p className="text-xs text-muted-foreground">{f.upvotes || 0} votes &middot; {f.status}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {['planned', 'in_progress', 'completed', 'rejected'].map((s) => (
                    <Button key={s} size="sm" variant="outline" className={cn(f.status === s && 'bg-primary/10')} onClick={() => handleUpdateFeature(f.id, s)}>
                      {s === 'in_progress' ? 'Building' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'applications' ? (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No host applications</CardContent></Card>
          ) : applications.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{a.organizationName}</p>
                  <p className="text-xs text-muted-foreground">{a.eventType} &middot; {a.country} &middot; {a.expectedParticipants} participants &middot; {a.status}</p>
                  <p className="text-xs text-muted-foreground mt-1">{a.description?.slice(0, 200)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {a.status === 'pending' && (
                    <>
                      <Button size="sm" variant="outline" className="text-green-500" onClick={() => handleUpdateApplication(a.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="outline" className="text-red-500" onClick={() => handleUpdateApplication(a.id, 'rejected')}>Reject</Button>
                      <Button size="sm" variant="outline" onClick={() => handleUpdateApplication(a.id, 'contacted')}>Contacted</Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : activeTab === 'events' ? (
        <div className="space-y-3">
          {events.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No events yet</CardContent></Card>
          ) : events.map((e: any) => (
            <Card key={e.id}>
              <CardContent className="p-4">
                <p className="font-medium">{e.title}</p>
                <p className="text-xs text-muted-foreground">{e.eventType} &middot; {e.status}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </div>
  );
}
