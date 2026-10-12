import React, { useEffect, useRef, useState } from 'react';
import { createDiscoveryObservatory, type DiscoveryObservatoryController } from './discovery-observatory';
import { discoveryExperiment } from '../discovery-model.mjs';
import '../autonomous-discovery.css';

// copied-adapted: the approved discovery-motion-01/refined trajectory study
// Version 21 copies the approved scene; the site owns locale, theme and reduced motion.
type Props = { en?: boolean; reduced: boolean; theme: 'dark' | 'light' };
const palettes = {
  dark: { prediction: '#a9d8c7', observation: '#e6b77c' },
  light: { prediction: '#2f7480', observation: '#26476b' },
};
function StaticField({ theme }: { theme: Props['theme'] }) {
  const colors = palettes[theme];
  const path = (points: number[][]) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${(x + 5) * 100 + 80},${240 - y * 55}`).join(' ');
  return <svg className="discovery-static" viewBox="0 0 1160 520" aria-hidden="true">
    {discoveryExperiment.heldOut.map((trial: { predicted: number[][]; actual: number[][] }, i: number) => <g key={i} fill="none">
      <path d={path(trial.predicted)} stroke={colors.prediction} strokeDasharray="6 6" opacity=".55"/>
      <path d={path(trial.actual)} stroke={colors.observation} strokeWidth="1.5" opacity=".85"/>
    </g>)}
  </svg>;
}

export default function AutonomousDiscovery({ en = true, reduced, theme }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const controller = useRef<DiscoveryObservatoryController | null>(null);
  const latest = useRef({ en, reduced, theme }); latest.current = { en, reduced, theme };
  const [ready, setReady] = useState(false);
  const t = (zh: string, english: string) => en ? english : zh;
  useEffect(() => {
    let disposed = false;
    const element = host.current!;
    document.fonts.ready.then(() => {
      if (disposed) return;
      try {
        controller.current = createDiscoveryObservatory(element, {
          ...latest.current,
          onReady: () => { if (!disposed) setReady(true); },
          onError: () => { if (!disposed) setReady(false); },
        });
      } catch {
        element.querySelector('canvas')?.remove();
        element.dataset.renderState = 'fallback';
        if (!disposed) setReady(false);
      }
    });
    return () => { disposed = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setState({ en, reduced, theme }); }, [en, reduced, theme]);
  return <div className="autonomous-discovery" ref={host} data-ready={ready} data-theme={theme} aria-label={t('自主科学发现的数值演示', 'A numerical demonstration of autonomous scientific discovery')}>
    <div className="discovery-experiment">
      <div className="discovery-render" data-discovery="scene" role="img" aria-label={t('两个隐藏的力使粒子轨迹弯曲；智能体选择探测位置，每次观测排除矛盾的解释，最终用学到的力预测未测轨迹', 'Two hidden forces bend particle paths; the agent chooses where to probe, each observation rules out contradicting explanations, and the learned forces predict unmeasured paths')}/>
      {!ready && <StaticField theme={theme}/>}
      <p className="discovery-narrative" data-discovery="narrative" aria-live="off">{t('隐藏的力让轨迹弯曲，许多解释都还说得通', 'Hidden forces bend the path, and many explanations still fit')}</p>
    </div>
    <p className="discovery-disclosure">{t('合成主动学习演示 · 4 次自主探测 · 6 条未参与拟合的轨迹', 'Synthetic active learning · 4 autonomous probes · 6 held-out trajectories')}</p>
  </div>;
}
