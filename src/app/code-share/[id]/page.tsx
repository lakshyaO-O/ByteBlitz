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
  Heart, GitFork, Copy, Check, ArrowLeft, Eye,
  Globe, Loader2, Share2, FileCode, ArrowUpRight, Flag,
} from 'lucide-react';
import { ReportButton } from '@/components/admin/ReportButton';
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const langMap: Record<string, string> = {
  python: 'python', typescript: 'typescript', javascript: 'javascript',
  go: 'go', rust: 'rust', java: 'java', css: 'css', html: 'html',
};

export default function CodeShareDetailPage() {
  const params = useParams();
  const [copied, setCopied] = React.useState(false);

  const snippet: any = null;
  const loading = false;

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </Shell>
    );
  }

  if (!snippet) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <FileCode className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="font-medium text-muted-foreground">Snippet not found</p>
          <p className="text-sm text-muted-foreground mt-1">This snippet may have been removed or doesn&apos;t exist.</p>
          <Button variant="outline" asChild className="mt-4 gap-1.5">
            <Link href="/code-share"><ArrowLeft className="w-4 h-4" /> Back to Code Share</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 text-muted-foreground -ml-2">
          <Link href="/code-share"><ArrowLeft className="w-4 h-4" /> Back</Link>
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[11px] font-mono">{snippet.language}</Badge>
                {snippet.isPublic && <Globe className="w-3 h-3 text-muted-foreground" />}
              </div>
              <h1 className="text-xl font-headline font-bold">{snippet.title}</h1>
              <p className="text-sm text-muted-foreground mt-1">{snippet.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {snippet.tags?.map((tag: string) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>

            <Card className="overflow-hidden border-border">
              <div className="bg-muted/30 px-3 py-1.5 flex items-center justify-between border-b border-border">
                <span className="text-xs font-mono text-muted-foreground">{snippet.language}</span>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7" onClick={() => {
                  navigator.clipboard.writeText(snippet.code);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}>
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <MonacoEditor
                height="400px"
                language={langMap[snippet.language] || 'plaintext'}
                value={snippet.code}
                theme="vs-dark"
                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false }}
              />
            </Card>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-1.5"><Heart className="w-3.5 h-3.5" /> {snippet.likes}</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><GitFork className="w-3.5 h-3.5" /> Fork</Button>
              <Button variant="outline" size="sm" className="gap-1.5"><Share2 className="w-3.5 h-3.5" /> Share</Button>
              <ReportButton targetType="code" targetId={snippet.id} targetLabel={snippet.title} variant="text" className="ml-1" />
              <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto">
                <Eye className="w-3 h-3" /> {snippet.views} views
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={snippet.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">{snippet.username?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{snippet.username}</p>
                    {snippet.userTitle && (
                      <p className="text-xs text-muted-foreground">{snippet.userTitle}</p>
                    )}
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {snippet.createdAt && (
                    <div className="flex items-center gap-2"><Eye className="w-3 h-3" /> {snippet.createdAt}</div>
                  )}
                  <div className="flex items-center gap-2"><Eye className="w-3 h-3" /> {snippet.views} views</div>
                  <div className="flex items-center gap-2"><Heart className="w-3 h-3" /> {snippet.likes} likes</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Shell>
  );
}
