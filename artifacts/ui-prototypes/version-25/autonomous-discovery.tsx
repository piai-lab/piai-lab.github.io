import React, { useEffect, useRef, useState } from 'react';
import { createDiscoveryObservatory, type DiscoveryObservatoryController } from './discovery-observatory';
import { discoveryExperiment } from '../discovery-model.mjs';
import '../autonomous-discovery.css';

// copied-adapted from version-23: retain the version-22 scene, disclosure and
// keyboard controls; only its renderer's display timing and emphasis are refined.
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
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(false);
  const latest = useRef({ en, reduced, theme, paused }); latest.current = { en, reduced, theme, paused };
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
          onError: () => { if (!disposed) { setReady(false); setFailed(true); } },
        });
      } catch {
        element.querySelector('canvas')?.remove();
        element.dataset.renderState = 'fallback';
        if (!disposed) { setReady(false); setFailed(true); }
      }
    });
    return () => { disposed = true; controller.current?.dispose(); controller.current = null; };
  }, []);
  useEffect(() => { controller.current?.setState({ en, reduced, theme, paused }); }, [en, reduced, theme, paused]);
  const toggle = () => { if (!reduced && !failed) setPaused(value => !value); };
  const replay = () => {
    if (reduced || failed) return;
    setPaused(false);
    controller.current?.setState({ paused: false });
    controller.current?.restart();
  };
  return <div className="autonomous-discovery" ref={host} data-ready={ready} data-theme={theme}
    role="group" tabIndex={0}
    aria-label={t('自主科学发现的数值演示', 'A numerical demonstration of autonomous scientific discovery') + (reduced || failed ? '' : t('；P 暂停或继续，R 重播', '; P pauses or resumes, R replays'))}
    aria-keyshortcuts={reduced || failed ? undefined : 'P R'}
    onKeyDown={event => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;
      const key = event.key.toLowerCase();
      if (key === 'p') { event.preventDefault(); event.stopPropagation(); toggle(); }
      else if (key === 'r') { event.preventDefault(); event.stopPropagation(); replay(); }
    }}>
    <div className="discovery-experiment">
      <div className="discovery-render" data-discovery="scene" role="img" aria-label={t('两个隐藏的力使粒子轨迹弯曲；智能体选择探测位置，每次观测排除矛盾的解释，最终用学到的力预测未测轨迹', 'Two hidden forces bend particle paths; the agent chooses where to probe, each observation rules out contradicting explanations, and the learned forces predict unmeasured paths')}/>
      {!ready && <StaticField theme={theme}/>}
      <p className="discovery-narrative" data-discovery="narrative" aria-live="off">{t('隐藏的力让轨迹弯曲，许多解释都还说得通', 'Hidden forces bend the path, and many explanations still fit')}</p>
    </div>
    <p className="discovery-disclosure">{t('合成主动学习演示 · 4 次自主探测 · 6 条未参与拟合的轨迹', 'Synthetic active learning · 4 autonomous probes · 6 held-out trajectories')}</p>
    <p className="sr-only" role="status">{failed ? t('动效暂不可用，已显示静态视图', 'Animation unavailable; a static view is shown') : reduced ? t('已减少动态，显示静态视图', 'Reduced motion; a static view is shown') : paused ? t('动态已暂停', 'Animation paused') : ''}</p>
  </div>;
}
