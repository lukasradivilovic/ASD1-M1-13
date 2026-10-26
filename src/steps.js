/*
 * Wykonanie krokowe. Każdy generator naprawdę liczy wynik (te same wzory co
 * w algorithms.js) i po każdej istotnej instrukcji oddaje migawkę stanu
 * (yield). Interfejs tylko wyświetla te migawki – nie ma tu nagranej animacji.
 * Liczniki ops w migawkach dotyczą tylko obliczeń algorytmu.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./algorithms.js'));
  else root.Steps = factory(root.PS);
})(typeof self !== 'undefined' ? self : this, function (PS) {
  'use strict';

  const PSEUDO = {
    naive1d: [
      'sumNaive(A, l, r):',
      '  s ← 0',
      '  dla i ← l, l+1, …, r−1:',
      '    s ← s + A[i]',
      '  zwróć s'
    ],
    prefix1d: [
      'build(A):',
      '  P[0] ← 0',
      '  dla i ← 0, 1, …, n−1:',
      '    P[i+1] ← P[i] + A[i]',
      'query(l, r):',
      '  jeśli nie (0 ≤ l ≤ r ≤ n): błąd',
      '  zwróć P[r] − P[l]'
    ],
    set1d: [
      'set(i, x):',
      '  jeśli nie (0 ≤ i < n): błąd',
      '  A[i] ← x      // P jest teraz nieaktualne',
      '  P[0] ← 0      // odbudowa P',
      '  dla k ← 0, 1, …, n−1:',
      '    P[k+1] ← P[k] + A[k]',
      'query(l, r):',
      '  zwróć P[r] − P[l]'
    ],
    naive2d: [
      'sumNaive2D(M, r1, r2, c1, c2):',
      '  s ← 0',
      '  dla i ← r1, …, r2−1:',
      '    dla j ← c1, …, c2−1:',
      '      s ← s + M[i][j]',
      '  zwróć s'
    ],
    prefix2d: [
      'build2D(M):',
      '  P ← zera, wymiar (R+1)×(C+1)',
      '  dla i ← 0, …, R−1:',
      '    dla j ← 0, …, C−1:',
      '      P[i+1][j+1] ← M[i][j] + P[i][j+1] + P[i+1][j] − P[i][j]',
      'query2D(r1, r2, c1, c2):',
      '  jeśli granice błędne: błąd',
      '  zwróć P[r2][c2] − P[r1][c2] − P[r2][c1] + P[r1][c1]'
    ],
    set2d: [
      'set2D(i, j, x):',
      '  jeśli (i, j) poza macierzą: błąd',
      '  M[i][j] ← x   // P jest teraz nieaktualne',
      '  P ← zera      // odbudowa P',
      '  dla a ← 0, …, R−1:  dla b ← 0, …, C−1:',
      '    P[a+1][b+1] ← M[a][b] + P[a][b+1] + P[a+1][b] − P[a][b]',
      'query2D(r1, r2, c1, c2):',
      '  zwróć P[r2][c2] − P[r1][c2] − P[r2][c1] + P[r1][c1]'
    ]
  };

  const copy1 = a => a.slice();
  const copy2 = m => m.map(r => r.slice());

  // Wspólny budowniczy migawek
  function maker(base) {
    return function frame(o) {
      return Object.assign({
        line: 0, reason: '', vars: {}, hlA: {}, hlP: {}, coef: null,
        result: null, error: null, Pstale: false, done: false,
        ops: { add: base.ops.add, sub: base.ops.sub }
      }, o);
    };
  }

  // ======================= 1D =======================
  function* naive1d(A, l, r) {
    const st = { ops: PS.newCounter() }; const F = maker(st);
    const show = o => F(Object.assign({ A: copy1(A), P: null }, o));
    yield show({ line: 0, reason: `Zapytanie o sumę zakresu [${l}, ${r}) bez żadnego przygotowania.`, vars: { l, r } });
    try { PS.validateRange(A.length, l, r); }
    catch (e) { yield show({ line: 0, error: e.message, reason: 'Zapytanie odrzucone: ' + e.message, done: true }); return; }
    let s = 0;
    yield show({ line: 1, reason: 'Zaczynam od sumy 0 (suma pustego zakresu).', vars: { l, r, s } });
    if (l === r) yield show({ line: 2, reason: 'l = r, więc zakres jest pusty i pętla nie wykona się ani razu.', vars: { l, r, s } });
    for (let i = l; i < r; i++) {
      const old = s;
      s = s + A[i]; st.ops.add++;
      yield show({ line: 3, vars: { l, r, i, 'A[i]': A[i], s },
        hlA: { [i]: { cls: 'active', tag: '+' } },
        reason: `i = ${i} < r = ${r}, więc dodaję A[${i}]: s = ${old} + (${A[i]}) = ${s}.` });
    }
    yield show({ line: 4, vars: { l, r, s }, result: s, done: true,
      reason: `Koniec pętli (i doszło do r = ${r}, element A[${r}] nie jest wliczany). Wynik: ${s}. Wykonano ${st.ops.add} dodawań.` });
  }

  function* buildFrames1D(A, P, st, show, lines, varName) {
    const v = varName || 'i';
    P[0] = 0;
    yield show({ line: lines.p0, reason: 'P[0] = 0 – suma zera pierwszych elementów. Dzięki temu wzór P[r] − P[l] działa też dla l = 0.', vars: { n: A.length } });
    if (A.length === 0) yield show({ line: lines.loop, reason: 'Tablica jest pusta (n = 0): P = [0] i pętla się nie wykonuje.', vars: { n: 0 } });
    for (let i = 0; i < A.length; i++) {
      P[i + 1] = P[i] + A[i]; st.ops.add++;
      yield show({ line: lines.body, vars: { [v]: i, [`P[${v}]`]: P[i], [`A[${v}]`]: A[i], [`P[${v}+1]`]: P[i + 1] },
        hlA: { [i]: { cls: 'read', tag: '+' } },
        hlP: { [i]: { cls: 'read', tag: '+' }, [i + 1]: { cls: 'write', tag: '=' } },
        reason: `P[${i + 1}] to suma A[0..${i}]: poprzedni prefiks P[${i}] = ${P[i]} plus A[${i}] = ${A[i]}, czyli ${P[i + 1]}.` });
    }
  }

  function* queryFrames1D(P, l, r, st, show, lineCheck, lineRet) {
    const n = P.length - 1;
    if (lineCheck !== null) {
      try { PS.validateRange(n, l, r); }
      catch (e) { yield show({ line: lineCheck, error: e.message, reason: 'Zapytanie odrzucone: ' + e.message, done: true }); return false; }
      yield show({ line: lineCheck, vars: { l, r, n }, reason: `Granice poprawne: 0 ≤ ${l} ≤ ${r} ≤ ${n}.` });
    }
    st.ops.sub++;
    const res = P[r] - P[l];
    yield show({ line: lineRet, vars: { l, r, 'P[r]': P[r], 'P[l]': P[l], wynik: res }, result: res, done: true,
      hlP: l === r ? { [r]: { cls: 'use', tag: '±' } } : { [r]: { cls: 'use', tag: '+' }, [l]: { cls: 'use', tag: '−' } },
      reason: `P[${r}] to suma A[0..${r - 1}], P[${l}] to suma A[0..${l - 1}]. Różnica zostawia dokładnie A[${l}..${r - 1}]: ${P[r]} − (${P[l]}) = ${res}. Jedno odejmowanie, niezależnie od długości zakresu.` });
    return true;
  }

  function* prefix1d(A, l, r) {
    const st = { ops: PS.newCounter() }; const F = maker(st);
    const P = new Array(A.length + 1).fill(null);
    const show = o => F(Object.assign({ A: copy1(A), P: copy1(P) }, o));
    yield show({ line: 0, reason: `Budowa tablicy P o długości n+1 = ${A.length + 1}. P[k] będzie sumą pierwszych k elementów.`, vars: { n: A.length } });
    yield* buildFrames1D(A, P, st, show, { p0: 1, loop: 2, body: 3 });
    yield show({ line: 4, vars: { l, r }, reason: `P gotowe (koszt budowy: ${st.ops.add} dodawań). Teraz zapytanie o [${l}, ${r}).` });
    yield* queryFrames1D(P, l, r, st, show, 5, 6);
  }

  function* set1d(A0, i, x, l, r) {
    const st = { ops: PS.newCounter() }; const F = maker(st);
    const A = copy1(A0);
    let P = PS.buildPrefix1D(A);  // stan sprzed zmiany (budowa nie jest liczona w tym przebiegu)
    let stale = false;
    const show = o => F(Object.assign({ A: copy1(A), P: copy1(P), Pstale: stale }, o));
    yield show({ line: 0, vars: { i, x }, reason: `Start: P jest aktualne dla obecnej tablicy. Wykonuję set(${i}, ${x}).` });
    try { PS.validateIndex(A.length, i); PS.validateArray([x]); PS.validateRange(A.length, l, r); }
    catch (e) { yield show({ line: 1, error: e.message, reason: 'Operacja odrzucona: ' + e.message, done: true }); return; }
    const old = A[i];
    A[i] = x; stale = true;
    const affected = {}; for (let k = i + 1; k <= A.length; k++) affected[k] = { cls: 'stale', tag: '✗' };
    yield show({ line: 2, vars: { i, x, 'stare A[i]': old }, hlA: { [i]: { cls: 'changed', tag: '✎' } }, hlP: affected,
      reason: `A[${i}] zmienione z ${old} na ${x}. Pola P[${i + 1}..${A.length}] zawierają teraz złe sumy (oznaczone ✗), więc nie wolno ich użyć. Odbudowuję P.` });
    P = new Array(A.length + 1).fill(null); stale = false;
    yield* buildFrames1D(A, P, st, show, { p0: 3, loop: 4, body: 5 }, 'k');
    yield* queryFrames1D(P, l, r, st, show, null, 7);
  }

  // ======================= 2D =======================
  function cellKey(i, j) { return i + ',' + j; }
  function zeros(R, C) { return Array.from({ length: R }, () => new Array(C).fill(0)); }
  function nulls(R, C) { return Array.from({ length: R }, () => new Array(C).fill(null)); }

  function* naive2d(M, r1, r2, c1, c2) {
    const st = { ops: PS.newCounter() }; const F = maker(st);
    const show = o => F(Object.assign({ A: copy2(M), P: null }, o));
    yield show({ line: 0, vars: { r1, r2, c1, c2 }, reason: `Suma prostokąta [${r1}, ${r2}) × [${c1}, ${c2}) przez przejrzenie wszystkich jego pól.` });
    try { PS.validateRect(M.length, M[0].length, r1, r2, c1, c2); }
    catch (e) { yield show({ line: 0, error: e.message, reason: 'Zapytanie odrzucone: ' + e.message, done: true }); return; }
    let s = 0;
    yield show({ line: 1, vars: { s }, reason: 'Suma startowa 0.' });
    if (r1 === r2 || c1 === c2) yield show({ line: 2, vars: { s }, reason: 'Prostokąt jest pusty (zerowa liczba wierszy lub kolumn), pętle nic nie dodadzą.' });
    for (let i = r1; i < r2; i++)
      for (let j = c1; j < c2; j++) {
        const old = s; s = s + M[i][j]; st.ops.add++;
        yield show({ line: 4, vars: { i, j, 'M[i][j]': M[i][j], s }, hlA: { [cellKey(i, j)]: { cls: 'active', tag: '+' } },
          reason: `Pole (${i}, ${j}) leży w prostokącie: s = ${old} + (${M[i][j]}) = ${s}.` });
      }
    yield show({ line: 5, vars: { s }, result: s, done: true,
      reason: `Przejrzano ${(r2 - r1) * (c2 - c1)} pól. Wynik ${s}, ${st.ops.add} dodawań.` });
  }

  function* buildFrames2D(M, P, st, show, lines, names) {
    const R = M.length, C = M[0].length;
    const [a, b] = names || ['i', 'j'];
    for (let i = 0; i <= R; i++) P[i][0] = 0;
    for (let j = 0; j <= C; j++) P[0][j] = 0;
    yield show({ line: lines.zero, vars: { R, C },
      reason: `P ma wymiar ${R + 1}×${C + 1}. Wiersz 0 i kolumna 0 to zera: suma po pustym zbiorze wierszy lub kolumn wynosi 0.` });
    for (let i = 0; i < R; i++)
      for (let j = 0; j < C; j++) {
        const up = P[i][j + 1], left = P[i + 1][j], diag = P[i][j];
        P[i + 1][j + 1] = M[i][j] + up + left - diag; st.ops.add += 2; st.ops.sub += 1;
        yield show({ line: lines.body,
          vars: { [a]: i, [b]: j, [`M[${a}][${b}]`]: M[i][j], 'góra': up, 'lewo': left, 'skos': diag, wynik: P[i + 1][j + 1] },
          hlA: { [cellKey(i, j)]: { cls: 'read', tag: '+' } },
          hlP: { [cellKey(i, j + 1)]: { cls: 'read', tag: '+' }, [cellKey(i + 1, j)]: { cls: 'read', tag: '+' },
                 [cellKey(i, j)]: { cls: 'minus', tag: '−' }, [cellKey(i + 1, j + 1)]: { cls: 'write', tag: '=' } },
          reason: `P[${i + 1}][${j + 1}] = M[${i}][${j}] + P[${i}][${j + 1}] + P[${i + 1}][${j}] − P[${i}][${j}] = ${M[i][j]} + ${up} + ${left} − ${diag} = ${P[i + 1][j + 1]}. ` +
                  `Prefiks z góry i prefiks z lewej zawierają ten sam obszar P[${i}][${j}], więc po dodaniu jest on liczony dwa razy i raz go odejmuję.` });
      }
  }

  function* queryFrames2D(M, P, r1, r2, c1, c2, st, show, lineCheck, lineRet) {
    const R = M.length, C = M[0].length;
    if (lineCheck !== null) {
      try { PS.validateRect(R, C, r1, r2, c1, c2); }
      catch (e) { yield show({ line: lineCheck, error: e.message, reason: 'Zapytanie odrzucone: ' + e.message, done: true }); return; }
      yield show({ line: lineCheck, vars: { r1, r2, c1, c2 }, reason: `Granice poprawne: 0 ≤ ${r1} ≤ ${r2} ≤ ${R}, 0 ≤ ${c1} ≤ ${c2} ≤ ${C}.` });
    }
    // coef[i][j] = ile razy pole M[i][j] jest w tej chwili wliczone do wyniku
    const coef = zeros(R, C);
    const addArea = (rr, cc, k) => { for (let i = 0; i < rr; i++) for (let j = 0; j < cc; j++) coef[i][j] += k; };
    const D = P[r2][c2], B = P[r1][c2], Cc = P[r2][c1], A = P[r1][c1];
    let val = D; addArea(r2, c2, +1);
    const hl = {};
    hl[cellKey(r2, c2)] = { cls: 'use', tag: '+' };
    yield show({ line: lineRet, coef: copy2(coef), hlP: Object.assign({}, hl), vars: { 'P[r2][c2]': D, 'częściowy wynik': val },
      reason: `Biorę P[${r2}][${c2}] = ${D}: suma całego obszaru [0, ${r2}) × [0, ${c2}). Liczby na polach M mówią, ile razy pole jest wliczone.` });
    val = val - B; st.ops.sub++; addArea(r1, c2, -1);
    hl[cellKey(r1, c2)] = { cls: 'minus', tag: '−' };
    yield show({ line: lineRet, coef: copy2(coef), hlP: Object.assign({}, hl), vars: { 'P[r1][c2]': B, 'częściowy wynik': val },
      reason: `Odejmuję P[${r1}][${c2}] = ${B}: pas nad prostokątem, wiersze [0, ${r1}).` });
    val = val - Cc; st.ops.sub++; addArea(r2, c1, -1);
    hl[cellKey(r2, c1)] = { cls: 'minus', tag: '−' };
    yield show({ line: lineRet, coef: copy2(coef), hlP: Object.assign({}, hl), vars: { 'P[r2][c1]': Cc, 'częściowy wynik': val },
      reason: `Odejmuję P[${r2}][${c1}] = ${Cc}: pas na lewo od prostokąta, kolumny [0, ${c1}). ` +
              (r1 > 0 && c1 > 0 ? `Lewy-górny róg [0, ${r1}) × [0, ${c1}) został odjęty dwa razy i ma teraz −1.` : 'Wspólna część jest pusta, więc nic nie zostało odjęte podwójnie.') });
    val = val + A; st.ops.add++; addArea(r1, c1, +1);
    hl[cellKey(r1, c1)] = { cls: 'use', tag: '+' };
    yield show({ line: lineRet, coef: copy2(coef), hlP: Object.assign({}, hl), vars: { 'P[r1][c1]': A, wynik: val }, result: val, done: true,
      reason: `Dodaję raz P[${r1}][${c1}] = ${A}, żeby oddać podwójnie odjęty róg. Teraz pola w prostokącie mają 1, a wszystkie inne 0. Wynik: ${val}.` });
  }

  function* prefix2d(M, r1, r2, c1, c2) {
    const st = { ops: PS.newCounter() }; const F = maker(st);
    const R = M.length, C = M[0].length;
    const P = nulls(R + 1, C + 1);
    const show = o => F(Object.assign({ A: copy2(M), P: copy2(P) }, o));
    yield show({ line: 0, vars: { R, C }, reason: 'Budowa macierzy sum prefiksowych. P[i][j] będzie sumą prostokąta [0, i) × [0, j).' });
    yield* buildFrames2D(M, P, st, show, { zero: 1, body: 4 });
    yield show({ line: 5, vars: { r1, r2, c1, c2 }, reason: `P gotowe (${st.ops.add} dodawań, ${st.ops.sub} odejmowań). Zapytanie o [${r1}, ${r2}) × [${c1}, ${c2}).` });
    yield* queryFrames2D(M, P, r1, r2, c1, c2, st, show, 6, 7);
  }

  function* set2d(M0, i, j, x, r1, r2, c1, c2) {
    const st = { ops: PS.newCounter() }; const F = maker(st);
    const M = copy2(M0); const R = M.length, C = M[0].length;
    let P = PS.buildPrefix2D(M); let stale = false;
    const show = o => F(Object.assign({ A: copy2(M), P: copy2(P), Pstale: stale }, o));
    yield show({ line: 0, vars: { i, j, x }, reason: `Start: P aktualne. Wykonuję set2D(${i}, ${j}, ${x}).` });
    try { PS.validateCell(R, C, i, j); PS.validateArray([x]); PS.validateRect(R, C, r1, r2, c1, c2); }
    catch (e) { yield show({ line: 1, error: e.message, reason: 'Operacja odrzucona: ' + e.message, done: true }); return; }
    const old = M[i][j]; M[i][j] = x; stale = true;
    const aff = {}; for (let a = i + 1; a <= R; a++) for (let b = j + 1; b <= C; b++) aff[cellKey(a, b)] = { cls: 'stale', tag: '✗' };
    yield show({ line: 2, vars: { i, j, x, 'stare M[i][j]': old }, hlA: { [cellKey(i, j)]: { cls: 'changed', tag: '✎' } }, hlP: aff,
      reason: `M[${i}][${j}] zmienione z ${old} na ${x}. Każde P[a][b] z a > ${i} i b > ${j} obejmuje to pole, więc jest nieaktualne (✗). Odbudowuję P.` });
    P = nulls(R + 1, C + 1); stale = false;
    yield* buildFrames2D(M, P, st, show, { zero: 3, body: 5 }, ['a', 'b']);
    yield* queryFrames2D(M, P, r1, r2, c1, c2, st, show, null, 7);
  }

  /** Uruchamia generator do końca i zwraca wszystkie migawki (przydatne w testach). */
  function runAll(gen) { const out = []; for (const f of gen) out.push(f); return out; }

  return { PSEUDO, naive1d, prefix1d, set1d, naive2d, prefix2d, set2d, runAll };
});
