'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Shell } from '@/components/layout/Shell';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Heart, GitFork, Copy, Check, ArrowLeft, Eye, Tag, Calendar,
  User, Globe, Loader2, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const mockSnippets: Record<string, any> = {
  '1': {
    id: '1', title: 'Binary Search Implementation', description: 'A clean binary search function with O(log n) time complexity.',
    language: 'python', code: 'def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1',
    username: 'alice_dev', avatar: '', likes: 42, forks: 12, views: 256,
    tags: ['algorithm', 'search'], isPublic: true, createdAt: '2026-06-28',
    userTitle: 'Full Stack Developer',
  },
  '2': {
    id: '2', title: 'React Custom Hook: useDebounce', description: 'Debounce hook for search inputs and API calls.',
    language: 'typescript', code: 'import { useState, useEffect } from "react";\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n  useEffect(() => {\n    const handler = setTimeout(() => setDebouncedValue(value), delay);\n    return () => clearTimeout(handler);\n  }, [value, delay]);\n  return debouncedValue;\n}',
    username: 'bob_codes', avatar: '', likes: 89, forks: 34, views: 1024,
    tags: ['react', 'hooks'], isPublic: true, createdAt: '2026-06-30',
    userTitle: 'Frontend Engineer',
  },
};

const langMap: Record<string, string> = {
  python: 'python', typescript: 'typescript', javascript: 'javascript',
  go: 'go', rust: 'rust', java: 'java', css: 'css', html: 'html',
};

export default function CodeShareDetailPage() {
  const params = useParams();
  const [copied, setCopied] = React.useState(false);

  const snippet = mockSnippets[params.id as string];

  if (!snippet) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
        </div>
      </Shell>
    );
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const related = Object.values(mockSnippets).filter(s => s.id !== snippet.id).slice(0, 3);

  return (
    <Shell>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button variant="ghost" asChild className="gap-2 text-muted-foreground hover:text-foreground -ml-2">
          <Link href="/code-share"><ArrowLeft className="w-4 h-4" /> Back to Code Share</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-mono bg-muted/50">
                  {snippet.language}
                </Badge>
                {snippet.isPublic && <Globe className="w-3 h-3 text-muted-foreground" />}
              </div>
              <h1 className="text-3xl font-headline font-bold">{snippet.title}</h1>
              <p className="text-muted-foreground mt-2">{snippet.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {snippet.tags.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-[9px] uppercase tracking-widest">
                    <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                  </Badge>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border-border">
              <div className="bg-muted/50 px-4 py-2 flex items-center justify-between border-b border-border">
                <span className="text-xs font-mono text-muted-foreground">{snippet.language}</span>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-xs" onClick={handleCopy}>
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
              </div>
              <MonacoEditor
                height="400px"
                language={langMap[snippet.language] || 'plaintext'}
                value={snippet.code}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 14, scrollBeyondLastLine: false }}
              />
            </Card>

            <div className="flex items-center gap-4">
              <Button variant="outline" className="gap-2"><Heart className="w-4 h-4" /> Like ({snippet.likes})</Button>
              <Button variant="outline" className="gap-2"><GitFork className="w-4 h-4" /> Fork ({snippet.forks})</Button>
              <Button variant="outline" className="gap-2"><Share2 className="w-4 h-4" /> Share</Button>
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Eye className="w-3 h-3" /> {snippet.views} views
              </span>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="bg-card/50 border-border">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={snippet.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{snippet.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-sm">{snippet.username}</p>
                    <p className="text-[10px] text-muted-foreground">{snippet.userTitle}</p>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {snippet.createdAt}</span>
                  <span className="flex items-center gap-2"><Eye className="w-3 h-3" /> {snippet.views} views</span>
                  <span className="flex items-center gap-2"><Heart className="w-3 h-3" /> {snippet.likes} likes</span>
                  <span className="flex items-center gap-2"><GitFork className="w-3 h-3" /> {snippet.forks} forks</span>
                </div>
              </CardContent>
            </Card>

            {related.length > 0 && (
              <div>
                <h3 className="text-sm font-headline font-bold uppercase tracking-widest text-muted-foreground mb-3">Related Snippets</h3>
                <div className="space-y-3">
                  {related.map((s: any) => (
                    <Link key={s.id} href={`/code-share/${s.id}`}>
                      <Card className="bg-card/50 border-border hover:border-primary/30 transition-all">
                        <CardContent className="p-3">
                          <p className="font-bold text-sm truncate">{s.title}</p>
                          <Badge variant="outline" className="text-[8px] uppercase tracking-widest mt-1 font-mono">{s.language}</Badge>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
}
