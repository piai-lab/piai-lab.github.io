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
const loopPath = 'M125 2 H875 Q988 2 988 10 Q988 18 875 18 H125 Q12 18 12 10 Q12 2 125 2';
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
  const colors = palettes[theme];
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
      <div className="discovery-render" data-discovery="scene" role="img" aria-label={t('系统自主选择探测位置，以观测修正预测，再用新的轨迹检验模型', 'The system selects probes, refines its predictions with observations and tests the model on unseen trajectories')}/>
      {!ready && <StaticField theme={theme}/>}
      <div className="discovery-scene-heading"><span className="discovery-dot"/><div>
        <p className="discovery-scene-title" data-discovery="scene-title">{t('同一个模型，预测新的轨迹', 'One model, new predictions')}</p>
        <p className="discovery-probe-id" data-discovery="probe-id">{t('未参与拟合的轨迹', 'UNSEEN TRAJECTORIES')}</p>
      </div></div>
      <div className="discovery-legend"><span><i/>{t('预测轨迹', 'Prediction')}</span><span><i className="measured"/>{t('观测轨迹', 'Observation')}</span></div>
      <div className="discovery-world-label" data-discovery="launch-label" aria-hidden="true"/>
      <div className="discovery-world-label gold" data-discovery="error-label" aria-hidden="true"/>
      <p className="discovery-narrative" data-discovery="narrative">{t('用六条未参与拟合的轨迹，检验模型的预测', 'Six held-out trajectories test the learned model')}</p>
    </div>
    <div className="discovery-process" aria-label={t('自主研究循环', 'Autonomous research loop')}>
      <ol className="discovery-process-steps">
        {['predictStep','experimentStep','compareStep','refineStep'].map((key, i) => <li key={key} data-discovery={`process-${i}`}><span className="discovery-process-number">0{i + 1}</span><span data-text={key}>{t(['提出预测','自主实验','对照证据','修正模型'][i], ['Predict','Experiment','Compare','Refine'][i])}</span></li>)}
      </ol>
      <svg className="discovery-process-path" viewBox="0 0 1000 20" preserveAspectRatio="none" aria-hidden="true">
        <path d={loopPath} fill="none" stroke={colors.prediction} strokeOpacity=".12" strokeWidth=".7" vectorEffect="non-scaling-stroke"/>
        <path data-discovery="flow-active" d={loopPath} fill="none" stroke={colors.observation} strokeOpacity=".7" strokeWidth="1.2" pathLength="1" strokeDasharray=".045 .955" strokeDashoffset="0"/>
        <circle data-discovery="flow-dot" r="2.2" fill={colors.observation}/>
      </svg>
    </div>
    <p className="discovery-disclosure">{t('研究过程的数值演示 · 4 次观测 · 6 条未参与拟合的轨迹', 'Synthetic active learning · 4 observations · 6 held-out tests')}</p>
  </div>;
}
