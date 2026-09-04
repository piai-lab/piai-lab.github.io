/**
 * πAI Lab 粒子场。
 * 视觉规则：直接承接用户提供的 MainParticlesComponent 运行结构；使用泊松圆盘采样、GPU 数据纹理、双渲染目标和同源参数，不混入历史 Canvas/WebGL 自定义粒子代码。
 */
import PoissonDiskSampling from "poisson-disk-sampling";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

type ParticleTone = "paper" | "dark" | "morph";

const simplexNoise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0); const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy)); vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz); vec3 l = 1.0 - g; vec3 i1 = min(g.xyz, l.zxy); vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx; vec3 x2 = x0 - i2 + C.yyy; vec3 x3 = x0 - D.yyy;
  i = mod289(i); vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857; vec3 ns = n_ * D.wyz - D.xzx; vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z); vec4 y_ = floor(j - 7.0 * x_); vec4 x = x_ * ns.x + ns.yyyy; vec4 y = y_ * ns.x + ns.yyyy; vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy); vec4 b1 = vec4(x.zw, y.zw); vec4 s0 = floor(b0)*2.0+1.0; vec4 s1 = floor(b1)*2.0+1.0; vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy; vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww; vec3 p0 = vec3(a0.xy,h.x); vec3 p1 = vec3(a0.zw,h.y); vec3 p2 = vec3(a1.xy,h.z); vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m = max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m; return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

const simVertex = `void main() { gl_Position = vec4(position, 1.0); }`;

const simFragment = `
precision highp float;
uniform sampler2D uPosition; uniform sampler2D uPosRefs; uniform vec2 uRingPos; uniform float uTime; uniform float uRingRadius; uniform float uRingWidth; uniform float uRingWidth2; uniform float uRingDisplacement;
${simplexNoise}
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(256.0, 256.0);
  vec4 pFrame = texture2D(uPosition, uv); float scale = pFrame.z; float velocity = pFrame.w; vec2 refPos = texture2D(uPosRefs, uv).xy;
  float time = uTime * .5; vec2 currentPos = refPos; vec2 pos = pFrame.xy; pos *= .8;
  float dist = distance(currentPos, uRingPos); float noise0 = snoise(vec3(currentPos * .2 + vec2(18.4924,72.9744), time*.5)); float dist1 = distance(currentPos + noise0*.005, uRingPos);
  float t = smoothstep(uRingRadius-(uRingWidth*2.),uRingRadius,dist) - smoothstep(uRingRadius,uRingRadius+uRingWidth,dist1);
  float t2 = smoothstep(uRingRadius-(uRingWidth2*2.),uRingRadius,dist) - smoothstep(uRingRadius,uRingRadius+uRingWidth2,dist1);
  float t3 = smoothstep(uRingRadius+uRingWidth2,uRingRadius,dist); t=pow(t,2.); t2=pow(t2,3.); t+=t2*3.; t+=t3*.4; t+=snoise(vec3(currentPos*30.+vec2(11.4924,12.9744),time*.5))*t3*.5;
  float nS=snoise(vec3(currentPos*2.+vec2(18.4924,72.9744),time*.5)); t+=pow((nS+1.5)*.5,2.)*.6;
  float noise1=snoise(vec3(currentPos*4.+vec2(88.494,32.4397),time*.35)); float noise2=snoise(vec3(currentPos*4.+vec2(50.904,120.947),time*.35));
  float noise3=snoise(vec3(currentPos*20.+vec2(18.4924,72.9744),time*.5)); float noise4=snoise(vec3(currentPos*20.+vec2(50.904,120.947),time*.5));
  vec2 disp=vec2(noise1,noise2)*.03; disp+=vec2(noise3,noise4)*.005; disp.x+=sin((refPos.x*20.)+(time*4.))*.02*clamp(dist,0.,1.); disp.y+=cos((refPos.y*20.)+(time*3.))*.02*clamp(dist,0.,1.);
  pos-=(uRingPos-(currentPos+disp))*pow(t2,.75)*uRingDisplacement; scale+=(t-scale)*.2; velocity*=.5; velocity+=scale*.25; gl_FragColor=vec4(currentPos+disp+(pos*.25),scale,velocity);
}`;

const renderVertex = `
precision highp float;
attribute vec4 seeds; uniform sampler2D uPosition; uniform float uParticleScale; uniform float uPixelRatio; varying vec4 vSeeds; varying float vVelocity; varying vec2 vLocalPos; varying vec2 vScreenPos; varying float vScale;
void main() { vec4 pos=texture2D(uPosition,uv); vSeeds=seeds; vVelocity=pos.w; vScale=pos.z; vLocalPos=pos.xy; vec4 viewSpace=modelViewMatrix*vec4(vec3(pos.xy,0.),1.0); gl_Position=projectionMatrix*viewSpace; vScreenPos=gl_Position.xy; gl_PointSize=((vScale*7.)*(uPixelRatio*.5)*uParticleScale); }`;

const renderFragment = `
precision highp float;
varying vec4 vSeeds; varying vec2 vScreenPos; varying vec2 vLocalPos; varying float vScale; varying float vVelocity;
uniform vec3 uColor1; uniform vec3 uColor2; uniform vec3 uColor3; uniform vec2 uRingPos; uniform float uAlpha; uniform float uTime; uniform int uColorScheme;
${simplexNoise}
float sdRoundBox(in vec2 p,in vec2 b,in vec4 r){r.xy=(p.x>0.0)?r.xy:r.zw;r.x=(p.y>0.0)?r.x:r.y;vec2 q=abs(p)-b+r.x;return min(max(q.x,q.y),0.0)+length(max(q,0.0))-r.x;}
vec2 rotate(vec2 v,float a){float s=sin(a);float c=cos(a);return mat2(c,s,-s,c)*v;}
void main(){float noiseAngle=snoise(vec3(vLocalPos*10.+vec2(18.4924,72.9744),uTime*.85));float noiseColor=snoise(vec3(vLocalPos*2.+vec2(74.664,91.556),uTime*.5));noiseColor=(noiseColor+1.)*.5;float angle=atan(vLocalPos.y-uRingPos.y,vLocalPos.x-uRingPos.x);vec2 uv=gl_PointCoord.xy-vec2(.5);uv.y*=-1.;uv=rotate(uv,-angle+(noiseAngle*.5));float progress=smoothstep(0.,.75,pow(noiseColor,2.));float h=.8;vec3 color=mix(mix(uColor1,uColor2,progress/h),mix(uColor2,uColor3,(progress-h)/(1.-h)),step(h,progress));float rounded=sdRoundBox(uv,vec2(.5,.2),vec4(.25));rounded=smoothstep(.1,0.,rounded);float a=uAlpha*rounded*smoothstep(.1,.2,vScale);if(a<.01)discard;color=clamp(color,0.,1.);color=mix(color,color*clamp(vVelocity,0.,1.),float(uColorScheme));gl_FragColor=vec4(color,clamp(a,0.,1.));}`;

export default function ResearchParticleField({ tone = "paper" }: { tone?: ParticleTone }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldInitialize, setShouldInitialize] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setShouldInitialize(true);
        observer.disconnect();
      }
    }, { threshold: 0.01 });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !shouldInitialize) return;
    const isMorph = tone === "morph";
    const isDark = tone === "dark" || isMorph;
    const sourceConfig = isMorph
      ? { minDistance: 8.6667, maxDistance: 9.6667, ringWidth: .15, ringWidth2: .05, displacement: .15, particleScale: .60 }
      : isDark
        ? { minDistance: 4.1333, maxDistance: 5.1333, ringWidth: .15, ringWidth2: .05, displacement: .23, particleScale: .65 }
        : { minDistance: 3.8667, maxDistance: 4.8667, ringWidth: .006, ringWidth2: .107, displacement: .62, particleScale: .59 };
    const theme = isDark ? "dark" : "light";
    const container = canvas.parentElement;
    if (!container) return;
    // WebGL contexts are a limited browser resource. The page remains usable when
    // a low-memory device or another tab has exhausted that resource.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true, stencil: false, precision: "highp" });
    } catch {
      canvas.classList.add("particle-field-unavailable");
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(theme === "dark" ? 0x000000 : 0xffffff, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 1000); camera.position.z = 3.1;
    const sampling = new PoissonDiskSampling({ shape: [500, 500], minDistance: sourceConfig.minDistance, maxDistance: sourceConfig.maxDistance, tries: 20 }).fill() as number[][];
    const size = 256; const length = size * size; const count = Math.min(sampling.length, length);
    const positions = new Float32Array(length * 4);
    for (let index = 0; index < count; index += 1) { positions[index * 4] = (sampling[index][0] - 250) / 250; positions[index * 4 + 1] = (sampling[index][1] - 250) / 250; }
    const posTexture = new THREE.DataTexture(positions, size, size, THREE.RGBAFormat, THREE.FloatType); posTexture.needsUpdate = true;
    const targetOptions = { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType, depthBuffer: false, stencilBuffer: false };
    let rt1 = new THREE.WebGLRenderTarget(size, size, targetOptions); let rt2 = new THREE.WebGLRenderTarget(size, size, targetOptions);
    const simScene = new THREE.Scene(); const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simMaterial = new THREE.ShaderMaterial({ uniforms: { uPosition: { value: posTexture }, uPosRefs: { value: posTexture }, uRingPos: { value: new THREE.Vector2() }, uTime: { value: 0 }, uRingRadius: { value: .2 }, uRingWidth: { value: sourceConfig.ringWidth }, uRingWidth2: { value: sourceConfig.ringWidth2 }, uRingDisplacement: { value: sourceConfig.displacement } }, vertexShader: simVertex, fragmentShader: simFragment });
    simScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial));
    const geometry = new THREE.BufferGeometry(); const uv = new Float32Array(count * 2); const seed = new Float32Array(count * 4);
    for (let index = 0; index < count; index += 1) { const x = index % size; const y = Math.floor(index / size); uv[index * 2] = x / size; uv[index * 2 + 1] = y / size; seed[index * 4] = Math.random(); seed[index * 4 + 1] = Math.random(); seed[index * 4 + 2] = Math.random(); seed[index * 4 + 3] = Math.random(); }
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3)); geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2)); geometry.setAttribute("seeds", new THREE.BufferAttribute(seed, 4));
    const renderMaterial = new THREE.ShaderMaterial({ uniforms: { uPosition: { value: posTexture }, uTime: { value: 0 }, uColor1: { value: new THREE.Color(isMorph ? "#676A72" : isDark ? "#7189ff" : "#2c64ed") }, uColor2: { value: new THREE.Color(isMorph ? "#FF4641" : isDark ? "#3074f9" : "#f84242") }, uColor3: { value: new THREE.Color(isMorph ? "#346BF1" : isDark ? "#000000" : "#ffcf03") }, uAlpha: { value: 1 }, uRingPos: { value: new THREE.Vector2() }, uParticleScale: { value: sourceConfig.particleScale }, uPixelRatio: { value: pixelRatio }, uColorScheme: { value: isDark ? 0 : 1 } }, vertexShader: renderVertex, fragmentShader: renderFragment, transparent: true, depthTest: false, depthWrite: false });
    const particleMesh = new THREE.Points(geometry, renderMaterial); particleMesh.scale.set(5, 5, 5); scene.add(particleMesh);
    const raycaster = new THREE.Raycaster(); const mouse = new THREE.Vector2(); const intersectionPoint = new THREE.Vector3(); const raycastPlane = new THREE.Mesh(new THREE.PlaneGeometry(12.5, 12.5), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); scene.add(raycastPlane);
    const ringPos = new THREE.Vector2(); const cursorPos = new THREE.Vector2(); const clock = new THREE.Clock(); let previousTime = 0; let everRendered = false; let active = true; let pointerInside = false; let animation = 0;
    const resize = () => { const rect = container.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); renderMaterial.uniforms.uPixelRatio.value = pixelRatio; };
    const onMove = (event: PointerEvent) => { const rect = canvas.getBoundingClientRect(); mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1; mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1; pointerInside = mouse.x >= -1 && mouse.x <= 1 && mouse.y >= -1 && mouse.y <= 1; };
    const onLeave = () => { pointerInside = false; };
    const observer = new IntersectionObserver((entries) => { active = entries[0]?.isIntersecting ?? false; }, { threshold: 0 }); observer.observe(canvas);
    const render = () => {
      animation = requestAnimationFrame(render); if (!active) return;
      const elapsed = clock.getElapsedTime(); const dt = elapsed - previousTime; previousTime = elapsed;
      const idleX = (Math.sin(elapsed * .66 + 94.234) - .5) * .4; const idleY = (Math.sin(elapsed * .75 + 21.028) - .5) * .2;
      cursorPos.set(idleX, idleY);
      if (pointerInside) { raycaster.setFromCamera(mouse, camera); const hit = raycaster.intersectObject(raycastPlane)[0]; if (hit) { intersectionPoint.copy(hit.point); cursorPos.set(intersectionPoint.x * .175 + idleX * .5, intersectionPoint.y * .175 + idleY * .5); ringPos.lerp(cursorPos, .02); } } else ringPos.lerp(cursorPos, .01);
      const width = renderer.domElement.width / pixelRatio; renderMaterial.uniforms.uParticleScale.value = width / 2000 * sourceConfig.particleScale;
      simMaterial.uniforms.uPosition.value = everRendered ? rt1.texture : posTexture; simMaterial.uniforms.uTime.value = elapsed; simMaterial.uniforms.uRingPos.value.copy(ringPos); simMaterial.uniforms.uRingRadius.value = .175 + Math.sin(elapsed) * .03 + Math.cos(elapsed * 3) * .02;
      renderer.setRenderTarget(rt2); renderer.clear(); renderer.render(simScene, simCamera); renderer.setRenderTarget(null);
      renderMaterial.uniforms.uPosition.value = everRendered ? rt2.texture : posTexture; renderMaterial.uniforms.uTime.value = elapsed; renderMaterial.uniforms.uRingPos.value.copy(ringPos); renderer.clear(); renderer.render(scene, camera);
      const swap = rt1; rt1 = rt2; rt2 = swap; everRendered = true;
      void dt;
    };
    resize(); window.addEventListener("resize", resize); canvas.addEventListener("pointermove", onMove, { passive: true }); canvas.addEventListener("pointerleave", onLeave, { passive: true }); animation = requestAnimationFrame(render);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); cancelAnimationFrame(animation); geometry.dispose(); renderMaterial.dispose(); simMaterial.dispose(); posTexture.dispose(); rt1.dispose(); rt2.dispose(); raycastPlane.geometry.dispose(); (raycastPlane.material as THREE.Material).dispose(); renderer.dispose(); renderer.forceContextLoss(); };
  }, [shouldInitialize, tone]);
  return <canvas ref={canvasRef} className={`particle-field particle-field-${tone}`} aria-hidden="true" />;
}

/**
 * 底部收束专用形变场。
 * 视觉规则：采用用户 MorphingParticlesComponent 的“基础散点 → 目标点位 → hover/pulse 推进”管线；
 * 目标形状以 πAI Lab 的无限环语义独立生成，不复用缺失的第三方 cube/individual 纹理。
 */
const morphSimFragment = `
precision highp float;
uniform sampler2D uPosition; uniform sampler2D uBase; uniform sampler2D uTarget; uniform float uTime; uniform float uHover;
vec2 hash(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
void main(){
  vec2 uv=gl_FragCoord.xy/vec2(256.0); vec4 previous=texture2D(uPosition,uv); vec2 base=texture2D(uBase,uv).xy; vec2 target=texture2D(uTarget,uv).xy;
  vec2 desired=mix(base,target,uHover); vec2 delta=desired-previous.xy; float distanceToTarget=length(delta); vec2 direction=delta/max(distanceToTarget,.0001);
  vec2 drift=(hash(uv+uTime*.001)-.5)*.004; vec2 nextPos=previous.xy+direction*min(distanceToTarget,.026)*.12+drift;
  float life=fract(hash(uv).x*7.0+uTime*.065); float targetScale=smoothstep(.0,.18,life)*(1.0-smoothstep(.74,1.0,life));
  targetScale+=smoothstep(.72,.08,distanceToTarget)*uHover*.82; float nextScale=mix(previous.z,targetScale,.09); float velocity=mix(previous.w,1.0-smoothstep(.015,.52,distanceToTarget),.12);
  gl_FragColor=vec4(nextPos,nextScale,velocity);
}`;

const morphRenderVertex = `
precision highp float;
uniform sampler2D uPosition; uniform float uPixelRatio; uniform float uParticleScale; varying float vScale; varying float vVelocity; varying vec2 vPosition;
void main(){vec4 p=texture2D(uPosition,uv);vScale=p.z;vVelocity=p.w;vPosition=p.xy;vec4 view=modelViewMatrix*vec4(p.xy,0.,1.);gl_Position=projectionMatrix*view;gl_PointSize=(1.2+p.z*8.5)*uPixelRatio*uParticleScale;}`;

const morphRenderFragment = `
precision highp float;
uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;uniform float uTime;varying float vScale;varying float vVelocity;varying vec2 vPosition;
void main(){vec2 p=gl_PointCoord-.5;float circle=smoothstep(.5,.38,length(p));if(circle<.02)discard;float mixValue=clamp(.5+.5*sin(vPosition.x*5.3+vPosition.y*4.1+uTime*.45),0.,1.);vec3 color=mix(uColor1,uColor2,mixValue);color=mix(color,uColor3,smoothstep(.72,1.,mixValue));float alpha=circle*smoothstep(.02,.21,vScale)*(.38+.62*vVelocity);gl_FragColor=vec4(color,alpha);}`;

export function MorphingParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldInitialize, setShouldInitialize] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) {
        setShouldInitialize(true);
        observer.disconnect();
      }
    }, { threshold: 0.01 });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container || !shouldInitialize) return;
    // Do not let a lost/exhausted WebGL context take down the whole React tree.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true, stencil: false, precision: "highp" });
    } catch {
      canvas.classList.add("particle-field-unavailable");
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x121317, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, .1, 1000);
    camera.position.z = 8.8;
    const size = 256;
    const length = size * size;
    const samples = new PoissonDiskSampling({ shape: [500, 500], minDistance: 8.6667, maxDistance: 10.2, tries: 20 }).fill() as number[][];
    const count = Math.min(samples.length, length);
    const baseData = new Float32Array(length * 4);
    const targetData = new Float32Array(length * 4);
    for (let index = 0; index < count; index += 1) {
      const x = (samples[index][0] - 250) / 250;
      const y = (samples[index][1] - 250) / 250;
      baseData[index * 4] = x;
      baseData[index * 4 + 1] = y;
      baseData[index * 4 + 2] = .32 + ((index % 11) / 40);
      const t = (index / count) * Math.PI * 6;
      const r = .76 + (((index * 47) % 19) / 100);
      const denom = 1 + Math.cos(t) * Math.cos(t);
      const wave = Math.sin(t * 3.1 + index * .17) * .032;
      targetData[index * 4] = (r * Math.sin(t) / denom) + wave;
      targetData[index * 4 + 1] = (.57 * Math.sin(t) * Math.cos(t) / denom) + Math.cos(t * 2.2 + index) * .025;
      targetData[index * 4 + 2] = .58;
    }
    const baseTexture = new THREE.DataTexture(baseData, size, size, THREE.RGBAFormat, THREE.FloatType);
    const targetTexture = new THREE.DataTexture(targetData, size, size, THREE.RGBAFormat, THREE.FloatType);
    baseTexture.needsUpdate = true;
    targetTexture.needsUpdate = true;
    const targets = { wrapS: THREE.ClampToEdgeWrapping, wrapT: THREE.ClampToEdgeWrapping, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, format: THREE.RGBAFormat, type: THREE.FloatType, depthBuffer: false, stencilBuffer: false };
    let rt1 = new THREE.WebGLRenderTarget(size, size, targets);
    let rt2 = new THREE.WebGLRenderTarget(size, size, targets);
    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simMaterial = new THREE.ShaderMaterial({ uniforms: { uPosition: { value: baseTexture }, uBase: { value: baseTexture }, uTarget: { value: targetTexture }, uTime: { value: 0 }, uHover: { value: .72 } }, vertexShader: simVertex, fragmentShader: morphSimFragment });
    const simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simScene.add(simMesh);
    const geometry = new THREE.BufferGeometry();
    const uv = new Float32Array(count * 2);
    for (let index = 0; index < count; index += 1) { uv[index * 2] = (index % size) / size; uv[index * 2 + 1] = Math.floor(index / size) / size; }
    geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const renderMaterial = new THREE.ShaderMaterial({ uniforms: { uPosition: { value: baseTexture }, uPixelRatio: { value: pixelRatio }, uParticleScale: { value: .60 }, uColor1: { value: new THREE.Color("#0b3477") }, uColor2: { value: new THREE.Color("#079a98") }, uColor3: { value: new THREE.Color("#146d8e") }, uTime: { value: 0 } }, vertexShader: morphRenderVertex, fragmentShader: morphRenderFragment, transparent: true, depthTest: false, depthWrite: false });
    const mesh = new THREE.Points(geometry, renderMaterial);
    mesh.scale.set(4.5, -4.5, 4.5);
    scene.add(mesh);
    const clock = new THREE.Clock();
    let previous = 0;
    let hover = .72;
    let targetHover = .72;
    let active = true;
    let rendered = false;
    let raf = 0;
    const resize = () => { const rect = container.getBoundingClientRect(); renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false); camera.aspect = rect.width / Math.max(1, rect.height); camera.updateProjectionMatrix(); renderMaterial.uniforms.uPixelRatio.value = pixelRatio; };
    const onMove = () => { targetHover = 1; };
    const onLeave = () => { targetHover = .72; };
    const observer = new IntersectionObserver((entries) => { active = entries[0]?.isIntersecting ?? false; }, { threshold: 0 });
    observer.observe(canvas);
    const render = () => {
      raf = requestAnimationFrame(render);
      if (!active) return;
      const elapsed = clock.getElapsedTime();
      const delta = Math.min(.05, elapsed - previous);
      previous = elapsed;
      targetHover = Math.max(.58, targetHover - delta * .075);
      hover += (targetHover - hover) * .045;
      simMaterial.uniforms.uPosition.value = rendered ? rt1.texture : baseTexture;
      simMaterial.uniforms.uTime.value = elapsed;
      simMaterial.uniforms.uHover.value = hover + Math.sin(elapsed * .8) * .06;
      renderer.setRenderTarget(rt2);
      renderer.clear();
      renderer.render(simScene, simCamera);
      renderer.setRenderTarget(null);
      renderMaterial.uniforms.uPosition.value = rendered ? rt2.texture : baseTexture;
      renderMaterial.uniforms.uTime.value = elapsed;
      renderMaterial.uniforms.uParticleScale.value = (renderer.domElement.width / pixelRatio) / 2000 * .83;
      renderer.clear();
      renderer.render(scene, camera);
      const swap = rt1;
      rt1 = rt2;
      rt2 = swap;
      rendered = true;
    };
    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave, { passive: true });
    raf = requestAnimationFrame(render);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); canvas.removeEventListener("pointermove", onMove); canvas.removeEventListener("pointerleave", onLeave); cancelAnimationFrame(raf); geometry.dispose(); simMesh.geometry.dispose(); simMaterial.dispose(); renderMaterial.dispose(); baseTexture.dispose(); targetTexture.dispose(); rt1.dispose(); rt2.dispose(); renderer.dispose(); renderer.forceContextLoss(); };
  }, [shouldInitialize]);

  return <canvas ref={canvasRef} className="particle-field particle-field-morph" aria-hidden="true" />;
}
