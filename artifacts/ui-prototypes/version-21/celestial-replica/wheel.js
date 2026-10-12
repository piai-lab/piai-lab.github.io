// Copied-adapted from zaoxu001/celestial-wheel, MIT (see ../../celestial-replica/LICENSE).
// Source commit: 92523275172139b3f67f06a3fa080b4e4f0d4e3d.
// Copied-adapted from ../biomedical-wheel/wheel-starlight.js: independent
// quaternions and closed orbit. Signed harmonic opening passes smoothly through
// the concentric pose, then opens on the other side without reversing momentum.
// Local adaptation: DIKW semantics, physical ring surfaces, no selection effects.
// 21: theme changes update existing materials; the accepted motion stays intact.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { getRingsDef } from '../../celestial-replica/data.js'
import { CYCLE, TAU, createRingMotion, openingAt, spinAt, setRingPose,
  setBeaconLocalPosition, setBeaconWorldPosition, cinematicAt } from '../../celestial-replica/kinematics.js'

const FONT = '"Zhuque Fangsong","Songti SC","STSong","Noto Serif SC",serif'
const ICE = 0xcbe9ee, GOLD = 0xe6b77c
// The existing semantic ring order carries three mineral tones, never a rainbow.
const RING_TONES = [0xc7e5f8, 0xf1c58e, 0xbcdcf2]

// Rectangular atlas cells have the same aspect ratio as their world-space planes.
// Higher resolution alone cannot fix words squeezed into a square radial cell.
function atlas(items, width, height, kind) {
  const cols = Math.ceil(Math.sqrt(items.length)), rows = Math.ceil(items.length / cols)
  const cv = document.createElement('canvas'); cv.width = cols * width; cv.height = rows * height
  const ctx = cv.getContext('2d'); if (!ctx) throw new Error('Canvas2D unavailable')
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  items.forEach((item, i) => {
    ctx.save(); ctx.translate((i % cols) * width, Math.floor(i / cols) * height)
    let size = height * (kind === 't4' ? .24 : kind === 't2' ? .72 : .7)
    ctx.font = `500 ${size}px ${FONT}`
    const measured = ctx.measureText(item.label)
    if (measured.width > width * .88) { size *= width * .88 / measured.width; ctx.font = `500 ${size}px ${FONT}` }
    const m = ctx.measureText(item.label)
    if(item.plate){ctx.strokeStyle='rgba(241,245,235,.7)';ctx.lineWidth=3;ctx.strokeRect(width*.12,height*.13,width*.76,height*.74)}
    ctx.fillStyle = item.isTitle ? '#ffffff' : '#eff7f8'
    ctx.fillText(item.label, (width + m.actualBoundingBoxLeft - m.actualBoundingBoxRight) / 2, (height + m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) / 2)
    ctx.restore()
  })
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.minFilter = THREE.LinearMipmapLinearFilter
  return { tex, cols, rows }
}

export function createCelestialWheel(host, { onFocus, onError, onReady, paused = false, reduced = false, en = false, theme = 'dark' } = {}) {
  const RINGS_DEF = getRingsDef(en), atlasTextures = []
  const params = new URLSearchParams(location.search)
  const requestedFrame = params.get('frame') ?? (params.has('t') ? String(Number(params.get('t')) * 60) : null)
  const fixedFrame = requestedFrame !== null && requestedFrame.trim() !== '' && Number.isFinite(Number(requestedFrame))
  const fixedTime = fixedFrame ? Math.max(0, Number(requestedFrame)) / 60 : 0
  delete host.dataset.focusRing; host.dataset.pulse = "0"
  host.dataset.cycleSeconds = String(CYCLE); host.dataset.reviewFrame = fixedFrame ? String(Number(requestedFrame)) : ''
  const canvas = document.createElement('canvas'); canvas.style.cssText = 'display:block;width:100%;height:100%;touch-action:pan-y'; canvas.setAttribute('aria-hidden', 'true'); host.appendChild(canvas)
  let renderer
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' }) }
  catch (error) { canvas.remove(); throw error }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2)); renderer.setSize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight))
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15; renderer.setClearColor(0x071722,0)
  const scene = new THREE.Scene()
  const room = new RoomEnvironment(), pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(room, .035)
  scene.environment = environment.texture; scene.environmentIntensity = .9
  room.dispose(); pmrem.dispose()
  const hemisphere = new THREE.HemisphereLight(0xe3f6f4, 0x123437, .9); scene.add(hemisphere)
  const key = new THREE.DirectionalLight(0xffecd5, 2.1); key.position.set(-5, 7, 9); scene.add(key)
  const rim = new THREE.DirectionalLight(0xcceafa, 1.4); rim.position.set(6, 3, -4); scene.add(rim)
  const warm = new THREE.PointLight(0xffd8a8, 26, 24, 2); warm.position.set(-3, -1, 5); scene.add(warm)
  const camera = new THREE.PerspectiveCamera(36, Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight), .1, 100)
  const world = new THREE.Group(); scene.add(world)
  // One clock drives optical currents, ring motion and the camera. Integer
  // harmonics make every effect close on the same 24-second seam.
  const flowPhase = { value: 0 }, lightTheme = { value: 0 }
  const geo = new THREE.PlaneGeometry(1, 1)
  const circle = (r, opacity = .22, color = ICE, seg = 256) => {
    const pts = []; for (let k = 0; k <= seg; k++) { const a = k / seg * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r)) }
    const material=new THREE.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false })
    material.onBeforeCompile=shader=>{
      shader.vertexShader='varying float vOpticalDepth;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\nvOpticalDepth=clamp((24.0+mvPosition.z)/9.0,.38,1.0);')
      shader.fragmentShader='varying float vOpticalDepth;\n'+shader.fragmentShader
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vOpticalDepth;')
    }
    return new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),material)
  }
  // Actual rounded metal edges, so highlights change with the original camera.
  const metalTrack = (r, color, thickness=.006) => {
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, thickness, 8, 320),
      new THREE.MeshStandardMaterial({color, metalness:.94, roughness:.17, emissive:color, emissiveIntensity:.025, transparent:true, opacity:1}))
    mesh.rotation.x = Math.PI / 2
    return mesh
  }
  const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=128
  const starCtx=starCanvas.getContext('2d'),starGradient=starCtx.createRadialGradient(64,64,0,64,64,64)
  starGradient.addColorStop(0,'rgba(255,255,255,1)');starGradient.addColorStop(.22,'rgba(255,255,255,1)');starGradient.addColorStop(.34,'rgba(255,255,255,.5)');starGradient.addColorStop(.48,'rgba(255,255,255,.10)');starGradient.addColorStop(1,'rgba(255,255,255,0)')
  starCtx.fillStyle=starGradient;starCtx.fillRect(0,0,128,128)
  const starTexture=new THREE.CanvasTexture(starCanvas);atlasTextures.push(starTexture)
  const flareCanvas=document.createElement('canvas');flareCanvas.width=flareCanvas.height=256
  const flareCtx=flareCanvas.getContext('2d'),fg=flareCtx.createRadialGradient(128,128,0,128,128,128)
  fg.addColorStop(0,'#ffffff');fg.addColorStop(.035,'#ffffff');fg.addColorStop(.10,'rgba(255,255,255,.75)');fg.addColorStop(.24,'rgba(255,255,255,.11)');fg.addColorStop(1,'rgba(255,255,255,0)')
  flareCtx.fillStyle=fg;flareCtx.fillRect(0,0,256,256)
  const flareLine=flareCtx.createLinearGradient(30,128,226,128);flareLine.addColorStop(0,'rgba(255,255,255,0)');flareLine.addColorStop(.46,'rgba(255,255,255,.25)');flareLine.addColorStop(.5,'rgba(255,255,255,.9)');flareLine.addColorStop(.54,'rgba(255,255,255,.25)');flareLine.addColorStop(1,'rgba(255,255,255,0)')
  flareCtx.strokeStyle=flareLine;flareCtx.lineWidth=1.6;flareCtx.beginPath();flareCtx.moveTo(30,128);flareCtx.lineTo(226,128);flareCtx.stroke();flareCtx.translate(128,128);flareCtx.rotate(Math.PI/2);flareCtx.translate(-128,-128);flareCtx.beginPath();flareCtx.moveTo(30,128);flareCtx.lineTo(226,128);flareCtx.stroke()
  const flareTexture=new THREE.CanvasTexture(flareCanvas);atlasTextures.push(flareTexture)
  let opticalSeed=172913
  const sample=()=>{opticalSeed=(Math.imul(opticalSeed,1664525)+1013904223)>>>0;return opticalSeed/4294967296}
  const gaussian=()=>Math.sqrt(-2*Math.log(Math.max(1e-6,sample())))*Math.cos(2*Math.PI*sample())
  const opticalPoints=(positions,sizes,colors,size,opacity)=>{
    const geometry=new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(positions,3)).setAttribute('aSize',new THREE.Float32BufferAttribute(sizes,1)).setAttribute('color',new THREE.Float32BufferAttribute(colors,3))
    const material=new THREE.PointsMaterial({map:starTexture,vertexColors:true,size,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending})
    material.onBeforeCompile=shader=>{shader.vertexShader='attribute float aSize;\n'+shader.vertexShader;shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * aSize;')}
    const p=new THREE.Points(geometry,material);p.frustumCulled=false;return p
  }
  // One draw call per ring, but positions live in the scene's fixed coordinates.
  // Evaluate the same motion law at t-age, including the earlier ring plane.
  // No accumulated history: pause, seek and the closed seam stay deterministic.
  function addBeaconTrails(R) {
    const positions=[],sizes=[],colors=[],tailAlpha=[]
    R.beacons.forEach((beacon,j)=>{
      const lifetime=j===0?.42:.30,steps=j===0?64:44
      const tint=new THREE.Color(j===0?0xffd4a1:0xd9f0ff)
      beacon.trailStart=positions.length/3;beacon.trailSteps=steps;beacon.trailLifetime=lifetime
      for(let i=0;i<steps;i++){
        const age=i/(steps-1)
        positions.push(0,0,0)
        sizes.push((j===0?2.3:1.2)*Math.pow(1-age,.65)+.025)
        tailAlpha.push(Math.pow(1-age,1.7))
        tint.clone().multiplyScalar(Math.pow(1-age,1.7)).toArray(colors,colors.length)
      }
    })
    const trail=opticalPoints(positions,sizes,colors,.14,.94)
    trail.geometry.getAttribute('position').setUsage(THREE.DynamicDrawUsage)
    trail.material.toneMapped=false
    trail.geometry.setAttribute('aTailAlpha',new THREE.Float32BufferAttribute(tailAlpha,1))
    const sizeShader=trail.material.onBeforeCompile
    trail.material.onBeforeCompile=shader=>{
      sizeShader(shader)
      shader.uniforms.uLightTheme=lightTheme
      shader.vertexShader='attribute float aTailAlpha;\nvarying float vTailAlpha;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvTailAlpha=aTailAlpha;')
      shader.fragmentShader='uniform float uLightTheme;\nvarying float vTailAlpha;\n'+shader.fragmentShader
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= mix(1.,vTailAlpha,uLightTheme);')
    }
    trail.material.customProgramCacheKey=()=> 'celestial-trail-theme-v1'
    R.trail=trail;scene.add(trail)
  }
  const RINGS = RINGS_DEF.map((r,i) => ({...r,...createRingMotion(i,r)}))
  RINGS.forEach((R, ringIndex) => {
    R.tint = [0xe5c186,0xc8dada,0xd8ac6c,0xc5d8da,0xb1c9cc,0xdbb782,0xa6c3ca,0xc3d7db,0xc9dcde,0xbcd0d4,0xd6ac79,0xd3b889][ringIndex]
    const g = new THREE.Group(); world.add(g); R.group = g
    R.depth = ringIndex / (RINGS.length - 1); R.angle = spinAt(R,0)
    const n = R.items.length, tang = Math.min(R.w*.6, 2 * Math.PI * R.r / n * .65)
    const cellHeight = 192, cellWidth = Math.round(cellHeight * tang / R.w)
    const { tex, cols, rows } = atlas(R.items, cellWidth, cellHeight, R.kind); atlasTextures.push(tex)
    const cells=[]
    R.items.forEach((it,i)=>{
      const a=i/n*Math.PI*2,plane=geo.clone(),uv=plane.getAttribute('uv')
      for(let j=0;j<uv.count;j++)uv.setXY(j,(uv.getX(j)+i%cols)/cols,(uv.getY(j)+rows-Math.floor(i/cols)-1)/rows)
      const mesh=new THREE.Mesh(plane)
      mesh.position.set(Math.cos(a)*R.r,.006,Math.sin(a)*R.r);mesh.scale.set(tang,R.w*.60,1)
      mesh.rotation.set(-Math.PI/2,-a+Math.PI/2,0,'YXZ');mesh.updateMatrix()
      plane.applyMatrix4(mesh.matrix);cells.push(plane)
    })
    const glyphs=new THREE.Mesh(mergeGeometries(cells),new THREE.MeshBasicMaterial({map:tex,color:R.tint,transparent:true,depthWrite:false,side:THREE.DoubleSide,forceSinglePass:true,opacity:.8,toneMapped:false}))
    cells.forEach(cell=>cell.dispose());if(R.primary){g.add(glyphs);R.glyphs=glyphs}else{glyphs.geometry.dispose();glyphs.material.dispose()}
    const bandWidth = R.w
    if(R.primary){
      const surface = new THREE.Mesh(new THREE.RingGeometry(R.r-bandWidth/2,R.r+bandWidth/2,320),
        new THREE.MeshPhysicalMaterial({color:0x294149,metalness:.6,roughness:.20,clearcoat:1,clearcoatRoughness:.08,transparent:true,opacity:.22,side:THREE.DoubleSide,depthWrite:false}))
      surface.rotation.x=-Math.PI/2;surface.position.y=-.006;g.add(surface);R.surface=surface
      R.tracks=[metalTrack(R.r-bandWidth/2,R.tint,.009),metalTrack(R.r+bandWidth/2,R.tint,.007)];g.add(...R.tracks)
      // Delicate paired threads leave the center of each band transparent.
      R.threads=[circle(R.r-bandWidth*.28,.3,R.tint),circle(R.r+bandWidth*.28,.22,R.tint)];g.add(...R.threads)
    }else{
      R.tracks=[metalTrack(R.r,R.tint,.0035)];R.threads=[circle(R.r+.028,.18,R.tint)];g.add(...R.tracks,...R.threads)
    }
    // Luminous grains hug each real ring plane; no radial pattern in outer dust.
    const grains=[],grainSizes=[],grainColors=[],tint=new THREE.Color(R.tint)
    for(let i=0;i<Math.round(50+R.r*40);i++){
      const a=i/Math.round(50+R.r*40)*Math.PI*2,rr=R.r+(sample()-.5)*R.w*.65,y=gaussian()*.009
      grains.push(Math.cos(a)*rr,y,Math.sin(a)*rr)
      grainSizes.push(sample()>.985?3.8:sample()>.87?1.9:.6+sample()*.85)
      tint.toArray(grainColors,i*3)
    }
    R.grains=opticalPoints(grains,grainSizes,grainColors,R.primary?.085:.06,.8);g.add(R.grains)
    R.grains.material.onBeforeCompile=shader=>{
      shader.uniforms.uFlowPhase=flowPhase
      shader.vertexShader='attribute float aSize;\nuniform float uFlowPhase;\nvarying float vWave;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float angle=atan(position.z,position.x);
        float travel=uFlowPhase*${((R.turns+R.spinTurns)*R.direction).toFixed(1)}+${(R.phase*.25).toFixed(8)};
        float c=cos(travel),s=sin(travel);
        transformed.x=c*position.x-s*position.z;transformed.z=s*position.x+c*position.z;
        vWave=.35+.65*pow(max(0.,cos(angle*3.-uFlowPhase*2.+${R.phase.toFixed(5)})),8.);
      `)
      shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * aSize * (.75 + vWave * .55);')
      shader.fragmentShader='varying float vWave;\n'+shader.fragmentShader
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= .4 + vWave * .6;')
    }
    R.grains.material.customProgramCacheKey=()=>`current-${ringIndex}`
    R.beacons=[]
    for(let j=0;j<(R.primary?4:2);j++){
      const material=new THREE.SpriteMaterial({map:flareTexture,color:j===0?0xffd4a1:0xd9f0ff,transparent:true,opacity:1,blending:THREE.AdditiveBlending,depthWrite:false})
      const sprite=new THREE.Sprite(material);sprite.scale.setScalar(j===0?.75:.32);g.add(sprite)
      const pearl = new THREE.Mesh(new THREE.SphereGeometry(j===0?.060:.026,20,14),new THREE.MeshStandardMaterial({color:j===0?0xe4e8dc:R.tint,metalness:.63,roughness:.2}))
      g.add(pearl)
      R.beacons.push({sprite,pearl,phase:sample()*Math.PI*2,turns:j===0?R.turns:Math.max(1,R.turns-j%2)})
    }
    addBeaconTrails(R)
  })
  host.dataset.trailCount=String(RINGS.reduce((n,R)=>n+R.beacons.length,0))

  // Center the actual ink bounds, not the advance width or font baseline.
  const glyphCanvas = document.createElement('canvas'); glyphCanvas.width = glyphCanvas.height = 768
  const glyphContext = glyphCanvas.getContext('2d'); if (!glyphContext) throw new Error('Canvas2D unavailable')
  glyphContext.fillStyle = '#e5f4ed'; glyphContext.textAlign = 'left'; glyphContext.textBaseline = 'alphabetic'; glyphContext.font = `500 510px ${FONT}`
  const metrics = glyphContext.measureText('π')
  const glyphX = (768 + metrics.actualBoundingBoxLeft - metrics.actualBoundingBoxRight) / 2
  const glyphY = (768 + metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2
  glyphContext.fillText('π', glyphX, glyphY)
  const inkX = glyphX + (metrics.actualBoundingBoxRight - metrics.actualBoundingBoxLeft) / 2
  const inkY = glyphY + (metrics.actualBoundingBoxDescent - metrics.actualBoundingBoxAscent) / 2
  const glyphTexture = new THREE.CanvasTexture(glyphCanvas); glyphTexture.colorSpace = THREE.SRGBColorSpace; glyphTexture.anisotropy = 8
  const nucleus = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: glyphTexture, transparent: true, depthTest: false, depthWrite: false, opacity: .85 }))
  nucleus.scale.setScalar(1.55); nucleus.material.opacity=1; nucleus.renderOrder = 20; world.add(nucleus)
  const inkLocal = new THREE.Vector3(inkX / 768 - .5, .5 - inkY / 768, 0)
  host.dataset.glyphInkBounds = JSON.stringify({ left: glyphX - metrics.actualBoundingBoxLeft, right: glyphX + metrics.actualBoundingBoxRight, top: glyphY - metrics.actualBoundingBoxAscent, bottom: glyphY + metrics.actualBoundingBoxDescent, canvas: 768 })

  const orbits = [[5.2,.9,.2], [5.35,-.7,.5], [5.15,.3,-.9], [5.45,1.2,.8]].map(([r,tx,tz], i) => { const l = circle(r, .14, RING_TONES[i % 3], 360); l.userData = {tx,tz}; world.add(l); return l })
  // Copied-adapted from universe-field.ts: low-discrepancy samples and point
  // materials. The accepted diffuse field has no river, arm or radial center.
  const radicalInverse=(n,base)=>{let value=0,place=1/base;while(n>0){value+=(n%base)*place;n=Math.floor(n/base);place/=base}return value}
  const atmosphere=new THREE.Group();scene.add(atmosphere)
  const fieldExtent={value:new THREE.Vector2()}
  const starBatches=[{positions:[],sizes:[],colors:[],lightColors:[],seeds:[]},{positions:[],sizes:[],colors:[],lightColors:[],seeds:[]}]
  const starTone=new THREE.Color()
  for(let i=1;i<=16000;i++){
    const x=radicalInverse(i,2)*2.3-1.15,y=radicalInverse(i,3)*2.3-1.15
    const density=.69+.13*Math.sin(x*4.1+.6*Math.cos(y*3.7))+.12*Math.cos(y*5.3-x*1.2)
    if(radicalInverse(i,7)>density)continue
    const depth=radicalInverse(i,5),grain=radicalInverse(i,11),glint=grain>.991
    const batch=starBatches[glint?1:0]
    batch.positions.push(x,y,-(25+depth*22))
    batch.seeds.push(radicalInverse(i,13)*TAU)
    batch.sizes.push(glint?14+depth*8:grain>.95?3.3:.95+grain*1.35)
    starTone.setHex(i%23===0?GOLD:i%3===0?0xb5dce5:ICE).multiplyScalar(glint?1.45:.32+grain*.55).toArray(batch.colors,batch.colors.length)
    starTone.setHex(i%23===0?0x956d42:0x2b6664).toArray(batch.lightColors,batch.lightColors.length)
  }
  function createDiffuseStars(batch,glint){
    const points=opticalPoints(batch.positions,batch.sizes,batch.colors,1,.86)
    points.material.map=glint?flareTexture:starTexture
    points.material.sizeAttenuation=false;points.material.toneMapped=false
    points.geometry.setAttribute('aSeed',new THREE.Float32BufferAttribute(batch.seeds,1))
    points.material.onBeforeCompile=shader=>{
      shader.uniforms.uFlowPhase=flowPhase;shader.uniforms.uFieldExtent=fieldExtent
      shader.vertexShader='attribute float aSize;\nattribute float aSeed;\nuniform float uFlowPhase;\nuniform vec2 uFieldExtent;\nvarying float vStarAlpha;\n'+shader.vertexShader
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
        float depth=clamp((-position.z-25.)/22.,0.,1.);
        vec2 drift=vec2(sin(uFlowPhase+position.y*2.4),cos(uFlowPhase+position.x*2.1));
        drift*=vec2(.008,.006)*mix(1.,.42,depth);
        vec2 screen=position.xy+drift;
        transformed.xy=screen*uFieldExtent*(-position.z);
        float edge=smoothstep(0.,.18,1.-max(abs(screen.x),abs(screen.y)));
        float center=mix(.42,1.,smoothstep(.08,.72,length(screen)));
        vStarAlpha=edge*center*(.90+.10*sin(uFlowPhase+aSeed));
      `)
      shader.vertexShader=shader.vertexShader.replace('gl_PointSize = size;','gl_PointSize = size * aSize;')
      shader.fragmentShader='varying float vStarAlpha;\n'+shader.fragmentShader
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a *= vStarAlpha;')
    }
    points.material.customProgramCacheKey=()=> 'diffuse-volume-v1'
    points.renderOrder=-10;atmosphere.add(points);batch.points=points
  }
  starBatches.forEach((batch,i)=>createDiffuseStars(batch,i===1))
  host.dataset.starCount=String(starBatches.reduce((n,b)=>n+b.seeds.length,0))
  host.dataset.starMode='diffuse-volume'
  host.dataset.primaryRadii=JSON.stringify(RINGS.filter(R=>R.primary).map(R=>({name:R.label,r:R.r})))

  const svgNS='http://www.w3.org/2000/svg'
  const labels=document.createElementNS(svgNS,'svg');labels.setAttribute('aria-hidden','true')
  labels.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible'
  const defs=document.createElementNS(svgNS,'defs');labels.appendChild(defs);host.appendChild(labels)
  const labelRings=RINGS.filter(R=>R.label)
  for(const R of labelRings){
    const path=document.createElementNS(svgNS,'path');path.id='ring-caption-'+R.key;defs.appendChild(path)
    const text=document.createElementNS(svgNS,'text'),along=document.createElementNS(svgNS,'textPath')
    along.setAttribute('href','#'+path.id);along.setAttribute('startOffset','50%');along.setAttribute('text-anchor','middle');along.textContent=R.label
    text.setAttribute('fill',R.key.startsWith('Wisdom')||R.key.startsWith('Model')?'#e2ceb1':'#d5e2df')
    text.style.cssText='font-family:Inter,\"Noto Sans SC\",sans-serif;font-weight:400;paint-order:stroke;stroke:#061820;stroke-width:3px;stroke-linejoin:round'
    text.appendChild(along);labels.appendChild(text);R.caption={path,text}
  }
  const labelPoint=new THREE.Vector3(),labelOrigin=new THREE.Vector3()
  function updateLabels(){
    const w=host.clientWidth,h=host.clientHeight,scale=w/960
    labels.setAttribute('viewBox',`0 0 ${w} ${h}`)
    const project=(R,a)=>{
      labelPoint.set(Math.cos(a)*(R.r+R.w*.8+.10),.008,Math.sin(a)*(R.r+R.w*.8+.10));R.group.localToWorld(labelPoint);labelPoint.project(camera)
      return [(labelPoint.x+1)*w/2,(1-labelPoint.y)*h/2]
    }
    labelOrigin.set(0,0,0);world.localToWorld(labelOrigin);labelOrigin.project(camera)
    const center=[(labelOrigin.x+1)*w/2,(1-labelOrigin.y)*h/2]
    for(const R of labelRings){
      const u=project(R,0).map((x,i)=>x-center[i]),v=project(R,Math.PI/2).map((x,i)=>x-center[i])
      const nx=Math.cos(R.labelStart),ny=Math.sin(R.labelStart)
      const a=Math.atan2(v[0]*nx+v[1]*ny,u[0]*nx+u[1]*ny)
      const anchor=project(R,a),font=Math.max(R.r<1?7.5:8.5,(R.r<1?9:10.5)*scale)
      const length=R.label.length*(font*.65+1.7*scale)+16*scale
      // Captions share the projected ring position, but stay upright and calm.
      // A shallow tangent arc avoids mirrored or compressed text at grazing angles.
      let angle=R.labelStart+Math.PI/2
      while(angle>Math.PI/2)angle-=Math.PI
      while(angle<-Math.PI/2)angle+=Math.PI
      angle=Math.max(-.5,Math.min(.5,angle))
      const dx=Math.cos(angle)*length/2,dy=Math.sin(angle)*length/2
      R.caption.path.setAttribute('d',`M${anchor[0]-dx},${anchor[1]-dy} Q${anchor[0]+ny*2*scale},${anchor[1]-nx*2*scale} ${anchor[0]+dx},${anchor[1]+dy}`)
      R.caption.text.style.fontSize=font+'px';R.caption.text.style.letterSpacing=(1.7*scale)+'px'
      const area=Math.abs(u[0]*v[1]-u[1]*v[0])/(Math.hypot(...u)*Math.hypot(...v)+.001)
      R.caption.text.style.opacity=String(.56+THREE.MathUtils.smoothstep(area,.06,.22)*.36)
    }
  }

  const state = { paused, reduced, theme: theme === 'light' ? 'light' : 'dark' }
  let running = true, raf = 0, elapsed = fixedTime, previous = 0, visible = true, failed = false, frames = 0, disposed = false
  const camPos = new THREE.Vector3(), origin = new THREE.Vector3()
  const trailPoint = new THREE.Vector3(), trailPose = new THREE.Quaternion(), beadPoint = new THREE.Vector3()
  const projected = new THREE.Vector3(), glyphProjected = new THREE.Vector3()
  function applyTheme() {
    const light=state.theme==='light', blend=light?THREE.NormalBlending:THREE.AdditiveBlending
    const cool=0x2b6664, copper=0x956d42
    const tones=[copper,0x356d6b,0x9e774a,cool,0x507d79,0x956d42,0x356e70,0x416f70,0x2b6664,0x507d79,0x956d42,0x896943]
    lightTheme.value=light?1:0
    renderer.setClearColor(light?0xf4f5f1:0x0a151a,0)
    renderer.toneMappingExposure=light?1:1.15
    scene.environmentIntensity=light?.6:.9
    hemisphere.color.setHex(light?0xf5f6ef:0xe3f6f4);hemisphere.groundColor.setHex(light?0x879d92:0x123437);hemisphere.intensity=light?1.1:.9
    key.intensity=light?1.5:2.1;rim.intensity=light?.7:1.4;warm.intensity=light?12:26
    for(const [ringIndex,R] of RINGS.entries()){
      const tint=light?tones[ringIndex]:R.tint
      for(const track of R.tracks){track.material.color.setHex(tint);track.material.emissive.setHex(tint);track.material.emissiveIntensity=light?0:.025;track.material.metalness=light?.72:.94;track.material.roughness=light?.3:.17}
      R.threads.forEach((thread,i)=>{thread.material.color.setHex(tint);thread.material.opacity=light?(R.primary?(i===0?.42:.32):.27):(R.primary?(i===0?.3:.22):.18)})
      if(R.surface){R.surface.material.color.setHex(light?0x376f6b:0x294149);R.surface.material.opacity=light?.085:.22;R.surface.material.roughness=light?.35:.20}
      if(R.glyphs){R.glyphs.material.color.setHex(tint);R.glyphs.material.opacity=light?.9:.8}
      const grainColor=new THREE.Color(tint),grainColors=R.grains.geometry.getAttribute('color')
      for(let i=0;i<grainColors.count;i++)grainColors.setXYZ(i,grainColor.r,grainColor.g,grainColor.b)
      grainColors.needsUpdate=true;R.grains.material.blending=blend;R.grains.material.opacity=light?.64:.8
      R.trail.material.blending=blend;R.trail.material.opacity=light?.66:.94
      const tailColors=R.trail.geometry.getAttribute('color')
      R.beacons.forEach((beacon,j)=>{
        const beaconTint=light?(j===0?copper:cool):(j===0?0xffd4a1:0xd9f0ff)
        beacon.sprite.material.color.setHex(beaconTint);beacon.sprite.material.blending=blend;beacon.sprite.userData.themeOpacity=light?.58:1
        beacon.pearl.material.color.setHex(light?(j===0?copper:tint):(j===0?0xe4e8dc:R.tint));beacon.pearl.material.roughness=light?.32:.2
        const tailColor=new THREE.Color(beaconTint)
        for(let i=0;i<beacon.trailSteps;i++){
          const fade=light?1:Math.pow(1-i/(beacon.trailSteps-1),1.7)
          tailColors.setXYZ(beacon.trailStart+i,tailColor.r*fade,tailColor.g*fade,tailColor.b*fade)
        }
      })
      tailColors.needsUpdate=true
      if(R.caption){R.caption.text.setAttribute('fill',light?(R.key.startsWith('Wisdom')||R.key.startsWith('Model')?'#956d42':'#2b6664'):(R.key.startsWith('Wisdom')||R.key.startsWith('Model')?'#e2ceb1':'#d5e2df'));R.caption.text.style.stroke=light?'#f4f5f1':'#0a151a'}
    }
    nucleus.material.color.setHex(light?cool:0xffffff)
    orbits.forEach((orbit,i)=>orbit.material.color.setHex(light?(i===1?copper:cool):RING_TONES[i%3]))
    for(const batch of starBatches){const colors=batch.points.geometry.getAttribute('color');colors.array.set(light?batch.lightColors:batch.colors);colors.needsUpdate=true;batch.points.material.blending=blend;batch.points.material.opacity=light?.34:.86}
    host.dataset.theme=state.theme
  }
  function updateState() { host.dataset.renderState = failed ? 'fallback' : disposed ? 'disposed' : document.hidden ? 'hidden' : !visible ? 'offscreen' : state.reduced ? 'reduced' : fixedFrame ? 'frame' : state.paused ? 'paused' : 'running' }
  function cancel() { if (raf) cancelAnimationFrame(raf); raf = 0; previous = 0; updateState() }
  function schedule() { if (!running || failed) return; if (document.hidden || !visible) { cancel(); return }; updateState(); if (!raf) raf = requestAnimationFrame(frame) }
  function onVisibility() { if (document.hidden) cancel(); else schedule() }
  function fail() { if (!running || failed) return; failed = true; dispose(); updateState(); onError?.() }
  function onContextLost(e) { e.preventDefault(); fail() }
  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h || !running || failed) return
    const dpr = Math.min(devicePixelRatio || 1, 2); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setPixelRatio(dpr); renderer.setSize(w, h); schedule()
  }
  canvas.addEventListener('webglcontextlost', onContextLost)
  document.addEventListener('visibilitychange', onVisibility); renderer.debug.onShaderError = fail
  const ro = new ResizeObserver(resize); ro.observe(host)
  const io = new IntersectionObserver(entries => { visible = entries[0]?.isIntersecting ?? true; if (visible) schedule(); else cancel() }, { threshold: .01 }); io.observe(host)

  function frame(timestamp) {
    raf = 0
    if (!running || failed || document.hidden || !visible) { cancel(); return }
    const stop = state.paused || state.reduced || fixedFrame
    // Analytic animation uses real active time. Pausing/offscreen resets previous;
    // a slow visible frame must not permanently stretch the active cycle.
    const dt = stop || !previous ? 0 : Math.max(0, (timestamp - previous) / 1000); previous = timestamp; elapsed += dt
    const now = state.reduced ? 0 : fixedFrame ? fixedTime : elapsed
    const cinema = cinematicAt(now, camera.aspect, state.reduced)
    const k = cinema.k, cyclePhase = cinema.phase
    flowPhase.value=cinema.progress*TAU
    // Fixed common center and scale: all visible structure change comes from
    // independent plane rotations, observed by one closed camera path.
    const sinTilt = Math.sin(cinema.tilt), cosTilt = Math.cos(cinema.tilt)
    const sinAzimuth = Math.sin(cinema.azimuth), cosAzimuth = Math.cos(cinema.azimuth)
    camPos.set(sinTilt * sinAzimuth, cosTilt, sinTilt * cosAzimuth).multiplyScalar(cinema.distance)
    if (camera.fov !== cinema.fov) { camera.fov = cinema.fov; camera.updateProjectionMatrix() }
    camera.position.copy(camPos)
    camera.up.set(0,0,-1);camera.lookAt(origin)
    for (const R of RINGS) {
      R.angle=spinAt(R,now);R.opening=openingAt(R,now,state.reduced)
      setRingPose(R,now,R.group.quaternion,state.reduced)
      const positions=R.trail.geometry.getAttribute('position')
      for(const beacon of R.beacons){
        setBeaconLocalPosition(R,beacon,now,beacon.sprite.position)
        beacon.pearl.position.copy(beacon.sprite.position)
        beacon.sprite.material.opacity=(.65+.2*Math.sin(cyclePhase+beacon.phase))*beacon.sprite.userData.themeOpacity
        for(let i=0;i<beacon.trailSteps;i++){
          const age=beacon.trailLifetime*i/(beacon.trailSteps-1)
          setBeaconWorldPosition(R,beacon,now-age,trailPoint,trailPose,state.reduced)
          positions.setXYZ(beacon.trailStart+i,trailPoint.x,trailPoint.y,trailPoint.z)
        }
      }
      positions.needsUpdate=true
    }
    orbits.forEach(o => { o.rotation.set(o.userData.tx*k,0,o.userData.tz*k);o.material.opacity=(state.theme==='light'?.21:.14)*(.7+.3*k*k) })
    // A camera-relative deep volume prevents the wheel's cinematic orbit from
    // dragging the background around. Only the low-amplitude shader drift moves it.
    atmosphere.position.copy(camera.position);atmosphere.quaternion.copy(camera.quaternion)
    const halfHeight=Math.tan(THREE.MathUtils.degToRad(camera.fov/2))
    fieldExtent.value.set(halfHeight*camera.aspect,halfHeight)
    nucleus.quaternion.copy(camera.quaternion)
    try { renderer.render(scene,camera); updateLabels() } catch { fail(); return }
    if (failed) return
    // Publish review telemetry at 10 Hz; fixed and paused frames remain exact.
    if (stop || frames % 6 === 0) {
    projected.set(0, 0, 0); world.localToWorld(projected); projected.project(camera)
    glyphProjected.copy(inkLocal); nucleus.localToWorld(glyphProjected); glyphProjected.project(camera)
    const toPixels = v => `${((v.x + 1) * host.clientWidth / 2).toFixed(3)},${((1 - v.y) * host.clientHeight / 2).toFixed(3)}`
    host.dataset.piCenter = toPixels(projected); host.dataset.glyphCenter = toPixels(glyphProjected)
    host.dataset.wheelMode = 'harmonic-spatial-celestial'; host.dataset.expansion = k.toFixed(3)
    host.dataset.cycle = cinema.cycle.toFixed(3); host.dataset.approach = cinema.approach.toFixed(4); host.dataset.motionProgress = cinema.progress.toFixed(5)
    host.dataset.camera = JSON.stringify({ position: camera.position.toArray(), target: [0, 0, 0], fov: cinema.fov, distance: cinema.distance, fitDistance: cinema.fitDistance, roll: cinema.roll, azimuth: cinema.azimuth, tilt: cinema.tilt })
    host.dataset.ringAngles = JSON.stringify(RINGS.map(R => Number(R.angle.toFixed(7))))
    host.dataset.drawCalls = String(renderer.info.render.calls)
    host.dataset.ringPoses = JSON.stringify(RINGS.map(R => R.group.quaternion.toArray()))
    host.dataset.ringOffsets = JSON.stringify(RINGS.map(R => R.group.position.toArray()))
    host.dataset.ringOpenings = JSON.stringify(RINGS.map(R => R.opening))
    host.dataset.worldScale = JSON.stringify(world.scale.toArray())
    host.dataset.flowPhase = flowPhase.value.toFixed(7)
    // Normalized first-star displacement mirrors the actual vertex shader.
    const first=starBatches[0],sx=first.positions[0],sy=first.positions[1],sz=first.positions[2]
    const depth=(-sz-25)/22,speed=1-.58*depth
    host.dataset.starDrift=JSON.stringify([.008*speed*Math.sin(flowPhase.value+sy*2.4),.006*speed*Math.cos(flowPhase.value+sx*2.1)])
    // Compare uploaded world-space trail heads with the rendered bead positions.
    let trailHeadError=0
    const beadPositions=[],tailPositions=[]
    for(const R of RINGS)for(const beacon of R.beacons){
      const p=R.trail.geometry.getAttribute('position'),n=beacon.trailStart
      beacon.pearl.getWorldPosition(beadPoint)
      trailHeadError=Math.max(trailHeadError,Math.hypot(p.getX(n)-beadPoint.x,p.getY(n)-beadPoint.y,p.getZ(n)-beadPoint.z))
      if(beacon===R.beacons[0]){
        const tail=n+beacon.trailSteps-1
        beadPositions.push(beadPoint.toArray())
        tailPositions.push([p.getX(tail),p.getY(tail),p.getZ(tail)])
      }
    }
    host.dataset.beadPositions=JSON.stringify(beadPositions)
    host.dataset.tailPositions=JSON.stringify(tailPositions)
    host.dataset.tailAge=String(RINGS[0].beacons[0].trailLifetime)
    host.dataset.trailHeadError=trailHeadError.toExponential(3)
    host.dataset.fps = dt > 0 ? (1/dt).toFixed(1) : '0'
    }
    host.dataset.frame = String(++frames); host.dataset.time = now.toFixed(3); updateState()
    if (frames === 1) onReady?.()
    if (!stop) schedule()
  }
  function dispose() {
    if (disposed) return
    disposed = true; running = false; cancel(); ro.disconnect(); io.disconnect()
    canvas.removeEventListener('webglcontextlost', onContextLost); document.removeEventListener('visibilitychange', onVisibility)
    renderer.debug.onShaderError = null
    const geometries = new Set(), materials = new Set(), textures = new Set(atlasTextures)
    scene.traverse(object => { if (object.geometry) geometries.add(object.geometry); const mm = object.material ? (Array.isArray(object.material) ? object.material : [object.material]) : []; for (const m of mm) { materials.add(m); if (m.map) textures.add(m.map) } })
    textures.forEach(texture => texture.dispose()); materials.forEach(material => material.dispose()); geometries.forEach(geometry => geometry.dispose())
    environment.dispose(); scene.clear(); renderer.renderLists.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); labels.remove(); host.style.cursor = ''; updateState()
  }
  applyTheme()
  resize()
  return {
    restart() { elapsed=0; previous=0; cancel(); schedule() },
    setState(next) {
      const playbackChanged=('paused' in next&&state.paused!==!!next.paused)||('reduced' in next&&state.reduced!==!!next.reduced)
      if('paused' in next)state.paused=!!next.paused
      if('reduced' in next)state.reduced=!!next.reduced
      if(next.theme&&next.theme!==state.theme){state.theme=next.theme==='light'?'light':'dark';applyTheme()}
      // A theme-only update never resets previous or elapsed, including mid-frame.
      if(playbackChanged)cancel()
      schedule()
    },
    dispose,
  }
}
