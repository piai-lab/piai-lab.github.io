import React, {useEffect, useRef, useState} from 'react';
import {Plus, Minus} from 'lucide-react';
import {Button} from '../../../../client/src/components/ui/button';
import {createModelField, type ModelField, type ModelTheme} from './reference-scene';

const labels=[['information','信息','Information',11,21],['knowledge','知识','Knowledge',88,18],['data','数据','Data',10,81],['model','模型','Model',90,63],['wisdom','智慧','Wisdom',50,70]] as const;

export default function ModelInfrastructure({en=false,reduced=false,theme='dark'}:{en?:boolean;reduced:boolean;theme:ModelTheme}){
 const host=useRef<HTMLDivElement>(null),engine=useRef<ModelField|null>(null);
 const [failed,setFailed]=useState(false),[paused,setPaused]=useState(false);
 const settings=useRef({reduced,paused,en,theme});settings.current={reduced,paused,en,theme};
 useEffect(()=>{
  if(!host.current)return;
  const scene=createModelField(host.current,()=>setFailed(true));engine.current=scene;scene.setState(settings.current);
  return()=>{scene.dispose();engine.current=null};
 },[]);
 useEffect(()=>engine.current?.setState({reduced,paused,en,theme}),[reduced,paused,en,theme]);
 return <div className={'model-dikw'+(failed?' model-dikw-fallback':'')} role="group" tabIndex={0}
  aria-label={en?'Scientific infrastructure: data, information, knowledge and models connect toward wisdom. P pauses motion, R replays':'科学基础设施：数据、信息、知识与模型共同走向智慧。按 P 暂停，按 R 重播'}
  onKeyDown={event=>{if(event.metaKey||event.ctrlKey||event.altKey||event.repeat)return;
   if(event.key.toLowerCase()==='p'){event.preventDefault();setPaused(p=>!p)}
   if(event.key.toLowerCase()==='r'){event.preventDefault();engine.current?.replay();setPaused(false)}
   if(event.key==='Escape')engine.current?.reset();
  }}>
  <div className="model-dikw-canvas" ref={host} aria-hidden="true"/>
  <div className="model-dikw-labels" aria-hidden="true">{labels.map(([id,zh,english,x,y])=><span key={id} className={'model-dikw-label '+id} style={{left:x+'%',top:y+'%'}}>{en?english:zh}</span>)}</div>
  <div className="model-dikw-zoom" role="group" aria-label={en?'View scale':'视图缩放'}>
   <Button variant="ghost" size="icon" disabled={failed} aria-label={en?'Zoom in':'放大'} onClick={()=>engine.current?.zoom(1)}><Plus size={16}/></Button>
   <Button variant="ghost" size="icon" disabled={failed} aria-label={en?'Zoom out':'缩小'} onClick={()=>engine.current?.zoom(-1)}><Minus size={16}/></Button>
  </div>
  <p className="sr-only" role="status">{failed?(en?'The visualization is unavailable. Data, information, knowledge and models connect toward wisdom':'可视化暂不可用。数据、信息、知识与模型共同走向智慧'):paused?(en?'Motion paused':'动态已暂停'):''}</p>
 </div>
}
