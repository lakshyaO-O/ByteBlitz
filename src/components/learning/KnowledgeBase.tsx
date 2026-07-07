'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Bookmark, FileText, Highlighter, MessageSquare, Plus, Trash2, Save, BookmarkCheck, Edit3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import type { KnowledgeEntry } from '@/types/learning';

interface Props {
  entries: KnowledgeEntry[];
  onAddEntry: (entry: Omit<KnowledgeEntry, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onDeleteEntry: (id: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export function KnowledgeBase({ entries, onAddEntry, onDeleteEntry, isBookmarked, onToggleBookmark }: Props) {
  const [showAddNote, setShowAddNote] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteTags, setNoteTags] = useState('');

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;
    onAddEntry({
      type: 'note',
      title: noteTitle.trim(),
      content: noteContent.trim(),
      tags: noteTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setNoteTitle('');
    setNoteContent('');
    setNoteTags('');
    setShowAddNote(false);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-semibold text-foreground">Knowledge Base</h4>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onToggleBookmark}>
            {isBookmarked
              ? <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
              : <Bookmark className="w-3.5 h-3.5 text-muted-foreground" />
            }
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowAddNote(!showAddNote)}>
            <Plus className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showAddNote && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-2 p-2 rounded-lg bg-muted/10 border border-border/30">
              <input
                value={noteTitle}
                onChange={e => setNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full px-2 py-1 text-[11px] bg-transparent border border-border/30 rounded-md focus:outline-none focus:border-primary/50"
              />
              <Textarea
                value={noteContent}
                onChange={e => setNoteContent(e.target.value)}
                placeholder="Write your note..."
                className="min-h-[60px] text-[11px]"
              />
              <input
                value={noteTags}
                onChange={e => setNoteTags(e.target.value)}
                placeholder="Tags (comma separated)"
                className="w-full px-2 py-1 text-[10px] bg-transparent border border-border/30 rounded-md focus:outline-none focus:border-primary/50"
              />
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setShowAddNote(false)}>Cancel</Button>
                <Button variant="default" size="sm" className="h-7 text-[10px] gap-1" onClick={handleSaveNote}>
                  <Save className="w-3 h-3" />
                  Save
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-1">
        {entries.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/60 text-center py-4">
            Add notes, save AI explanations, and bookmark problems to build your personal knowledge base.
          </p>
        ) : (
          entries.map(entry => (
            <div key={entry.id} className="group p-2.5 rounded-lg border border-border/20 hover:bg-muted/10 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {entry.type === 'note' && <Edit3 className="w-3 h-3 text-blue-400" />}
                    {entry.type === 'bookmark' && <BookmarkCheck className="w-3 h-3 text-amber-400" />}
                    {entry.type === 'highlight' && <Highlighter className="w-3 h-3 text-yellow-400" />}
                    {entry.type === 'saved-explanation' && <MessageSquare className="w-3 h-3 text-violet-400" />}
                    <span className="text-[11px] font-medium text-foreground truncate">{entry.title}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{entry.content}</p>
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-[7px] px-1 py-0">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={() => onDeleteEntry(entry.id)}>
                  <Trash2 className="w-3 h-3 text-muted-foreground hover:text-red-400" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
