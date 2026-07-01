'use client';

import React, { useRef, useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, Save, Clock, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CodingLanguage, EditorTheme } from '@/types';
import { useEditorPersistence } from '@/hooks/use-editor-persistence';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveCode as saveToFirebase } from '@/services/practice.service';

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false, loading: () => (
  <div className="flex items-center justify-center h-full bg-[#011627]">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
)});

const LANGUAGE_MAP: Record<CodingLanguage, string> = {
  javascript: 'javascript',
  typescript: 'typescript',
  python: 'python',
  java: 'java',
  cpp: 'cpp',
  go: 'go',
  rust: 'rust',
};

const EDITOR_THEME_MAP: Record<EditorTheme, string> = {
  'vs-dark': 'vs-dark',
  'vs-light': 'vs',
  'hc-black': 'hc-black',
  monokai: 'monokai',
  dracula: 'dracula',
  nord: 'nord',
};

interface CodeEditorProps {
  initialCode?: string;
  language?: CodingLanguage;
  problemId?: string;
  problemTitle?: string;
  userId?: string | null;
  readOnly?: boolean;
  onChange?: (code: string) => void;
  onSave?: (code: string) => void;
  height?: string;
  editorTheme?: EditorTheme;
  fontSize?: number;
}

export function CodeEditor({
  initialCode = '',
  language = 'javascript',
  problemId = 'default',
  problemTitle = 'Untitled',
  userId = null,
  readOnly = false,
  onChange,
  onSave,
  height = '100%',
  editorTheme: themeProp,
  fontSize = 14,
}: CodeEditorProps) {
  const [code, setCode] = useState(initialCode);
  const [currentLang, setCurrentLang] = useState<CodingLanguage>(language);
  const [mounted, setMounted] = useState(false);
  const editorRef = useRef<any>(null);
  const [isModified, setIsModified] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<EditorTheme>(themeProp || 'vs-dark');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved' | null>(null);
  const { isOnline } = useOnlineStatus();
  const { lastSaved, loadCode, autoSave } = useEditorPersistence(userId || null);

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    if (userId && problemId) {
      loadCode(problemId, userId).then((savedCode) => {
        if (savedCode) {
          setCode(savedCode);
          setIsModified(false);
        } else if (initialCode) {
          setCode(initialCode);
        }
      });
    } else {
      setCode(initialCode);
    }
  }, [problemId, userId]);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('monokai', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '75715e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'f92672' },
        { token: 'string', foreground: 'e6db74' },
        { token: 'number', foreground: 'ae81ff' },
        { token: 'type', foreground: '66d9ef' },
        { token: 'function', foreground: 'a6e22e' },
      ],
      colors: { 'editor.background': '#272822', 'editor.foreground': '#f8f8f2' },
    });

    monaco.editor.defineTheme('dracula', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4' },
        { token: 'keyword', foreground: 'ff79c6' },
        { token: 'string', foreground: 'f1fa8c' },
        { token: 'number', foreground: 'bd93f9' },
        { token: 'type', foreground: '8be9fd' },
      ],
      colors: { 'editor.background': '#282a36', 'editor.foreground': '#f8f8f2' },
    });

    monaco.editor.defineTheme('nord', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '616e88' },
        { token: 'keyword', foreground: '81a1c1' },
        { token: 'string', foreground: 'a3be8c' },
        { token: 'number', foreground: 'b48ead' },
        { token: 'type', foreground: '88c0d0' },
      ],
      colors: { 'editor.background': '#2e3440', 'editor.foreground': '#d8dee9' },
    });

    editor.addAction({
      id: 'save-action',
      label: 'Save Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS],
      run: () => {
        const currentCode = editor.getValue();
        handleManualSave(currentCode);
      },
    });

    editor.addAction({
      id: 'format-code',
      label: 'Format Code',
      keybindings: [monaco.KeyMod.Shift | monaco.KeyMod.Alt | monaco.KeyCode.KeyF],
      run: () => editor.getAction('editor.action.formatDocument')?.run(),
    });
  };

  const handleManualSave = async (codeToSave?: string) => {
    const finalCode = codeToSave || code;
    setSaveStatus('saving');
    if (userId && problemId) {
      await saveToFirebase(userId, problemId, currentLang, finalCode);
    }
    autoSave(problemId, problemTitle, currentLang, finalCode, userId || '');
    onSave?.(finalCode);
    setSaveStatus('saved');
    setIsModified(false);
    setTimeout(() => setSaveStatus(null), 2000);
  };

  const handleChange = (value: string | undefined) => {
    const newCode = value || '';
    setCode(newCode);
    setIsModified(true);
    setSaveStatus('unsaved');
    onChange?.(newCode);

    if (userId && problemId && isOnline) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        await saveToFirebase(userId, problemId, currentLang, newCode);
        autoSave(problemId, problemTitle, currentLang, newCode, userId);
        setSaveStatus('saved');
        setIsModified(false);
        setTimeout(() => setSaveStatus(null), 2000);
      }, 3000);
    }
  };

  const handleLanguageChange = (lang: CodingLanguage) => {
    setCurrentLang(lang);
    onChange?.(code);
  };

  const themeToUse = themeProp || currentTheme;
  const monacoTheme = EDITOR_THEME_MAP[themeToUse] || 'vs-dark';

  return (
    <div className="flex flex-col h-full rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-3">
          <Select value={currentLang} onValueChange={(v: CodingLanguage) => handleLanguageChange(v)}>
            <SelectTrigger className="h-7 text-xs w-[130px] bg-background/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANGUAGE_MAP).map(([key, val]) => (
                <SelectItem key={key} value={key}>{val.charAt(0).toUpperCase() + val.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <Badge variant="outline" className="text-[10px] h-5 text-yellow-400 border-yellow-400/30 bg-yellow-400/5">
              Offline
            </Badge>
          )}
          {saveStatus === 'saved' && (
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Saved
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Saving...
            </span>
          )}
          {lastSaved && !isModified && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {isModified && (
            <span className="text-[10px] text-yellow-400 font-bold">Modified</span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => handleManualSave()}
            disabled={readOnly}
          >
            <Save className="w-3 h-3" />
            Save
          </Button>
        </div>
      </div>
      <div className="flex-1" style={{ height }}>
        {mounted ? (
          <MonacoEditor
            language={LANGUAGE_MAP[currentLang]}
            value={code}
            theme={monacoTheme}
            onChange={handleChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize,
              fontFamily: "'Source Code Pro', 'Fira Code', monospace",
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              lineNumbers: 'on',
              renderWhitespace: 'selection',
              tabSize: 2,
              readOnly,
              wordWrap: 'on',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              bracketPairColorization: { enabled: true },
              autoIndent: 'full',
              formatOnPaste: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-[#011627]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>
    </div>
  );
}
