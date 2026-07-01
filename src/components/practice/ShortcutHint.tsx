'use client';

import { useState } from 'react';
import { Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const shortcuts = [
  { key: 'Ctrl + Enter', action: 'Run Tests' },
  { key: 'Ctrl + Shift + Enter', action: 'Submit Solution' },
  { key: 'Ctrl + S', action: 'Save Code' },
  { key: 'Ctrl + Shift + F', action: 'Format Code' },
  { key: 'Ctrl + /', action: 'Toggle Comment' },
  { key: 'Ctrl + D', action: 'Select Next Occurrence' },
  { key: 'Alt + Up/Down', action: 'Move Line' },
  { key: 'Shift + Alt + F', action: 'Format Document' },
  { key: 'Ctrl + B', action: 'Toggle Sidebar' },
  { key: 'Escape', action: 'Close Panels' },
];

export function ShortcutHint() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setOpen(true)}>
        <Keyboard className="w-3 h-3" /> Shortcuts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Keyboard className="w-4 h-4 text-primary" /> Keyboard Shortcuts
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-1">
            {shortcuts.map((s) => (
              <div key={s.key} className="flex items-center justify-between py-1.5">
                <span className="text-xs text-muted-foreground">{s.action}</span>
                <kbd className="px-2 py-0.5 rounded bg-muted border border-border text-[10px] font-mono font-bold">
                  {s.key}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
