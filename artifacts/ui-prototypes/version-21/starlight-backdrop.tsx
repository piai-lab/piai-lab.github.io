import React, { useEffect, useRef } from 'react';

type StarlightBackdropProps = { reduced: boolean; theme: 'dark' | 'light' };
type DustLayer = { surface: HTMLCanvasElement; depth: number };

// copied-adapted from ../starlight-backdrop.tsx: preserve the seeded field,
// visibility/resize lifecycle and time; theme only changes cached paint.
function sampler(seed: number) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function makeGlow(warm: boolean) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext('2d')!;
  const rgb = warm ? '226,180,132' : '133,190,222';
  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, warm ? 'rgba(255,242,222,.85)' : 'rgba(230,246,255,.85)');
  gradient.addColorStop(.14, `rgba(${rgb},.38)`);
  gradient.addColorStop(.4, `rgba(${rgb},.06)`);
  gradient.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);
  return canvas;
}

export default function StarlightBackdrop({ reduced, theme }: StarlightBackdropProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const latest = useRef({ reduced, theme });
  const controller = useRef<{ setState: (next: StarlightBackdropProps) => void } | null>(null);
  latest.current = { reduced, theme };

  useEffect(() => {
    controller.current?.setState({ reduced, theme });
  }, [reduced, theme]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    let { reduced, theme } = latest.current;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      canvas.dataset.renderState = 'unavailable';
      return;
    }
    const parameter = new URLSearchParams(window.location.search).get('frame');
    const frame = parameter === null ? NaN : Number(parameter);
    const frozen = Number.isFinite(frame) && frame >= 0;
    const sprites = [makeGlow(false), makeGlow(true)];
    let layers: DustLayer[] = [];
    let disposed = false, visible = false, raf = 0, previous = 0;
    let width = 0, height = 0, dpr = 1, time = frozen ? frame / 60 : 0;
    let frames = 0;
    const padding = 32;

    const state = () => {
      canvas.dataset.renderState = disposed ? 'disposed' : document.hidden ? 'hidden' :
        !visible ? 'offscreen' : reduced ? 'reduced' : frozen ? 'frame' : 'running';
    };
    const canRun = () => !disposed && visible && !document.hidden && !reduced && !frozen && width > 0 && height > 0;
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = previous = 0;
    };
    const releaseLayers = () => {
      layers.forEach(layer => { layer.surface.width = layer.surface.height = 1; });
      layers = [];
    };

    function build() {
      releaseLayers();
      const random = sampler(790217);
      const cacheDpr = Math.min(dpr, 1.5);
      // Density follows the viewport, never the length of the document.
      // No cloud/cluster population: the wheel owns the concentrated light.
      const darkTotal = Math.min(3000, Math.max(240, Math.round(width * height / 720)));
      const total = theme === 'light' ? Math.round(darkTotal * .45) : darkTotal;
      const counts = [Math.round(total * .78), total - Math.round(total * .78)];
      const fieldWidth = width + padding * 2, fieldHeight = height + padding * 2;

      counts.forEach((count, index) => {
        const surface = document.createElement('canvas');
        surface.width = Math.ceil(fieldWidth * cacheDpr);
        surface.height = Math.ceil(fieldHeight * cacheDpr);
        const paint = surface.getContext('2d')!;
        paint.setTransform(cacheDpr, 0, 0, cacheDpr, padding * cacheDpr, padding * cacheDpr);
        for (let i = 0; i < count; i++) {
          const x = random() * fieldWidth - padding;
          const y = random() * fieldHeight - padding;
          const light = random(), warm = random() < .065;
          const radius = index === 0 ? .42 + Math.pow(random(), 2) * .42 : .64 + Math.pow(random(), 2) * .58;
          paint.globalAlpha = theme === 'light'
            ? index === 0 ? .10 + light * .14 : .16 + light * .14
            : index === 0 ? .28 + light * .38 : .52 + light * .40;
          paint.fillStyle = theme === 'light' ? '#2b6664' : warm ? '#dfba93' : light > .72 ? '#d9eaf4' : '#9ec2d8';
          paint.beginPath();
          paint.arc(x, y, radius, 0, Math.PI * 2);
          paint.fill();
          if (theme === 'dark' && index === 1 && light > .90) {
            paint.globalAlpha = .40;
            const diameter = 7 + random() * 6;
            paint.drawImage(sprites[warm ? 1 : 0], x - diameter / 2, y - diameter / 2, diameter, diameter);
          }
        }
        paint.globalAlpha = 1;
        layers.push({ surface, depth: index + 1 });
      });
      canvas.dataset.points = String(total);
      canvas.dataset.theme = theme;
      canvas.dataset.dpr = dpr.toFixed(2);
    }

    function render() {
      if (disposed || !width || !height) return;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx!.clearRect(0, 0, width, height);
      for (const layer of layers) {
        const phase = time * .01 * layer.depth;
        const x = Math.sin(phase) * 2 * layer.depth;
        const y = (Math.cos(phase * .73) - 1) * layer.depth;
        ctx!.drawImage(layer.surface, x - padding, y - padding, width + padding * 2, height + padding * 2);
      }
      canvas.dataset.time = time.toFixed(3);
      canvas.dataset.frame = String(++frames);
      state();
    }

    function tick(now: number) {
      raf = 0;
      if (!canRun()) { state(); return; }
      const dt = previous ? Math.max(0, (now - previous) / 1000) : 0;
      previous = now;
      time += dt;
      render();
      if (canRun()) raf = requestAnimationFrame(tick);
    }

    function reconcile() {
      stop();
      state();
      if (canRun()) raf = requestAnimationFrame(tick);
    }

    function setState(next: StarlightBackdropProps) {
      const themeChanged = next.theme !== theme;
      const reducedChanged = next.reduced !== reduced;
      reduced = next.reduced;
      theme = next.theme;
      // Theme changes repaint the cached field; time, visibility and RAF ownership stay intact.
      if (themeChanged && width > 0 && height > 0) {
        build();
        render();
      }
      if (reducedChanged) reconcile();
    }

    function resize() {
      if (disposed) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        width = height = 0;
        reconcile();
        return;
      }
      const nextDpr = Math.min(window.devicePixelRatio || 1, 2);
      if (width === rect.width && height === rect.height && dpr === nextDpr) return;
      width = rect.width; height = rect.height; dpr = nextDpr;
      canvas.width = Math.ceil(width * dpr); canvas.height = Math.ceil(height * dpr);
      build();
      render();
      reconcile();
    }

    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? false;
      reconcile();
    }, { threshold: 0 });
    controller.current = { setState };
    resizeObserver.observe(canvas);
    intersectionObserver.observe(canvas);
    document.addEventListener('visibilitychange', reconcile);
    window.addEventListener('resize', resize, { passive: true });
    resize();

    return () => {
      disposed = true;
      stop();
      controller.current = null;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', reconcile);
      window.removeEventListener('resize', resize);
      releaseLayers();
      sprites.forEach(sprite => { sprite.width = sprite.height = 1; });
      canvas.width = canvas.height = 1;
      state();
    };
  }, []);

  return <canvas ref={canvasRef} className="starlight-backdrop" data-theme={theme} aria-hidden="true" />;
}
