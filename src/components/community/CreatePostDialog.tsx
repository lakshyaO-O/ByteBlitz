'use client';

import { useState, useCallback } from 'react';
import {
  FileText, Loader2, Image, Code, Hash, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { PostType } from '@/types';

const POST_TYPE_OPTIONS: { value: PostType; label: string; description: string }[] = [
  { value: 'discussion', label: 'Discussion', description: 'Start a conversation' },
  { value: 'code_share', label: 'Code Share', description: 'Share code snippets' },
  { value: 'project_showcase', label: 'Project Showcase', description: 'Show your work' },
  { value: 'tip', label: 'Tip', description: 'Share a helpful tip' },
];

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'cpp', 'c', 'go', 'rust',
  'swift', 'kotlin', 'ruby', 'php', 'html', 'css', 'sql', 'bash',
];

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    type: PostType;
    title: string;
    content: string;
    code?: string;
    codeLanguage?: string;
    tags: string[];
  }) => Promise<void>;
  submitting?: boolean;
}

export function CreatePostDialog({ open, onOpenChange, onSubmit, submitting }: CreatePostDialogProps) {
  const [type, setType] = useState<PostType>('discussion');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [tagsInput, setTagsInput] = useState('');
  const [titleCharCount, setTitleCharCount] = useState(0);

  const resetForm = useCallback(() => {
    setType('discussion');
    setTitle('');
    setContent('');
    setCode('');
    setLanguage('javascript');
    setTagsInput('');
    setTitleCharCount(0);
  }, []);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);
    await onSubmit({
      type,
      title: title.trim(),
      content: content.trim(),
      code: code.trim() || undefined,
      codeLanguage: code.trim() ? language : undefined,
      tags,
    });
    resetForm();
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  const estimatedReadTime = Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200));

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto gap-0 p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base font-headline font-bold">Create Post</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                Share your knowledge with the developer community
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Post Type</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {POST_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs transition-all duration-200',
                    type === opt.value
                      ? 'border-primary/50 bg-primary/5 text-foreground'
                      : 'border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground',
                  )}
                >
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-70">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-title" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Title</span>
              <span className="text-[10px] text-muted-foreground/60">{title.length}/200</span>
            </Label>
            <Input
              id="post-title"
              value={title}
              onChange={e => { setTitle(e.target.value); setTitleCharCount(e.target.value.length); }}
              placeholder="Give your post a descriptive title..."
              maxLength={200}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-content" className="text-xs font-medium text-muted-foreground flex items-center justify-between">
              <span>Content</span>
              <span className="text-[10px] text-muted-foreground/60">~{estimatedReadTime} min read</span>
            </Label>
            <Textarea
              id="post-content"
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your post content... Markdown is supported."
              rows={6}
              className="text-sm resize-y min-h-[120px]"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="post-code" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Code className="w-3 h-3" />
                <span>Code (optional)</span>
              </Label>
              {code && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-[10px] text-muted-foreground"
                  onClick={() => setCode('')}
                >
                  <X className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
            </div>
            <div className={cn('rounded-lg border border-border overflow-hidden transition-all duration-200', code && 'border-primary/30')}>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b border-border/40">
                <Code className="w-3 h-3 text-muted-foreground" />
                <select
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                  className="flex-1 bg-transparent text-xs text-muted-foreground border-none outline-none focus:outline-none cursor-pointer"
                  aria-label="Programming language"
                >
                  {LANGUAGES.map(l => (
                    <option key={l} value={l} className="bg-background">{l}</option>
                  ))}
                </select>
              </div>
              <Textarea
                id="post-code"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Paste your code snippet here..."
                rows={5}
                className="text-sm font-code border-0 rounded-none resize-y min-h-[80px] focus-visible:ring-0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="post-tags" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              <span>Tags (comma separated)</span>
            </Label>
            <Input
              id="post-tags"
              value={tagsInput}
              onChange={e => setTagsInput(e.target.value)}
              placeholder="e.g. react, typescript, tutorial"
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter className="p-6 pt-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)} className="text-xs h-9">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim() || title.length > 200}
            className="text-xs h-9 gap-1.5"
          >
            {submitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            {submitting ? 'Publishing...' : 'Publish Post'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
