"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
};

type Theme = "light" | "dark";

/**
 * A persistent, looping "constellation" particle field rendered on a canvas.
 *
 * It sits behind all page content (fixed, non-interactive) and animates via a
 * single requestAnimationFrame loop. Particles drift, wrap around the edges,
 * and draw connecting lines to nearby neighbours and to the cursor. The effect
 * is disabled for users who prefer reduced motion, and it adapts its palette to
 * the active (light/dark) theme.
 */
export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const detectTheme = (): Theme =>
      document.documentElement.classList.contains("dark") ||
      (!document.documentElement.classList.contains("light") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
        ? "dark"
        : "light";

    // Brand violet (matches the logo gradient) with per-theme opacity tuning so
    // it reads well on both a white and a near-black background.
    const palette = {
      light: { r: 99, g: 76, b: 224, dot: 0.55, line: 0.16, cursor: 0.28 },
      dark: { r: 168, g: 148, b: 255, dot: 0.7, line: 0.18, cursor: 0.32 },
    } satisfies Record<Theme, Record<string, number>>;

    let theme = detectTheme();
    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: Particle[] = [];
    let animationFrame = 0;

    const LINK_DISTANCE = 140;
    const CURSOR_DISTANCE = 180;
    const pointer = { x: -9999, y: -9999, active: false };

    const createParticles = () => {
      // Scale particle count with viewport area, but keep it bounded so large
      // displays stay smooth.
      const target = Math.min(
        110,
        Math.max(28, Math.floor((width * height) / 16000)),
      );
      particles = Array.from({ length: target }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        radius: Math.random() * 1.6 + 0.8,
      }));
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      createParticles();
    };

    const drawStaticField = () => {
      // Reduced-motion / no-animation fallback: a calm, static scattering.
      ctx.clearRect(0, 0, width, height);
      const c = palette[theme];
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.dot})`;
        ctx.fill();
      }
    };

    const render = () => {
      const c = palette[theme];
      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around the edges for a seamless, endless drift.
        if (p.x < -5) p.x = width + 5;
        else if (p.x > width + 5) p.x = -5;
        if (p.y < -5) p.y = height + 5;
        else if (p.y > height + 5) p.y = -5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${c.dot})`;
        ctx.fill();
      }

      // Connecting lines between nearby particles.
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            const alpha = (1 - dist / LINK_DISTANCE) * c.line;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }

        // Subtle link from each nearby particle to the cursor.
        if (pointer.active) {
          const dx = a.x - pointer.x;
          const dy = a.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < CURSOR_DISTANCE) {
            const alpha = (1 - dist / CURSOR_DISTANCE) * c.cursor;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(pointer.x, pointer.y);
            ctx.strokeStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      animationFrame = window.requestAnimationFrame(render);
    };

    const start = () => {
      window.cancelAnimationFrame(animationFrame);
      if (reducedMotion.matches) {
        drawStaticField();
      } else {
        animationFrame = window.requestAnimationFrame(render);
      }
    };

    const handleResize = () => {
      resize();
      start();
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -9999;
      pointer.y = -9999;
    };

    const handleThemeChange = () => {
      theme = detectTheme();
      if (reducedMotion.matches) drawStaticField();
    };

    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const themeObserver = new MutationObserver(handleThemeChange);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    resize();
    start();

    window.addEventListener("resize", handleResize);
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    reducedMotion.addEventListener("change", start);
    colorScheme.addEventListener("change", handleThemeChange);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      reducedMotion.removeEventListener("change", start);
      colorScheme.removeEventListener("change", handleThemeChange);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
