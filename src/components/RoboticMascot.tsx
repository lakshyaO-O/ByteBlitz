'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { X, Send, Lightbulb, Bug, Code2, Sparkles, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Position {
  x: number;
  y: number;
}

const REACTIONS = ['🤖', '😊', '🎮', '⚡', '🏆', '💪', '🚀', '✨', '🎯', '👍', '🔥', '💯', '🤔', '😎', '🎉'];

const SLOGANS = ["Let's Fight!", "Hack it!", "Compile!", "AC incoming!", "Optimizing...", "Run it!", "Clean Code!"];

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

export function RoboticMascot() {
  const pathname = usePathname();
  const [eyeOffset, setEyeOffset] = useState<Position>({ x: 0, y: 0 });
  const [reaction, setReaction] = useState('🤖');
  const [isHovering, setIsHovering] = useState(false);
  const [slogan, setSlogan] = useState("Let's Fight!");
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('devrann_codeace_pos');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return { x: 0, y: 0 };
  });
  const dragRef = useRef<{ startX: number; startY: number; offsetX: number; offsetY: number; dragging: boolean }>({
    startX: 0, startY: 0, offsetX: 0, offsetY: 0, dragging: false,
  });

  const mascotRef = useRef<HTMLDivElement>(null);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Teaser messages that cycle to attract attention
  const teasers = [
    { icon: '🤖', text: "Ask me anything!" },
    { icon: '💡', text: "Need a hint?" },
    { icon: '🐛', text: "Stuck on a bug?" },
    { icon: '⚡', text: "I'm CodeAce!" },
    { icon: '🚀', text: "Try me!" },
  ];
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [showTeaser, setShowTeaser] = useState(true);

  useEffect(() => {
    const cycleTimer = setInterval(() => {
      setShowTeaser(false);
      setTimeout(() => {
        setTeaserIndex(i => (i + 1) % teasers.length);
        setShowTeaser(true);
      }, 400);
    }, 4000);
    return () => clearInterval(cycleTimer);
  }, [teasers.length]);

  useEffect(() => {
    if (isChatOpen) setShowTeaser(false);
  }, [isChatOpen]);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hello! I'm **CodeAce** — don't feel embarres to ask for help! I can assist with algorithms, debugging, code reviews, and anything coding. What do you need?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isChatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isChatOpen]);

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const mascot = mascotRef.current;
      if (!mascot) return;
      const rect = mascot.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy) || 1;
      const maxEyeTravel = 2.8;
      setEyeOffset({ x: (dx / distance) * maxEyeTravel, y: (dy / distance) * maxEyeTravel });
    };
    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      if (isChatOpen) return;
      const randomReaction = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      setReaction(randomReaction);
      const randomSlogan = SLOGANS[Math.floor(Math.random() * SLOGANS.length)];
      setSlogan(randomSlogan);
      if (reactionTimeoutRef.current) clearTimeout(reactionTimeoutRef.current);
      reactionTimeoutRef.current = setTimeout(() => setReaction('🤖'), 1500);
    };
    const handlePointerDown = () => setIsHovering(true);
    const handlePointerUp = () => setIsHovering(false);
    window.addEventListener('click', handleInteraction);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isChatOpen]);

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

  const getExpression = (react: string): 'idle' | 'happy' | 'excited' | 'cool' | 'thinking' => {
    switch (react) {
      case '🤖': return 'idle';
      case '😊': case '👍': case '🎉': case '🏆': case '💪': case '💯': return 'happy';
      case '⚡': case '🚀': case '✨': case '🔥': case '🎮': case '🎯': return 'excited';
      case '😎': return 'cool';
      case '🤔': return 'thinking';
      default: return 'happy';
    }
  };

  const expr = getExpression(reaction);
  const eyeStyle = { transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`, transition: 'transform 90ms ease-out' };

  const renderEye = (eyeName: 'left' | 'right') => {
    if (expr === 'happy') return (
      <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
        <path d="M1.5 7 C 3 4, 7 4, 8.5 7" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" />
      </svg>
    );
    if (expr === 'cool') return (
      <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
        <path d="M1 5 H9" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
    if (expr === 'thinking') {
      if (eyeName === 'left') return (
        <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
          <circle cx="5" cy="5" r="3.5" fill="#22d3ee" />
        </svg>
      );
      return (
        <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee] scale-90" style={{ ...eyeStyle, transform: `translate(${eyeOffset.x}px, ${eyeOffset.y - 2}px)` }}>
          <circle cx="5" cy="5" r="3.5" fill="#22d3ee" />
        </svg>
      );
    }
    if (expr === 'excited') return (
      <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_4px_#22d3ee] animate-pulse" style={eyeStyle}>
        <ellipse cx="5" cy="5" rx="3.5" ry="4.5" fill="#22d3ee" />
      </svg>
    );
    return (
      <svg width="12" height="12" viewBox="0 0 10 10" className="eye-blink drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
        <circle cx="5" cy="5" r="3.5" fill="#22d3ee" />
      </svg>
    );
  };

  const renderMouth = () => {
    if (expr === 'happy') return (
      <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee]">
        <path d="M1.5 1 C 3 3.5, 7 3.5, 8.5 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
    if (expr === 'excited') return (
      <svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-[0_0_2px_#22d3ee]">
        <circle cx="5" cy="5" r="2" fill="#22d3ee" />
      </svg>
    );
    if (expr === 'thinking') return (
      <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee] rotate-[4deg]">
        <path d="M2.5 2.5 H7.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
    if (expr === 'cool') return (
      <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee]">
        <path d="M2 1.5 C 3 3, 6 2, 8 1.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </svg>
    );
    return (
      <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee]">
        <path d="M2.5 2.5 H7.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  if (pathname === '/auth') return null;

  return (
    <>

      <div
        ref={mascotRef}
        onClick={(e) => { if (dragRef.current.dragging) { e.preventDefault(); return; } setIsChatOpen(true); }}
        onPointerDown={(e) => {
          const el = mascotRef.current;
          if (!el) return;
          dragRef.current.startX = e.clientX;
          dragRef.current.startY = e.clientY;
          dragRef.current.offsetX = position.x;
          dragRef.current.offsetY = position.y;
          dragRef.current.dragging = false;
          el.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const el = mascotRef.current;
          if (!el || !el.hasPointerCapture(e.pointerId)) return;
          const dx = e.clientX - dragRef.current.startX;
          const dy = e.clientY - dragRef.current.startY;
          if (Math.abs(dx) > 5 || Math.abs(dy) > 5) dragRef.current.dragging = true;
          const newX = dragRef.current.offsetX + dx;
          const newY = dragRef.current.offsetY + dy;
          setPosition({ x: newX, y: newY });
        }}
        onPointerUp={(e) => {
          const el = mascotRef.current;
          if (!el) return;
          el.releasePointerCapture(e.pointerId);
          if (dragRef.current.dragging) {
            try { localStorage.setItem('devrann_codeace_pos', JSON.stringify(position)); } catch {}
          }
        }}
        className="fixed bottom-4 right-4 z-[9999] cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${isHovering ? 1.08 : 1})`, transition: dragRef.current.dragging ? 'none' : 'transform 0.15s ease-out' }}
      >
        {/* Animated teaser bubble */}
        {showTeaser && !isChatOpen && (
          <div
            className="absolute right-0 bottom-full mb-3 pointer-events-none z-[10000]"
            style={{ animation: 'fadeSlideIn 0.35s ease-out' }}
          >
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950/95 border border-cyan-400/40 rounded-2xl px-4 py-3 shadow-[0_8px_32px_rgba(6,182,212,0.25),0_0_0_1px_rgba(6,182,212,0.1)] flex items-center gap-2.5">
              <span className="text-lg">{teasers[teaserIndex].icon}</span>
              <span className="text-[12px] font-bold text-cyan-200 font-headline tracking-wide whitespace-nowrap">
                {teasers[teaserIndex].text}
              </span>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: '6px solid rgba(6, 182, 212, 0.4)',
                }}
              />
              <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '5px solid rgb(9, 15, 29)',
                }}
              />
            </div>
          </div>
        )}

        <div className="relative">
          {/* Emote Bubble */}
          {reaction !== '🤖' && !isChatOpen && (
            <div className="absolute bottom-full mb-[16px] left-1/2 -translate-x-1/2 bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-400/30 text-xs px-3 py-1 rounded-lg shadow-[0_4px_20px_rgba(6,182,212,0.2)] flex items-center gap-1.5 whitespace-nowrap z-[10000]"
              style={{ animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
            >
              <span className="text-[16px]">{reaction}</span>
              <span className="text-[10px] text-cyan-300 font-bold tracking-wider uppercase font-mono">
                {expr === 'happy' ? 'YAY!' : expr === 'excited' ? 'WOAH!' : expr === 'cool' ? 'CHILL' : expr === 'thinking' ? 'HMM...' : 'HELLO'}
              </span>
              <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid rgba(6, 182, 212, 0.3)' }}
              />
              <div className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: '3px solid rgb(9, 15, 29)' }}
              />
            </div>
          )}

          <div className="relative w-[72px] h-[60px] bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border-[2px] border-cyan-400/60 rounded-[18px] shadow-[0_8px_32px_rgba(6,182,212,0.3),0_0_60px_rgba(6,182,212,0.1),inset_0_1px_1px_rgba(255,255,255,0.08)] flex flex-col items-center justify-center transition-all duration-300">
            {isHovering && (
              <div className="absolute inset-0 rounded-[16px] border-[2px] border-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.6)] animate-pulse pointer-events-none" />
            )}
            <div className="absolute -top-[12px] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-[8px] h-[8px] bg-cyan-300 rounded-full shadow-[0_0_12px_#22d3ee] animate-pulse" />
              <div className="w-[2px] h-[8px] bg-cyan-400/80" />
            </div>
            <div className="absolute -left-[5px] top-1/2 -translate-y-1/2 w-[4px] h-[14px] bg-cyan-400/50 rounded-l-[2px]" />
            <div className="absolute -right-[5px] top-1/2 -translate-y-1/2 w-[4px] h-[14px] bg-cyan-400/50 rounded-r-[2px]" />
            <div className="absolute inset-[4px] bg-gradient-to-b from-slate-900 to-slate-950 rounded-[12px] overflow-hidden border border-cyan-500/20 flex flex-col items-center justify-center shadow-inner">
              <div className="flex gap-[12px] items-center justify-center mb-[3px] z-10">
                {renderEye('left')}
                {renderEye('right')}
              </div>
              <div className="mt-[3px] z-10 flex items-center justify-center">{renderMouth()}</div>
            </div>
          </div>

          {/* Slogan Bubble */}
          {isHovering && !isChatOpen && (
            <div className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-[10000]" style={{ animation: 'fadeIn 0.2s ease-out' }}>
              <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-[0_4px_20px_rgba(6,182,212,0.3),0_0_0_1px_rgba(255,255,255,0.05)] border border-cyan-300/30 tracking-wide font-mono">
                {slogan}
              </div>
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0"
                style={{ borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderBottom: '4px solid rgb(6, 182, 212)' }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed inset-x-3 bottom-3 z-[9999] w-[calc(100vw-1.5rem)] max-w-[420px] sm:right-6 sm:bottom-6 sm:left-auto sm:w-[420px] max-h-[calc(100dvh-2rem)] sm:h-[600px] bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/25 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(6,182,212,0.08)] flex flex-col overflow-hidden animate-in slide-in-from-right-5 fade-in duration-200">
          {/* Decorative gradient blobs */}
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
            <button onClick={() => setIsChatOpen(false)} className="text-slate-500 hover:text-cyan-300 transition-colors p-1.5 rounded-lg hover:bg-slate-800/50">
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
              <div key={i} className={cn("flex", msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn(
                  "max-w-[88%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 text-cyan-50 rounded-br-sm border border-cyan-500/15 shadow-[0_2px_8px_rgba(6,182,212,0.08)]'
                    : 'bg-gradient-to-br from-slate-800/70 to-slate-800/30 text-slate-200 rounded-bl-sm border border-slate-700/25'
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-gradient-to-br from-slate-800/70 to-slate-800/30 border border-slate-700/25 rounded-bl-sm flex items-center gap-2.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
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
        </div>
      )}

      <style jsx>{`
        @keyframes bounce { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-30px); opacity: 0; } }
        @keyframes fadeIn { 0% { opacity: 0; transform: translate(-50%, 6px); } 100% { opacity: 1; transform: translate(-50%, 0); } }
        @keyframes popIn { 0% { opacity: 0; transform: translate(-50%, 8px) scale(0.85); } 100% { opacity: 1; transform: translate(-50%, 0) scale(1); } }
        @keyframes eyeBlink { 0%, 96%, 100% { transform: scaleY(1); } 98% { transform: scaleY(0.15); } }
        :global(.eye-blink) { animation: eyeBlink 4s infinite; transform-origin: center; }
        @keyframes fadeSlideIn { 0% { opacity: 0; transform: translateY(6px) scale(0.92); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
      `}</style>
    </>
  );
}
