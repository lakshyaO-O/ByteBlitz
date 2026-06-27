'use client';

import React, { useState, useEffect, useRef } from 'react';

interface Position {
  x: number;
  y: number;
}

const REACTIONS = [
  '🤖',
  '😊',
  '🎮',
  '⚡',
  '🏆',
  '💪',
  '🚀',
  '✨',
  '🎯',
  '👍',
  '🔥',
  '💯',
  '🤔',
  '😎',
  '🎉',
];

const SLOGANS = [
  "Let's Fight!",
  "Hack it!",
  "Compile!",
  "AC incoming!",
  "Optimizing...",
  "Run it!",
  "Clean Code!",
];

export function RoboticMascot() {
  const [eyeOffset, setEyeOffset] = useState<Position>({ x: 0, y: 0 });
  const [reaction, setReaction] = useState('🤖');
  const [isHovering, setIsHovering] = useState(false);
  const [slogan, setSlogan] = useState("Let's Fight!");
  const trailPositions: Position[] = [];
  const currentOffset: Position = { x: 0, y: 0 };
  
  const mascotRef = useRef<HTMLDivElement>(null);
  const reactionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the mascot still while the eyes track the pointer.
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

      setEyeOffset({
        x: (dx / distance) * maxEyeTravel,
        y: (dy / distance) * maxEyeTravel,
      });
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => window.removeEventListener('pointermove', handlePointerMove);
  }, []);

  // Random reactions
  useEffect(() => {
    const handleInteraction = () => {
      const randomReaction =
        REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      setReaction(randomReaction);

      const randomSlogan = SLOGANS[Math.floor(Math.random() * SLOGANS.length)];
      setSlogan(randomSlogan);

      if (reactionTimeoutRef.current) {
        clearTimeout(reactionTimeoutRef.current);
      }

      reactionTimeoutRef.current = setTimeout(() => {
        setReaction('🤖');
      }, 1500);
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
  }, []);

  const getExpression = (react: string): 'idle' | 'happy' | 'excited' | 'cool' | 'thinking' => {
    switch (react) {
      case '🤖':
        return 'idle';
      case '😊':
      case '👍':
      case '🎉':
      case '🏆':
      case '💪':
      case '💯':
        return 'happy';
      case '⚡':
      case '🚀':
      case '✨':
      case '🔥':
      case '🎮':
      case '🎯':
        return 'excited';
      case '😎':
        return 'cool';
      case '🤔':
        return 'thinking';
      default:
        return 'happy';
    }
  };

  const expr = getExpression(reaction);
  const eyeStyle = {
    transform: `translate(${eyeOffset.x}px, ${eyeOffset.y}px)`,
    transition: 'transform 90ms ease-out',
  };

  const renderEye = (eyeName: 'left' | 'right') => {
    if (expr === 'happy') {
      return (
        <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
          <path d="M1.5 7 C 3 4, 7 4, 8.5 7" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" fill="none" />
        </svg>
      );
    }
    if (expr === 'cool') {
      return (
        <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
          <path d="M1 5 H9" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    }
    if (expr === 'thinking') {
      if (eyeName === 'left') {
        return (
          <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
            <circle cx="5" cy="5" r="3.5" fill="#22d3ee" />
          </svg>
        );
      } else {
        return (
          <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_3px_#22d3ee] scale-90" style={{ ...eyeStyle, transform: `translate(${eyeOffset.x}px, ${eyeOffset.y - 2}px)` }}>
            <circle cx="5" cy="5" r="3.5" fill="#22d3ee" />
          </svg>
        );
      }
    }
    if (expr === 'excited') {
      return (
        <svg width="12" height="12" viewBox="0 0 10 10" className="drop-shadow-[0_0_4px_#22d3ee] animate-pulse" style={eyeStyle}>
          <ellipse cx="5" cy="5" rx="3.5" ry="4.5" fill="#22d3ee" />
        </svg>
      );
    }
    // idle
    return (
      <svg width="12" height="12" viewBox="0 0 10 10" className="eye-blink drop-shadow-[0_0_3px_#22d3ee]" style={eyeStyle}>
        <circle cx="5" cy="5" r="3.5" fill="#22d3ee" />
      </svg>
    );
  };

  const renderMouth = () => {
    if (expr === 'happy') {
      return (
        <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee]">
          <path d="M1.5 1 C 3 3.5, 7 3.5, 8.5 1" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    }
    if (expr === 'excited') {
      return (
        <svg width="10" height="10" viewBox="0 0 10 10" className="drop-shadow-[0_0_2px_#22d3ee]">
          <circle cx="5" cy="5" r="2" fill="#22d3ee" />
        </svg>
      );
    }
    if (expr === 'thinking') {
      return (
        <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee] rotate-[4deg]">
          <path d="M2.5 2.5 H7.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    }
    if (expr === 'cool') {
      return (
        <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee]">
          <path d="M2 1.5 C 3 3, 6 2, 8 1.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </svg>
      );
    }
    // idle
    return (
      <svg width="12" height="6" viewBox="0 0 10 5" className="drop-shadow-[0_0_2px_#22d3ee]">
        <path d="M2.5 2.5 H7.5" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  };

  return (
    <>
      {/* Trail effect */}
      {trailPositions.map((pos, idx) => (
        <div
          key={idx}
          className="fixed pointer-events-none"
          style={{
            left: `${pos.x + currentOffset.x}px`,
            top: `${pos.y + currentOffset.y}px`,
            transform: 'translate(-50%, -50%)',
            opacity: (idx / trailPositions.length) * 0.3,
            fontSize: '12px',
          }}
        >
          ✨
        </div>
      ))}

      {/* Main mascot */}
      <div
        ref={mascotRef}
        className="fixed bottom-5 right-5 pointer-events-none z-[9999] transition-transform"
        style={{
          transform: `scale(${isHovering ? 1.12 : 1})`,
        }}
      >
        {/* Robot body */}
        <div className="relative">
          {/* Emote Bubble above the head */}
          {reaction !== '🤖' && (
            <div
              className="absolute bottom-full mb-[14px] left-1/2 -translate-x-1/2 bg-slate-950/95 border border-cyan-500/30 text-xs px-2 py-0.5 rounded-md shadow-[0_4px_12px_rgba(6,182,212,0.15)] flex items-center gap-1.5 whitespace-nowrap z-[10000]"
              style={{
                animation: 'popIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <span className="text-[14px]">{reaction}</span>
              <span className="text-[9px] text-cyan-400 font-semibold tracking-wider uppercase font-mono">
                {expr === 'happy' ? 'YAY!' : expr === 'excited' ? 'WOAH!' : expr === 'cool' ? 'CHILL' : expr === 'thinking' ? 'HMM...' : 'HELLO'}
              </span>
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderTop: '4px solid rgba(6, 182, 212, 0.3)',
                }}
              />
              <div
                className="absolute top-[calc(100%-1px)] left-1/2 -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '3px solid transparent',
                  borderRight: '3px solid transparent',
                  borderTop: '3px solid rgb(9, 15, 29)',
                }}
              />
            </div>
          )}

          {/* Cute robot face container */}
          <div className="relative w-[54px] h-[44px] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-[1.5px] border-cyan-500/50 rounded-[14px] shadow-[0_4px_16px_rgba(6,182,212,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col items-center justify-center transition-all duration-300">
            {/* Glow effect when clicked */}
            {isHovering && (
              <div className="absolute inset-0 rounded-[14px] border-[1.5px] border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.5)] animate-pulse pointer-events-none" />
            )}

            {/* Antenna */}
            <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 flex flex-col items-center">
              <div className="w-[6px] h-[6px] bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee] animate-pulse" />
              <div className="w-[2px] h-[6px] bg-cyan-500/60" />
            </div>

            {/* Ears */}
            <div className="absolute -left-[4px] top-1/2 -translate-y-1/2 w-[3px] h-[12px] bg-cyan-500/40 rounded-l-[2px]" />
            <div className="absolute -right-[4px] top-1/2 -translate-y-1/2 w-[3px] h-[12px] bg-cyan-500/40 rounded-r-[2px]" />

            {/* Screen Background */}
            <div className="absolute inset-[3px] bg-slate-950/90 rounded-[10px] overflow-hidden border border-slate-800/50 flex flex-col items-center justify-center">
              {/* Scanline/Grid Effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.05)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none" />
              
              {/* Eyes Container */}
              <div className="flex gap-[10px] items-center justify-center mb-[2px] z-10">
                {renderEye('left')}
                {renderEye('right')}
              </div>

              {/* Blush Cheeks */}
              <div className="absolute inset-x-[6px] bottom-[10px] flex justify-between pointer-events-none z-10">
                <div className="w-[6px] h-[3px] bg-pink-500/50 blur-[0.5px] rounded-full transition-opacity duration-300" style={{ opacity: expr === 'happy' || expr === 'excited' ? 1 : 0 }} />
                <div className="w-[6px] h-[3px] bg-pink-500/50 blur-[0.5px] rounded-full transition-opacity duration-300" style={{ opacity: expr === 'happy' || expr === 'excited' ? 1 : 0 }} />
              </div>

              {/* Mouth Container */}
              <div className="mt-[2px] z-10 flex items-center justify-center">
                {renderMouth()}
              </div>
            </div>
          </div>

          {/* Slogan Speech Bubble below the head when clicking */}
          {isHovering && (
            <div
              className="absolute top-full mt-3 left-1/2 transform -translate-x-1/2 whitespace-nowrap z-[10000]"
              style={{
                animation: 'fadeIn 0.2s ease-out',
              }}
            >
              <div className="bg-gradient-to-r from-cyan-600 to-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-[0_4px_12px_rgba(79,70,229,0.3)] border border-cyan-400/20 tracking-wide font-mono">
                {slogan}
              </div>
              <div
                className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0"
                style={{
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '4px solid rgb(8, 145, 178)', // cyan-600
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Styles for animations */}
      <style jsx>{`
        @keyframes bounce {
          0% {
            transform: translateY(0);
            opacity: 1;
          }
          100% {
            transform: translateY(-30px);
            opacity: 0;
          }
        }

        @keyframes fadeIn {
          0% {
            opacity: 0;
            transform: translate(-50%, 6px);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes popIn {
          0% {
            opacity: 0;
            transform: translate(-50%, 8px) scale(0.85);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }

        @keyframes eyeBlink {
          0%, 96%, 100% {
            transform: scaleY(1);
          }
          98% {
            transform: scaleY(0.15);
          }
        }

        :global(.eye-blink) {
          animation: eyeBlink 4s infinite;
          transform-origin: center;
        }
      `}</style>
    </>
  );
}
