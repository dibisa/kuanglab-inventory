# Relaxation ILT Bench

A small, self-contained app for 1D inverse Laplace transforms of NMR relaxation and diffusion data (T2/CPMG, T1 inversion or saturation recovery, diffusion, Gaussian T2). Load a two-column x/y file and the distribution, fit and residuals update right away. Everything runs in the browser, so nothing is installed and no data leaves your computer.

## Use it

* **Offline:** open `ilt-bench.html` in any browser. It is one file (page and solver together), so you can copy or email it.
* **From this folder:** open `index.html` (it loads `ilt-core.js` from the same folder).

Input: any text file with columns separated by spaces, tabs or commas (`.int`, `.txt`, `.dat`, `.csv`). Lines starting with `#` and other non-numeric lines are skipped. Pick other columns with the x/y column boxes.

## Methods

| Method | What it does |
|---|---|
| Regularized (BRD) | min ‖Kf − y‖² + α‖f‖², f ≥ 0. SVD-compressed kernel, Newton solve in the dual, α from the Butler–Reeds–Dawson rule. Same algorithm class as osilap. |
| Regularized (S-curve / fixed α) | Same solver with α picked from the slope of log χ vs log α, or entered directly. |
| NNLS | Unregularized non-negative least squares (Lawson–Hanson). |
| Discrete | Multi-exponential least-squares fit (Levenberg–Marquardt) with ± errors, seeded from the regularized peaks. |

If the automatic noise estimate is too low for BRD to converge, the app falls back to the S-curve α and says so; entering σ by hand fixes it.

Kernels match `decay2distr.py`: `cpmg` = exp(−t/T), `ir` = 1 − 2 exp(−t/T), `diff` = exp(−bD), `t2g` = exp(−t²/2T²), plus saturation recovery 1 − exp(−t/T).

## Output

* Copy distribution or fit/residual tables (tab separated) to Excel, Origin or Igor.
* Save a `.out` file in the `decay2distr.py` layout, so `out2plot.py` can read it.
* Peak table (position, log-mean, area, fraction) and area between user-set bounds, like `out2plot.py`.

## Files

* `ilt-core.js` holds the numerical code (no dependencies; also usable from Node: `require('./ilt-core.js')`, though this repo's package.json sets ES module mode, so copy it to a `.cjs` file first).
* `index.html` is the interface.
* `make_standalone.py` rebuilds `ilt-bench.html` after edits: `python3 make_standalone.py`.

## References

* L. Venkataramanan, Y.-Q. Song, M. D. Hürlimann, *IEEE Trans. Signal Process.* 50, 1017 (2002).
* J. P. Butler, J. A. Reeds, S. V. Dawson, *SIAM J. Numer. Anal.* 18, 381 (1981).
* C. L. Lawson, R. J. Hanson, *Solving Least Squares Problems* (1974).

This is an independent implementation. It does not contain or call osilap (T. Ohkubo, Chiba University), whose licence restricts redistribution.
