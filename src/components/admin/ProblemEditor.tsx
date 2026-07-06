'use client';

import React, { useState, useCallback } from 'react';
import {
  ArrowLeft, Save, Eye, EyeOff, Archive, Trash2, Clock,
  Plus, X, Upload, RotateCcw, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';

type CodingLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp';
type Difficulty = 'Easy' | 'Medium' | 'Hard';

const LANGUAGES: CodingLanguage[] = ['javascript', 'typescript', 'python', 'java', 'cpp'];
const LANGUAGE_LABELS: Record<CodingLanguage, string> = {
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
};

const ALL_TOPICS = [
  'Arrays', 'Strings', 'Math', 'Loops', 'Functions', 'Recursion',
  'Sorting', 'Searching', 'Hashing', 'Stack', 'Queue', 'Linked List',
  'Trees', 'Graphs', 'Heap', 'Greedy', 'Dynamic Programming',
  'Backtracking', 'Bit Manipulation', 'Binary Search', 'Two Pointers',
  'Sliding Window', 'Prefix Sum', 'Tries', 'Union Find', 'Segment Tree', 'SQL',
];

type EditorTab = 'details' | 'testCases' | 'code' | 'editorial' | 'settings' | 'versions';

interface TestCase {
  input: string;
  expected: string;
  isHidden: boolean;
  description: string;
}

interface Example {
  input: string;
  output: string;
  explanation: string;
}

interface VersionInfo {
  id: string;
  snapshot?: Record<string, unknown>;
  savedAt: string;
  savedBy: string;
  savedByEmail: string;
  restoredFrom?: string;
}

interface ProblemEditorProps {
  problemId: string | null;
  initialMeta: Record<string, unknown>;
  initialContent: Record<string, unknown> | null;
  onBack: () => void;
  onSaved: () => void;
}

export function ProblemEditor({ problemId, initialMeta, initialContent, onBack, onSaved }: ProblemEditorProps) {
  const isNew = !problemId;
  const [activeTab, setActiveTab] = useState<EditorTab>('details');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(false);
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [meta, setMeta] = useState({
    title: (initialMeta.title as string) || '',
    difficulty: (initialMeta.difficulty as Difficulty) || 'Easy',
    category: (initialMeta.category as string) || '',
    points: (initialMeta.points as number) || 100,
    isPublished: (initialMeta.isPublished as boolean) ?? false,
    isPremium: (initialMeta.isPremium as boolean) ?? false,
    isArchived: (initialMeta.isArchived as boolean) ?? false,
    estimatedTime: (initialMeta.estimatedTime as number) || 15,
    topics: (initialMeta.topics as string[]) || [],
    companyTags: (initialMeta.companyTags as string[]) || [],
    prerequisites: (initialMeta.prerequisites as string[]) || [],
    difficultyRating: (initialMeta.difficultyRating as number) || 1,
  });

  const [content, setContent] = useState({
    description: (initialContent?.description as string) || '',
    constraints: (initialContent?.constraints as string[]) || [],
    examples: (initialContent?.examples as Example[]) || [],
    testCases: (initialContent?.testCases as TestCase[]) || [],
    hints: (initialContent?.hints as string[]) || [],
    editorial: (initialContent?.editorial as string) || '',
    solutionCode: (initialContent?.solutionCode as Record<string, string>) || {},
    starterCode: (initialContent?.starterCode as Record<string, string>) || {},
    timeLimitMs: (initialContent?.timeLimitMs as number) ?? 2000,
    memoryLimitKb: (initialContent?.memoryLimitKb as number) ?? 256000,
  });

  const [newTag, setNewTag] = useState('');
  const [newCompanyTag, setNewCompanyTag] = useState('');
  const [newPreReq, setNewPreReq] = useState('');

  const addToList = (list: string[], setList: (v: string[]) => void, value: string) => {
    if (value && !list.includes(value)) {
      setList([...list, value]);
    }
  };

  const loadVersions = useCallback(async () => {
    if (!problemId) return;
    setVersionsLoading(true);
    try {
      const { getProblemVersions } = await import('@/services/admin');
      const result = await getProblemVersions(problemId);
      setVersions(result.versions || []);
    } catch {}
    setVersionsLoading(false);
  }, [problemId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { saveProblemContent, createProblem } = await import('@/services/admin');
      const data = { ...meta, ...content };

      if (isNew) {
        const result = await createProblem(data);
        if (result?.id) {
          onSaved();
        }
      } else {
        await saveProblemContent(problemId, data);
        onSaved();
      }
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    try {
      const { toggleProblemPublish } = await import('@/services/admin');
      if (!problemId) return;
      const result = await toggleProblemPublish(problemId);
      setMeta(prev => ({ ...prev, isPublished: result.isPublished }));
    } catch {}
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const { deleteProblem } = await import('@/services/admin');
      if (!problemId) return;
      await deleteProblem(problemId);
      setConfirmDelete(false);
      onBack();
      onSaved();
    } catch {}
    setDeleteLoading(false);
  };

  const handleArchive = async () => {
    try {
      const { archiveProblem } = await import('@/services/admin');
      if (!problemId) return;
      await archiveProblem(problemId);
      setMeta(prev => ({ ...prev, isArchived: true }));
      setConfirmArchive(false);
    } catch {}
  };

  const addTestCase = () => {
    setContent(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expected: '', isHidden: false, description: '' }],
    }));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: unknown) => {
    setContent(prev => {
      const tcs = [...prev.testCases];
      tcs[index] = { ...tcs[index], [field]: value };
      return { ...prev, testCases: tcs };
    });
  };

  const removeTestCase = (index: number) => {
    setContent(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index),
    }));
  };

  const addExample = () => {
    setContent(prev => ({
      ...prev,
      examples: [...prev.examples, { input: '', output: '', explanation: '' }],
    }));
  };

  const updateExample = (index: number, field: keyof Example, value: string) => {
    setContent(prev => {
      const exs = [...prev.examples];
      exs[index] = { ...exs[index], [field]: value };
      return { ...prev, examples: exs };
    });
  };

  const removeExample = (index: number) => {
    setContent(prev => ({
      ...prev,
      examples: prev.examples.filter((_, i) => i !== index),
    }));
  };

  const updateStarterCode = (lang: CodingLanguage, code: string) => {
    setContent(prev => ({
      ...prev,
      starterCode: { ...prev.starterCode, [lang]: code },
    }));
  };

  const updateSolutionCode = (lang: CodingLanguage, code: string) => {
    setContent(prev => ({
      ...prev,
      solutionCode: { ...prev.solutionCode, [lang]: code },
    }));
  };

  const restoreVersion = async (versionId: string) => {
    try {
      const { restoreProblemVersion } = await import('@/services/admin');
      if (!problemId) return;
      await restoreProblemVersion(problemId, versionId);
      onSaved();
    } catch {}
  };

  const visibleTestCases = content.testCases.filter(tc => !tc.isHidden);
  const hiddenTestCases = content.testCases.filter(tc => tc.isHidden);

  const tabs: { key: EditorTab; label: string }[] = [
    { key: 'details', label: 'Details' },
    { key: 'testCases', label: `Tests (${content.testCases.length})` },
    { key: 'code', label: 'Code' },
    { key: 'editorial', label: 'Editorial' },
    { key: 'settings', label: 'Settings' },
    ...(isNew ? [] : [{ key: 'versions' as EditorTab, label: 'Versions' }]),
  ];

  const activeTabContent = () => {
    switch (activeTab) {
      case 'details': return renderDetails();
      case 'testCases': return renderTestCases();
      case 'code': return renderCode();
      case 'editorial': return renderEditorial();
      case 'settings': return renderSettings();
      case 'versions': return renderVersions();
    }
  };

  const visibleTestCaseList = content.testCases.filter(tc => !tc.isHidden);
  const hiddenTestCaseList = content.testCases.filter(tc => tc.isHidden);

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1.5 hover:bg-muted rounded-md transition-colors">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h2 className="text-sm font-headline font-black uppercase tracking-tighter">
              {isNew ? 'Create Problem' : meta.title || 'Untitled'}
            </h2>
            <p className="text-[10px] text-muted-foreground font-mono">
              {isNew ? 'New problem' : `${problemId} · ${meta.difficulty} · ${meta.points} pts`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {!isNew && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { loadVersions(); setPreview(!preview); }}
                className="h-7 text-[10px] gap-1"
              >
                {preview ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {preview ? 'Edit' : 'Preview'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTogglePublish}
                className="h-7 text-[10px] gap-1"
              >
                {meta.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                {meta.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmArchive(true)}
                className="h-7 text-[10px] gap-1 text-amber-500 hover:text-amber-600"
              >
                <Archive className="w-3 h-3" />
                Archive
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(true)}
                className="h-7 text-[10px] gap-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </>
          )}
          <Button size="sm" onClick={handleSave} disabled={saving} className="h-7 text-[10px] gap-1">
            <Save className="w-3 h-3" />
            {saving ? 'Saving...' : isNew ? 'Create' : 'Save'}
          </Button>
        </div>
      </div>

      {preview ? (
        <div className="border border-border rounded-lg p-4 bg-card/30 max-w-3xl">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold">{meta.title}</h3>
            <div className="flex items-center gap-2 mb-4">
              <span className={cn(
                'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                meta.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' :
                meta.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500',
              )}>
                {meta.difficulty}
              </span>
              <span className="text-[10px] text-muted-foreground">{meta.points} points</span>
              <span className="text-[10px] text-muted-foreground">{meta.category}</span>
            </div>
            <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">{content.description}</div>
            {content.constraints.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold mb-1">Constraints:</h4>
                <ul className="text-[11px] text-muted-foreground space-y-0.5">
                  {content.constraints.map((c, i) => <li key={i}>{c}</li>)}
                </ul>
              </div>
            )}
            {content.examples.length > 0 && (
              <div className="mt-4 space-y-2">
                {content.examples.map((ex, i) => (
                  <div key={i} className="bg-muted/30 border border-border rounded-md p-2">
                    <p className="text-[9px] font-bold text-muted-foreground mb-1">Example {i + 1}:</p>
                    <p className="text-[10px]"><span className="font-medium">Input:</span> {ex.input}</p>
                    <p className="text-[10px]"><span className="font-medium">Output:</span> {ex.output}</p>
                    {ex.explanation && <p className="text-[10px] text-muted-foreground mt-0.5">{ex.explanation}</p>}
                  </div>
                ))}
              </div>
            )}
            {visibleTestCaseList.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-bold mb-1">Test Cases ({visibleTestCaseList.length} visible):</h4>
                <div className="text-[10px] text-muted-foreground">
                  {visibleTestCaseList.map((tc, i) => (
                    <div key={i} className="border-b border-border/30 py-1 last:border-0">
                      <span className="font-medium">{tc.description || `Test ${i + 1}`}</span>
                      <span className="ml-2">{tc.input} → {tc.expected}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="mt-4 text-[10px] text-muted-foreground">
              Judge: {content.timeLimitMs}ms / {(content.memoryLimitKb / 1024).toFixed(0)}MB
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-0.5 border-b border-border mb-4">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-2 text-[11px] font-medium border-b-2 transition-colors -mb-px',
                  activeTab === tab.key
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTabContent()}
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete Problem"
        description={`Are you sure you want to delete "${meta.title}"? This will permanently remove the problem, all its content, and version history.`}
        confirmLabel={deleteLoading ? 'Deleting...' : 'Delete'}
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive Problem"
        description={`Archive "${meta.title}"? It will be hidden from the active list but can be restored later.`}
        confirmLabel="Archive"
        variant="warning"
        onConfirm={handleArchive}
      />
    </div>
  );

  function renderDetails() {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Title</label>
            <Input
              className="h-8 text-xs"
              value={meta.title}
              onChange={e => setMeta(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Problem title"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Difficulty</label>
            <select
              value={meta.difficulty}
              onChange={e => setMeta(prev => ({ ...prev, difficulty: e.target.value as Difficulty }))}
              className="w-full h-8 text-xs bg-background border border-border rounded-md px-2"
            >
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Points</label>
            <Input
              className="h-8 text-xs"
              type="number"
              value={meta.points}
              onChange={e => setMeta(prev => ({ ...prev, points: parseInt(e.target.value) || 0 }))}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Description (Markdown)</label>
          <textarea
            value={content.description}
            onChange={e => setContent(prev => ({ ...prev, description: e.target.value }))}
            className="w-full min-h-[240px] text-xs bg-muted/20 border border-border rounded-md px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder="## Problem Description&#10;&#10;Write the problem description here..."
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Constraints (one per line)</label>
          <textarea
            value={content.constraints.join('\n')}
            onChange={e => setContent(prev => ({ ...prev, constraints: e.target.value.split('\n').filter(Boolean) }))}
            className="w-full h-20 text-xs bg-muted/20 border border-border rounded-md px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder="1 <= n <= 10^5&#10;-10^9 <= arr[i] <= 10^9"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-medium text-muted-foreground">Examples</label>
            <button onClick={addExample} className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
              <Plus className="w-2.5 h-2.5" /> Add Example
            </button>
          </div>
          <div className="space-y-2">
            {content.examples.map((ex, i) => (
              <div key={i} className="flex gap-2 items-start bg-muted/10 border border-border rounded-md p-2">
                <div className="flex-1 space-y-1.5">
                  <Input
                    className="h-7 text-[10px] font-mono"
                    value={ex.input}
                    onChange={e => updateExample(i, 'input', e.target.value)}
                    placeholder="Input"
                  />
                  <Input
                    className="h-7 text-[10px] font-mono"
                    value={ex.output}
                    onChange={e => updateExample(i, 'output', e.target.value)}
                    placeholder="Expected output"
                  />
                  <Input
                    className="h-7 text-[10px]"
                    value={ex.explanation}
                    onChange={e => updateExample(i, 'explanation', e.target.value)}
                    placeholder="Explanation (optional)"
                  />
                </div>
                <button onClick={() => removeExample(i)} className="p-1 hover:bg-destructive/10 rounded mt-1">
                  <X className="w-3 h-3 text-destructive" />
                </button>
              </div>
            ))}
            {content.examples.length === 0 && (
              <p className="text-[10px] text-muted-foreground italic">No examples added</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  function renderTestCases() {
    return (
      <div className="space-y-4 max-w-3xl">
        {/* Visible Test Cases */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-medium text-muted-foreground">
              Visible Test Cases ({visibleTestCases.length})
            </label>
          </div>
          {visibleTestCases.map((tc, i) => (
            <div key={i} className="flex gap-2 items-start bg-muted/10 border border-border rounded-md p-2 mb-1.5">
              <div className="flex-1 space-y-1.5">
                <div className="flex gap-2">
                  <Input
                    className="h-7 text-[10px] font-mono flex-1"
                    value={tc.input}
                    onChange={e => updateTestCase(i, 'input', e.target.value)}
                    placeholder="Input"
                  />
                  <Input
                    className="h-7 text-[10px] font-mono flex-1"
                    value={tc.expected}
                    onChange={e => updateTestCase(i, 'expected', e.target.value)}
                    placeholder="Expected output"
                  />
                </div>
                <div className="flex gap-2">
                  <Input
                    className="h-7 text-[10px] flex-1"
                    value={tc.description}
                    onChange={e => updateTestCase(i, 'description', e.target.value)}
                    placeholder="Description (e.g. Basic case)"
                  />
                  <label className="flex items-center gap-1.5 text-[10px] text-muted-foreground shrink-0">
                    <input
                      type="checkbox"
                      checked={tc.isHidden}
                      onChange={e => {
                        updateTestCase(i, 'isHidden', e.target.checked);
                        setContent(prev => {
                          const tcs = [...prev.testCases];
                          tcs[i] = { ...tcs[i], isHidden: e.target.checked };
                          return { ...prev, testCases: tcs };
                        });
                      }}
                      className="w-3 h-3"
                    />
                    Hidden
                  </label>
                  <button onClick={() => removeTestCase(i)} className="p-1 hover:bg-destructive/10 rounded shrink-0">
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {visibleTestCases.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic mb-2">No visible test cases</p>
          )}
        </div>

        {/* Hidden Test Cases */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] font-medium text-muted-foreground">
              Hidden Test Cases ({hiddenTestCases.length})
            </label>
          </div>
          {hiddenTestCases.map((tc, i) => {
            const origIndex = content.testCases.indexOf(tc);
            return (
              <div key={i} className="flex gap-2 items-start bg-amber-500/5 border border-amber-500/20 rounded-md p-2 mb-1.5">
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <Input
                      className="h-7 text-[10px] font-mono flex-1 bg-background"
                      value={tc.input}
                      onChange={e => updateTestCase(origIndex, 'input', e.target.value)}
                      placeholder="Input"
                    />
                    <Input
                      className="h-7 text-[10px] font-mono flex-1 bg-background"
                      value={tc.expected}
                      onChange={e => updateTestCase(origIndex, 'expected', e.target.value)}
                      placeholder="Expected output"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="h-7 text-[10px] flex-1 bg-background"
                      value={tc.description}
                      onChange={e => updateTestCase(origIndex, 'description', e.target.value)}
                      placeholder="Description (e.g. Edge case)"
                    />
                    <label className="flex items-center gap-1.5 text-[10px] text-amber-400 shrink-0">
                      <input
                        type="checkbox"
                        checked={tc.isHidden}
                        onChange={e => {
                          updateTestCase(origIndex, 'isHidden', e.target.checked);
                          setContent(prev => {
                            const tcs = [...prev.testCases];
                            tcs[origIndex] = { ...tcs[origIndex], isHidden: e.target.checked };
                            return { ...prev, testCases: tcs };
                          });
                        }}
                        className="w-3 h-3"
                      />
                      Hidden
                    </label>
                    <button onClick={() => removeTestCase(origIndex)} className="p-1 hover:bg-destructive/10 rounded shrink-0">
                      <X className="w-3 h-3 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {hiddenTestCases.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic mb-2">No hidden test cases</p>
          )}
        </div>

        <button
          onClick={addTestCase}
          className="flex items-center gap-1 text-[10px] text-primary hover:underline"
        >
          <Plus className="w-3 h-3" /> Add Test Case
        </button>
      </div>
    );
  }

  function renderCode() {
    const [selectedLang, setSelectedLang] = useState<CodingLanguage>('javascript');
    return (
      <div className="space-y-3 max-w-3xl">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-muted-foreground">Language:</span>
          {LANGUAGES.map(lang => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={cn(
                'px-2 py-1 text-[10px] rounded-md transition-colors',
                selectedLang === lang
                  ? 'bg-foreground/10 text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {LANGUAGE_LABELS[lang]}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Starter Code</label>
          <textarea
            value={content.starterCode[selectedLang] || ''}
            onChange={e => updateStarterCode(selectedLang, e.target.value)}
            className="w-full min-h-[200px] text-[11px] bg-muted/20 border border-border rounded-md px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder={`// Starter code for ${LANGUAGE_LABELS[selectedLang]}`}
          />
        </div>

        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Hints (one per line)</label>
          <textarea
            value={content.hints.join('\n')}
            onChange={e => setContent(prev => ({ ...prev, hints: e.target.value.split('\n').filter(Boolean) }))}
            className="w-full h-20 text-xs bg-muted/20 border border-border rounded-md px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder="Hint 1&#10;Hint 2&#10;Hint 3"
          />
        </div>
      </div>
    );
  }

  function renderEditorial() {
    const [selectedLang, setSelectedLang] = useState<CodingLanguage>('javascript');
    return (
      <div className="space-y-4 max-w-3xl">
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Editorial / Solution Explanation (Markdown)</label>
          <textarea
            value={content.editorial}
            onChange={e => setContent(prev => ({ ...prev, editorial: e.target.value }))}
            className="w-full min-h-[240px] text-xs bg-muted/20 border border-border rounded-md px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder="## Solution Approach&#10;&#10;Explain the solution approach here..."
          />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-medium text-muted-foreground">Solution Code:</span>
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                onClick={() => setSelectedLang(lang)}
                className={cn(
                  'px-2 py-1 text-[10px] rounded-md transition-colors',
                  selectedLang === lang
                    ? 'bg-foreground/10 text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
          <textarea
            value={content.solutionCode[selectedLang] || ''}
            onChange={e => updateSolutionCode(selectedLang, e.target.value)}
            className="w-full min-h-[200px] text-[11px] bg-muted/20 border border-border rounded-md px-3 py-2 font-mono resize-y focus:outline-none focus:ring-1 focus:ring-foreground/20"
            placeholder={`// Solution code for ${LANGUAGE_LABELS[selectedLang]}`}
          />
        </div>
      </div>
    );
  }

  function renderSettings() {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Time Limit (ms)</label>
            <Input
              className="h-8 text-xs font-mono"
              type="number"
              value={content.timeLimitMs}
              onChange={e => setContent(prev => ({ ...prev, timeLimitMs: parseInt(e.target.value) || 2000 }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Memory Limit (KB)</label>
            <Input
              className="h-8 text-xs font-mono"
              type="number"
              value={content.memoryLimitKb}
              onChange={e => setContent(prev => ({ ...prev, memoryLimitKb: parseInt(e.target.value) || 256000 }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Category</label>
            <Input
              className="h-8 text-xs"
              value={meta.category}
              onChange={e => setMeta(prev => ({ ...prev, category: e.target.value }))}
              placeholder="e.g. Arrays"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Estimated Time (min)</label>
            <Input
              className="h-8 text-xs"
              type="number"
              value={meta.estimatedTime}
              onChange={e => setMeta(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 15 }))}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-[10px]">
            <input
              type="checkbox"
              checked={meta.isPremium}
              onChange={e => setMeta(prev => ({ ...prev, isPremium: e.target.checked }))}
              className="w-3 h-3"
            />
            Premium (Pro only)
          </label>
          <label className="flex items-center gap-2 text-[10px]">
            <input
              type="checkbox"
              checked={meta.isPublished}
              onChange={e => setMeta(prev => ({ ...prev, isPublished: e.target.checked }))}
              className="w-3 h-3"
            />
            Published
          </label>
        </div>

        {/* Topics */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1.5 block">Topics / Tags</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {meta.topics.map(topic => (
              <Badge
                key={topic}
                variant="outline"
                className="text-[9px] cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                onClick={() => setMeta(prev => ({ ...prev, topics: prev.topics.filter(t => t !== topic) }))}
              >
                {topic} <X className="w-2 h-2 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {ALL_TOPICS.filter(t => !meta.topics.includes(t)).map(topic => (
              <button
                key={topic}
                onClick={() => setMeta(prev => ({ ...prev, topics: [...prev.topics, topic] }))}
                className={cn(
                  'px-2 py-0.5 text-[9px] border border-border/50 rounded-md hover:bg-foreground/5 transition-colors',
                  meta.topics.includes(topic) ? 'bg-foreground/10 border-foreground/20' : 'text-muted-foreground',
                )}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Company Tags */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Company Tags</label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {meta.companyTags.map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[9px] cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setMeta(prev => ({ ...prev, companyTags: prev.companyTags.filter(t => t !== tag) }))}
              >
                {tag} <X className="w-2 h-2 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input
              className="h-7 text-[10px] flex-1"
              value={newCompanyTag}
              onChange={e => setNewCompanyTag(e.target.value)}
              placeholder="Add company tag"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  addToList(meta.companyTags, v => setMeta(prev => ({ ...prev, companyTags: v })), newCompanyTag);
                  setNewCompanyTag('');
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={() => {
                addToList(meta.companyTags, v => setMeta(prev => ({ ...prev, companyTags: v })), newCompanyTag);
                setNewCompanyTag('');
              }}
            >
              Add
            </Button>
          </div>
        </div>

        {/* Prerequisites */}
        <div>
          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Prerequisites</label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {meta.prerequisites.map(pre => (
              <Badge
                key={pre}
                variant="outline"
                className="text-[9px] cursor-pointer hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setMeta(prev => ({ ...prev, prerequisites: prev.prerequisites.filter(t => t !== pre) }))}
              >
                {pre} <X className="w-2 h-2 ml-1" />
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input
              className="h-7 text-[10px] flex-1"
              value={newPreReq}
              onChange={e => setNewPreReq(e.target.value)}
              placeholder="Add prerequisite problem ID"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  addToList(meta.prerequisites, v => setMeta(prev => ({ ...prev, prerequisites: v })), newPreReq);
                  setNewPreReq('');
                }
              }}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[10px]"
              onClick={() => {
                addToList(meta.prerequisites, v => setMeta(prev => ({ ...prev, prerequisites: v })), newPreReq);
                setNewPreReq('');
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderVersions() {
    return (
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-3">
          <label className="text-[10px] font-medium text-muted-foreground">Version History</label>
          <button
            onClick={loadVersions}
            className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
          >
            <RotateCcw className="w-2.5 h-2.5" /> Refresh
          </button>
        </div>
        {versionsLoading ? (
          <p className="text-[10px] text-muted-foreground italic">Loading versions...</p>
        ) : versions.length === 0 ? (
          <p className="text-[10px] text-muted-foreground italic">No version history yet. Save the problem to create a version.</p>
        ) : (
          <div className="space-y-1">
            {versions.map((v, i) => (
              <div key={v.id} className="flex items-center justify-between bg-muted/10 border border-border rounded-md px-3 py-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {v.savedAt ? new Date(v.savedAt).toLocaleString() : v.id}
                  </span>
                  <span className="text-[9px] text-muted-foreground/60">by {v.savedByEmail || v.savedBy}</span>
                  {v.restoredFrom && (
                    <Badge variant="outline" className="text-[8px] text-amber-500 border-amber-500/30">Restored</Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {i > 0 && (
                    <button
                      onClick={() => restoreVersion(v.id)}
                      className="text-[9px] text-primary hover:underline"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
}
