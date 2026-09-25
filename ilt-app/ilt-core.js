/*
 * ILT core: 1D inverse Laplace transform for relaxation / diffusion data.
 *
 * Independent implementation of the published algorithm:
 *   L. Venkataramanan, Y.-Q. Song, M. D. Hürlimann, IEEE Trans. Signal Process. 50, 1017 (2002)
 *   J. P. Butler, J. A. Reeds, S. V. Dawson, SIAM J. Numer. Anal. 18, 381 (1981)  (BRD)
 *
 * Problem: find f >= 0 minimising ||K f - y||^2 + alpha ||f||^2
 *   1. K is compressed with an SVD (keep singular values above sfactor * s_max).
 *   2. For fixed alpha the problem is solved in the dual variable c (length = rank)
 *      with Newton's method: f = max(0, K~' c).
 *   3. alpha is chosen by BRD (alpha = sqrt(r) sigma / ||c||), an S-curve slope, or fixed.
 */
(function (root) {
  'use strict';

  const KERNELS = {
    T2:    { label: 'T2 decay  exp(-t/T)',               f: (t, T) => Math.exp(-t / T) },
    T1IR:  { label: 'T1 inversion recovery  1-2exp(-t/T)', f: (t, T) => 1 - 2 * Math.exp(-t / T) },
    T1SR:  { label: 'T1 saturation recovery  1-exp(-t/T)', f: (t, T) => 1 - Math.exp(-t / T) },
    D:     { label: 'Diffusion  exp(-b D)',              f: (b, D) => Math.exp(-b * D) },
    GAUSS: { label: 'Gaussian decay  exp(-t^2/2T^2)',    f: (t, T) => Math.exp(-0.5 * (t / T) * (t / T)) },
  };

  function logspace(a, b, n) {
    const la = Math.log10(a), lb = Math.log10(b), out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = Math.pow(10, n === 1 ? la : la + (lb - la) * i / (n - 1));
    return out;
  }
  function linspace(a, b, n) {
    const out = new Float64Array(n);
    for (let i = 0; i < n; i++) out[i] = n === 1 ? a : a + (b - a) * i / (n - 1);
    return out;
  }
  const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

  // Householder QR of an m x n matrix given as n columns. Returns R (n x n, columns) and Q'y.
  function qrWithRhs(cols, y) {
    const n = cols.length, m = y.length, A = cols.map(c => Float64Array.from(c)), b = Float64Array.from(y);
    const k = Math.min(m, n);
    for (let j = 0; j < k; j++) {
      const a = A[j];
      let norm = 0;
      for (let i = j; i < m; i++) norm += a[i] * a[i];
      norm = Math.sqrt(norm);
      if (norm === 0) continue;
      const alpha = a[j] > 0 ? -norm : norm;
      const v = new Float64Array(m - j);
      v[0] = a[j] - alpha;
      for (let i = j + 1; i < m; i++) v[i - j] = a[i];
      const vv = dot(v, v);
      if (vv === 0) continue;
      const apply = x => {
        let s = 0;
        for (let i = j; i < m; i++) s += v[i - j] * x[i];
        s = 2 * s / vv;
        for (let i = j; i < m; i++) x[i] -= s * v[i - j];
      };
      for (let jj = j; jj < n; jj++) apply(A[jj]);
      apply(b);
    }
    const R = A.map(c => Float64Array.from(c.subarray(0, k)));
    return { R, qty: b.subarray(0, k) };
  }

  // One-sided Jacobi SVD of a square-ish matrix given as columns (rows = cols[0].length).
  function jacobiSVD(cols) {
    const n = cols.length, m = cols[0].length, A = cols.map(c => Float64Array.from(c));
    const V = [];
    for (let j = 0; j < n; j++) { const v = new Float64Array(n); v[j] = 1; V.push(v); }
    const eps = 1e-15;
    for (let sweep = 0; sweep < 80; sweep++) {
      let rotated = false;
      for (let p = 0; p < n - 1; p++) {
        for (let q = p + 1; q < n; q++) {
          const ap = A[p], aq = A[q];
          let a = 0, b = 0, g = 0;
          for (let i = 0; i < m; i++) { a += ap[i] * ap[i]; b += aq[i] * aq[i]; g += ap[i] * aq[i]; }
          if (Math.abs(g) <= eps * Math.sqrt(a * b) || g === 0) continue;
          rotated = true;
          const zeta = (b - a) / (2 * g);
          const t = (zeta >= 0 ? 1 : -1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
          const c = 1 / Math.sqrt(1 + t * t), s = c * t;
          for (let i = 0; i < m; i++) { const x = ap[i], y = aq[i]; ap[i] = c * x - s * y; aq[i] = s * x + c * y; }
          const vp = V[p], vq = V[q];
          for (let i = 0; i < n; i++) { const x = vp[i], y = vq[i]; vp[i] = c * x - s * y; vq[i] = s * x + c * y; }
        }
      }
      if (!rotated) break;
    }
    const sv = A.map(a => Math.sqrt(dot(a, a)));
    const order = sv.map((s, i) => i).sort((i, j) => sv[j] - sv[i]);
    return {
      s: order.map(i => sv[i]),
      U: order.map(i => { const u = A[i], s = sv[i]; return s > 0 ? u.map(x => x / s) : u; }),
      V: order.map(i => V[i]),
    };
  }

  function cholSolve(H, g) { // H: r x r array of rows (SPD), solves H x = g
    const r = g.length, L = H.map(row => Float64Array.from(row));
    for (let j = 0; j < r; j++) {
      let d = L[j][j];
      for (let k = 0; k < j; k++) d -= L[j][k] * L[j][k];
      if (d <= 0) d = 1e-300;
      L[j][j] = Math.sqrt(d);
      for (let i = j + 1; i < r; i++) {
        let s = L[i][j];
        for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
        L[i][j] = s / L[j][j];
      }
    }
    const z = new Float64Array(r);
    for (let i = 0; i < r; i++) { let s = g[i]; for (let k = 0; k < i; k++) s -= L[i][k] * z[k]; z[i] = s / L[i][i]; }
    const x = new Float64Array(r);
    for (let i = r - 1; i >= 0; i--) { let s = z[i]; for (let k = i + 1; k < r; k++) s -= L[k][i] * x[k]; x[i] = s / L[i][i]; }
    return x;
  }

  // Km: r rows (Float64Array length n). Minimise Phi(c) = 1/2 sum max(0,Km'c)^2 + alpha/2 |c|^2 - c.mt
  function solveFixedAlpha(Km, mt, alpha, c0, opts) {
    const r = Km.length, n = Km[0].length;
    const maxIt = (opts && opts.newtonMax) || 500, tol = (opts && opts.newtonTol) || 1e-10;
    let c = c0 ? Float64Array.from(c0) : new Float64Array(r);
    const z = new Float64Array(n);
    const calcZ = (cc, out) => { out.fill(0); for (let i = 0; i < r; i++) { const ci = cc[i], row = Km[i]; for (let j = 0; j < n; j++) out[j] += row[j] * ci; } return out; };
    const phi = (cc, zz) => { let s = 0; for (let j = 0; j < n; j++) if (zz[j] > 0) s += zz[j] * zz[j]; return 0.5 * s + 0.5 * alpha * dot(cc, cc) - dot(cc, mt); };
    const mnorm = Math.sqrt(dot(mt, mt)) || 1;
    calcZ(c, z);
    let it = 0;
    for (; it < maxIt; it++) {
      const g = new Float64Array(r);
      for (let i = 0; i < r; i++) { let s = 0; const row = Km[i]; for (let j = 0; j < n; j++) if (z[j] > 0) s += row[j] * z[j]; g[i] = s + alpha * c[i] - mt[i]; }
      if (Math.sqrt(dot(g, g)) < tol * mnorm) break;
      const H = [];
      for (let i = 0; i < r; i++) {
        const hi = new Float64Array(r), ri = Km[i];
        for (let k = 0; k <= i; k++) { let s = 0; const rk = Km[k]; for (let j = 0; j < n; j++) if (z[j] > 0) s += ri[j] * rk[j]; hi[k] = s; }
        H.push(hi);
      }
      for (let i = 0; i < r; i++) { for (let k = i + 1; k < r; k++) H[i][k] = H[k][i]; H[i][i] += alpha; }
      const dc = cholSolve(H, g.map(v => -v));
      const f0 = phi(c, z), slope = dot(g, dc);
      let t = 1, cNew, zNew = new Float64Array(n);
      for (let ls = 0; ls < 60; ls++) {
        cNew = c.map((v, i) => v + t * dc[i]);
        calcZ(cNew, zNew);
        if (phi(cNew, zNew) <= f0 + 1e-4 * t * slope) break;
        t *= 0.5;
      }
      c = cNew; z.set(zNew);
      if (t * Math.sqrt(dot(dc, dc)) < 1e-14 * (Math.sqrt(dot(c, c)) + 1e-300)) break;
    }
    const f = z.map(v => (v > 0 ? v : 0));
    return { c, f, iterations: it };
  }

  function compress(K, y, sfactor) {
    const { R, qty } = qrWithRhs(K, y);
    const k = qty.length, n0 = R.length;
    let svd;
    if (k < n0) { // fewer data points than grid points: decompose R' (k columns) instead
      const Rt = [];
      for (let i = 0; i < k; i++) Rt.push(Float64Array.from(R, col => col[i]));
      const t = jacobiSVD(Rt);
      svd = { s: t.s, U: t.V, V: t.U };
    } else {
      svd = jacobiSVD(R);
    }
    const smax = svd.s[0];
    let r = 0;
    while (r < svd.s.length && svd.s[r] > sfactor * smax) r++;
    r = Math.max(1, Math.min(r, y.length));
    const n = K.length;
    const Km = [], mt = new Float64Array(r);
    for (let i = 0; i < r; i++) {
      const row = new Float64Array(n);
      for (let j = 0; j < n; j++) row[j] = svd.s[i] * svd.V[i][j];
      Km.push(row);
      mt[i] = dot(svd.U[i], qty);
    }
    return { Km, mt, r, s: svd.s };
  }

  function forward(K, f) {
    const m = K[0].length, out = new Float64Array(m);
    for (let j = 0; j < K.length; j++) { const fj = f[j]; if (!fj) continue; const col = K[j]; for (let i = 0; i < m; i++) out[i] += col[i] * fj; }
    return out;
  }

  function findPeaks(T, f, logGrid) {
    const n = f.length, fmax = Math.max(...f);
    if (!(fmax > 0)) return [];
    const peaks = [];
    for (let i = 0; i < n; i++) {
      const l = i > 0 ? f[i - 1] : 0, r = i < n - 1 ? f[i + 1] : 0;
      if (f[i] > 0.02 * fmax && f[i] >= l && f[i] > r) peaks.push(i);
    }
    const total = f.reduce((a, b) => a + b, 0);
    // split at minima between successive peaks
    const bounds = [0];
    for (let k = 0; k < peaks.length - 1; k++) {
      let mi = peaks[k];
      for (let i = peaks[k]; i <= peaks[k + 1]; i++) if (f[i] < f[mi]) mi = i;
      bounds.push(mi);
    }
    bounds.push(n - 1);
    return peaks.map((p, k) => {
      let area = 0, wsum = 0;
      for (let i = bounds[k]; i <= bounds[k + 1]; i++) {
        const w = (i === bounds[k] && k > 0) || (i === bounds[k + 1] && k < peaks.length - 1) ? 0.5 : 1;
        area += w * f[i];
        wsum += w * f[i] * (logGrid ? Math.log(T[i]) : T[i]);
      }
      const mean = area > 0 ? (logGrid ? Math.exp(wsum / area) : wsum / area) : T[p];
      return { index: p, Tpeak: T[p], Tmean: mean, amplitude: area, fraction: total > 0 ? area / total : 0, from: T[bounds[k]], to: T[bounds[k + 1]] };
    });
  }


  // ---------- NNLS (Lawson-Hanson active set, on the normal equations) ----------
  function nnlsNormal(AtA, Atb, maxIter) {
    const n = Atb.length, x = new Float64Array(n), P = new Uint8Array(n);
    const w = () => { const g = new Float64Array(n); for (let i = 0; i < n; i++) { let s = Atb[i]; const row = AtA[i]; for (let j = 0; j < n; j++) s -= row[j] * x[j]; g[i] = s; } return g; };
    const solveP = () => {
      const idx = []; for (let i = 0; i < n; i++) if (P[i]) idx.push(i);
      const H = idx.map(i => Float64Array.from(idx, j => AtA[i][j] + (i === j ? 1e-13 * AtA[i][i] : 0)));
      const z = cholSolve(H, Float64Array.from(idx, i => Atb[i]));
      const out = new Float64Array(n); idx.forEach((i, k) => { out[i] = z[k]; }); return out;
    };
    const tolW = 1e-12 * Math.max(...Atb.map(Math.abs), 1e-300);
    for (let outer = 0; outer < (maxIter || 3 * n); outer++) {
      const g = w();
      let jmax = -1, gmax = tolW;
      for (let i = 0; i < n; i++) if (!P[i] && g[i] > gmax) { gmax = g[i]; jmax = i; }
      if (jmax < 0) break;
      P[jmax] = 1;
      for (let inner = 0; inner < 3 * n; inner++) {
        const z = solveP();
        let ok = true; for (let i = 0; i < n; i++) if (P[i] && z[i] <= 0) { ok = false; break; }
        if (ok) { x.set(z); break; }
        let a = Infinity;
        for (let i = 0; i < n; i++) if (P[i] && z[i] <= 0) a = Math.min(a, x[i] / (x[i] - z[i]));
        for (let i = 0; i < n; i++) if (P[i]) { x[i] += a * (z[i] - x[i]); if (x[i] <= 1e-300) { x[i] = 0; P[i] = 0; } }
      }
    }
    return x;
  }

  // ---------- discrete multi-component fit (Levenberg-Marquardt on A_i, ln T_i, baseline) ----------
  function discreteFit(x, y, kernel, T0, withBaseline) {
    const k = KERNELS[kernel].f, nc = T0.length, m = x.length;
    let scale = 0; for (const v of y) scale = Math.max(scale, Math.abs(v));
    const yn = Float64Array.from(y, v => v / scale);
    // start amplitudes from a linear least-squares with the fixed starting T's
    let p = [];
    {
      const cols = T0.map(T => Float64Array.from(x, t => k(t, T)));
      if (withBaseline) cols.push(new Float64Array(m).fill(1));
      const q = cols.length, AtA = [], Atb = new Float64Array(q);
      for (let i = 0; i < q; i++) { AtA.push(Float64Array.from(cols, c => dot(cols[i], c))); Atb[i] = dot(cols[i], yn); }
      const a = nnlsNormal(AtA, Atb);
      for (let i = 0; i < nc; i++) p.push(Math.max(a[i], 1e-3));
      for (let i = 0; i < nc; i++) p.push(Math.log(T0[i]));
      if (withBaseline) p.push(a[nc] || 0);
    }
    const np_ = p.length;
    const model = pp => {
      const out = new Float64Array(m);
      for (let c = 0; c < nc; c++) { const A = pp[c], T = Math.exp(pp[nc + c]); for (let i = 0; i < m; i++) out[i] += A * k(x[i], T); }
      if (withBaseline) for (let i = 0; i < m; i++) out[i] += pp[2 * nc];
      return out;
    };
    const ssr = pp => { const f = model(pp); let s = 0; for (let i = 0; i < m; i++) { const d = yn[i] - f[i]; s += d * d; } return s; };
    const jac = pp => {
      const f0 = model(pp), J = [];
      for (let j = 0; j < np_; j++) {
        const h = 1e-6 * Math.max(Math.abs(pp[j]), 1e-3), q = pp.slice(); q[j] += h;
        const f1 = model(q); J.push(Float64Array.from(f1, (v, i) => (v - f0[i]) / h));
      }
      return { J, f0 };
    };
    let lambda = 1e-3, cur = ssr(p);
    for (let it = 0; it < 300; it++) {
      const { J, f0 } = jac(p);
      const JtJ = J.map(a => Float64Array.from(J, b => dot(a, b)));
      const r = Float64Array.from(yn, (v, i) => v - f0[i]);
      const Jtr = Float64Array.from(J, a => dot(a, r));
      let improved = false;
      for (let tries = 0; tries < 20; tries++) {
        const H = JtJ.map((row, i) => row.map((v, j) => v + (i === j ? lambda * (JtJ[i][i] || 1e-12) : 0)));
        const d = cholSolve(H, Jtr);
        const q = p.map((v, i) => v + d[i]);
        let valid = true; for (let c = 0; c < nc; c++) if (q[c] < 0 || !isFinite(q[nc + c])) valid = false;
        const s2 = valid ? ssr(q) : Infinity;
        if (s2 < cur) { const rel = (cur - s2) / cur; p = q; cur = s2; lambda = Math.max(lambda / 3, 1e-12); improved = rel > 1e-12; break; }
        lambda *= 4;
      }
      if (!improved) break;
    }
    // uncertainties from (J'J)^-1 * reduced chi^2
    const { J, f0 } = jac(p);
    const JtJ = J.map(a => Float64Array.from(J, b => dot(a, b)));
    const dof = Math.max(1, m - np_), rcs = cur / dof;
    const err = new Float64Array(np_);
    for (let j = 0; j < np_; j++) { const e = new Float64Array(np_); e[j] = 1; const col = cholSolve(JtJ.map(r => Float64Array.from(r)), e); err[j] = Math.sqrt(Math.max(col[j], 0) * rcs); }
    let Atot = 0; for (let c = 0; c < nc; c++) Atot += p[c];
    const comps = [];
    for (let c = 0; c < nc; c++) {
      const T = Math.exp(p[nc + c]);
      comps.push({ A: p[c] * scale, Aerr: err[c] * scale, T, Terr: T * err[nc + c], fraction: Atot > 0 ? p[c] / Atot : 0 });
    }
    comps.sort((a, b) => a.T - b.T);
    const baseline = withBaseline ? p[2 * nc] * scale : 0, baselineErr = withBaseline ? err[2 * nc] * scale : 0;
    const fit = Float64Array.from(f0, v => v * scale);
    const partials = comps.map(cp => Float64Array.from(x, t => cp.A * k(t, cp.T) + baseline));
    return { comps, baseline, baselineErr, fit, partials };
  }

  /*
   * opts: { kernel, Tmin, Tmax, nT, gridSpace: 'log'|'linear', mode: 'brd'|'scurve'|'fixed',
   *         alpha, sigma (0 = auto), sfactor, baseline (bool), scurveTarget, alphaTol, alphaMax }
   */
  function invert(x, yRaw, opts) {
    const t0 = (typeof performance !== 'undefined' ? performance : Date).now();
    const o = Object.assign({ kernel: 'T2', Tmin: 1e-4, Tmax: 10, nT: 100, gridSpace: 'log', mode: 'brd', alpha: 1,
      sigma: 0, sfactor: 1e-4, baseline: false, scurveTarget: 0.1, alphaTol: 1e-4, alphaMax: 5000, nScurve: 41 }, opts || {});
    const m = x.length;
    if (m < 3 || yRaw.length !== m) throw new Error('Need at least 3 (x, y) points.');
    const kern = KERNELS[o.kernel];
    if (!kern) throw new Error('Unknown kernel ' + o.kernel);
    const T = o.gridSpace === 'linear' ? linspace(o.Tmin, o.Tmax, o.nT) : logspace(o.Tmin, o.Tmax, o.nT);

    let scale = 0;
    for (const v of yRaw) scale = Math.max(scale, Math.abs(v));
    if (!(scale > 0)) throw new Error('All y values are zero.');
    const y = Float64Array.from(yRaw, v => v / scale);

    const K = [];
    for (let j = 0; j < T.length; j++) K.push(Float64Array.from(x, t => kern.f(t, T[j])));
    if (o.baseline) { K.push(new Float64Array(m).fill(1)); K.push(new Float64Array(m).fill(-1)); }

    const { Km, mt, r, s } = compress(K, y, o.sfactor);
    const yy = dot(y, y), mm = dot(mt, mt);
    const sigmaAuto = m > r ? Math.sqrt(Math.max(yy - mm, 0) / (m - r)) : 0;
    let sigma = o.sigma > 0 ? o.sigma / scale : sigmaAuto;

    const chiOf = f => { const fit = forward(K, f); let s2 = 0; for (let i = 0; i < m; i++) { const d = fit[i] - y[i]; s2 += d * d; } return Math.sqrt(s2 / m); };

    const nnlsMode = o.mode === 'nnls';
    // S-curve (computed for the regularised modes so it can be plotted)
    const s0sq = s[0] * s[0];
    const alphas = logspace(s0sq * 10, s0sq * 1e-14, o.nScurve);
    const scurve = [];
    let cPrev = null;
    for (const a of (nnlsMode ? [] : alphas)) {
      const sol = solveFixedAlpha(Km, mt, a, cPrev);
      cPrev = sol.c;
      scurve.push({ alpha: a, chi: chiOf(sol.f) });
    }
    for (let i = 0; i < scurve.length; i++) {
      const a = scurve[Math.max(0, i - 1)], b = scurve[Math.min(scurve.length - 1, i + 1)];
      scurve[i].slope = (Math.log10(b.chi) - Math.log10(a.chi)) / (Math.log10(b.alpha) - Math.log10(a.alpha));
    }

    // alpha where d log(chi) / d log(alpha) first reaches the target, walking up from small alpha
    const asc = scurve.slice().reverse();
    let alphaS = asc.length ? asc[asc.length - 1].alpha : 0;
    for (let i = 1; i < asc.length; i++) {
      if (asc[i].slope >= o.scurveTarget) {
        const p = asc[i - 1], q = asc[i], w = (o.scurveTarget - p.slope) / ((q.slope - p.slope) || 1);
        alphaS = Math.pow(10, Math.log10(p.alpha) + Math.min(1, Math.max(0, w)) * (Math.log10(q.alpha) - Math.log10(p.alpha)));
        break;
      }
    }

    let alpha, c = null, brdIterations = 0, converged = true, warning = '';
    if (nnlsMode) {
      alpha = 0;
    } else if (o.mode === 'fixed') {
      alpha = o.alpha > 0 ? o.alpha : 1;
    } else if (o.mode === 'scurve') {
      alpha = alphaS;
    } else { // BRD
      if (!(sigma > 0)) sigma = 1e-6;
      alpha = o.alpha > 0 ? o.alpha : 1;
      converged = false;
      const alphaFloor = alphaS * 1e-5;
      for (; brdIterations < o.alphaMax; brdIterations++) {
        const sol = solveFixedAlpha(Km, mt, alpha, c);
        c = sol.c;
        const cn = Math.sqrt(dot(c, c));
        const aNew = Math.sqrt(r) * sigma / (cn || 1e-300);
        const rel = Math.abs(aNew - alpha) / alpha;
        alpha = aNew;
        if (rel < o.alphaTol) { converged = true; break; }
        if (alpha < alphaFloor) break;
      }
      if (!converged || alpha < alphaFloor) {
        warning = 'BRD could not reach the noise level (' + (sigma * scale).toPrecision(3) +
          '). Used the S-curve alpha instead. Try setting the noise sigma by hand.';
        alpha = alphaS; c = null; converged = false;
      }
    }

    let fScaled;
    if (nnlsMode) { // plain non-negative least squares on the full kernel (no regularisation)
      const q = K.length, AtA = [], Atb = new Float64Array(q);
      for (let i = 0; i < q; i++) { const row = new Float64Array(q); for (let j = 0; j <= i; j++) row[j] = dot(K[i], K[j]); AtA.push(row); Atb[i] = dot(K[i], y); }
      for (let i = 0; i < q; i++) for (let j = i + 1; j < q; j++) AtA[i][j] = AtA[j][i];
      fScaled = nnlsNormal(AtA, Atb);
    } else {
      fScaled = solveFixedAlpha(Km, mt, alpha, c).f;
    }
    const fitScaled = forward(K, fScaled);
    const nT = T.length;
    const f = Float64Array.from(fScaled.subarray(0, nT), v => v * scale);
    const baseline = o.baseline ? (fScaled[nT] - fScaled[nT + 1]) * scale : 0;
    const fit = Float64Array.from(fitScaled, v => v * scale);
    const resid = Float64Array.from(yRaw, (v, i) => v - fit[i]);
    const rms = Math.sqrt(resid.reduce((a, v) => a + v * v, 0) / m);
    const sigmaUsed = (sigma > 0 ? sigma : sigmaAuto) * scale;
    const total = f.reduce((a, b) => a + b, 0);
    const logGrid = o.gridSpace !== 'linear';
    let lm = 0;
    for (let j = 0; j < nT; j++) lm += f[j] * (logGrid ? Math.log(T[j]) : T[j]);
    const meanT = total > 0 ? (logGrid ? Math.exp(lm / total) : lm / total) : NaN;

    return {
      T, f, fit, resid, x, y: yRaw, baseline, alpha, rank: r, singularValues: s,
      sigma: sigmaUsed, sigmaAuto: sigmaAuto * scale, rms, chi2red: sigmaUsed > 0 ? (rms * rms) / (sigmaUsed * sigmaUsed) : NaN,
      snr: sigmaUsed > 0 ? scale / sigmaUsed : Infinity, total, meanT,
      peaks: findPeaks(T, f, logGrid), brdIterations, converged, warning, alphaScurve: alphaS,
      scurve: scurve.map(p => ({ alpha: p.alpha, chi: p.chi * scale, slope: p.slope })),
      ms: (typeof performance !== 'undefined' ? performance : Date).now() - t0,
    };
  }

  const api = { invert, discreteFit, nnlsNormal, KERNELS, logspace, linspace };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ILT = api;
})(typeof self !== 'undefined' ? self : this);
