import React, { useEffect, useRef } from 'react';

type StarlightBackdropProps = { reduced: boolean; theme: 'dark' | 'light' };
type Star = { x: number; y: number; r: number; a: number; tone: number; phase: number; rate: number; glow: boolean };

// v25, copied-adapted from v22: one persistent field across both themes. The scenes no longer paint their own
// stars, so the viewport reads as one continuous space. Three depth layers
// share one clock; scrolling moves them at different rates and the field wraps
// vertically, so density follows the viewport, never the document length.
const LAYERS = [
  { area: 1700, radius: [.35, .7], alpha: [.2, .48], parallax: .035, twinkle: .12 },
  { area: 7000, radius: [.6, 1.05], alpha: [.4, .7], parallax: .09, twinkle: .3 },
  { area: 30000, radius: [.9, 1.5], alpha: [.6, .92], parallax: .17, twinkle: .42 },
];
const DARK_TONES = ['#9ec2d8', '#d9eaf4', '#c7e0de', '#dfba93'];
const LIGHT_TONES = ['#1d5964', '#3b6680', '#4a5f6b', '#26476b'];

function sampler(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeGlow() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 48;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
  gradient.addColorStop(0, 'rgba(232,246,255,.7)');
  gradient.addColorStop(.12, 'rgba(170,210,226,.26)');
  gradient.addColorStop(.45, 'rgba(140,190,214,.04)');
  gradient.addColorStop(1, 'rgba(140,190,214,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 48, 48);
  return canvas;
}

export default function StarlightBackdrop({ reduced, theme }: StarlightBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ reduced, theme });
  const controller = useRef<{ setState: (next: StarlightBackdropProps) => void } | null>(null);
  latest.current = { reduced, theme };

  useEffect(() => { controller.current?.setState({ reduced, theme }); }, [reduced, theme]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) { canvas.dataset.renderState = 'unavailable'; return; }
    let { reduced, theme } = latest.current;
    const parameter = new URLSearchParams(window.location.search).get('frame');
    const frozenFrame = parameter === null ? NaN : Number(parameter);
    const frozen = Number.isFinite(frozenFrame) && frozenFrame >= 0;
    const glow = makeGlow();
    let layers: Star[][] = [];
    let disposed = false, raf = 0, previous = 0, width = 0, height = 0, dpr = 1;
    let time = frozen ? frozenFrame / 60 : 0, frames = 0;

    const animated = () => !disposed && !document.hidden && !reduced && !frozen && width > 0 && height > 0;
    const state = () => {
      canvas.dataset.renderState = disposed ? 'disposed' : document.hidden ? 'hidden' :
        reduced ? 'reduced' : frozen ? 'frame' : 'running';
    };

    function build() {
      const random = sampler(790217);
      layers = LAYERS.map((layer, depth) => {
        const count = Math.max(8, Math.round(width * height / layer.area));
        return Array.from({ length: count }, () => {
          const tone = random();
          return {
            x: random() * width,
            y: random() * height,
            r: layer.radius[0] + Math.pow(random(), 2) * (layer.radius[1] - layer.radius[0]),
            a: layer.alpha[0] + random() * (layer.alpha[1] - layer.alpha[0]),
            tone: tone < .07 ? 3 : tone < .3 ? 1 : tone < .55 ? 2 : 0,
            phase: random() * Math.PI * 2,
            // Slow, incommensurate breathing between 7 and 19 seconds.
            rate: Math.PI * 2 / (7 + random() * 12),
            glow: depth === 2 && random() < .32,
          };
        });
      });
      canvas.dataset.points = String(layers.reduce((n, l) => n + l.length, 0));
      canvas.dataset.theme = theme;
    }

    function render() {
      if (disposed || !width || !height) return;
      const light = theme === 'light';
      const tones = light ? LIGHT_TONES : DARK_TONES;
      const scroll = window.scrollY;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);
      layers.forEach((stars, depth) => {
        const layer = LAYERS[depth];
        const shift = reduced ? 0 : scroll * layer.parallax;
        const drift = reduced ? 0 : Math.sin(time * .021 + depth) * (depth + 1) * 1.6;
        for (const [index, star] of stars.entries()) {
          // Keep one geometry; light mode reveals a stable subset of each layer.
          if (light && index % 5 >= 3) continue;
          let y = (star.y - shift) % height;
          if (y < 0) y += height;
          const x = star.x + drift;
          const breath = reduced ? 1 : 1 - layer.twinkle * (.5 + .5 * Math.sin(time * star.rate + star.phase));
          const alpha = star.a * breath * (light ? .62 : 1);
          if (star.glow && !light) {
            ctx!.globalAlpha = alpha * .75;
            const d = 9 + star.r * 6;
            ctx!.drawImage(glow, x - d / 2, y - d / 2, d, d);
          }
          ctx!.globalAlpha = alpha;
          ctx!.fillStyle = tones[star.tone];
          ctx!.beginPath();
          ctx!.arc(x, y, star.r, 0, Math.PI * 2);
          ctx!.fill();
        }
      });
      ctx!.globalAlpha = 1;
      canvas.dataset.time = time.toFixed(3);
      canvas.dataset.frame = String(++frames);
      state();
    }

    function tick(now: number) {
      raf = 0;
      if (!animated()) { previous = 0; state(); return; }
      time += previous ? Math.min(1 / 30, (now - previous) / 1000) : 0;
      previous = now;
      render();
      raf = requestAnimationFrame(tick);
    }
    function reconcile() {
      cancelAnimationFrame(raf); raf = previous = 0;
      if (animated()) raf = requestAnimationFrame(tick);
      else render();
      state();
    }
    function resize() {
      if (disposed) return;
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      if (w === width && h === height && nextDpr === dpr) return;
      // Mobile URL bars change innerHeight while scrolling; keep the field stable.
      const rebuild = !layers.length || w !== width || Math.abs(h - height) > 140 || nextDpr !== dpr;
      width = w; height = h; dpr = nextDpr;
      canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
      if (rebuild) build();
      reconcile();
    }
    // Static modes redraw only when necessary; reduced motion has no parallax.
    function onScroll() { if (!animated() && !raf) raf = requestAnimationFrame(() => { raf = 0; render(); }); }
    function setState(next: StarlightBackdropProps) {
      reduced = next.reduced; theme = next.theme;
      canvas.dataset.theme = theme;
      reconcile();
    }

    controller.current = { setState };
    document.addEventListener('visibilitychange', reconcile);
    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    resize();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      controller.current = null;
      document.removeEventListener('visibilitychange', reconcile);
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', onScroll);
      glow.width = glow.height = 1;
      canvas.width = canvas.height = 1;
      state();
    };
  }, []);

  return <canvas ref={canvasRef} className="starlight-backdrop" data-theme={theme} aria-hidden="true" />;
}
