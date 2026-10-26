/*
 * ASD1-M1-13 — Sumy prefiksowe i zapytania na zakresach
 * Badane algorytmy: sumowanie bez przygotowania, sumy prefiksowe 1D i 2D,
 * zmiana danych set(...) z odbudową sum.
 *
 * Plik działa w przeglądarce (window.PS) i w Node (module.exports),
 * dzięki temu testy sprawdzają dokładnie ten sam kod, który widzi aplikacja.
 *
 * Liczniki: każda funkcja przyjmuje opcjonalny obiekt `cnt` = {add, sub}.
 *   add – liczba wykonanych dodawań (operator +),
 *   sub – liczba wykonanych odejmowań (operator −).
 * Walidacja, kopiowanie tablic i animacja NIE są liczone.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.PS = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const LIMITS = { maxLen: 64, minVal: -20, maxVal: 20, maxRows: 10, maxCols: 10 };

  class ValidationError extends Error {
    constructor(msg) { super(msg); this.name = 'ValidationError'; }
  }

  function newCounter() { return { add: 0, sub: 0 }; }
  function noCounter(c) { return c || newCounter(); }

  // ---------- walidacja ----------
  function isInt(v) { return typeof v === 'number' && Number.isInteger(v); }

  function checkValue(x, where) {
    if (!isInt(x)) throw new ValidationError(`${where}: wartość "${x}" nie jest liczbą całkowitą`);
    if (x < LIMITS.minVal || x > LIMITS.maxVal)
      throw new ValidationError(`${where}: wartość ${x} spoza zakresu ${LIMITS.minVal}…${LIMITS.maxVal}`);
  }

  function validateArray(a) {
    if (!Array.isArray(a)) throw new ValidationError('Tablica musi być listą liczb');
    if (a.length > LIMITS.maxLen) throw new ValidationError(`Tablica może mieć najwyżej ${LIMITS.maxLen} elementy (ma ${a.length})`);
    a.forEach((x, i) => checkValue(x, `A[${i}]`));
  }

  function validateMatrix(m) {
    if (!Array.isArray(m) || m.length < 1 || m.length > LIMITS.maxRows)
      throw new ValidationError(`Macierz musi mieć od 1 do ${LIMITS.maxRows} wierszy`);
    const C = Array.isArray(m[0]) ? m[0].length : 0;
    if (C < 1 || C > LIMITS.maxCols) throw new ValidationError(`Macierz musi mieć od 1 do ${LIMITS.maxCols} kolumn`);
    m.forEach((row, i) => {
      if (!Array.isArray(row) || row.length !== C)
        throw new ValidationError(`Wiersz ${i} ma inną liczbę kolumn niż wiersz 0 (macierz musi być prostokątna)`);
      row.forEach((x, j) => checkValue(x, `M[${i}][${j}]`));
    });
  }

  function validateRange(n, l, r) {
    if (!isInt(l) || !isInt(r)) throw new ValidationError('Granice l i r muszą być liczbami całkowitymi');
    if (l < 0 || r > n) throw new ValidationError(`Granice spoza danych: wymagane 0 ≤ l ≤ r ≤ ${n}, podano [${l}, ${r})`);
    if (l > r) throw new ValidationError(`Odwrócony zakres: l = ${l} > r = ${r}`);
  }

  function validateRect(R, C, r1, r2, c1, c2) {
    if (![r1, r2, c1, c2].every(isInt)) throw new ValidationError('Granice prostokąta muszą być liczbami całkowitymi');
    if (r1 < 0 || r2 > R || c1 < 0 || c2 > C)
      throw new ValidationError(`Granice spoza macierzy ${R}×${C}: podano [${r1}, ${r2}) × [${c1}, ${c2})`);
    if (r1 > r2 || c1 > c2)
      throw new ValidationError(`Odwrócony prostokąt: [${r1}, ${r2}) × [${c1}, ${c2})`);
  }

  function validateIndex(n, i) {
    if (!isInt(i) || i < 0 || i >= n) throw new ValidationError(`Indeks ${i} spoza tablicy (dozwolone 0…${n - 1})`);
  }

  function validateCell(R, C, i, j) {
    if (!isInt(i) || !isInt(j) || i < 0 || i >= R || j < 0 || j >= C)
      throw new ValidationError(`Komórka (${i}, ${j}) spoza macierzy ${R}×${C}`);
  }

  // ---------- 1D ----------
  /** Sumowanie bez przygotowania: przechodzi po A[l..r-1]. Koszt: r−l dodawań. */
  function naiveSum1D(a, l, r, cnt) {
    cnt = noCounter(cnt);
    validateRange(a.length, l, r);
    let s = 0;
    for (let i = l; i < r; i++) { s = s + a[i]; cnt.add++; }
    return s;
  }

  /** Budowa P: P[0] = 0, P[i+1] = P[i] + A[i]. Koszt: n dodawań, pamięć n+1. */
  function buildPrefix1D(a, cnt) {
    cnt = noCounter(cnt);
    const P = new Array(a.length + 1);
    P[0] = 0;
    for (let i = 0; i < a.length; i++) { P[i + 1] = P[i] + a[i]; cnt.add++; }
    return P;
  }

  /** Zapytanie o sumę [l, r) = P[r] − P[l]. Koszt: 1 odejmowanie. */
  function query1D(P, l, r, cnt) {
    cnt = noCounter(cnt);
    validateRange(P.length - 1, l, r);
    cnt.sub++;
    return P[r] - P[l];
  }

  // ---------- 2D ----------
  function naiveSum2D(m, r1, r2, c1, c2, cnt) {
    cnt = noCounter(cnt);
    validateRect(m.length, m[0].length, r1, r2, c1, c2);
    let s = 0;
    for (let i = r1; i < r2; i++)
      for (let j = c1; j < c2; j++) { s = s + m[i][j]; cnt.add++; }
    return s;
  }

  /**
   * P ma wymiary (R+1)×(C+1), zerowy wiersz 0 i zerowa kolumna 0.
   * P[i+1][j+1] = M[i][j] + P[i][j+1] + P[i+1][j] − P[i][j]
   * Koszt: 2 dodawania + 1 odejmowanie na komórkę.
   */
  function buildPrefix2D(m, cnt) {
    cnt = noCounter(cnt);
    const R = m.length, C = m[0].length;
    const P = Array.from({ length: R + 1 }, () => new Array(C + 1).fill(0));
    for (let i = 0; i < R; i++)
      for (let j = 0; j < C; j++) {
        P[i + 1][j + 1] = m[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
        cnt.add += 2; cnt.sub += 1;
      }
    return P;
  }

  /** Suma prostokąta [r1,r2)×[c1,c2) = P[r2][c2] − P[r1][c2] − P[r2][c1] + P[r1][c1]. */
  function query2D(P, r1, r2, c1, c2, cnt) {
    cnt = noCounter(cnt);
    validateRect(P.length - 1, P[0].length - 1, r1, r2, c1, c2);
    cnt.sub += 2; cnt.add += 1;
    return P[r2][c2] - P[r1][c2] - P[r2][c1] + P[r1][c1];
  }

  // ---------- struktury z operacją set ----------
  /**
   * Tablica z sumami prefiksowymi. Po set(i,x) sumy są odbudowywane od razu,
   * więc sum(l,r) nigdy nie korzysta z nieaktualnego P.
   */
  class PrefixArray {
    constructor(a, cnt) {
      validateArray(a);
      this.cnt = noCounter(cnt);
      this.A = a.slice();
      this.version = 0;
      this.rebuild();
    }
    rebuild() { this.P = buildPrefix1D(this.A, this.cnt); this.builtFor = this.version; }
    set(i, x) {
      validateIndex(this.A.length, i);
      checkValue(x, 'set');
      this.A[i] = x;
      this.version++;           // stare P jest od tej chwili nieaktualne
      this.rebuild();
    }
    sum(l, r) {
      if (this.builtFor !== this.version) throw new Error('Nieaktualne sumy prefiksowe');
      return query1D(this.P, l, r, this.cnt);
    }
    get length() { return this.A.length; }
  }

  class PrefixMatrix {
    constructor(m, cnt) {
      validateMatrix(m);
      this.cnt = noCounter(cnt);
      this.M = m.map(r => r.slice());
      this.version = 0;
      this.rebuild();
    }
    rebuild() { this.P = buildPrefix2D(this.M, this.cnt); this.builtFor = this.version; }
    set(i, j, x) {
      validateCell(this.M.length, this.M[0].length, i, j);
      checkValue(x, 'set');
      this.M[i][j] = x;
      this.version++;
      this.rebuild();
    }
    sum(r1, r2, c1, c2) {
      if (this.builtFor !== this.version) throw new Error('Nieaktualne sumy prefiksowe');
      return query2D(this.P, r1, r2, c1, c2, this.cnt);
    }
  }

  // ---------- parsowanie danych użytkownika ----------
  function parseArray(text) {
    const t = String(text).trim();
    if (t === '' || t === '[]') return [];
    const parts = t.replace(/^\[|\]$/g, '').split(/[\s,;]+/).filter(s => s !== '');
    const a = parts.map(s => {
      if (!/^-?\d+$/.test(s)) throw new ValidationError(`"${s}" nie jest liczbą całkowitą`);
      return Number(s);
    });
    validateArray(a);
    return a;
  }

  function parseMatrix(text) {
    const rows = String(text).trim().split(/\r?\n|\]\s*,?\s*\[/)
      .map(l => l.replace(/[\[\]]/g, '').trim()).filter(l => l !== '');
    const m = rows.map(l => l.split(/[\s,;]+/).filter(s => s !== '').map(s => {
      if (!/^-?\d+$/.test(s)) throw new ValidationError(`"${s}" nie jest liczbą całkowitą`);
      return Number(s);
    }));
    validateMatrix(m);
    return m;
  }

  // Deterministyczny generator liczb (do powtarzalnych eksperymentów)
  function rng(seed) {
    let s = seed >>> 0;
    return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  function randInt(rand, lo, hi) { return lo + Math.floor(rand() * (hi - lo + 1)); }

  return {
    LIMITS, ValidationError, newCounter,
    validateArray, validateMatrix, validateRange, validateRect, validateIndex, validateCell,
    naiveSum1D, buildPrefix1D, query1D,
    naiveSum2D, buildPrefix2D, query2D,
    PrefixArray, PrefixMatrix,
    parseArray, parseMatrix, rng, randInt
  };
});
