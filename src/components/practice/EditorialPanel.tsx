'use client';

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Code2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CodingLanguage } from '@/types';

interface EditorialPanelProps {
  editorial: string;
  solutionCode: Record<CodingLanguage, string>;
}

export function EditorialPanel({ editorial, solutionCode }: EditorialPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [solutionLang, setSolutionLang] = useState<CodingLanguage>('javascript');

  if (!editorial && Object.keys(solutionCode).length === 0) return null;

  return (
    <div className="space-y-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Editorial</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="space-y-4">
          {editorial && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {editorial}
            </div>
          )}

          {Object.keys(solutionCode).length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Code2 className="w-3.5 h-3.5" />
                <span className="font-bold uppercase tracking-widest">Solution</span>
                <select
                  value={solutionLang}
                  onChange={(e) => setSolutionLang(e.target.value as CodingLanguage)}
                  className="bg-muted border border-border rounded px-2 py-0.5 text-[10px]"
                >
                  {Object.keys(solutionCode).map(lang => (
                    <option key={lang} value={lang}>{lang}</option>
                  ))}
                </select>
              </div>
              <pre className="p-3 rounded-lg bg-muted/30 border border-border text-xs font-mono overflow-x-auto whitespace-pre">
                {solutionCode[solutionLang] || '// No solution available'}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
