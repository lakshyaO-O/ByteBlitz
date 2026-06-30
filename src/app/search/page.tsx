'use client';

import React, { useState, useCallback } from 'react';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, User, Code2, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const MOCK_USERS = [
  { id: 'u1', username: 'SyntaxSamurai', rating: 2150, tier: 'Master' },
  { id: 'u2', username: 'BinaryBoss', rating: 1890, tier: 'Expert' },
  { id: 'u3', username: 'RecursionQueen', rating: 1650, tier: 'Advanced' },
  { id: 'u4', username: 'NullPointer', rating: 1420, tier: 'Intermediate' },
  { id: 'u5', username: 'CodeWizard', rating: 2300, tier: 'Master' },
  { id: 'u6', username: 'AlgoMaster', rating: 1780, tier: 'Expert' },
  { id: 'u7', username: 'PixelPusher', rating: 1100, tier: 'Learner' },
  { id: 'u8', username: 'ByteBaron', rating: 1950, tier: 'Expert' },
];

const MOCK_PROBLEMS = [
  { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy' },
  { id: 'reverse-string', title: 'Reverse String', difficulty: 'Easy' },
  { id: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'Medium' },
  { id: 'fizz-buzz', title: 'FizzBuzz', difficulty: 'Easy' },
  { id: 'merge-sorted', title: 'Merge Sorted Arrays', difficulty: 'Medium' },
  { id: 'binary-search', title: 'Binary Search', difficulty: 'Medium' },
  { id: 'linked-list-cycle', title: 'Linked List Cycle', difficulty: 'Hard' },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'all' | 'users' | 'problems'>('all');

  const filteredUsers = query.length > 0
    ? MOCK_USERS.filter(u => u.username.toLowerCase().includes(query.toLowerCase()))
    : [];

  const filteredProblems = query.length > 0
    ? MOCK_PROBLEMS.filter(p => p.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  const hasResults = filteredUsers.length > 0 || filteredProblems.length > 0;

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-4xl font-headline font-black uppercase tracking-tighter text-foreground">
            SEARCH
          </h1>
          <p className="text-muted-foreground">Find players and problems across the arena.</p>
        </div>

        <Card className="bg-card/50 border-border">
          <CardContent className="p-6 space-y-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search by username or problem name..."
                className="pl-12 h-14 text-lg bg-muted/50 border-border"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {(['all', 'users', 'problems'] as const).map((type) => (
                <Button
                  key={type}
                  variant={searchType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSearchType(type)}
                  className="text-xs font-bold uppercase tracking-widest"
                >
                  {type === 'all' ? 'All' : type}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {query.length > 0 && (
          <div className="space-y-6">
            {!hasResults && (
              <div className="text-center py-20 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p className="font-bold uppercase tracking-widest text-sm">No results found</p>
                <p className="text-xs mt-2">Try a different search term.</p>
              </div>
            )}

            {searchType !== 'problems' && filteredUsers.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Players ({filteredUsers.length})
                </h2>
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <Link key={user.id} href={`/profile`}>
                      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-4">
                          <Avatar className="h-10 w-10 border border-muted">
                            <AvatarFallback className="bg-muted text-xs">{user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-bold">{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.rating} ELO • {user.tier}</p>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <span>View Profile</span>
                          </Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {searchType !== 'users' && filteredProblems.length > 0 && (
              <div>
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">
                  Problems ({filteredProblems.length})
                </h2>
                <div className="space-y-2">
                  {filteredProblems.map((problem) => (
                    <Link key={problem.id} href={`/arena`}>
                      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all cursor-pointer">
                        <CardContent className="p-4 flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                            <Code2 className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold">{problem.title}</p>
                            <span className={cn(
                              'text-[10px] font-bold uppercase tracking-widest',
                              problem.difficulty === 'Easy' ? 'text-emerald-400' :
                              problem.difficulty === 'Medium' ? 'text-yellow-400' : 'text-destructive'
                            )}>
                              {problem.difficulty}
                            </span>
                          </div>
                          <Button variant="ghost" size="sm">Solve</Button>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {query.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Search className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="text-sm font-bold uppercase tracking-widest">Start typing to search</p>
            <p className="text-xs mt-2">Search for players by username or problems by name.</p>
          </div>
        )}
      </div>
    </Shell>
  );
}
