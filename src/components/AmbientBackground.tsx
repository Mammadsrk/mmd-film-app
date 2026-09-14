import React, { useEffect, useRef } from 'react';

interface OrbNode {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  angle: number;
  speed: number;
  distance: number;
}

export const AmbientBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with spring physics
    const mouse = {
      x: width / 2,
      y: height / 3,
      targetX: width / 2,
      targetY: height / 3,
      isActive: false,
      lastMoveTime: Date.now(),
    };

    // Soft pastel/indigo/slate atmospheric palettes (very low opacity)
    const orbColors = [
      'rgba(99, 102, 241, 0.08)',  // Indigo
      'rgba(56, 189, 248, 0.06)',  // Sky/Cyan
      'rgba(139, 92, 246, 0.07)',  // Soft Violet
      'rgba(100, 116, 139, 0.08)', // Slate
      'rgba(79, 70, 229, 0.06)',   // Deep Indigo
      'rgba(244, 114, 182, 0.03)', // Whisper Rose
    ];

    // Initialize 6 gentle floating nodes
    const nodes: OrbNode[] = orbColors.map((color, i) => {
      const angle = (i / orbColors.length) * Math.PI * 2;
      const dist = 120 + Math.random() * 180;
      return {
        baseX: width / 2,
        baseY: height / 3,
        x: width / 2 + Math.cos(angle) * dist,
        y: height / 3 + Math.sin(angle) * dist,
        vx: 0,
        vy: 0,
        radius: 200 + Math.random() * 140,
        color,
        alpha: 0.8,
        angle,
        speed: 0.003 + Math.random() * 0.004,
        distance: dist,
      };
    });

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handlePointerMove = (e: PointerEvent) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isActive = true;
      mouse.lastMoveTime = Date.now();
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });

    // Animation Loop with gentle spring dynamics
    const render = () => {
      // Smoothly interpolate mouse position toward target
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      ctx.clearRect(0, 0, width, height);

      // Deep obsidian canvas base
      ctx.fillStyle = '#020204';
      ctx.fillRect(0, 0, width, height);

      // Render floating nodes with soft radial gradients
      const time = Date.now() * 0.001;

      nodes.forEach((node, idx) => {
        // Orbit dynamics around smoothed mouse or screen center
        node.angle += node.speed;
        const targetOrbX = mouse.x + Math.cos(node.angle + time * 0.2) * node.distance;
        const targetOrbY = mouse.y + Math.sin(node.angle + time * 0.2) * (node.distance * 0.75);

        // Spring acceleration
        const ax = (targetOrbX - node.x) * 0.035;
        const ay = (targetOrbY - node.y) * 0.035;

        node.vx = (node.vx + ax) * 0.88; // Damping
        node.vy = (node.vy + ay) * 0.88;

        node.x += node.vx;
        node.y += node.vy;

        // Draw soft radiant orb
        const grad = ctx.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          node.radius
        );
        grad.addColorStop(0, node.color);
        grad.addColorStop(0.5, node.color.replace(/[\d\.]+\)$/, '0.03)'));
        grad.addColorStop(1, 'rgba(2, 2, 4, 0)');

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });

      // Subtle atmospheric vignette overlay
      const vignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        Math.min(width, height) * 0.4,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.8
      );
      vignette.addColorStop(0, 'rgba(2, 2, 4, 0)');
      vignette.addColorStop(1, 'rgba(2, 2, 4, 0.7)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block pointer-events-none"
        style={{ willChange: 'contents' }}
      />
    </div>
  );
};
