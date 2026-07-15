'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Users, Code2, MessageSquare, ArrowUpRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAuth } from 'firebase/auth';
import Link from 'next/link';

interface SearchResults {
  users: Array<{ id: string; uid: string; username: string; email: string; role: string; banned: boolean }>;
  problems: Array<{ id: string; title: string; difficulty: string; isPublished: boolean }>;
  posts: Array<{ id: string; title: string; username: string; type: string; createdAt: string }>;
}

type SearchTab = 'all' | 'users' | 'problems' | 'posts';

const TABS: { label: string; value: SearchTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Users', value: 'users' },
  { label: 'Problems', value: 'problems' },
  { label: 'Posts', value: 'posts' },
];

export function QuickSearch() {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<SearchTab>('all');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string, t: SearchTab) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;

      const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}&type=${t}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query, tab), 300);
    return () => clearTimeout(timer);
  }, [query, tab, search]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const totalResults = results
    ? results.users.length + results.problems.length + results.posts.length
    : 0;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Quick search users, problems, posts..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className={cn(
            'w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background',
            'text-xs text-foreground placeholder:text-muted-foreground/60',
            'focus:outline-none focus:ring-1 focus:ring-foreground/10 focus:border-foreground/20',
            'transition-colors',
          )}
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground/60 animate-spin" />
        )}
      </div>

      {open && query.length >= 2 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 rounded-lg border border-border bg-background shadow-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border px-2 py-1.5 gap-1">
            {TABS.map(t => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); search(query, t.value); }}
                className={cn(
                  'text-[11px] px-2 py-1 rounded font-medium transition-colors',
                  tab === t.value
                    ? 'bg-foreground/5 text-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto py-1">
            {results && totalResults === 0 && (
              <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                No results found
              </div>
            )}

            {(tab === 'all' || tab === 'users') && results?.users.map(user => (
              <Link
                key={user.id}
                href={`/admin/users`}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-foreground/[0.02] transition-colors"
              >
                <Users className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{user.username || user.email}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                </div>
                <span className="text-[9px] text-muted-foreground/60 uppercase">{user.role}</span>
              </Link>
            ))}

            {(tab === 'all' || tab === 'problems') && results?.problems.map(problem => (
              <Link
                key={problem.id}
                href={`/admin/problems`}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-foreground/[0.02] transition-colors"
              >
                <Code2 className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{problem.title}</p>
                </div>
                <span className={cn(
                  'text-[9px] font-medium px-1 py-0.5 rounded',
                  problem.difficulty === 'Easy' && 'text-emerald-600 dark:text-emerald-500 bg-emerald-500/5',
                  problem.difficulty === 'Medium' && 'text-amber-600 dark:text-amber-500 bg-amber-500/5',
                  problem.difficulty === 'Hard' && 'text-red-600 dark:text-red-500 bg-red-500/5',
                )}>
                  {problem.difficulty}
                </span>
              </Link>
            ))}

            {(tab === 'all' || tab === 'posts') && results?.posts.map(post => (
              <Link
                key={post.id}
                href={`/admin/community`}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-foreground/[0.02] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground truncate">{post.title || 'Untitled'}</p>
                  <p className="text-[10px] text-muted-foreground">by {post.username || 'Unknown'}</p>
                </div>
              </Link>
            ))}
          </div>

          {results && totalResults > 0 && (
            <div className="border-t border-border px-3 py-1.5">
              <p className="text-[9px] text-muted-foreground/60">{totalResults} result{totalResults !== 1 ? 's' : ''}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
