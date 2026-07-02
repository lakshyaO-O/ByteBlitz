'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText } from 'lucide-react';
import { saveNotes } from '@/services/practice';

interface NotesPanelProps {
  userId: string | null;
  problemId: string;
  initialNotes?: string;
}

export function NotesPanel({ userId, problemId, initialNotes = '' }: NotesPanelProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { setNotes(initialNotes); }, [initialNotes]);

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    await saveNotes(userId, problemId, notes);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Personal Notes</span>
        </div>
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={handleSave} disabled={saving}>
          <Save className="w-3 h-3" />
          {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your notes, thoughts, or approach here..."
        className="min-h-[120px] bg-muted/20 border-border text-xs resize-y"
      />
    </div>
  );
}
