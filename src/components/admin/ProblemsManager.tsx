'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, X, Plus, Loader2, RefreshCw, ChevronDown, ChevronUp,
  Trash2, Eye, EyeOff, Edit3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchAdminProblems, createProblem, updateProblem, deleteProblem } from '@/services/admin';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Difficulty } from '@/types';

interface AdminProblem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  points: number;
  isPublished?: boolean;
  isPremium?: boolean;
  totalSubmissions?: number;
  totalAccepted?: number;
  createdAt?: string;
  topics?: string[];
}

export function ProblemsManager() {
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editProblem, setEditProblem] = useState<AdminProblem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newProblem, setNewProblem] = useState<Partial<AdminProblem>>({
    title: '', difficulty: 'Easy', category: '', points: 100, topics: [],
  });

  const loadProblems = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminProblems();
    setProblems(data as AdminProblem[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadProblems(); }, [loadProblems]);

  const filtered = useMemo(() => {
    let f = problems;
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(p => p.title?.toLowerCase().includes(q) || p.id?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q));
    }
    if (difficultyFilter !== 'all') {
      f = f.filter(p => p.difficulty === difficultyFilter);
    }
    return f;
  }, [problems, search, difficultyFilter]);

  const handleTogglePublish = async (p: AdminProblem) => {
    await updateProblem(p.id, { isPublished: !p.isPublished });
    setProblems(prev => prev.map(x => x.id === p.id ? { ...x, isPublished: !x.isPublished } : x));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem? This cannot be undone.')) return;
    await deleteProblem(id);
    setProblems(prev => prev.filter(x => x.id !== id));
  };

  const handleCreate = async () => {
    if (!newProblem.title) return;
    const id = await createProblem(newProblem);
    if (id) {
      await loadProblems();
      setIsCreating(false);
      setNewProblem({ title: '', difficulty: 'Easy', category: '', points: 100, topics: [] });
    }
  };

  const handleSaveEdit = async () => {
    if (!editProblem) return;
    await updateProblem(editProblem.id, editProblem);
    setProblems(prev => prev.map(x => x.id === editProblem.id ? editProblem : x));
    setEditProblem(null);
  };

  const acceptanceRate = (p: AdminProblem) => {
    if (!p.totalSubmissions || p.totalSubmissions === 0) return '—';
    return `${Math.round((p.totalAccepted || 0) / p.totalSubmissions * 100)}%`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            className="pl-8 h-8 text-xs bg-muted/50 border-border"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <select
          value={difficultyFilter}
          onChange={e => setDifficultyFilter(e.target.value)}
          className="h-8 px-2 text-xs bg-muted/50 border border-border rounded font-mono"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <Button variant="outline" size="sm" onClick={loadProblems} className="h-8 gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
        <Button variant="default" size="sm" onClick={() => setIsCreating(true)} className="h-8 gap-1 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Problem
        </Button>
        <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} problems</span>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm font-headline">Create New Problem</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-[10px]">Title</Label>
              <Input className="h-8 text-xs mt-1" value={newProblem.title} onChange={e => setNewProblem({ ...newProblem, title: e.target.value })} placeholder="Problem title" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[10px]">Difficulty</Label>
                <select
                  value={newProblem.difficulty}
                  onChange={e => setNewProblem({ ...newProblem, difficulty: e.target.value as Difficulty })}
                  className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div>
                <Label className="text-[10px]">Points</Label>
                <Input className="h-8 text-xs mt-1" type="number" value={newProblem.points || 100} onChange={e => setNewProblem({ ...newProblem, points: parseInt(e.target.value) || 0 })} />
              </div>
              <div>
                <Label className="text-[10px]">Category</Label>
                <Input className="h-8 text-xs mt-1" value={newProblem.category || ''} onChange={e => setNewProblem({ ...newProblem, category: e.target.value })} placeholder="e.g. Arrays" />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setIsCreating(false)} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleCreate} className="text-xs">Create Problem</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Table */}
      <Card className="bg-card/50 border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Title</th>
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Difficulty</th>
                <th className="text-left px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden md:table-cell">Category</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Points</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden lg:table-cell">Submissions</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground hidden lg:table-cell">Acceptance</th>
                <th className="text-center px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Status</th>
                <th className="text-right px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const isExpanded = expandedId === p.id;
                return (
                  <React.Fragment key={p.id}>
                    <tr
                      className={cn('border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer', !p.isPublished && 'opacity-50')}
                      onClick={() => setExpandedId(isExpanded ? null : p.id)}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {p.isPremium && (
                            <Badge variant="default" className="text-[7px] px-1 py-0 h-3.5 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              PRO
                            </Badge>
                          )}
                          <span className="font-medium truncate max-w-[200px]">{p.title}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn(
                          'text-[10px] font-bold uppercase tracking-wider',
                          p.difficulty === 'Easy' ? 'text-emerald-400' : p.difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive'
                        )}>
                          {p.difficulty}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell">{p.category || '—'}</td>
                      <td className="px-3 py-2.5 text-center font-mono font-bold">{p.points || 0}</td>
                      <td className="px-3 py-2.5 text-center font-mono text-muted-foreground hidden lg:table-cell">{p.totalSubmissions || 0}</td>
                      <td className="px-3 py-2.5 text-center font-mono hidden lg:table-cell">{acceptanceRate(p)}</td>
                      <td className="px-3 py-2.5 text-center">
                        {p.isPublished !== false ? (
                          <Eye className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5 text-muted-foreground mx-auto" />
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 inline text-muted-foreground" />}
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr>
                        <td colSpan={8} className="px-4 py-4 bg-muted/10">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleTogglePublish(p)} className="text-xs h-8 gap-1">
                              {p.isPublished !== false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              {p.isPublished !== false ? 'Unpublish' : 'Publish'}
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditProblem({ ...p })} className="text-xs h-8 gap-1">
                                  <Edit3 className="w-3.5 h-3.5" /> Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-lg">
                                <DialogHeader>
                                  <DialogTitle className="text-sm font-headline">Edit Problem</DialogTitle>
                                </DialogHeader>
                                {editProblem && (
                                  <div className="space-y-3 py-2">
                                    <div>
                                      <Label className="text-[10px]">Title</Label>
                                      <Input className="h-8 text-xs mt-1" value={editProblem.title} onChange={e => setEditProblem({ ...editProblem, title: e.target.value })} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                      <div>
                                        <Label className="text-[10px]">Difficulty</Label>
                                        <select
                                          value={editProblem.difficulty}
                                          onChange={e => setEditProblem({ ...editProblem, difficulty: e.target.value as Difficulty })}
                                          className="w-full mt-1 h-8 px-2 text-xs bg-background border border-border rounded font-mono"
                                        >
                                          <option value="Easy">Easy</option>
                                          <option value="Medium">Medium</option>
                                          <option value="Hard">Hard</option>
                                        </select>
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">Points</Label>
                                        <Input className="h-8 text-xs mt-1" type="number" value={editProblem.points} onChange={e => setEditProblem({ ...editProblem, points: parseInt(e.target.value) || 0 })} />
                                      </div>
                                      <div>
                                        <Label className="text-[10px]">Category</Label>
                                        <Input className="h-8 text-xs mt-1" value={editProblem.category} onChange={e => setEditProblem({ ...editProblem, category: e.target.value })} />
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4 pt-1">
                                      <label className="flex items-center gap-2 text-xs">
                                        <input type="checkbox" checked={editProblem.isPremium || false} onChange={e => setEditProblem({ ...editProblem, isPremium: e.target.checked })} />
                                        Premium (Pro only)
                                      </label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                      <Button variant="outline" size="sm" onClick={() => setEditProblem(null)} className="text-xs">Cancel</Button>
                                      <Button size="sm" onClick={handleSaveEdit} className="text-xs">Save Changes</Button>
                                    </div>
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id)} className="text-xs h-8 gap-1">
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
