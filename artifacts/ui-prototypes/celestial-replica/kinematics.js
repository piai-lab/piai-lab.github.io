import { Euler, Quaternion, MathUtils } from 'three'

export const CYCLE = 24, TAU = Math.PI * 2, BEACON_HEIGHT = .018
// Copied-adapted from ../biomedical-wheel/wheel.js, original 09/12/14 planes.
// Preserve the approved independent axes; only their timing is coordinated.
const SPATIAL_POSES = [
  [.15078925,3.02555786,-.92895214], [.43407205,3.65780148,-.16840548],
  [-.74882742,1.44793367,-1.09355409], [-.32050602,2.75078535,-.96100424],
  [-.64971223,2.40911256,-1.10275479], [.08841140,5.66196996,-.01673721],
  [-.12299076,.28125609,.85063672], [-1.11406224,4.68987443,-.02186525],
  [.99504086,3.73545581,-.21602163], [-.86230225,3.52141110,-.59538934],
  [-.62733668,5.69143313,.70084125], [-.58064997,5.15063634,-.40096336],
]

export function phaseAt(seconds) {
  return ((seconds % CYCLE) + CYCLE) % CYCLE / CYCLE * TAU
}

export function createRingMotion(index, { r, speed }) {
  const [rx, ry, rz] = SPATIAL_POSES[index]
  const basePose = new Quaternion().setFromEuler(new Euler(rx, ry, rz, 'YXZ'))
  return {
    basePose, phase: index / SPATIAL_POSES.length * TAU,
    direction: Math.sign(speed), spinTurns: r < 1 ? 3 : r < 2 ? 2 : 1,
    turns: r < 1 ? 3 : r < 3.1 ? 2 : 1,
  }
}

export function openingAt(ring, seconds, expanded = false) {
  const phase = phaseAt(seconds)
  return expanded ? 1 : Math.sin(phase) * (1 + .18 * Math.sin(phase + ring.phase))
}

export function spinAt(ring, seconds) {
  return ring.phase * .25 + ring.direction * ring.spinTurns * phaseAt(seconds)
}

function setTilt(ring, seconds, target, expanded) {
  return target.identity().slerp(ring.basePose, openingAt(ring, seconds, expanded))
}

export function setRingPose(ring, seconds, target, expanded = false) {
  setTilt(ring, seconds, target, expanded)
  // Multiply by local Y rotation without allocating a quaternion per sample.
  const angle = spinAt(ring, seconds) / 2, s = Math.sin(angle), c = Math.cos(angle)
  const { x, y, z, w } = target
  return target.set(x*c-z*s, y*c+w*s, z*c+x*s, w*c-y*s)
}

export function setBeaconLocalPosition(ring, beacon, seconds, target) {
  // rotateY(a) maps an XZ-circle angle b to b-a. Compensate the ring's
  // material rotation so the beacon retains its declared world-orbit rate.
  const angle = beacon.phase + ring.direction * beacon.turns * phaseAt(seconds) + spinAt(ring, seconds)
  return target.set(Math.cos(angle)*ring.r, BEACON_HEIGHT, Math.sin(angle)*ring.r)
}

export function setBeaconWorldPosition(ring, beacon, seconds, target, scratchPose, expanded = false) {
  const angle = beacon.phase + ring.direction * beacon.turns * phaseAt(seconds)
  target.set(Math.cos(angle)*ring.r, BEACON_HEIGHT, Math.sin(angle)*ring.r)
  return target.applyQuaternion(setTilt(ring, seconds, scratchPose, expanded))
}

export function cinematicAt(seconds, aspect, expanded = false) {
  const phase = phaseAt(seconds), progress = phase / TAU, cycle = progress * CYCLE
  const k = expanded ? 1 : Math.sin(phase)
  const fov = 38
  const halfFov = Math.atan(Math.tan(MathUtils.degToRad(fov/2)) * Math.min(1, aspect))
  const fitDistance = 6.15 / Math.sin(halfFov), distance = fitDistance * .90
  // The camera's angular speed stays positive (0.36–1.64 times base speed),
  // slowing at the two open passages. Fixed distance and up-vector avoid
  // competing zoom, breathing and roll while the ring planes cross.
  const azimuth = expanded ? Math.PI/6 : phase + .32 * Math.sin(2*phase)
  const tilt = expanded ? 1.10 : 1.25 * Math.sin(phase)
  return { cycle, phase, progress, k, approach: 0, fov, distance, fitDistance, azimuth, tilt, roll: 0 }
}
