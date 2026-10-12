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
  light: {gold:0x26476b,ice:0x2f7480,white:0x0f1b22,mint:0x1d5964,core:0x26476b,star:0x3b6680,background:0xf3f5f7,field:[29/255,89/255,100/255],sheet:[29/255,89/255,100/255]},
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
// Observations stay as gold beams. Predictions are no longer one dashed line:
// every explanation the posterior still allows is drawn, so evidence visibly
// narrows the fan from many paths to one bundle. Paths are rank-matched so the
// contraction is continuous.
const trials=experiment.trials.map(t=>({actual:beam(t.actual)}));
const validation=experiment.heldOut.map(t=>({actual:beam(t.actual)}));
const ports=experiment.candidates.map(y=>{const point=sprite(.09,'ice');point.position.set(-5,y,0);return point;});
const launcher=sprite(.4,'white'), launcherCore=sprite(.1,'gold');
const K=72,P=22,ROW=(STEPS+1)*3,hypotheses=experiment.hypotheses;
const prior=hypotheses.map(()=>1/hypotheses.length);
function resample(weights){const out=[],total=weights.reduce((a,b)=>a+b,0);let c=weights[0],i=0;for(let k=0;k<K;k++){const target=(k+.5)/K*total;while(c<target&&i<weights.length-1){i++;c+=weights[i];}out.push(i);}return out;}
function fan(weights,starts,depths){
  const picks=resample(weights);
  const mean=[0,1].map(d=>picks.reduce((s,i)=>s+hypotheses[i][d],0)/K);
  const rows=picks.map((h,j)=>{const y0=starts[j%starts.length],base=depths[j%depths.length];const path=trace(hypotheses[h],y0);const spread=Math.max(-1.3,Math.min(1.3,((hypotheses[h][0]-mean[0])-(hypotheses[h][1]-mean[1]))*1.4));return {key:j%starts.length*100+path.at(-1)[1],path:path.map(([x,y])=>[x,y,base+spread*((x+5)/10)**1.3])};});
  rows.sort((a,b)=>a.key-b.key);
  const paths=new Float32Array(K*ROW),lines=new Float32Array(K*STEPS*6);
  rows.forEach(({path},j)=>{path.forEach((q,k)=>paths.set(q,j*ROW+k*3));for(let k=0;k<STEPS;k++)lines.set([...path[k],...path[k+1]],(j*STEPS+k)*6);});
  return {paths,lines};
}
const fans=experiment.trials.map((t,i)=>[fan(i?experiment.trials[i-1].weights:prior,[t.y],[0]),fan(t.weights,[t.y],[0])]);
const finalFan=fan(experiment.trials.at(-1).weights,experiment.heldOut.map(h=>h.y),experiment.heldOut.map(h=>h.z));
fans.push([finalFan,finalFan]);
const fanGeometry=geo(new THREE.BufferGeometry());
fanGeometry.setAttribute('position',new THREE.BufferAttribute(fans[0][0].lines.slice(),3));fanGeometry.setAttribute('nextPosition',new THREE.BufferAttribute(fans[0][1].lines.slice(),3));
const fieldMaterial=mat(new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{mixAmount:{value:0},alpha:{value:0},reach:{value:0},ink:{value:new THREE.Vector3(...palette.field)}},
  vertexShader:'attribute vec3 nextPosition;uniform float mixAmount;varying vec3 p;void main(){p=mix(position,nextPosition,mixAmount);gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);}',
  fragmentShader:'uniform float alpha;uniform float reach;uniform vec3 ink;varying vec3 p;void main(){float drawn=1.-smoothstep(reach-.6,reach,p.x);float tail=.55+.45*smoothstep(-5.,0.,p.x);gl_FragColor=vec4(ink,alpha*drawn*tail);}'
}));
const fanLines=new THREE.LineSegments(fanGeometry,fieldMaterial);fanLines.frustumCulled=false;world.add(fanLines);let fanIndex=-1;
const particleGeometry=geo(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(K*P*3),3)));
const particleMaterial=mat(new THREE.PointsMaterial({map:glow,size:.085,color:palette.ice,transparent:true,depthWrite:false,opacity:0,blending:THREE.AdditiveBlending}),'ice');
const particles=new THREE.Points(particleGeometry,particleMaterial);particles.frustumCulled=false;world.add(particles);
const offsets=Array.from({length:K},(_,j)=>((j*.6180339887)%1));
function flowParticles(before,after,blend,reach,t){
  const a=particleGeometry.attributes.position;
  for(let n=0;n<K*P;n++){
    const j=n%K,k=Math.floor(n/K),u=(k/P+offsets[j]+t*.085)%1,q=u*STEPS,i=Math.min(STEPS-1,Math.floor(q)),f=q-i,o=j*ROW+i*3;
    for(let d=0;d<3;d++){const b0=before[o+d]+(before[o+3+d]-before[o+d])*f,b1=after[o+d]+(after[o+3+d]-after[o+d])*f;a.array[n*3+d]=b0+(b1-b0)*blend;}
    if(a.array[n*3]>reach)a.array[n*3+1]=1e4;
  }
  a.needsUpdate=true;
}
// The two hidden force centres. Their glow is the posterior mean strength; the
// faint halo around each is the posterior spread, so it tightens with evidence.
const CENTERS=[[-1.45,.85],[1.25,-.8]];
function moments(weights){return [0,1].map(d=>{let m=0,v=0;weights.forEach((w,i)=>m+=w*hypotheses[i][d]);weights.forEach((w,i)=>v+=w*(hypotheses[i][d]-m)**2);return [m,Math.sqrt(v)];});}
const stats=[moments(prior),...experiment.trials.map(t=>moments(t.weights))];
const bodies=CENTERS.map(([x,y])=>{const core=sprite(.3,'gold'),halo=sprite(1,'ice'),ring=new THREE.Mesh(geo(new THREE.RingGeometry(.985,1,96)),mat(new THREE.MeshBasicMaterial({color:palette.ice,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}),'ice'));core.position.set(x,y,0);halo.position.set(x,y,-.01);ring.position.set(x,y,0);world.add(ring);return {core,halo,ring};});
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
  el.dataset.theme = theme;
}
// The exact same trial paths are used by the renderer and the inference audit.
const START=[0,5,10,14.5],END=[5,10,14.5,19];
const text = {
  en:{captions:['Hidden forces bend the path, and many explanations still fit','The agent probes where the explanations disagree most','Each observation rules out the explanations it contradicts','One more measurement tests what remains','The learned forces predict six paths never measured']},
  zh:{captions:['隐藏的力让轨迹弯曲，许多解释都还说得通','智能体在解释分歧最大的地方继续探测','每一次观测，都排除与它矛盾的解释','再测一次，检验留下来的解释','学到的力，预测六条从未测过的轨迹']}
};
const dict=()=>text[en?'en':'zh'];
let lastStage=-1;
function language(){lastStage=-1;}
function label(element,point,labelText,opacity,dy=-16){
  const v=world.localToWorld(new THREE.Vector3(...point)).project(camera);
  element.textContent=labelText;element.style.left=`${el.offsetLeft+clamp((v.x+1)*width/2,58,width-58)}px`;element.style.top=`${el.offsetTop+clamp((1-v.y)*height/2+dy,24,height-8)}px`;element.style.opacity=String(opacity);
}
function render(now){
  const mobile=width<650,t=time,phase=t/duration*Math.PI*2;
  const fade=S(0,.22,t)*(1-S(25.25,26,t));
  const reveal=S(18.7,21,t)*(1-S(24.7,26,t));
  world.scale.set(mobile?1:camera.aspect*.53,mobile?Math.min(1.4,camera.aspect*1.45):.80,1.4);
  world.rotation.set(.06*Math.sin(phase),-.10+.16*Math.sin(phase),mobile?-Math.PI/2:-.028+.018*Math.sin(phase));
  const halfHeight=mobile?6.2:3.45;
  const distance=halfHeight/Math.tan(THREE.MathUtils.degToRad(camera.fov/2));
  camera.position.set(.65*Math.sin(phase),1.1+.2*Math.sin(phase),distance);
  camera.lookAt(mobile?-.15:0,mobile?0:-.62,0);camera.updateMatrixWorld();world.updateMatrixWorld(true);
  let round=t<5?0:t<10?1:t<14.5?2:t<19?3:4;
  const start=round<4?START[round]:19,end=round<4?END[round]:24.7;
  if(round!==fanIndex){
    fanGeometry.attributes.position.array.set(fans[round][0].lines);fanGeometry.attributes.nextPosition.array.set(fans[round][1].lines);
    fanGeometry.attributes.position.needsUpdate=fanGeometry.attributes.nextPosition.needsUpdate=true;fanIndex=round;
  }
  const blend=round<4?S(end-1.6,end-.35,t):0;
  const envelope=fade*S(start,start+.5,t)*(round<4?1-S(end-.25,end+.05,t):1);
  const reach=-5+10.6*S(start+.1,start+(round<4?1.6:2.2),t);
  const light=theme==='light';
  fieldMaterial.uniforms.mixAmount.value=blend;fieldMaterial.uniforms.reach.value=reach;
  fieldMaterial.uniforms.alpha.value=envelope*(light?.09:.075);
  particleMaterial.opacity=envelope*(light?.55:.9);
  flowParticles(fans[round][0].paths,fans[round][1].paths,blend,reach,t);
  for(let i=0;i<trials.length;i++){
    const o=trials[i],s0=START[i],e0=END[i];
    const live=t>=s0&&t<e0,past=t>=e0;
    const p=clamp((t-s0-1.2)/(e0-s0-3.2));
    showBeam(o.actual,p,fade*(live?1:past?.16*(1-reveal):0),t);
  }
  for(let i=0;i<validation.length;i++){
    const v=validation[i],s0=19+i*.29,local=t-s0;
    const p=clamp((local-1.2)/3.1),a=fade*S(s0+.8,s0+1.2,t);
    showBeam(v.actual,p,a*.8,t);
    if(p>=1){const q=((t-s0-4.3)*.43)%1;if(q>=0){const pos=at(v.actual.points,q);v.actual.light.position.copy(pos);v.actual.core.position.copy(pos);v.actual.light.material.opacity=a*.7;v.actual.core.material.opacity=a*.8;}}
  }
  const which=Math.min(round,3),trial=experiment.trials[which];
  const prevY=which?experiment.trials[which-1].y:trial.y;
  const launchY=THREE.MathUtils.lerp(prevY,trial.y,S(START[which],START[which]+.6,t));
  launcher.position.set(-5,launchY,0);launcherCore.position.copy(launcher.position);
  launcher.material.opacity=fade*(1-reveal)*.8;launcherCore.material.opacity=fade*(1-reveal);
  // Candidate probes: size is the predictive disagreement the system measured there.
  ports.forEach((o,i)=>{const score=trial.maxScore>1e-10?clamp(trial.scores[i]/trial.maxScore):0;const selected=i===trial.candidate;o.material.color.setHex(selected?palette.gold:palette.ice);o.material.opacity=fade*(1-reveal)*(selected?.9:.04+.34*score*score);o.scale.setScalar(selected?.18:.035+.12*score);});
  const sa=stats[Math.min(round,4)],sb=stats[Math.min(round+1,4)],k=round<4?blend:0;
  const light2=theme==='light';
  bodies.forEach((o,d)=>{const m=sa[d][0]+(sb[d][0]-sa[d][0])*k,sd=sa[d][1]+(sb[d][1]-sa[d][1])*k;
    const sure=clamp(1-sd*2.4);
    o.core.scale.setScalar(.18+.42*m*(.5+.5*sure));o.core.material.opacity=fade*(light2?.6:1)*(.3+.7*sure);
    const r=.18+sd*2.2;o.halo.scale.setScalar(r*2.1);o.halo.material.opacity=fade*(light2?.035:.09)*(.4+.6*sure);
    o.ring.material.opacity=0;});
  if(round!==lastStage){$('narrative').textContent=dict().captions[round];lastStage=round;}
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
function onContextLost(e){e.preventDefault();dispose();el.dataset.state='unavailable';$('narrative').textContent=dict().captions[4];onError?.();}
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
