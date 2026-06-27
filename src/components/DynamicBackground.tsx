'use client';

import React, { useEffect, useRef } from 'react';

export function DynamicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = {
        x: -1000,
        y: -1000,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const maxParticles = 65;

    class Particle {
      x: number = 0;
      y: number = 0;
      size: number = 0;
      speedX: number = 0;
      speedY: number = 0;
      colorRGB: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 };
      alpha: number = 0;

      constructor(w: number, h: number) {
        this.reset(w, h, true);
      }

      reset(w: number, h: number, initial = false) {
        this.x = Math.random() * w;
        this.y = initial ? Math.random() * h : h + 10;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = -(Math.random() * 0.5 + 0.2); // upwards
        this.alpha = Math.random() * 0.5 + 0.2;
        
        // Random choice of neon cyan, indigo, or purple
        const r = Math.random();
        if (r < 0.4) {
          // Cyan
          this.colorRGB = { r: 34, g: 211, b: 238 };
        } else if (r < 0.8) {
          // Indigo
          this.colorRGB = { r: 99, g: 102, b: 241 };
        } else {
          // Purple
          this.colorRGB = { r: 168, g: 85, b: 247 };
        }
      }

      update(w: number, h: number) {
        this.x += this.speedX;
        this.y += this.speedY;

        // Mouse interactive force: gentle attraction or push
        const dx = mouseRef.current.x - this.x;
        const dy = mouseRef.current.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x -= (dx / dist) * force * 0.6;
          this.y -= (dy / dist) * force * 0.6;
        }

        // Reset if goes off screen
        if (this.y < -10 || this.x < -10 || this.x > w + 10) {
          this.reset(w, h, false);
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.beginPath();
        c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        c.fillStyle = `rgba(${this.colorRGB.r}, ${this.colorRGB.g}, ${this.colorRGB.b}, ${this.alpha})`;
        c.fill();
      }
    }

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Initialize particles
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        particles.push(new Particle(canvas.width, canvas.height));
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        
        // Connection to mouse
        const mDx = mouseRef.current.x - p1.x;
        const mDy = mouseRef.current.y - p1.y;
        const mDist = Math.sqrt(mDx * mDx + mDy * mDy);
        
        if (mDist < 110) {
          const mAlpha = (110 - mDist) / 110 * 0.25;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
          ctx.strokeStyle = `rgba(${p1.colorRGB.r}, ${p1.colorRGB.g}, ${p1.colorRGB.b}, ${mAlpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }

        // Connections to other particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 90) {
            const alpha = (90 - dist) / 90 * 0.12;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(${p1.colorRGB.r}, ${p1.colorRGB.g}, ${p1.colorRGB.b}, ${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const w = canvas.width;
      const h = canvas.height;

      // Draw grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.025)';
      ctx.lineWidth = 1;
      const gridSpacing = 50;
      
      // Vertical grid lines
      for (let x = 0; x < w; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < h; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Update & Draw particles
      particles.forEach((p) => {
        p.update(w, h);
        p.draw(ctx);
      });

      // Draw network lines
      drawConnections();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-[-1] overflow-hidden bg-slate-950">
      {/* Perspective light from bottom */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_40%,rgba(99,102,241,0.025)_80%,rgba(6,182,212,0.06)_100%)]" />

      {/* Cyber Grid gradient */}
      <div 
        className="absolute inset-0 opacity-[0.25]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.12) 0%, transparent 45%),
            radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.1) 0%, transparent 50%)
          `,
          filter: 'blur(40px)',
        }}
      />

      {/* Huge animated glowing orbs in the background */}
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-cyan-500/10 blur-[150px] animate-nebula-slow pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-10%] w-[55vw] h-[55vw] rounded-full bg-indigo-500/10 blur-[150px] animate-nebula-reverse pointer-events-none" />
      <div className="absolute top-[30%] right-[-15%] w-[45vw] h-[45vw] rounded-full bg-purple-500/8 blur-[130px] animate-nebula-mid pointer-events-none" />

      {/* Canvas for dynamic particles */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Scanline pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_98%,rgba(34,211,238,0.04)_98%)] bg-[size:100%_30px] pointer-events-none" />

      <style jsx>{`
        @keyframes nebulaSlow {
          0% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(8%, 6%) scale(1.15);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes nebulaReverse {
          0% {
            transform: translate(0, 0) scale(1.1);
          }
          50% {
            transform: translate(-10%, -6%) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1.1);
          }
        }

        @keyframes nebulaMid {
          0% {
            transform: translate(0, 0) scale(0.95);
          }
          50% {
            transform: translate(5%, -10%) scale(1.1);
          }
          100% {
            transform: translate(0, 0) scale(0.95);
          }
        }

        .animate-nebula-slow {
          animation: nebulaSlow 30s infinite ease-in-out alternate;
        }

        .animate-nebula-reverse {
          animation: nebulaReverse 35s infinite ease-in-out alternate;
        }

        .animate-nebula-mid {
          animation: nebulaMid 28s infinite ease-in-out alternate;
        }
      `}</style>
    </div>
  );
}
