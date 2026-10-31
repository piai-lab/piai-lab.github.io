import React, {useEffect, useRef, useState} from 'react';
import {createCelestialWheel} from './wheel.js';
import {getRingsDef} from '../../celestial-replica/data.js';

type WheelController = ReturnType<typeof createCelestialWheel>;

function StillWheel(){
 return <svg className="celestial-wheel-still" viewBox="-6 -6 12 12" aria-hidden="true" style={{color:'var(--wheel-ink, var(--ink))'}}>
  {getRingsDef().map(ring=><g key={ring.key} fill="none" stroke={ring.r<2?'var(--wheel-warm, var(--copper))':'var(--wheel-metal, var(--accent))'}>
   <circle r={ring.r} strokeWidth={ring.primary ? .012 : .006} opacity={ring.primary ? .62 : .3}/>
   {ring.primary&&<text x="0" y={-ring.r-.12} textAnchor="middle" fill="currentColor" stroke="none" fontSize=".16" letterSpacing=".025">{ring.label}</text>}
  </g>)}
  <text x="0" y="0" textAnchor="middle" dominantBaseline="central" fill="var(--wheel-ink, var(--ink))" fontFamily="Georgia,serif" fontSize=".45">π</text>
 </svg>
}

// Copied-adapted from version-22/celestial-replica/view.tsx. Its inline framing,
// keyboard controls and scene lifecycle are preserved without a new mode.
export default function CelestialWheel({en=true,reduced=false,theme='dark'}:{en?:boolean;reduced:boolean;theme:'dark'|'light'}){
 const host=useRef<HTMLDivElement>(null),engine=useRef<WheelController|null>(null);
 const [ready,setReady]=useState(false),[failed,setFailed]=useState(false),[paused,setPaused]=useState(false);
 const settings=useRef({reduced,paused,theme});settings.current={reduced,paused,theme};
 useEffect(()=>{
  let disposed=false;
  document.fonts.ready.then(()=>{
   if(disposed||!host.current)return;
   try{engine.current=createCelestialWheel(host.current,{
    ...settings.current,
    onReady:()=>{if(!disposed)setReady(true)},
    onError:()=>{if(!disposed){setFailed(true);setReady(false)}},
   })}catch{if(!disposed)setFailed(true)}
  });
  return()=>{disposed=true;engine.current?.dispose();engine.current=null};
 },[]);
 useEffect(()=>engine.current?.setState({reduced,paused,theme}),[reduced,paused,theme]);
 const toggle=()=>{if(!reduced&&!failed)setPaused(value=>!value)};
 const replay=()=>{if(reduced||failed)return;setPaused(false);engine.current?.setState({paused:false,reduced,theme});engine.current?.restart()};
 // Keep the artwork free of overlay controls; pause/replay are keyboard-only.
 return <div className="celestial-wheel" role="group" tabIndex={0}
  aria-label={en?'Celestial wheel: Data, Information, Knowledge, Model and Wisdom. P pauses or resumes, R replays':'周天：数据、信息、知识、模型与智慧。P 暂停或继续，R 重播'}
  aria-keyshortcuts="P R"
  onKeyDown={event=>{if(event.metaKey||event.ctrlKey||event.altKey||event.repeat)return;const key=event.key.toLowerCase();if(key==='p'){event.preventDefault();event.stopPropagation();toggle()}else if(key==='r'){event.preventDefault();event.stopPropagation();replay()}}}>
  <div className="celestial-wheel-canvas" ref={host} aria-hidden="true"/>
  {!ready&&<StillWheel/>}
  <p className="sr-only" role="status">{failed?(en?'Animation unavailable; a static view is shown':'动效暂不可用，已显示静态视图'):paused?(en?'Animation paused':'动态已暂停'):''}</p>
 </div>
}
