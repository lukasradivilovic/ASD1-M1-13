/*
 * Porównanie kosztu metod (karta, punkt 5).
 * Liczniki: add = liczba dodawań, sub = liczba odejmowań wykonanych przez badany
 * algorytm. Losowanie danych i zapytań, walidacja i interfejs nie są liczone.
 * Dane są deterministyczne (stałe ziarno), więc wyniki da się powtórzyć.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./algorithms.js'));
  else root.Compare = factory(root.PS);
})(typeof self !== 'undefined' ? self : this, function (PS) {
  'use strict';

  function randomArray(rand, n) { return Array.from({ length: n }, () => PS.randInt(rand, -20, 20)); }
  function randomMatrix(rand, R, C) { return Array.from({ length: R }, () => randomArray(rand, C)); }

  /** q zapytań [l, r) losowanych jednostajnie spośród poprawnych par 0 ≤ l ≤ r ≤ n. */
  function randomQueries(rand, n, q) {
    const out = [];
    for (let k = 0; k < q; k++) {
      let l = PS.randInt(rand, 0, n), r = PS.randInt(rand, 0, n);
      if (l > r) [l, r] = [r, l];
      out.push([l, r]);
    }
    return out;
  }

  /** Jedno doświadczenie 1D: te same zapytania obiema metodami. */
  function experiment1D(A, queries) {
    const naive = PS.newCounter();
    const resN = queries.map(([l, r]) => PS.naiveSum1D(A, l, r, naive));
    const build = PS.newCounter();
    const P = PS.buildPrefix1D(A, build);
    const query = PS.newCounter();
    const resP = queries.map(([l, r]) => PS.query1D(P, l, r, query));
    const agree = resN.every((v, i) => v === resP[i]);
    return {
      n: A.length, q: queries.length,
      naiveOps: naive.add + naive.sub,
      buildOps: build.add + build.sub,
      queryOps: query.add + query.sub,
      prefixTotal: build.add + build.sub + query.add + query.sub,
      naiveMem: 1, prefixMem: A.length + 1,
      agree
    };
  }

  function run1D(opts) {
    const o = Object.assign({ sizes: [8, 32, 64], counts: [1, 10, 100], seed: 2026, worst: false }, opts);
    const rand = PS.rng(o.seed);
    const rows = [];
    for (const n of o.sizes) {
      const A = randomArray(rand, n);
      for (const q of o.counts) {
        const queries = o.worst ? Array.from({ length: q }, () => [0, n]) : randomQueries(PS.rng(o.seed + n * 1000 + q), n, q);
        rows.push(experiment1D(A, queries));
      }
    }
    return rows;
  }

  /** Macierz: budowa, jedna zmiana set i jedno zapytanie. */
  function run2D(opts) {
    const o = Object.assign({ sizes: [3, 6, 10], seed: 2026 }, opts);
    const rows = [];
    for (const s of o.sizes) {
      const rand = PS.rng(o.seed + s);
      const M = randomMatrix(rand, s, s);
      const si = PS.randInt(rand, 0, s - 1), sj = PS.randInt(rand, 0, s - 1), sx = PS.randInt(rand, -20, 20);
      let r1 = PS.randInt(rand, 0, s), r2 = PS.randInt(rand, 0, s); if (r1 > r2) [r1, r2] = [r2, r1];
      let c1 = PS.randInt(rand, 0, s), c2 = PS.randInt(rand, 0, s); if (c1 > c2) [c1, c2] = [c2, c1];
      for (const variant of ['losowy', 'cała macierz']) {
        const rect = variant === 'losowy' ? [r1, r2, c1, c2] : [0, s, 0, s];
        // metoda bez przygotowania: set to samo przypisanie (0 operacji), zapytanie przegląda pola
        const Mn = M.map(r => r.slice()); Mn[si][sj] = sx;
        const naive = PS.newCounter();
        const resN = PS.naiveSum2D(Mn, ...rect, naive);
        // sumy prefiksowe
        const build = PS.newCounter();
        const pm = new PS.PrefixMatrix(M, build);
        const upd = PS.newCounter(); pm.cnt = upd; pm.set(si, sj, sx);
        const qc = PS.newCounter(); pm.cnt = qc; const resP = pm.sum(...rect);
        rows.push({
          size: `${s}×${s}`, variant, rect: `[${rect[0]},${rect[1]})×[${rect[2]},${rect[3]})`, set: `set(${si},${sj},${sx})`,
          naiveOps: naive.add + naive.sub,
          buildOps: build.add + build.sub,
          updateOps: upd.add + upd.sub,
          queryOps: qc.add + qc.sub,
          prefixTotal: build.add + build.sub + upd.add + upd.sub + qc.add + qc.sub,
          prefixMem: (s + 1) * (s + 1),
          agree: resN === resP, result: resP
        });
      }
    }
    return rows;
  }

  return { run1D, run2D, experiment1D, randomQueries, randomArray, randomMatrix };
});
