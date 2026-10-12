// Reference-preserving 2.5D composition. The user-selected image supplies the art;
// Local waves deform all five networks; the central pivot and labels stay anchored.
// This deliberately does not claim that the image has been reconstructed as full 3D.
import * as THREE from 'three';
import referenceUrl from '../../../visual-assets/scientific-concepts/wisdom-center-approved-reference.png';
export type ModelTheme='dark'|'light';
export type ModelField={setState:(s:{reduced:boolean;paused:boolean;en?:boolean;theme?:ModelTheme})=>void;zoom:(n:number)=>void;replay:()=>void;reset:()=>void;dispose:()=>void};
const W=1586,H=992,TOP=170,FH=H-TOP,SPEED=1.5,TAIL_STEPS=5;
const labels={information:[162,284],knowledge:[1430,254],data:[121,806],model:[1447,601],wisdom:[805,704]} as const;
// Theme affects pigment and compositing only. The original texture, topology,
// deformation and shared animation clock remain the approved reference's owners.
const themeFragment=`
uniform float uLight;
uniform vec3 uSurface,uInk,uCopper;
vec3 pigment(vec3 source){
 float warm=smoothstep(.012,.12,source.r-source.b)*smoothstep(.025,.16,source.r);
 return mix(uInk,uCopper,warm);
}
`;
// One shared deformation keeps texture strands and travelling sprites attached.
// Compact C1 envelopes anchor the boundaries; neighbouring nodes share the same
// travelling phase. The 8-clock-second period divides the existing 32-second loop.
const surfaceFlow=`
float surfaceLabel(vec2 p,vec4 r){vec2 d=max(r.xy-p,p-r.zw);return 1.-smoothstep(24.,44.,max(d.x,d.y));}
vec2 patchWave(vec2 p,vec2 center,vec2 radius,float phase,float strength,float direction){
 vec2 q=(p-center)/radius;
 float envelope=pow(max(0.,1.-dot(q,q)),2.);
 float spatial=q.x*4.5+q.y*1.1;
 float wave=sin(spatial-phase*direction)-sin(spatial);
 float crossWave=cos(spatial*.7-phase*direction)-cos(spatial*.7);
 return vec2(2.8*crossWave,8.5*wave)*envelope*strength;
}
vec2 surfaceDisplacement(vec2 p){
 float phase=uTime*6.28318530718/8.;
 vec2 flow=patchWave(p,vec2(1240.,365.),vec2(345.,170.),phase,1.,1.)
  +patchWave(p,vec2(335.,355.),vec2(380.,160.),phase,.85,-1.)
  +patchWave(p,vec2(275.,670.),vec2(380.,218.),phase,.58,1.)
  +patchWave(p,vec2(1280.,695.),vec2(290.,220.),phase,.72,-1.);
 float labels=max(max(surfaceLabel(p,vec4(86.,268.,237.,302.)),surfaceLabel(p,vec4(1356.,235.,1510.,274.))),max(max(surfaceLabel(p,vec4(86.,786.,162.,827.)),surfaceLabel(p,vec4(1394.,582.,1507.,622.))),surfaceLabel(p,vec4(730.,682.,887.,725.))));
 float core=smoothstep(1.,1.22,length((p-vec2(800.,485.))/vec2(222.,224.)));
 // Two quadrature shear modes move opposite lobes together around a fixed pivot.
 // The odd spatial field has no whole-object translation or uniform breathing.
 vec2 q=(p-vec2(800.,485.))/vec2(290.,272.);
 float envelope=pow(max(0.,1.-dot(q,q)),2.);
 float shear=sin(phase),diagonal=.6*(1.-cos(phase));
 vec2 centerFlow=34.*envelope*vec2(q.y*shear+q.x*diagonal,q.x*shear-q.y*diagonal);
 float edge=smoothstep(0.,45.,p.x)*smoothstep(0.,45.,1586.-p.x)
  *smoothstep(170.,210.,p.y)*smoothstep(0.,45.,992.-p.y);
 return (flow*core+centerFlow)*(1.-labels)*edge*uMotion;
}
`;
const vertex=`
uniform vec2 uSize;
uniform float uScale,uZoom,uTime,uMotion;
varying vec2 vUv;
${surfaceFlow}
void main(){
 vUv=uv;
 vec2 screen=vec2(uv.x,1.-uv.y)*uSize;
 vec2 p=(screen-uSize*.5)/(uScale*uZoom)+vec2(793.,581.);
 vec2 offset=surfaceDisplacement(p)*uScale*uZoom;
 gl_Position=vec4(position.xy+vec2(offset.x,-offset.y)*2./uSize,0.,1.);
}`;
const fragment=`
precision highp float;
uniform sampler2D uArt;
uniform vec2 uSize;
uniform float uScale;
uniform float uZoom;
uniform float uTime;
uniform float uMotion;
uniform float uNativeLabels;
varying vec2 vUv;
${themeFragment}
const float TAU=6.28318530718;
vec3 art(vec2 px){return texture2D(uArt,vec2(px.x/1586.,1.-px.y/992.)).rgb;}
float boxMask(vec2 p,vec4 r){vec2 d=max(r.xy-p,p-r.zw);return 1.-smoothstep(-1.,3.,max(d.x,d.y));}
vec3 restoreLabel(vec3 c,vec2 p,vec4 r){
 float mask=boxMask(p,r);vec2 t=clamp((p-r.xy)/(r.zw-r.xy),0.,1.);
 // Corner interpolation avoids stretching a star or the gold path across the label.
 vec3 tl=min(art(r.xy-vec2(6.)),art(r.xy-vec2(10.)));
 vec3 tr=min(art(vec2(r.z+6.,r.y-6.)),art(vec2(r.z+10.,r.y-10.)));
 vec3 bl=min(art(vec2(r.x-6.,r.w+6.)),art(vec2(r.x-10.,r.w+10.)));
 vec3 br=min(art(r.zw+vec2(6.)),art(r.zw+vec2(10.)));
 vec3 blank=mix(min(tl,bl),min(tr,br),t.x);
 return mix(c,blank,mask*uNativeLabels);
}
void main(){
 vec2 screen=vec2(vUv.x,1.-vUv.y)*uSize;
 vec2 p=(screen-uSize*.5)/(uScale*uZoom)+vec2(793.,581.);
 float phase=uTime*TAU/16.;
 float protect=max(max(boxMask(p,vec4(86.,268.,237.,302.)),boxMask(p,vec4(1356.,235.,1510.,274.))),max(max(boxMask(p,vec4(86.,786.,162.,827.)),boxMask(p,vec4(1394.,582.,1507.,622.))),boxMask(p,vec4(730.,682.,887.,725.))));
 bool inside=p.x>=0.&&p.x<=1586.&&p.y>=170.&&p.y<=992.;
 vec3 c=art(clamp(p,vec2(0.,170.),vec2(1586.,992.)));
 if(!inside)c=art(vec2(90.,p.y<170.?180.:980.));
 c=restoreLabel(c,p,vec4(86.,268.,237.,302.));
 c=restoreLabel(c,p,vec4(1356.,235.,1510.,274.));
 c=restoreLabel(c,p,vec4(86.,786.,162.,827.));
 c=restoreLabel(c,p,vec4(1394.,582.,1507.,622.));
 c=restoreLabel(c,p,vec4(730.,682.,887.,725.));
 // Isolate small luminous peaks: only existing point cores change brightness.
 // The vertex shader moves the local mesh; luminous peaks retain their identity.
 vec3 neighbours=(art(p+vec2(2.,0.))+art(p-vec2(2.,0.))+art(p+vec2(0.,2.))+art(p-vec2(0.,2.)))*.25;
 float peak=max(max(c.r-neighbours.r,c.g-neighbours.g),c.b-neighbours.b);
 float point=smoothstep(.035,.19,peak)*smoothstep(.18,.65,max(c.r,max(c.g,c.b)));
 float beat=pow(.5+.5*sin(p.x*.036+p.y*.027-phase*4.),3.);
 c*=1.+point*(beat*.65-.12)*uMotion*(1.-protect)*(inside?1.:0.);
 float edge=smoothstep(0.,36.,p.x)*smoothstep(0.,36.,1586.-p.x)*smoothstep(170.,198.,p.y)*smoothstep(0.,28.,992.-p.y);
 vec3 referenceBase=art(vec2(90.,980.));
 c=mix(referenceBase,c,edge);
 // Separate the photographed luminous structure from its dark ground. This
 // preserves the same fine strands as ink on paper, without inverting the page.
 vec3 signal=max(c-referenceBase,vec3(0.));
 float strength=max(signal.r,max(signal.g,signal.b));
 float coverage=pow(clamp(strength*1.4,0.,1.),.68);
 vec3 lightArt=mix(uSurface,pigment(signal),coverage);
 vec3 darkArt=clamp(uSurface+signal,0.,1.);
 c=mix(darkArt,lightArt,uLight);
 gl_FragColor=vec4(c,1.);
 #include <colorspace_fragment>
}
`;

// Only points are rendered here; paths are sampled from the approved image's
// strands, without adding visible curves or changing the reference topology.
const pointVertex=`
uniform vec2 uSize;
uniform float uScale,uZoom,uPixelRatio,uMotion,uTime;
attribute vec3 tint;
attribute float opacity;
attribute float size;
varying vec3 vTint;
varying float vOpacity;
${surfaceFlow}
void main(){
 vec2 p=position.xy+surfaceDisplacement(position.xy);
 vec2 screen=(p-vec2(793.,581.))*uScale*uZoom+uSize*.5;
 gl_Position=vec4(screen.x/uSize.x*2.-1.,1.-screen.y/uSize.y*2.,0.,1.);
 gl_PointSize=size*uPixelRatio*clamp(uScale*uZoom,.55,1.15);
 vTint=tint;vOpacity=opacity*uMotion;
}`;
const pointFragment=`
varying vec3 vTint;
varying float vOpacity;
${themeFragment}
void main(){
 vec2 q=(gl_PointCoord-.5)*2.;float d=dot(q,q);
 float a=(exp(-d*32.)*.92+exp(-d*6.)*.15)*vOpacity;
 if(a<.002)discard;
 gl_FragColor=vec4(mix(vTint,pigment(vTint),uLight),a);
 #include <colorspace_fragment>
}`;

// Three depth layers share a closed harmonic clock. Only these independent
// stars move independently of the local mesh; labels remain anchored.
const starVertex=`
uniform vec2 uSize;
uniform float uTime,uPixelRatio;
attribute vec3 tint;
attribute float size,layer;
varying vec3 vTint;
varying vec2 vScreen;
varying float vOpacity,vDepth;
const float TAU=6.28318530718;
void main(){
 float phase=uTime*TAU/32.;
 float frequency=layer>1.5?2.:1.;
 // Neighbouring stars share a spatial phase field instead of independent jitter.
 // Characteristic speeds across depth follow 1:3:9 (amplitude x frequency).
 float offset=(position.y*.70+position.x*.12)*TAU;
 float radius=layer<.5?.014:layer<1.5?.042:.063;
 vec2 flow=vec2(sin(phase*frequency+offset)-sin(offset),
  (cos(phase*frequency+offset)-cos(offset))*.40)*radius;
 flow=mat2(.956,.292,-.292,.956)*flow;
 vec2 p=position.xy+flow;
 vScreen=p*uSize;
 gl_Position=vec4(p.x*2.-1.,1.-p.y*2.,0.,1.);
 gl_PointSize=size*uPixelRatio;
 float edge=smoothstep(0.,.07,p.x)*smoothstep(0.,.07,1.-p.x)
  *smoothstep(0.,.08,p.y)*smoothstep(0.,.09,1.-p.y);
 float base=layer<.5?.35:layer<1.5?.58:.75;
 vOpacity=base*(.8+.2*sin(phase*3.+offset))*edge;
 vTint=tint;vDepth=layer;
}`;
const starFragment=`
uniform sampler2D uArt;
uniform vec2 uSize;
uniform float uScale,uZoom,uMotion,uTime;
varying vec3 vTint;
varying vec2 vScreen;
varying float vOpacity,vDepth;
${themeFragment}
${surfaceFlow}
float labelMask(vec2 p,vec4 r){vec2 d=max(r.xy-p,p-r.zw);return 1.-smoothstep(4.,18.,max(d.x,d.y));}
void main(){
 vec2 p=(vScreen-uSize*.5)/(uScale*uZoom)+vec2(793.,581.);
 float protect=max(max(labelMask(p,vec4(86.,268.,237.,302.)),labelMask(p,vec4(1356.,235.,1510.,274.))),max(max(labelMask(p,vec4(86.,786.,162.,827.)),labelMask(p,vec4(1394.,582.,1507.,622.))),labelMask(p,vec4(730.,682.,887.,725.))));
 float inside=step(0.,p.x)*step(p.x,1586.)*step(170.,p.y)*step(p.y,992.);
 // Inverse local deformation keeps background stars behind the moving strands.
 vec2 source=p-surfaceDisplacement(p);
 source=p-surfaceDisplacement(source);
 vec3 art=texture2D(uArt,vec2(clamp(source.x/1586.,0.,1.),1.-clamp(source.y/992.,0.,1.))).rgb;
 // Stars pass behind the reference's bright strands, leaving them readable.
 float clear=1.-smoothstep(.018,.18,max(art.r,max(art.g,art.b)))*inside;
 vec2 q=(gl_PointCoord-.5)*2.;float d=dot(q,q);
 float shape=exp(-d*(vDepth>1.5?15.:30.))*.9+exp(-d*5.)*.13;
 float a=shape*vOpacity*clear*(1.-protect)*uMotion;
 if(a<.002)discard;
 gl_FragColor=vec4(mix(vTint,pigment(vTint),uLight),a*mix(1.,.42,uLight));
 #include <colorspace_fragment>
}`;
type Route={points:number[][];color:string;period:number;phase:number};
const routes:Route[]=[
 {points:[[12,389],[196,376],[361,322],[446,269]],color:'#b5e9ff',period:8,phase:0},
 {points:[[157,431],[314,428],[461,393],[629,432]],color:'#9bdfff',period:8,phase:.14},
 {points:[[380,284],[439,317],[554,367],[636,405]],color:'#b5e9ff',period:8,phase:.28},
 {points:[[83,611],[232,661],[409,626],[569,538],[649,500]],color:'#bde7ff',period:8,phase:.42},
 {points:[[293,746],[411,721],[531,648],[597,563],[671,526]],color:'#bde7ff',period:8,phase:.56},
 {points:[[953,410],[1028,343],[1099,261],[1200,287],[1297,223]],color:'#b6f3db',period:8,phase:.12},
 {points:[[1061,397],[1143,344],[1280,350],[1397,409],[1471,374]],color:'#b6f3db',period:8,phase:.36},
 {points:[[978,509],[1100,519],[1246,548],[1398,629]],color:'#c0ddef',period:8,phase:.24},
 {points:[[971,546],[1090,574],[1220,637],[1287,756],[1462,808]],color:'#c0ddef',period:8,phase:.48},
 {points:[[731,409],[808,479],[885,563],[949,628],[1036,687],[1215,705],[1287,756],[1398,629]],color:'#ffe0a2',period:16,phase:.08},
 {points:[[367,786],[412,840],[575,867],[707,867],[878,841],[1080,809],[1287,756]],color:'#ffe0a2',period:16,phase:.3},
];

export function createModelField(host:HTMLElement,onFail:()=>void):ModelField{
 let renderer:THREE.WebGLRenderer|undefined,texture:THREE.Texture|undefined;
 let alive=true,visible=false,loaded=false,paused=false,reduced=false,theme:ModelTheme='dark',raf=0,last=0,time=0,zoom=1,zoomTarget=1,width=1,height=1,scale=1,frames=0,total=0;
 const query=new URLSearchParams(location.search),fixed=query.has('dikwFrame')?Number(query.get('dikwFrame'))/60:null;
 const uniforms={uArt:{value:null as THREE.Texture|null},uSize:{value:new THREE.Vector2()},uScale:{value:1},uZoom:{value:1},uTime:{value:0},uMotion:{value:1},uNativeLabels:{value:1},uPixelRatio:{value:1},uLight:{value:0},uSurface:{value:new THREE.Color('#0a151a')},uInk:{value:new THREE.Color('#2b6664')},uCopper:{value:new THREE.Color('#956d42')}};
 const scene=new THREE.Scene(),camera=new THREE.Camera(),geometry=new THREE.PlaneGeometry(2,2,192,112),material=new THREE.ShaderMaterial({uniforms,vertexShader:vertex,fragmentShader:fragment,depthTest:false,depthWrite:false});scene.add(new THREE.Mesh(geometry,material));
 const tracks=routes.map(route=>{const curve=new THREE.CatmullRomCurve3(route.points.map(([x,y])=>new THREE.Vector3(x,y,0)),false,'centripetal');return {...route,length:curve.getLength(),samples:curve.getSpacedPoints(160)}});
 // Brief glints occur at existing junctions when a travelling head reaches them.
 const junctions=[[0,3],[3,3],[5,4],[7,3],[8,3],[9,2],[10,2],[10,4]].map(([track,anchor])=>{
  const route=tracks[track],[x,y]=route.points[anchor];let closest=0,distance=Infinity;
  route.samples.forEach((p,i)=>{const d=(p.x-x)**2+(p.y-y)**2;if(d<distance){closest=i;distance=d}});
  return {track,x,y,progress:closest/160};
 });
 const heads=tracks.length*8,trailCount=heads*(TAIL_STEPS+1),count=trailCount+junctions.length;
 const positions=new THREE.BufferAttribute(new Float32Array(count*3),3),colors=new THREE.BufferAttribute(new Float32Array(count*3),3),opacities=new THREE.BufferAttribute(new Float32Array(count),1),sizes=new THREE.BufferAttribute(new Float32Array(count),1);
 positions.setUsage(THREE.DynamicDrawUsage);opacities.setUsage(THREE.DynamicDrawUsage);
 tracks.forEach((route,i)=>{const c=new THREE.Color(route.color);for(let j=0;j<8;j++)for(let k=0;k<=TAIL_STEPS;k++){
  const index=(i*8+j)*(TAIL_STEPS+1)+k;colors.setXYZ(index,c.r,c.g,c.b);sizes.setX(index,k===0?12.5:10-k*.45);
 }});
 junctions.forEach((junction,i)=>{const c=new THREE.Color(tracks[junction.track].color),index=trailCount+i;colors.setXYZ(index,c.r,c.g,c.b);sizes.setX(index,34);positions.setXYZ(index,junction.x,junction.y,0)});
 const pointGeometry=new THREE.BufferGeometry();pointGeometry.setAttribute('position',positions);pointGeometry.setAttribute('tint',colors);pointGeometry.setAttribute('opacity',opacities);pointGeometry.setAttribute('size',sizes);
 const pointMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:pointVertex,fragmentShader:pointFragment,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending});
 const movingPoints=new THREE.Points(pointGeometry,pointMaterial);movingPoints.frustumCulled=false;movingPoints.renderOrder=1;scene.add(movingPoints);
 const starCount=620,starGeometry=new THREE.BufferGeometry();
 const starPositions=new Float32Array(starCount*3),starColors=new Float32Array(starCount*3),starSizes=new Float32Array(starCount),starLayers=new Float32Array(starCount);
 const palette=['#b9d5e2','#c5e5ee','#d6e6e3','#a5d8d0','#dfc89c'].map(c=>new THREE.Color(c));
 for(let i=0;i<starCount;i++){
  const slot=i%31,layer=slot<19?0:slot<29?1:2,seed=(i*.61803398875)%1;
  // Low-discrepancy placement has no grid, random jumps or radial turbine pattern.
  starPositions.set([((i+.5)*.754877666)%1,((i+.5)*.569840291)%1,0],i*3);
  const c=palette[i%palette.length];starColors.set([c.r,c.g,c.b],i*3);
  starSizes[i]=layer===0?3+seed*2:layer===1?5+seed*3:10+seed*7;
  starLayers[i]=layer;
 }
 starGeometry.setAttribute('position',new THREE.BufferAttribute(starPositions,3));starGeometry.setAttribute('tint',new THREE.BufferAttribute(starColors,3));starGeometry.setAttribute('size',new THREE.BufferAttribute(starSizes,1));starGeometry.setAttribute('layer',new THREE.BufferAttribute(starLayers,1));
 const starMaterial=new THREE.ShaderMaterial({uniforms,vertexShader:starVertex,fragmentShader:starFragment,transparent:true,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending});
 const starField=new THREE.Points(starGeometry,starMaterial);starField.frustumCulled=false;starField.renderOrder=.5;scene.add(starField);
 function applyTheme(next:ModelTheme){
  theme=next;
  const light=theme==='light';
  uniforms.uLight.value=light?1:0;
  uniforms.uSurface.value.set(light?'#f4f5f1':'#0a151a');
  for(const material of [pointMaterial,starMaterial]){
   material.blending=light?THREE.NormalBlending:THREE.AdditiveBlending;
   material.needsUpdate=true;
  }
  host.dataset.theme=theme;
 }
 host.dataset.theme=theme;
 function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
 function schedule(){if(alive&&loaded&&visible&&!document.hidden&&!raf)raf=requestAnimationFrame(render);}
 function render(now:number){
  raf=0;if(!alive||!renderer)return;
  const raw=last?(now-last)/1000:0,dt=Math.min(raw,.12);last=now;
  if(!paused&&!reduced&&fixed===null)time+=dt;
  const t=fixed!==null&&Number.isFinite(fixed)?fixed:reduced?0:time;
  const easing=1-Math.exp(-dt*8);zoom=reduced?zoomTarget:zoom+(zoomTarget-zoom)*easing;
  uniforms.uTime.value=(((t*SPEED)%32)+32)%32;uniforms.uZoom.value=zoom;uniforms.uMotion.value=reduced?0:1;
  movingPoints.visible=!reduced;starField.visible=!reduced;
  tracks.forEach((route,i)=>{for(let j=0;j<8;j++)for(let k=0;k<=TAIL_STEPS;k++){
   const progress=((uniforms.uTime.value/route.period+j/8+route.phase-k*3.2/route.length)%1+1)%1,sample=progress*160,index=Math.floor(sample),mix=sample-index,a=route.samples[index],b=route.samples[index+1],sprite=(i*8+j)*(TAIL_STEPS+1)+k;
   positions.setXYZ(sprite,THREE.MathUtils.lerp(a.x,b.x,mix),THREE.MathUtils.lerp(a.y,b.y,mix),0);
   const envelope=THREE.MathUtils.smoothstep(progress,0,.035)*(1.-THREE.MathUtils.smoothstep(progress,.965,1.));
   opacities.setX(sprite,envelope*(k===0?1.25:.65*Math.exp(-k*.38)));
  }});
  junctions.forEach((junction,i)=>{
   const route=tracks[junction.track],phase=(((uniforms.uTime.value/route.period+route.phase-junction.progress)*8)%1+1)%1;
   const seconds=Math.min(phase,1-phase)*route.period/(8*SPEED);
   opacities.setX(trailCount+i,.64*Math.exp(-((seconds/.11)**2)));
  });positions.needsUpdate=true;opacities.needsUpdate=true;
  // Both themes and locales use the same DOM labels. The existing source-image
  // restoration above removes baked English text before applying the palette.
  uniforms.uNativeLabels.value=1;
  host.parentElement?.classList.remove('uses-reference-labels');
  for(const [name,[x,y]]of Object.entries(labels)){
   const el=host.parentElement?.querySelector<HTMLElement>('.model-dikw-label.'+name);if(!el)continue;
   const half=el.offsetWidth*.5+12;
   el.style.left=THREE.MathUtils.clamp(width*.5+(x-W*.5)*scale*zoom,half,width-half)+'px';
   el.style.top=(height*.5+(y-(TOP+FH*.5))*scale*zoom)+'px';
  }
  renderer.render(scene,camera);
  if(raw>0){frames++;total+=raw;if(frames%90===0)host.dataset.averageFps=String(Math.round(frames/total));}
  Object.assign(host.dataset,{renderState:reduced?'reduced':paused?'paused':fixed!==null?'fixed':'running',frame:String(Math.round(t*60)),zoom:zoom.toFixed(3),rendering:'reference-texture-with-local-mesh-motion',motion:'local-mesh-points-and-starfield',meshRegions:'5',centerMotion:'coupled-shear',meshCycleSeconds:String(8/SPEED),compositionScale:'.86',movingPoints:String(heads),speed:String(SPEED),cycleSeconds:String(32/SPEED),trailSteps:String(TAIL_STEPS),starLayers:'3',stars:String(starGeometry.drawRange.count)});
  if((!paused&&!reduced&&fixed===null)||Math.abs(zoom-zoomTarget)>.001)schedule();else last=0;
 }
 function resize(){const r=host.getBoundingClientRect();if(!renderer||r.width<1||r.height<1)return;width=r.width;height=r.height;scale=Math.min(width/W,height/FH)*.86;renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(width,height);uniforms.uSize.value.set(width,height);uniforms.uScale.value=scale;uniforms.uPixelRatio.value=renderer.getPixelRatio();starGeometry.setDrawRange(0,Math.round(starCount*THREE.MathUtils.clamp(width*height/(1280*550),.2,1)));schedule();}
 function visibility(){if(document.hidden){cancel();host.dataset.renderState='hidden';}else schedule();}
 function lost(e:Event){e.preventDefault();cancel();host.dataset.renderState='unavailable';onFail();}
 const observer=new IntersectionObserver(entries=>{visible=!!entries[0]?.isIntersecting;if(visible)schedule();else{cancel();host.dataset.renderState='offscreen';}},{threshold:.01});
 const ro=new ResizeObserver(resize);
 try{
  renderer=new THREE.WebGLRenderer({alpha:false,antialias:false,powerPreference:'high-performance'});renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;host.appendChild(renderer.domElement);
  renderer.debug.onShaderError=()=>{cancel();onFail();};
  texture=new THREE.TextureLoader().load(referenceUrl,t=>{if(!alive){t.dispose();return;}t.colorSpace=THREE.SRGBColorSpace;t.minFilter=THREE.LinearFilter;t.magFilter=THREE.LinearFilter;t.generateMipmaps=false;uniforms.uArt.value=t;loaded=true;host.dataset.ready='true';resize();},undefined,onFail);
  renderer.domElement.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visibility);observer.observe(host);ro.observe(host);const r=host.getBoundingClientRect();visible=r.bottom>0&&r.top<innerHeight;resize();
 }catch(e){console.error('Reference field initialization failed',e);onFail();}
 return{setState(s){reduced=s.reduced;paused=s.paused;if(s.theme&&s.theme!==theme)applyTheme(s.theme);if(reduced)zoom=zoomTarget;schedule();},zoom(n){zoomTarget=THREE.MathUtils.clamp(zoomTarget*(n>0?1.12:1/1.12),.85,1.38);if(reduced)zoom=zoomTarget;schedule();},replay(){time=0;last=0;zoomTarget=1;if(reduced)zoom=zoomTarget;schedule();},reset(){zoomTarget=1;if(reduced)zoom=zoomTarget;schedule();},dispose(){alive=false;cancel();observer.disconnect();ro.disconnect();document.removeEventListener('visibilitychange',visibility);renderer?.domElement.removeEventListener('webglcontextlost',lost);geometry.dispose();material.dispose();pointGeometry.dispose();pointMaterial.dispose();starGeometry.dispose();starMaterial.dispose();texture?.dispose();renderer?.dispose();renderer?.domElement.remove();}};
}
