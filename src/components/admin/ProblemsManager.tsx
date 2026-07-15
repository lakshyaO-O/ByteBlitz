'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search, X, Plus, Loader2, RefreshCw, Eye, EyeOff, Archive,
  FileText, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ProblemEditor } from '@/components/admin/ProblemEditor';
import { fetchAdminProblems, fetchProblemWithContent } from '@/services/admin';

interface AdminProblem {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  points: number;
  isPublished?: boolean;
  isPremium?: boolean;
  isArchived?: boolean;
  totalSubmissions?: number;
  totalAccepted?: number;
  topics?: string[];
  estimatedTime?: number;
}

export function ProblemsManager() {
  const [problems, setProblems] = useState<AdminProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [showArchived, setShowArchived] = useState(false);

  // Editor state
  const [editProblemId, setEditProblemId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editorMeta, setEditorMeta] = useState<Record<string, unknown>>({});
  const [editorContent, setEditorContent] = useState<Record<string, unknown> | null>(null);
  const [editorLoading, setEditorLoading] = useState(false);

  const loadProblems = useCallback(async () => {
    setLoading(true);
    const data = await fetchAdminProblems();
    setProblems(data as AdminProblem[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadProblems(); }, [loadProblems]);

  const filtered = useMemo(() => {
    let f = problems;
    if (!showArchived) {
      f = f.filter(p => !p.isArchived);
    }
    if (search) {
      const q = search.toLowerCase();
      f = f.filter(p =>
        p.title?.toLowerCase().includes(q) ||
        p.id?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q) ||
        p.topics?.some(t => t.toLowerCase().includes(q))
      );
    }
    if (difficultyFilter !== 'all') {
      f = f.filter(p => p.difficulty === difficultyFilter);
    }
    return f;
  }, [problems, search, difficultyFilter, showArchived]);

  const openEditor = async (problemId: string) => {
    setEditorLoading(true);
    setEditProblemId(problemId);
    try {
      const result = await fetchProblemWithContent(problemId);
      if (result) {
        setEditorMeta(result.meta || {});
        setEditorContent(result.content || {});
      }
    } catch {}
    setEditorLoading(false);
  };

  const startCreating = () => {
    setIsCreating(true);
    setEditProblemId(null);
    setEditorMeta({});
    setEditorContent(null);
  };

  const handleBack = () => {
    setEditProblemId(null);
    setIsCreating(false);
    setEditorMeta({});
    setEditorContent(null);
  };

  const handleSaved = () => {
    loadProblems();
  };

  if (editProblemId || isCreating) {
    if (editorLoading) {
      return (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <ProblemEditor
        problemId={editProblemId}
        initialMeta={editorMeta}
        initialContent={editorContent}
        onBack={handleBack}
        onSaved={handleSaved}
      />
    );
  }

  const acceptanceRate = (p: AdminProblem) => {
    if (!p.totalSubmissions || p.totalSubmissions === 0) return '—';
    return `${Math.round((p.totalAccepted || 0) / p.totalSubmissions * 100)}%`;
  };

  const archivedCount = problems.filter(p => p.isArchived).length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-headline font-black uppercase tracking-tighter">Problem Management</h2>
          <span className="text-[10px] text-muted-foreground font-mono">Create, edit, manage problems</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search problems..."
            className="pl-8 h-8 text-xs bg-muted/30 border-border"
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
          className="h-8 px-2 text-xs bg-background border border-border rounded-md"
        >
          <option value="all">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className={cn('h-8 text-[10px] gap-1', showArchived && 'text-amber-500')}
        >
          <Archive className="w-3 h-3" />
          Archives ({archivedCount})
        </Button>
        <Button variant="outline" size="sm" onClick={loadProblems} className="h-8 gap-1 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
        <Button variant="default" size="sm" onClick={startCreating} className="h-8 gap-1 text-xs">
          <Plus className="w-3.5 h-3.5" /> New Problem
        </Button>
        <span className="text-[10px] text-muted-foreground font-mono">{filtered.length} problems</span>
      </div>

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
                <th className="text-right px-3 py-2 font-bold uppercase tracking-widest text-[9px] text-muted-foreground" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr
                  key={p.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-muted/40 transition-colors cursor-pointer',
                    (!p.isPublished || p.isArchived) && 'opacity-50',
                  )}
                  onClick={() => openEditor(p.id)}
                >
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      {p.isArchived && (
                        <Archive className="w-3 h-3 text-amber-500 shrink-0" />
                      )}
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
                    <FileText className="w-3.5 h-3.5 text-muted-foreground/60 inline" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-6 text-center">
            <FileText className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No problems found</p>
            <Button variant="outline" size="sm" onClick={startCreating} className="mt-2 text-xs">
              <Plus className="w-3 h-3 mr-1" /> Create your first problem
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
