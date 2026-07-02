'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Lightbulb, Bug, Code2, Sparkles, Loader2, GripHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence, PanInfo } from 'framer-motion';

const EDGE_TAB_SIZE = 50;
const AVATAR_SIZE = 40;
const AVATAR_EDGE_MARGIN = 16;
const MINIMIZE_THRESHOLD = 80;
const RESTORE_THRESHOLD = 30;

const QUICK_ACTIONS = [
  { label: 'Hint', icon: Lightbulb, prompt: 'Give me a hint for my current coding problem' },
  { label: 'Debug', icon: Bug, prompt: 'Help me debug my code - what might be wrong?' },
  { label: 'Explain', icon: Code2, prompt: 'Explain this algorithm or concept' },
  { label: 'Review', icon: Sparkles, prompt: 'Review my code and suggest improvements' },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface SavedState {
  x: number;
  y: number;
  minimized: boolean;
  edgeSide: 'left' | 'right';
}

const STORAGE_KEY = 'devrann_codeace_state';

function loadSavedState(): SavedState | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
}

function saveState(state: SavedState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

export function RoboticMascot() {
  const pathname = usePathname();
  const savedState = useRef(loadSavedState());

  const [minimized, setMinimized] = useState(savedState.current?.minimized ?? false);
  const [edgeSide, setEdgeSide] = useState<'left' | 'right'>(savedState.current?.edgeSide ?? 'right');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const defaultX = vw - AVATAR_SIZE - AVATAR_EDGE_MARGIN;
  const defaultY = vh - AVATAR_SIZE - AVATAR_EDGE_MARGIN - 80;

  const x = useMotionValue(savedState.current?.x ?? defaultX);
  const y = useMotionValue(savedState.current?.y ?? defaultY);
  const scale = useMotionValue(1);

  const springConfig = { stiffness: 300, damping: 30, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);
  const springScale = useSpring(scale, { stiffness: 500, damping: 25 });

  const opacity = useTransform(springScale, [0.5, 1], [0, 1]);

  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [reaction, setReaction] = useState('🤖');
  const [isHovering, setIsHovering] = useState(false);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const initialStateRef = useRef({ x: defaultX, y: defaultY });

  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm **CodeAce** — don't feel embarres to ask for help! I can assist with algorithms, debugging, code reviews, and anything coding. What do you need?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const edgeTabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (savedState.current) {
      x.set(savedState.current.x);
      y.set(savedState.current.y);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) inputRef.current.focus();
  }, [isChatOpen]);

  useEffect(() => {
    if (pathname === '/auth' || pathname === '/learning') {
      setMinimized(true);
    }
  }, [pathname]);

  const persist = useCallback((mx: number, my: number, min: boolean, side: 'left' | 'right') => {
    saveState({ x: mx, y: my, minimized: min, edgeSide: side });
  }, []);

  const snapToEdge = useCallback((mx: number, my: number) => {
    const margin = AVATAR_SIZE / 2;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const distLeft = mx + AVATAR_SIZE / 2;
    const distRight = w - (mx + AVATAR_SIZE / 2);
    const side = distLeft < distRight ? 'left' : 'right';
    const edgeX = side === 'left' ? -AVATAR_SIZE + 6 : w - 6;
    const clampedY = Math.max(margin + 60, Math.min(h - AVATAR_SIZE - margin - 60, my));
    setEdgeSide(side);
    setMinimized(true);
    springX.set(edgeX);
    springY.set(clampedY);
    persist(edgeX, clampedY, true, side);
  }, [springX, springY, persist]);

  const restoreFromEdge = useCallback((mx: number, my: number) => {
    const navH = 60;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const restoreX = edgeSide === 'left' ? AVATAR_EDGE_MARGIN : w - AVATAR_SIZE - AVATAR_EDGE_MARGIN;
    const restoreY = Math.max(navH + 10, Math.min(h - AVATAR_SIZE - 10, my));
    setMinimized(false);
    springX.set(restoreX);
    springY.set(restoreY);
    persist(restoreX, restoreY, false, edgeSide);
  }, [edgeSide, springX, springY, persist]);

  const handlePanEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const mx = x.get();
    const my = y.get();
    setIsDragging(false);
    springScale.set(1);

    const w = window.innerWidth;
    const h = window.innerHeight;

    if (minimized) {
      if (info.offset.x > RESTORE_THRESHOLD && edgeSide === 'left') {
        restoreFromEdge(mx, my);
      } else if (info.offset.x < -RESTORE_THRESHOLD && edgeSide === 'right') {
        restoreFromEdge(mx, my);
      } else {
        springX.set(mx);
        springY.set(my);
        persist(mx, my, true, edgeSide);
      }
      return;
    }

    const isOffLeft = mx + AVATAR_SIZE < -MINIMIZE_THRESHOLD;
    const isOffRight = mx > w + MINIMIZE_THRESHOLD;
    const isOffTop = my + AVATAR_SIZE < -MINIMIZE_THRESHOLD;
    const isOffBottom = my > h + MINIMIZE_THRESHOLD;

    if (isOffLeft || isOffRight || isOffTop || isOffBottom) {
      snapToEdge(mx, my);
    } else {
      const navH = 60;
      const clampedX = Math.max(AVATAR_EDGE_MARGIN, Math.min(w - AVATAR_SIZE - AVATAR_EDGE_MARGIN, mx));
      const clampedY = Math.max(navH + 10, Math.min(h - AVATAR_SIZE - 10, my));
      springX.set(clampedX);
      springY.set(clampedY);
      persist(clampedX, clampedY, false, edgeSide);
    }
  }, [x, y, minimized, edgeSide, springX, springY, springScale, snapToEdge, restoreFromEdge, persist]);

  const handleSend = async (content?: string) => {
    const message = (content || input).trim();
    if (!message || isLoading) return;
    if (!content) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages.slice(-10) }),
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'Hmm, I got nothing. Try rephrasing?' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Connection hiccup. Mind trying again?' }]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const el = minimized ? edgeTabRef.current : avatarRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const maxTravel = minimized ? 1.5 : 2.5;
      setEyeOffset({ x: (dx / dist) * maxTravel, y: (dy / dist) * maxTravel });
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, [minimized]);

  useEffect(() => {
    const handleInteraction = () => {
      if (isChatOpen || minimized) return;
      const emojis = ['🤖', '😊', '⚡', '🚀', '✨', '🎯', '🔥', '💡'];
      setReaction(emojis[Math.floor(Math.random() * emojis.length)]);
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      reactionTimeoutRef.current = setTimeout(() => setReaction('🤖'), 1500);
    };
    window.addEventListener('click', handleInteraction);
    return () => window.removeEventListener('click', handleInteraction);
  }, [isChatOpen, minimized]);

  if (pathname === '/auth') return null;

  return (
    <>
      {/* Minimized Edge Tab */}
      <AnimatePresence>
        {minimized && !isChatOpen && (
          <motion.div
            ref={edgeTabRef}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'fixed',
              top: springY,
              left: edgeSide === 'left' ? 0 : undefined,
              right: edgeSide === 'right' ? 0 : undefined,
              zIndex: 9999,
              y: 0,
            }}
            className="touch-none select-none"
          >
            <motion.div
              drag="x"
              dragElastic={0.1}
              dragMomentum={false}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handlePanEnd}
              style={{ x: 0 }}
              whileHover={{ scale: 1.15 }}
              className="relative cursor-ew-resize"
            >
              <div
                className={cn(
                  'relative flex items-center justify-center transition-all duration-300',
                  edgeSide === 'left' ? 'rounded-r-xl' : 'rounded-l-xl',
                )}
                style={{
                  width: 5,
                  height: EDGE_TAB_SIZE,
                  background: 'linear-gradient(180deg, rgba(6,182,212,0.6), rgba(99,102,241,0.6))',
                  boxShadow: '0 0 12px rgba(6,182,212,0.3), 0 0 24px rgba(6,182,212,0.1), inset 0 0 6px rgba(6,182,212,0.15)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/20 to-indigo-400/20 animate-pulse" />
              </div>

              <div
                className={cn(
                  'absolute top-1/2 -translate-y-1/2 flex items-center justify-center',
                  edgeSide === 'left' ? '-right-3' : '-left-3',
                )}
              >
                <div
                  className="w-[14px] h-[14px] rounded-full flex items-center justify-center"
                  style={{
                    background: 'radial-gradient(circle, rgba(6,182,212,0.5), rgba(6,182,212,0.15))',
                    boxShadow: '0 0 8px rgba(6,182,212,0.4)',
                  }}
                >
                  <div className="w-[6px] h-[6px] rounded-full bg-cyan-300 animate-pulse" />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Docked Avatar (hidden when minimized or chat open) */}
      <AnimatePresence>
        {!minimized && !isChatOpen && (
          <motion.div
            ref={avatarRef}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            style={{
              position: 'fixed',
              left: springX,
              top: springY,
              zIndex: 9999,
              scale: springScale,
              opacity,
            }}
            className="touch-none select-none"
            onHoverStart={() => setIsHovering(true)}
            onHoverEnd={() => setIsHovering(false)}
          >
            <motion.div
              drag
              dragElastic={0.05}
              dragMomentum={false}
              onDragStart={() => { setIsDragging(true); springScale.set(1.1); }}
              onDragEnd={handlePanEnd}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { if (!isDragging) setIsChatOpen(true); }}
              className="relative cursor-pointer"
            >
              {/* Glow ring */}
              <motion.div
                animate={{
                  boxShadow: isHovering
                    ? '0 0 24px rgba(6,182,212,0.5), 0 0 48px rgba(6,182,212,0.15)'
                    : '0 0 12px rgba(6,182,212,0.3), 0 0 24px rgba(6,182,212,0.08)',
                }}
                transition={{ duration: 0.3 }}
                className="relative rounded-full flex items-center justify-center"
                style={{
                  width: AVATAR_SIZE,
                  height: AVATAR_SIZE,
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.25), rgba(99,102,241,0.2))',
                  border: '1.5px solid rgba(6,182,212,0.5)',
                }}
              >
                {/* Reactive eyes */}
                <div className="flex items-center gap-[5px]">
                  <svg width="8" height="8" viewBox="0 0 8 8" style={{ transform: `translate(${eyeOffset.x * 0.3}px, ${eyeOffset.y * 0.3}px)` }}>
                    <circle cx="4" cy="4" r="2.5" fill="#22d3ee" />
                  </svg>
                  <svg width="8" height="8" viewBox="0 0 8 8" style={{ transform: `translate(${eyeOffset.x * 0.3}px, ${eyeOffset.y * 0.3}px)` }}>
                    <circle cx="4" cy="4" r="2.5" fill="#22d3ee" />
                  </svg>
                </div>
              </motion.div>

              {/* Reaction emote */}
              <AnimatePresence>
                {reaction !== '🤖' && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.7 }}
                    animate={{ opacity: 1, y: -2, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.7 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="absolute -top-4 -right-2 text-[14px] pointer-events-none"
                  >
                    {reaction}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hover hint */}
              <AnimatePresence>
                {isHovering && (
                  <motion.div
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={cn(
                      'absolute top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none',
                      edgeSide === 'right' ? 'right-full mr-2' : 'left-full ml-2',
                    )}
                    style={{
                      background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(99,102,241,0.1))',
                      border: '1px solid rgba(6,182,212,0.2)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <span className="text-[10px] font-bold text-cyan-300 tracking-wide flex items-center gap-1.5">
                      <GripHorizontal className="w-3 h-3" /> Drag to hide
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20, transition: { duration: 0.15 } }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.8 }}
            className="fixed inset-x-3 bottom-3 z-[9999] w-[calc(100vw-1.5rem)] max-w-[420px] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[420px] max-h-[calc(100dvh-2rem)] sm:h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/25 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(6,182,212,0.08)] flex flex-col overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative flex items-center gap-3 px-5 py-4 border-b border-cyan-500/15 bg-gradient-to-r from-cyan-500/5 to-transparent shrink-0">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400/30 to-indigo-400/30 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.15)]">
                <Sparkles className="w-4 h-4 text-cyan-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-cyan-300 font-headline flex items-center gap-2">
                  CodeAce
                  <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-300 bg-emerald-500/15 px-1.5 py-0.5 rounded-full border border-emerald-400/20 shadow-[0_0_8px_rgba(52,211,153,0.15)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> ONLINE
                  </span>
                </p>
                <p className="text-[10px] text-slate-400">AI Coding Assistant</p>
              </div>
              <button
                onClick={() => setIsChatOpen(false)}
                className="text-slate-500 hover:text-cyan-300 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="relative flex gap-2 px-5 py-3 border-b border-cyan-500/8 bg-slate-900/40 overflow-x-auto shrink-0">
              {QUICK_ACTIONS.map(action => (
                <button key={action.label} onClick={() => handleSend(action.prompt)} disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-cyan-500/15 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/15 hover:border-cyan-400/40 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] transition-all whitespace-nowrap disabled:opacity-40"
                >
                  <action.icon className="w-3 h-3" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-5 py-4 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-cyan-500/20 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-50 rounded-br-sm border border-cyan-500/15 shadow-[0_2px_8px_rgba(6,182,212,0.08)]'
                      : 'bg-gradient-to-br from-slate-800/70 to-slate-800/30 text-slate-200 rounded-bl-sm border border-slate-700/25',
                  )}>
                    {msg.content}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-gradient-to-br from-slate-800/70 to-slate-800/30 border border-slate-700/25 rounded-bl-sm flex items-center gap-2.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                    <span className="text-sm text-slate-400">Thinking...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="relative px-5 py-4 border-t border-cyan-500/10 bg-gradient-to-r from-transparent via-slate-900/60 to-transparent shrink-0">
              <div className="flex gap-2">
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                  placeholder="Ask about coding..."
                  className="flex-1 bg-slate-800/70 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-cyan-100 placeholder:text-slate-500 outline-none focus:border-cyan-500/40 focus:shadow-[0_0_12px_rgba(6,182,212,0.08)] transition-all"
                  disabled={isLoading}
                />
                <button onClick={() => handleSend()} disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-500/10 border border-cyan-400/25 flex items-center justify-center hover:from-cyan-400/30 hover:to-cyan-500/20 hover:shadow-[0_0_12px_rgba(6,182,212,0.15)] transition-all disabled:opacity-30 shrink-0"
                >
                  <Send className="w-4 h-4 text-cyan-300" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
