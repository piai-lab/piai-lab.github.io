// A bounded, synthetic active-learning demonstration, not a scientific result.
// The inference engine observes terminal vertical positions only. It never reads
// WORLD parameters, and chooses probes by posterior predictive disagreement.
export const STEPS = 240;
const WORLD = [0.83, 1.17];
const centers = [[-1.45, 0.85], [1.25, -0.8]];
export function trace(strengths, y0, z = 0) {
  const points = []; let y = y0, velocity = 0;
  const dx = 10 / STEPS;
  function acceleration(x, yy, v) {
    let a = -0.075 * v;
    for (let i = 0; i < 2; i++) {
      const cx = centers[i][0], cy = centers[i][1];
      const distance = ((x - cx) / 1.2) ** 2 + ((yy - cy) / 1.65) ** 2;
      a -= strengths[i] * (yy - cy) * Math.exp(-distance);
    }
    return a;
  }
  for (let i = 0; i <= STEPS; i++) {
    const x = -5 + dx * i;
    points.push([x, y, z]);
    // Midpoint integration of the transverse-motion model.
    const a = acceleration(x, y, velocity);
    const vh = velocity + a * dx * .5;
    y += vh * dx;
    velocity += acceleration(x + dx * .5, y - vh * dx * .5, vh) * dx;
  }
  return points;
}
const terminal = path => path.at(-1)[1];
const truth = y => trace(WORLD, y);
export function makeExperiment() {
  const hypotheses = [];
  for (let a = 0; a <= 30; a++) for (let b = 0; b <= 30; b++) hypotheses.push([a / 20, b / 20]);
  let weights = hypotheses.map(() => 1 / hypotheses.length);
  const candidates = Array.from({length: 17}, (_, i) => -2.4 + i * .3);
  const table = candidates.map(y => hypotheses.map(h => terminal(trace(h, y))));
  const estimate = () => [0, 1].map(j => hypotheses.reduce((s, h, i) => s + weights[i] * h[j], 0));
  const trials = [];
  // The first observation is fixed. Subsequent probes are selected autonomously.
  for (let round = 0; round < 4; round++) {
    const scores = table.map((v, i) => {
      if (trials.some(t => t.candidate === i)) return -Infinity;
      const mean = v.reduce((s, x, k) => s + weights[k] * x, 0);
      return v.reduce((s, x, k) => s + weights[k] * (x - mean) ** 2, 0);
    });
    const best = round === 0 ? 10 : scores.indexOf(Math.max(...scores));
    const y = candidates[best];
    const before = round === 0 ? [0, 0] : estimate();
    const actual = truth(y), predicted = trace(before, y);
    const measurement = terminal(actual);
    // A noise-tolerant likelihood, not a hardcoded reveal of the world.
    const sigma = .15;
    const logs = hypotheses.map((_, k) => Math.log(Math.max(weights[k], 1e-280)) - .5 * ((table[best][k] - measurement) / sigma) ** 2);
    const maxLog = Math.max(...logs), raw = logs.map(v => Math.exp(v - maxLog));
    const sum = raw.reduce((a, b) => a + b, 0);
    weights = raw.map(v => v / sum);
    const after = estimate();
    trials.push({round, candidate: best, y, scores, score: scores[best], maxScore: Math.max(...scores), before, after, actual, predicted, revised: trace(after, y), error: Math.abs(terminal(predicted) - measurement), remaining: weights.filter(w => w > .002).length});
  }
  const learned = estimate();
  const heldOutY = [-2.17, -1.37, -.67, .43, 1.13, 2.03];
  const heldOut = heldOutY.map((y, i) => {
    const actual = truth(y), predicted = trace(learned, y), baseline = trace([0, 0], y);
    const z = (i % 3 - 1) * .6;
    return {y, z, actual: actual.map(p => [p[0], p[1], z]), predicted: predicted.map(p => [p[0], p[1], z]), error: Math.abs(terminal(predicted) - terminal(actual)), baselineError: Math.abs(terminal(baseline) - terminal(actual))};
  });
  return {trials, heldOut, candidates, learned, summary: {
    model: 'Two-parameter transverse force field; synthetic observations',
    priorCandidates: hypotheses.length,
    measuredProbeInputs: trials.map(t => t.y),
    heldOutInputs: heldOutY,
    finalParameters: learned,
    baselineMAE: heldOut.reduce((s, t) => s + t.baselineError, 0) / heldOut.length,
    heldOutMAE: heldOut.reduce((s, t) => s + t.error, 0) / heldOut.length,
    activeSelectionVerified: trials.slice(1).every(t => Math.abs(t.score - t.maxScore) < 1e-12)
  }};
}

// Shared by the animated scene and its static fallback
export const discoveryExperiment = makeExperiment();
