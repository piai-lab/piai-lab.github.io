/**
 * 底部品牌动画：copied-adapted 自已批准的 ClosingParticleField 原型。
 * 复用 ResearchParticleField 的 SVG 采样、GPU 双缓冲及生命周期，
 * 以 21 秒连续完成费马螺旋、环面、品牌展翼与再次展开。
 */
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import * as THREE from "three";
import symbolSvg from "@/assets/piai-lab-symbol.svg?raw";
import symbolUrl from "@/assets/piai-lab-symbol.svg";
const simVertex = `void main() { gl_Position = vec4(position, 1.0); }`;
const morphSimFragment = `
precision highp float;
uniform sampler2D uPosition; uniform sampler2D uBase; uniform sampler2D uTarget;
uniform float uTime; uniform float uTorus; uniform float uLogo; uniform float uDelta; uniform float uInitial;
mat3 rotateX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}
mat3 rotateY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}
void main(){
  vec2 uv=gl_FragCoord.xy/vec2(256.);
  vec4 seed=texture2D(uBase,uv); vec4 previous=texture2D(uPosition,uv);
  vec2 target=texture2D(uTarget,uv).xy;
  float r=sqrt(seed.x), a=seed.y+uTime*.23;
  vec3 spiral=vec3(r*cos(a),r*sin(a),sin(r*13.-uTime*1.4)*.09);
  spiral=rotateX(.5+sin(uTime*.17)*.18)*spiral;
  float u=seed.z+uTime*.20, v=seed.w+uTime*.33;
  float minor=.25+.025*sin(u*3.+uTime*.7);
  vec3 torus=vec3((.69+minor*cos(v))*cos(u),(.69+minor*cos(v))*sin(u),minor*sin(v));
  torus=rotateY(uTime*.16)*rotateX(.65+sin(uTime*.2)*.18)*torus;
  vec3 mathShape=mix(spiral,torus,uTorus);
  vec3 logo=vec3(target,sin(abs(target.x)*9.-uTime*.8)*.008);
  vec3 desired=mix(mathShape,logo,uLogo);
  float approach=1.-exp(-uDelta*5.5);
  vec3 nextPos=mix(previous.xyz,desired,max(approach,uInitial));
  float light=.65+.25*sin(seed.z*4.-uTime*1.1);
  gl_FragColor=vec4(nextPos,light);
}`;
const morphRenderVertex = `
precision highp float;
uniform sampler2D uPosition; uniform sampler2D uTarget;
uniform float uPixelRatio; uniform float uParticleScale; uniform float uTime; uniform vec2 uPointer;
varying float vScale; varying float vWave; varying float vDepth;
void main(){
  vec4 p=texture2D(uPosition,uv);vec2 target=texture2D(uTarget,uv).xy;
  float phase=abs(target.x)*8.5-target.y*3.-uTime*.85;
  vWave=pow(.5+.5*cos(phase),10.);vScale=p.w;vDepth=p.z;
  vec3 pos=p.xyz;pos.xy+=uPointer*p.z*.035;
  vec4 view=modelViewMatrix*vec4(pos,1.);
  gl_Position=projectionMatrix*view;
  gl_PointSize=clamp((1.1+p.w*.5+vWave*.3)*uParticleScale,.9,1.9)*uPixelRatio;
}`;
const morphRenderFragment = `
precision highp float;
uniform vec3 uColor1;uniform vec3 uColor2;uniform vec3 uColor3;
varying float vScale;varying float vWave;varying float vDepth;
void main(){
  float radius=length(gl_PointCoord-.5);
  float core=1.-smoothstep(.14,.48,radius);if(core<.015)discard;
  vec3 color=mix(uColor2,uColor1,.4+.3*vScale);
  color=mix(color,uColor3,vWave*.65);
  float depthFade=mix(.5,1.,smoothstep(-.7,.6,vDepth));
  gl_FragColor=vec4(color,core*(.50+vScale*.25+vWave*.2)*depthFade);
  #include <colorspace_fragment>
}`;

function sampleBrandSilhouette() {
  const source = new DOMParser().parseFromString(symbolSvg, "image/svg+xml");
  const viewBox = source.documentElement
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  const context = document.createElement("canvas").getContext("2d");
  if (
    !context ||
    !viewBox ||
    viewBox.length !== 4 ||
    !viewBox.every(Number.isFinite)
  )
    return null;
  const [left, top, width, height] = viewBox;
  if (width <= 0 || height <= 0) return null;
  const paths = Array.from(source.querySelectorAll("path"), path => ({
    shape: new Path2D(path.getAttribute("d") || ""),
    fillRule:
      path.getAttribute("fill-rule") === "evenodd"
        ? ("evenodd" as const)
        : ("nonzero" as const),
  }));
  // Jittered cells avoid scanline patterns while preserving the canonical path.
  const step = width / 256;
  const points: [number, number][] = [];
  for (let y = top + step / 2; y < top + height; y += step) {
    for (let x = left + step / 2; x < left + width; x += step) {
      const px = x + (Math.random() - 0.5) * step;
      const py = y + (Math.random() - 0.5) * step;
      if (
        paths.some(path =>
          context.isPointInPath(path.shape, px, py, path.fillRule)
        )
      ) {
        points.push([
          (px - left - width / 2) / (width / 2),
          (py - top - height / 2) / (width / 2),
        ]);
      }
    }
  }
  for (let index = points.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    [points[index], points[other]] = [points[other], points[index]];
  }
  return points.length ? { points, aspect: height / width } : null;
}

export function MorphingParticleField({ zh = true }: { zh?: boolean }) {
  const controlsRef = useRef<{ toggle: () => void; replay: () => void } | null>(
    null
  );
  const pausedRef = useRef(false);
  const clockRef = useRef(0);
  const [paused, setPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shouldInitialize, setShouldInitialize] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  const [unavailable, setUnavailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [compact, setCompact] = useState<boolean | null>(null);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      setReady(false);
      setReducedMotion(preference.matches);
    };
    preference.addEventListener("change", onChange);
    return () => preference.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (!canvas || !container) return;
    const resizeObserver = new ResizeObserver(() =>
      setCompact(container.clientWidth < 700)
    );
    resizeObserver.observe(container);
    setCompact(container.clientWidth < 700);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setShouldInitialize(true);
          observer.disconnect();
        }
      },
      { threshold: 0.01 }
    );
    observer.observe(canvas);
    return () => {
      observer.disconnect();
      resizeObserver.disconnect();
    };
  }, [reducedMotion, compact]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = canvas?.parentElement;
    if (
      !canvas ||
      !container ||
      !shouldInitialize ||
      reducedMotion ||
      unavailable ||
      compact === null
    )
      return;
    setReady(false);
    let silhouette: ReturnType<typeof sampleBrandSilhouette>;
    try {
      silhouette = sampleBrandSilhouette();
    } catch {
      setUnavailable(true);
      return;
    }
    if (!silhouette) {
      setUnavailable(true);
      return;
    }
    // Do not let a lost/exhausted WebGL context take down the whole React tree.
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false,
        stencil: false,
        precision: "highp",
      });
    } catch {
      setUnavailable(true);
      return;
    }
    if (!renderer.extensions.has("EXT_color_buffer_float")) {
      renderer.dispose();
      renderer.forceContextLoss();
      setUnavailable(true);
      return;
    }
    const pixelRatio = Math.min(
      window.devicePixelRatio || 1,
      compact ? 1.5 : 2
    );
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.z = 8.8;
    const size = 256;
    const length = size * size;
    const count = compact ? 4608 : 7680;
    const rings = compact ? 36 : 40;
    const baseData = new Float32Array(length * 4);
    const targetData = new Float32Array(length * 4);
    const ordered = silhouette.points
      .slice()
      .sort((a, b) => Math.atan2(a[1], a[0]) - Math.atan2(b[1], b[0]));
    for (let index = 0; index < count; index += 1) {
      const t = (index + 0.5) / count;
      baseData[index * 4] = t;
      baseData[index * 4 + 1] = index * Math.PI * (3 - Math.sqrt(5));
      baseData[index * 4 + 2] = t * Math.PI * 2;
      baseData[index * 4 + 3] = ((index % rings) / rings) * Math.PI * 2;
      const target = ordered[Math.floor((index * ordered.length) / count)];
      targetData[index * 4] = target[0];
      targetData[index * 4 + 1] = target[1];
    }
    const baseTexture = new THREE.DataTexture(
      baseData,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    const targetTexture = new THREE.DataTexture(
      targetData,
      size,
      size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    baseTexture.needsUpdate = true;
    targetTexture.needsUpdate = true;
    const targets = {
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      depthBuffer: false,
      stencilBuffer: false,
    };
    let rt1 = new THREE.WebGLRenderTarget(size, size, targets);
    let rt2 = new THREE.WebGLRenderTarget(size, size, targets);
    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPosition: { value: baseTexture },
        uBase: { value: baseTexture },
        uTarget: { value: targetTexture },
        uTime: { value: 0 },
        uTorus: { value: 0 },
        uLogo: { value: 0 },
        uInitial: { value: 1 },
        uDelta: { value: 1 / 60 },
      },
      vertexShader: simVertex,
      fragmentShader: morphSimFragment,
    });
    const simMesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), simMaterial);
    simScene.add(simMesh);
    const geometry = new THREE.BufferGeometry();
    const uv = new Float32Array(count * 2);
    for (let index = 0; index < count; index += 1) {
      uv[index * 2] = ((index % size) + 0.5) / size;
      uv[index * 2 + 1] = (Math.floor(index / size) + 0.5) / size;
    }
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(count * 3), 3)
    );
    geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
    const palette = getComputedStyle(canvas);
    const color = (token: string) =>
      new THREE.Color(palette.getPropertyValue(token).trim());
    const renderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPosition: { value: baseTexture },
        uTarget: { value: targetTexture },
        uPointer: { value: new THREE.Vector2() },
        uPixelRatio: { value: pixelRatio },
        uParticleScale: { value: 0.6 },
        uColor1: { value: color("--morph-one") },
        uColor2: { value: color("--morph-two") },
        uColor3: { value: color("--morph-three") },
        uTime: { value: 0 },
      },
      vertexShader: morphRenderVertex,
      fragmentShader: morphRenderFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const mesh = new THREE.Points(geometry, renderMaterial);
    scene.add(mesh);
    let previous = 0;
    let elapsed = clockRef.current;
    let shapeScale = 1;
    let logoScale = 1;
    const pointer = new THREE.Vector2();
    let active = true;
    let rendered = false;
    let raf = 0;
    const resize = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const visibleHeight =
        2 *
        Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
        camera.position.z;
      shapeScale = Math.min(
        4.5,
        (visibleHeight * camera.aspect * 0.8) / 2.2,
        (visibleHeight * 0.8) / 2.1
      );
      logoScale = Math.min(
        4.5,
        (visibleHeight * camera.aspect * 0.82) / 2,
        (visibleHeight * 0.76) / (2 * silhouette.aspect)
      );
      renderMaterial.uniforms.uPixelRatio.value = pixelRatio;
      renderMaterial.uniforms.uParticleScale.value = Math.max(
        0.64,
        Math.min(1, width / 1100)
      );
      if (rendered) {
        stop();
        previous = performance.now();
        render(previous, true);
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!compact) {
        const rect = canvas.getBoundingClientRect();
        pointer.set(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -(((event.clientY - rect.top) / rect.height) * 2 - 1)
        );
      }
    };
    const onLeave = () => {
      pointer.set(0, 0);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const render = (now: number, force = false) => {
      raf = 0;
      const frozen = pausedRef.current;
      if (!active || document.hidden || (frozen && rendered && !force)) return;
      const gap = Math.max(0, (now - previous) / 1000);
      const delta = Math.min(1 / 30, gap);
      previous = now;
      // start() resets the time base after a pause; only simulation dt is clamped.
      elapsed += !frozen && !force ? gap : 0;
      clockRef.current = elapsed;
      const cycle = elapsed % 21;
      const ease = (start: number, end: number) => {
        const t = Math.max(0, Math.min(1, (cycle - start) / (end - start)));
        return t * t * (3 - 2 * t);
      };
      const torus = ease(3, 6) * (1 - ease(17.8, 20.8));
      const logo = ease(9, 13) * (1 - ease(18, 20.8));
      const scale = THREE.MathUtils.lerp(shapeScale, logoScale, logo);
      mesh.scale.set(scale, -scale, scale);
      renderMaterial.uniforms.uPointer.value.lerp(
        pointer,
        1 - Math.exp(-delta * 2)
      );
      simMaterial.uniforms.uPosition.value = rendered
        ? rt1.texture
        : baseTexture;
      simMaterial.uniforms.uTime.value = elapsed;
      simMaterial.uniforms.uDelta.value = delta;
      simMaterial.uniforms.uTorus.value = torus;
      simMaterial.uniforms.uLogo.value = logo;
      simMaterial.uniforms.uInitial.value = rendered ? 0 : 1;
      renderer.setRenderTarget(rt2);
      renderer.clear();
      renderer.render(simScene, simCamera);
      renderer.setRenderTarget(null);
      renderMaterial.uniforms.uPosition.value = rt2.texture;
      renderMaterial.uniforms.uTime.value = elapsed;
      renderer.clear();
      renderer.render(scene, camera);
      if (!rendered) setReady(true);
      const swap = rt1;
      rt1 = rt2;
      rt2 = swap;
      rendered = true;
      if (!frozen) raf = requestAnimationFrame(render);
    };
    const start = () => {
      if (raf || !active || document.hidden || (pausedRef.current && rendered))
        return;
      previous = performance.now();
      raf = requestAnimationFrame(render);
    };
    controlsRef.current = {
      toggle: () => {
        pausedRef.current = !pausedRef.current;
        setPaused(pausedRef.current);
        if (pausedRef.current) stop();
        else start();
      },
      replay: () => {
        stop();
        elapsed = 0;
        clockRef.current = 0;
        rendered = false;
        pausedRef.current = false;
        setPaused(false);
        start();
      },
    };
    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      stop();
      setUnavailable(true);
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry?.isIntersecting ?? false;
        if (active) start();
        else stop();
      },
      { threshold: 0 }
    );
    const resizeObserver = new ResizeObserver(resize);
    resize();
    observer.observe(canvas);
    resizeObserver.observe(container);
    document.addEventListener("visibilitychange", onVisibility);
    canvas.addEventListener("pointermove", onMove, { passive: true });
    canvas.addEventListener("pointerleave", onLeave, { passive: true });
    canvas.addEventListener("webglcontextlost", onContextLost);
    start();
    return () => {
      controlsRef.current = null;
      stop();
      observer.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      geometry.dispose();
      simMesh.geometry.dispose();
      simMaterial.dispose();
      renderMaterial.dispose();
      baseTexture.dispose();
      targetTexture.dispose();
      rt1.dispose();
      rt2.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    };
  }, [shouldInitialize, reducedMotion, unavailable, compact]);

  const showFallback = reducedMotion || unavailable || !ready;
  return (
    <>
      <div className="closing-art">
        <canvas
          key={`${reducedMotion ? "static" : "animated"}-${compact}`}
          ref={canvasRef}
          className="particle-field particle-field-morph"
          style={{
            visibility: showFallback ? "hidden" : "visible",
            opacity: 0.95,
          }}
          aria-hidden="true"
        />
        {showFallback && (
          <img
            src={symbolUrl}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "8%",
              top: "11%",
              width: "84%",
              height: "78%",
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
              opacity: 0.28,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
      {!reducedMotion && !unavailable && (
        <div
          className="closing-motion-controls"
          aria-label={zh ? "展翼动画控制" : "Brand animation controls"}
        >
          <button
            type="button"
            onClick={() => controlsRef.current?.toggle()}
            aria-label={
              zh
                ? paused
                  ? "继续动画"
                  : "暂停动画"
                : paused
                  ? "Play animation"
                  : "Pause animation"
            }
          >
            {paused ? <Play size={14} /> : <Pause size={14} />}
          </button>
          <button type="button" onClick={() => controlsRef.current?.replay()}>
            <RotateCcw size={13} />
            <span>{zh ? "重播演化" : "Replay"}</span>
          </button>
        </div>
      )}
    </>
  );
}
