import * as THREE from 'three';
import {discoveryExperiment as experiment, trace, STEPS} from '../discovery-model.mjs';

/* Reuse: direct-import THREE 0.185.1 from the host. The version-21 palette
 * adapts the approved piai-redesign-20 scene. Lifecycle and glow construction are
 * copied-adapted from artifacts/ui-prototypes/discovery-observatory.js.
 * Its rejected scene and hardcoded evidence are not reused.
 * MIT License — Copyright (c) 2026 zaoxu001.
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions: The above copyright notice and this
 * permission notice shall be included in all copies or substantial portions of
 * the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
 * EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES
 * OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */
// copied-adapted from the approved discovery-motion-01/refined/scene.js
// Keep the selected visual sequence; the page owns language, theme and reduced motion.
/** @typedef {{setState(next: {en?: boolean, reduced?: boolean, theme?: 'dark' | 'light'}): void, dispose(): void}} DiscoveryObservatoryController */
/**
 * @param {HTMLElement} host
 * @param {{en?: boolean, reduced?: boolean, theme?: 'dark' | 'light', onReady?: () => void, onError?: () => void}} [options]
 * @returns {DiscoveryObservatoryController}
 */
export function createDiscoveryObservatory(host, {en=true, reduced=false, theme='dark', onReady, onError}={}) {
const elements = new Map();
const $ = name => { if (!elements.has(name)) elements.set(name, host.querySelector(`[data-discovery="${name}"]`)); return elements.get(name); };
const el = $('scene'), duration = 26;
let time = reduced ? 23 : 0, resumeTime = 0;
let visible = false, raf = 0, previous = 0, disposed = false;
let frameCount=0, width=1, height=1, ro, io;
const S = (a,b,t) => {const v=Math.max(0,Math.min(1,(t-a)/(b-a)));return v*v*(3-2*v);};
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
const camera = new THREE.PerspectiveCamera(38,1,.1,100);
const resources = {geometries:new Set(),materials:new Set(),textures:new Set()};
const geo = g => (resources.geometries.add(g),g);
const palettes = {
  dark: {gold:0xe6b77c,ice:0xa9d8c7,white:0xedf3ed,mint:0xa9d8c7,core:0xf4e5c9,star:0x8faebd,background:0x0a151a,field:[.48,.76,.82],sheet:[.30,.67,.66]},
  light: {gold:0x956d42,ice:0x2b6664,white:0x182c32,mint:0x2b6664,core:0x956d42,star:0x2b6664,background:0xf4f5f1,field:[43/255,102/255,100/255],sheet:[43/255,102/255,100/255]},
};
let palette = palettes[theme];
function mat(material, role) {
  resources.materials.add(material);
  material.userData.themeColorRole = role;
  material.userData.darkBlending = material.blending;
  if (theme === 'light' && material.blending === THREE.AdditiveBlending) material.blending = THREE.NormalBlending;
  return material;
}
let renderer;
try { renderer = new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'high-performance'}); }
catch { throw new Error('WebGL unavailable'); }
renderer.setClearColor(palette.background,0);renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.domElement.setAttribute('aria-hidden','true');el.appendChild(renderer.domElement);
function glowMap(){const c=document.createElement('canvas');c.width=c.height=96;const x=c.getContext('2d');const g=x.createRadialGradient(48,48,0,48,48,48);g.addColorStop(0,'#fff');g.addColorStop(.06,'#fff');g.addColorStop(.17,'rgba(255,255,255,.64)');g.addColorStop(.43,'rgba(255,255,255,.09)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,96,96);const map=new THREE.CanvasTexture(c);resources.textures.add(map);return map;}
const glow=glowMap();
scene.add(new THREE.AmbientLight(0xadcdda,1.2));
const keyLight=new THREE.DirectionalLight(0xffedce,4);keyLight.position.set(-2,5,7);scene.add(keyLight);
const rimLight=new THREE.DirectionalLight(0x8bcbf2,3);rimLight.position.set(3,-1,2);scene.add(rimLight);
function sprite(size,role='gold'){const m=mat(new THREE.SpriteMaterial({map:glow,color:palette[role],transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}),role);const s=new THREE.Sprite(m);s.scale.setScalar(size);world.add(s);return s;}
function line(points,role,opacity=.5,dashed=false){const color=palette[role];const g=geo(new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p))));const material=mat(dashed?new THREE.LineDashedMaterial({color,transparent:true,opacity,depthWrite:false,dashSize:.075,gapSize:.075}):new THREE.LineBasicMaterial({color,transparent:true,opacity,depthWrite:false}),role);const o=new THREE.Line(g,material);if(dashed)o.computeLineDistances();world.add(o);return o;}
// TubeGeometry normally uses arc-length sampling. The simulated observations
// use fixed x steps, so both tube and moving probe must share this parameter.
class MeasuredCurve extends THREE.CatmullRomCurve3 {
  getPointAt(t,target){return this.getPoint(t,target);}
  getTangentAt(t,target){return this.getTangent(t,target);}
}
function beam(points){
  const curve=new MeasuredCurve(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
  const g=geo(new THREE.TubeGeometry(curve,STEPS,.013,6,false));
  const m=mat(new THREE.MeshBasicMaterial({color:palette.gold,transparent:true,opacity:.9,depthWrite:false}),'gold');
  const mesh=new THREE.Mesh(g,m);world.add(mesh);
  const halo=new THREE.Mesh(geo(new THREE.TubeGeometry(curve,STEPS,.052,5,false)),mat(new THREE.MeshBasicMaterial({color:palette.gold,transparent:true,opacity:.035,depthWrite:false,blending:THREE.AdditiveBlending}),'gold'));world.add(halo);
  const light=sprite(.35);
  const core=new THREE.Mesh(geo(new THREE.SphereGeometry(.037,20,12)),mat(new THREE.MeshStandardMaterial({color:palette.core,metalness:.65,roughness:.26,emissive:0x947748,emissiveIntensity:.15,transparent:true}),'core'));
  world.add(core);
  const grainGeometry=geo(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(15*3),3)));
  const grainMaterial=mat(new THREE.PointsMaterial({map:glow,size:.075,color:palette.gold,transparent:true,depthWrite:false,opacity:.65,blending:THREE.AdditiveBlending}),'gold');
  const grains=new THREE.Points(grainGeometry,grainMaterial);world.add(grains);
  return {mesh,halo,light,core,grains,points,curve};
}
function at(points,t){const q=clamp(t)*STEPS,i=Math.min(STEPS-1,Math.floor(q)),f=q-i;return new THREE.Vector3(...points[i]).lerp(new THREE.Vector3(...points[i+1]),f);}
function showBeam(b,p,opacity,t){
  const n=Math.max(0,Math.floor(clamp(p)*STEPS));
  b.mesh.geometry.setDrawRange(0,n*36);b.mesh.material.opacity=opacity;
  b.halo.geometry.setDrawRange(0,n*30);b.halo.material.opacity=opacity*.038;
  const head=b.curve.getPoint(clamp(p));b.light.position.copy(head);b.core.position.copy(head);
  const active=opacity*(p>0?1:0)*(p<.999?1:.62);
  b.light.material.opacity=active*.85;b.core.material.opacity=active;
  const a=b.grains.geometry.attributes.position;
  for(let i=0;i<15;i++){const fraction=Math.max(0,p-i*.009);const v=b.curve.getPoint(fraction);a.setXYZ(i,v.x,v.y,v.z);}
  a.needsUpdate=true;b.grains.material.opacity=active*.8;
}
const trials=experiment.trials.map(t=>({actual:beam(t.actual),predicted:line(t.predicted,'ice',.5,true),expected:sprite(.14,'ice'),gap:line([t.predicted.at(-1),t.actual.at(-1)],'gold',0,true)}));
trials.forEach((o,i)=>o.expected.position.set(...experiment.trials[i].predicted.at(-1)));
const validation=experiment.heldOut.map(t=>({actual:beam(t.actual),predicted:line(t.predicted,'ice',0,true),end:sprite(.18,'mint')}));
validation.forEach((o,i)=>o.end.position.set(...experiment.heldOut[i].predicted.at(-1)));
const ports=experiment.candidates.map(y=>{const point=sprite(.09,'ice');point.position.set(-5,y,0);return point;});
const launcher=sprite(.4,'white'), launcherCore=sprite(.1,'gold');
const launchRail=line([[-5,-2.55,0],[-5,2.55,0]],'ice',.1);
const choices=experiment.candidates.map(y=>line([[-5.22,y,0],[-5.04,y,0]],'ice',.2));
// Background lines are predictions of the current learned model, not observations.
// A single shader morphs the whole prediction family as each observation updates it.
const fieldModels=[[0,0],...experiment.trials.map(t=>t.after)];
const fields=fieldModels.map(model=>{
  const positions=[];
  for(const z of [-.68,0,.68])for(let j=0;j<23;j++){
    const path=trace(model,-2.3+j*4.6/22,z);
    for(let k=0;k<STEPS;k++)positions.push(...path[k],...path[k+1]);
  }
  return new Float32Array(positions);
});
const fieldGeometry=geo(new THREE.BufferGeometry());
fieldGeometry.setAttribute('position',new THREE.BufferAttribute(fields[0].slice(),3));fieldGeometry.setAttribute('nextPosition',new THREE.BufferAttribute(fields[1].slice(),3));
const fieldMaterial=mat(new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{mixAmount:{value:0},alpha:{value:0},clock:{value:0},ink:{value:new THREE.Vector3(...palette.field)}},
  vertexShader:'attribute vec3 nextPosition;uniform float mixAmount;varying vec3 p;void main(){p=mix(position,nextPosition,mixAmount);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform float alpha;uniform float clock;uniform vec3 ink;varying vec3 p;void main(){float edge=smoothstep(-4.8,-2.5,p.x)*(1.-smoothstep(2.6,5.,p.x));float thread=.78+.22*cos(p.x*1.3-clock);gl_FragColor=vec4(ink,alpha*edge*thread);}'
}));
const field=new THREE.LineSegments(fieldGeometry,fieldMaterial);field.frustumCulled=false;world.add(field);let fieldIndex=-1;
// A translucent ruled surface uses the same model predictions as the fine ribs.
// It adds material depth without adding a different physical object or metaphor.
const sheetModels=fields.map(source=>{
 const out=[];
 for(let j=0;j<23;j++)for(let k=0;k<=STEPS;k++){
  const q=(23+j)*STEPS*6+Math.min(k,STEPS-1)*6+(k===STEPS?3:0);
  out.push(source[q],source[q+1],source[q+2]);
 }
 return new Float32Array(out);
});
const sheetGeometry=geo(new THREE.BufferGeometry());
sheetGeometry.setAttribute('position',new THREE.BufferAttribute(sheetModels[0].slice(),3));sheetGeometry.setAttribute('nextPosition',new THREE.BufferAttribute(sheetModels[1].slice(),3));
const sheetIndices=[];for(let j=0;j<22;j++)for(let k=0;k<STEPS;k++){const a=j*(STEPS+1)+k,b=a+STEPS+1;sheetIndices.push(a,b,a+1,a+1,b,b+1);}sheetGeometry.setIndex(sheetIndices);
const sheetMaterial=mat(new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
 uniforms:{mixAmount:{value:0},alpha:{value:0},clock:{value:0},ink:{value:new THREE.Vector3(...palette.sheet)}},
 vertexShader:'attribute vec3 nextPosition;uniform float mixAmount;varying vec3 p;void main(){p=mix(position,nextPosition,mixAmount);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
 fragmentShader:'uniform float alpha;uniform float clock;uniform vec3 ink;varying vec3 p;void main(){float edge=smoothstep(-5.,-2.4,p.x)*(1.-smoothstep(2.9,5.,p.x));float silk=.48+.35*cos(p.y*2.-p.x*.3);gl_FragColor=vec4(ink,alpha*edge*silk);}'
}));const sheet=new THREE.Mesh(sheetGeometry,sheetMaterial);sheet.frustumCulled=false;world.add(sheet);
const processPath=$('flow-active'),processLength=processPath.getTotalLength();

// Quiet material depth: calibrated sampling planes, without frames or HUDs.
const specks=[];let seed=854;
const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
for(let i=0;i<180;i++)specks.push((random()-.5)*32,(random()-.5)*17,-4-random()*9);
const stars=new THREE.Points(geo(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(specks,3))),mat(new THREE.PointsMaterial({map:glow,color:palette.star,size:.05,transparent:true,opacity:.3,depthWrite:false}),'star'));scene.add(stars);
function applyTheme() {
  palette = palettes[theme];
  renderer.setClearColor(palette.background,0);
  resources.materials.forEach(material => {
    const role = material.userData.themeColorRole;
    if (role) material.color.setHex(palette[role]);
    const blending = theme === 'light' && material.userData.darkBlending === THREE.AdditiveBlending ? THREE.NormalBlending : material.userData.darkBlending;
    if (material.blending !== blending) { material.blending = blending; material.needsUpdate = true; }
    if (role === 'core') {
      material.emissive.setHex(theme === 'light' ? palette.gold : 0x947748);
      material.emissiveIntensity = theme === 'light' ? .02 : .15;
    }
  });
  fieldMaterial.uniforms.ink.value.set(...palette.field);
  sheetMaterial.uniforms.ink.value.set(...palette.sheet);
  stars.material.opacity = theme === 'light' ? .16 : .3;
  el.dataset.theme = theme;
}
// The exact same trial paths are used by the renderer and the inference audit.
const START=[0,5,10,14.5],END=[5,10,14.5,19];
const text = {
  en:{nextStep:'New question',predictStep:'Predict',experimentStep:'Experiment',compareStep:'Compare',refineStep:'Refine',prediction:'Prediction',observation:'Observation',titles:['An unexpected turn','Choosing the next experiment','An explanation taking shape','Putting the model to the test','One model, new predictions'],captions:['The particle takes a different path than predicted','The system selects where competing explanations disagree most','New evidence changes the model and its predictions','Another measurement checks what the model has learned','Six held-out trajectories test the learned model'],launch:'Probe selected',deviation:'Prediction differs',align:'Prediction checked',verify:'UNSEEN TRAJECTORIES',sample:'OBSERVATION',},
  zh:{nextStep:'新的问题',predictStep:'提出预测',experimentStep:'自主实验',compareStep:'对照证据',refineStep:'修正模型',prediction:'预测轨迹',observation:'观测轨迹',titles:['运动偏离了预测','系统自己选择下一次探测','新证据改变了原来的解释','用新的测量继续检验','同一个模型，预测新的轨迹'],captions:['粒子的实际运动，与预先画出的轨迹不同','系统自动选择不同解释分歧最大的位置进行探测','新的观测结果，让预测轨迹随之修正','再次探测，检验修正后的解释','用六条未参与拟合的轨迹，检验模型的预测'],launch:'选定探测位置',deviation:'预测出现偏差',align:'检验新预测',verify:'未参与拟合的轨迹',sample:'观测',}
};
const dict=()=>text[en?'en':'zh'];
let lastStage=-1;
function language(){host.querySelectorAll('[data-text]').forEach(e=>e.textContent=dict()[e.dataset.text]);lastStage=-1;}
function label(element,point,labelText,opacity,dy=-16){
  const v=world.localToWorld(new THREE.Vector3(...point)).project(camera);
  element.textContent=labelText;element.style.left=`${el.offsetLeft+clamp((v.x+1)*width/2,58,width-58)}px`;element.style.top=`${el.offsetTop+clamp((1-v.y)*height/2+dy,24,height-8)}px`;element.style.opacity=String(opacity);
}
function render(now){
  const mobile=width<650,t=time,phase=t/duration*Math.PI*2;
  const fade=S(0,.22,t)*(1-S(25.25,26,t));
  const reveal=S(18.7,21,t)*(1-S(24.7,26,t));
  world.scale.set(mobile?1:camera.aspect*.53,mobile?Math.min(1.4,camera.aspect*1.45):.80,1.4);
  world.rotation.set(.035*Math.sin(phase),-.07+.10*Math.sin(phase),mobile?-Math.PI/2:-.028+.018*Math.sin(phase));
  const halfHeight=mobile?5.8:3.28;
  const distance=halfHeight/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  camera.position.set(.65*Math.sin(phase),1.1+.2*Math.sin(phase),distance);
  camera.lookAt(mobile?-.15:0,mobile?0:-.56,0);camera.updateMatrixWorld();world.updateMatrixWorld(true);
  let round=t<5?0:t<10?1:t<14.5?2:t<19?3:4;
  let modelIndex=0,modelBlend=0;
  for(let i=0;i<END.length;i++)if(t>=END[i]-.8){modelIndex=i;modelBlend=S(END[i]-.8,END[i]-.08,t);}
  if(t>=24.7){modelIndex=4;modelBlend=S(24.7,26,t);}
  const nextIndex=modelIndex===4?0:modelIndex+1;
  if(modelIndex!==fieldIndex){
    for(const [geometry,models] of [[fieldGeometry,fields],[sheetGeometry,sheetModels]]) {
      for(const [name,index] of [['position',modelIndex],['nextPosition',nextIndex]]) {
        geometry.attributes[name].array.set(models[index]);geometry.attributes[name].needsUpdate=true;
      }
    }
    fieldIndex=modelIndex;
  }
  fieldMaterial.uniforms.mixAmount.value=modelBlend;
  fieldMaterial.uniforms.alpha.value=.025+fade*(.045+.075*S(3.8,5.1,t));fieldMaterial.uniforms.clock.value=phase*2;
  sheetMaterial.uniforms.mixAmount.value=modelBlend;sheetMaterial.uniforms.alpha.value=fade*.045*S(3.8,5.1,t);sheetMaterial.uniforms.clock.value=phase;
  for(let i=0;i<trials.length;i++){
    const o=trials[i],start=START[i],end=END[i],local=t-start;
    const live=t>=start&&t<end;
    const past=t>=end;
    const p=clamp((local-.55)/(end-start-1.45));
    const a=fade*(live?1:past?.18*(1-reveal):0);
    showBeam(o.actual,p,a,t);
    const appear=S(start,start+.45,t),retire=1-S(end-.12,end+.12,t);
    const refine=S(end-.80,end-.12,t),attr=o.predicted.geometry.attributes.position;
    for(let k=0;k<=STEPS;k++){const p0=experiment.trials[i].predicted[k],p1=experiment.trials[i].revised[k];attr.setXYZ(k,THREE.MathUtils.lerp(p0[0],p1[0],refine),THREE.MathUtils.lerp(p0[1],p1[1],refine),p0[2]);}
    attr.needsUpdate=true;o.predicted.computeLineDistances();o.predicted.material.color.setHex(refine>.02?palette.mint:palette.ice);
    o.predicted.material.opacity=fade*.60*appear*retire;
    o.predicted.geometry.setDrawRange(0,Math.floor(STEPS*clamp(local/.6))+1);
    o.expected.material.opacity=fade*.70*appear*retire;
    o.gap.material.opacity=fade*S(end-1.1,end-.65,t)*retire*.65;
  }
  for(let i=0;i<validation.length;i++){
    const v=validation[i],start=19+i*.29,local=t-start;
    const p=clamp((local-.55)/3.3),a=fade*S(start,start+.4,t);
    v.predicted.material.opacity=a*.52;
    v.predicted.geometry.setDrawRange(0,Math.floor(STEPS*clamp(local/.65))+1);
    showBeam(v.actual,p,a*.76,t);
    v.end.material.opacity=a*S(start+3.3,start+3.8,t)*.85;
    if(p>=1){
      // Continue one compact packet along the tested path, without stopping time.
      const q=((t-start-3.85)*.43)%1;
      if(q>=0){const pos=at(v.actual.points,q);v.actual.light.position.copy(pos);v.actual.core.position.copy(pos);v.actual.light.material.opacity=a*.7;v.actual.core.material.opacity=a*.8;}
    }
  }
  const which=Math.min(round,3),trial=experiment.trials[which];
  const prevY=which?experiment.trials[which-1].y:trial.y;
  const launchY=THREE.MathUtils.lerp(prevY,trial.y,S(START[which],START[which]+.6,t));
  launcher.position.set(-5,launchY,0);launcherCore.position.copy(launcher.position);
  launcher.material.opacity=fade*(1-reveal)*.8;launcherCore.material.opacity=fade*(1-reveal);
  ports.forEach((o,i)=>{const selected=i===trial.candidate;o.material.opacity=fade*(1-reveal)*(selected?.8:.20);o.scale.setScalar(selected?.14:.07);});
  choices.forEach((o,i)=>{const score=trial.maxScore>1e-10?clamp(trial.scores[i]/trial.maxScore):0;const selected=i===trial.candidate;const points=o.geometry.attributes.position;points.setXYZ(0,-5.06-.08-.35*score,experiment.candidates[i],0);points.needsUpdate=true;o.material.opacity=fade*(1-reveal)*(selected?.8:.1+.33*score);o.material.color.setHex(selected?palette.gold:palette.ice);});
  launchRail.material.opacity=.12*fade*(1-reveal);
  const end=END[which],check=S(end-1.15,end-.85,t)*(1-S(end-.2,end+.1,t));
  label($('launch-label'),[-5,launchY,0],dict().launch,fade*(1-reveal)*S(START[which]+.3,START[which]+.7,t),-23);
  label($('error-label'),trial.actual.at(-1),trial.error>.2?dict().deviation:dict().align,check*fade,-20);
  if(round!==lastStage){
    $('process-3').querySelector('[data-text]').textContent=round===4?dict().nextStep:dict().refineStep;
    $('scene-title').textContent=dict().titles[round];$('narrative').textContent=dict().captions[round];
    $('probe-id').textContent=round===4?dict().verify:`${dict().sample} ${String(round+1).padStart(2,'0')} / 04`;

    lastStage=round;
  }
  let step,flow;
  if(round<4){const local=t-START[round],len=END[round]-START[round];const knots=[0,.55,len-.90,len-.55,len];const positions=[0,.145,.290,.435,1];step=local<knots[1]?0:local<knots[2]?1:local<knots[3]?2:3;flow=THREE.MathUtils.lerp(positions[step],positions[step+1],S(knots[step],knots[step+1],local));}
  else{const local=t-19;step=local<.65?0:local<4.8?1:local<5.7?2:3;const knots=[0,.65,4.8,5.7,7],positions=[0,.145,.290,.435,1];flow=THREE.MathUtils.lerp(positions[step],positions[step+1],S(knots[step],knots[step+1],local));}
  for(let i=0;i<4;i++)$('process-'+i).setAttribute('aria-current',String(i===step));
  processPath.setAttribute('stroke-dashoffset',String(-flow));const processPoint=processPath.getPointAtLength(flow*processLength);$('flow-dot').setAttribute('cx',processPoint.x);$('flow-dot').setAttribute('cy',processPoint.y);
  renderer.render(scene,camera);frameCount++;
  el.dataset.time=t.toFixed(3);el.dataset.stage=String(round);el.dataset.frames=String(frameCount);el.dataset.state=disposed?'disposed':document.hidden?'hidden':!visible?'offscreen':reduced?'reduced':'running';
}
function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;previous=0;}
function canRender(){return !disposed&&visible&&!document.hidden&&width>0&&height>0;}
function schedule(){if(canRender()&&!raf)raf=requestAnimationFrame(frame);}
function frame(now){raf=0;if(!canRender()){cancel();return;}if(!reduced&&previous)time=(time+Math.min((now-previous)/1000,.08))%duration;previous=now;render(now);if(!reduced)schedule();else previous=0;}
function resize(){if(disposed)return;width=el.clientWidth;height=el.clientHeight;if(!width||!height){cancel();return;}renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.65));renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();render(0);schedule();}
function onVisibility(){if(document.hidden){cancel();el.dataset.state='hidden';}else{previous=0;schedule();}}
function setState(next){
  if(disposed)return;
  if(next.en!==undefined&&next.en!==en){en=next.en;language();}
  if(next.theme!==undefined&&next.theme!==theme){theme=next.theme;applyTheme();}
  if(next.reduced!==undefined&&next.reduced!==reduced){
    if(next.reduced){resumeTime=time;time=23;}else time=resumeTime;
    reduced=next.reduced;cancel();
  }
  render(0);schedule();
}
function onContextLost(e){e.preventDefault();dispose();el.dataset.state='unavailable';$('scene-title').textContent=dict().titles[4];$('narrative').textContent=dict().captions[4];$('probe-id').textContent=dict().verify;onError?.();}
function dispose(){
  if(disposed)return;disposed=true;cancel();ro?.disconnect();io?.disconnect();
  document.removeEventListener('visibilitychange',onVisibility);
  renderer.domElement.removeEventListener('webglcontextlost',onContextLost);
  resources.geometries.forEach(g=>g.dispose());resources.materials.forEach(m=>m.dispose());resources.textures.forEach(t=>t.dispose());
  renderer.dispose();renderer.domElement.remove();el.dataset.state='disposed';
}
try {
  document.addEventListener('visibilitychange',onVisibility);
  renderer.domElement.addEventListener('webglcontextlost',onContextLost);
  ro=new ResizeObserver(resize);ro.observe(el);
  io=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;if(visible)schedule();else{cancel();el.dataset.state='offscreen';}},{threshold:.05});io.observe(el);
  language();applyTheme();resize();onReady?.();
} catch(error){dispose();throw error;}
return {setState,dispose};
}
