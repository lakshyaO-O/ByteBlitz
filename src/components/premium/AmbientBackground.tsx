'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Orb {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  color: string;
}

export function AmbientBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    if (orbsRef.current.length === 0) {
      orbsRef.current = Array.from({ length: 3 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 200 + Math.random() * 300,
        speedX: (Math.random() - 0.5) * 0.15,
        speedY: (Math.random() - 0.5) * 0.15,
        opacity: 0.03 + Math.random() * 0.03,
        color: ['hsl(217, 76%, 52%)', 'hsl(270, 76%, 52%)', 'hsl(180, 76%, 52%)'][Math.floor(Math.random() * 3)],
      }));
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      orbsRef.current.forEach((orb) => {
        orb.x += orb.speedX;
        orb.y += orb.speedY;

        if (orb.x < -orb.size) orb.x = canvas.width + orb.size;
        if (orb.x > canvas.width + orb.size) orb.x = -orb.size;
        if (orb.y < -orb.size) orb.y = canvas.height + orb.size;
        if (orb.y > canvas.height + orb.size) orb.y = -orb.size;

        const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.size);
        gradient.addColorStop(0, orb.color.replace('hsl', 'hsla').replace(')', `, ${orb.opacity})`));
        gradient.addColorStop(1, orb.color.replace('hsl', 'hsla').replace(')', ', 0)'));

        ctx.fillStyle = gradient;
        ctx.fillRect(orb.x - orb.size, orb.y - orb.size, orb.size * 2, orb.size * 2);
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn('fixed inset-0 pointer-events-none z-0', className)}
      aria-hidden="true"
    />
  );
}
