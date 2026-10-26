/*
 * Automatyczne testy. Ten sam plik uruchamia się w Node (tests/run-tests.js)
 * i w zakładce „Testy” aplikacji. Każdy test ma wejście, oczekiwany wynik
 * i funkcję, która liczy wynik uzyskany.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports)
    module.exports = factory(require('../src/algorithms.js'), require('../src/steps.js'), require('../src/compare.js'));
  else root.TestCases = factory(root.PS, root.Steps, root.Compare);
})(typeof self !== 'undefined' ? self : this, function (PS, Steps, Compare) {
  'use strict';

  const J = v => JSON.stringify(v);
  // zwraca komunikat błędu walidacji albo "brak błędu"
  function err(fn) {
    try { fn(); return 'brak błędu'; }
    catch (e) { return e instanceof PS.ValidationError ? 'ValidationError' : 'inny błąd: ' + e.message; }
  }
  const lastResult = frames => frames[frames.length - 1].result;

  const T = [];
  const add = (id, group, name, input, expected, run) => T.push({ id, group, name, input, expected, run });

  // ---------- przykład kontrolny z karty ----------
  add('T01', 'Prefiks 1D', 'Przykład kontrolny: budowa P', 'A = [2,1,3,4,5]',
    J([0, 2, 3, 6, 10, 15]), () => J(PS.buildPrefix1D([2, 1, 3, 4, 5])));
  add('T02', 'Prefiks 1D + bezpośrednia', 'Przykład kontrolny: sum(1,4) obiema metodami', 'A = [2,1,3,4,5], [1,4)',
    J({ bezposrednia: 8, prefiks: 8 }), () => {
      const A = [2, 1, 3, 4, 5];
      return J({ bezposrednia: PS.naiveSum1D(A, 1, 4), prefiks: PS.query1D(PS.buildPrefix1D(A), 1, 4) });
    });
  add('T03', 'set 1D', 'Przykład kontrolny: set(2,5), potem sum(1,4)', 'A = [2,1,3,4,5]; set(2,5); sum(1,4)',
    J({ P: [0, 2, 3, 8, 12, 17], suma: 10 }), () => {
      const pa = new PS.PrefixArray([2, 1, 3, 4, 5]); pa.set(2, 5);
      return J({ P: pa.P, suma: pa.sum(1, 4) });
    });
  add('T04', 'Prefiks 2D + bezpośrednia', 'Przykład kontrolny: prostokąt [0,2)×[1,3)', 'M = [[1,2,3],[4,5,6]]',
    J({ bezposrednia: 16, prefiks: 16 }), () => {
      const M = [[1, 2, 3], [4, 5, 6]];
      return J({ bezposrednia: PS.naiveSum2D(M, 0, 2, 1, 3), prefiks: PS.query2D(PS.buildPrefix2D(M), 0, 2, 1, 3) });
    });
  add('T05', 'Prefiks 2D', 'Macierz P dla przykładu kontrolnego', 'M = [[1,2,3],[4,5,6]]',
    J([[0, 0, 0, 0], [0, 1, 3, 6], [0, 5, 12, 21]]), () => J(PS.buildPrefix2D([[1, 2, 3], [4, 5, 6]])));

  // ---------- przypadki brzegowe 1D ----------
  add('T06', 'Brzegowe 1D', 'Pusta tablica', 'A = [], sum(0,0)',
    J({ P: [0], bezposrednia: 0, prefiks: 0 }), () => J({ P: PS.buildPrefix1D([]), bezposrednia: PS.naiveSum1D([], 0, 0), prefiks: PS.query1D([0], 0, 0) }));
  add('T07', 'Brzegowe 1D', 'Pusty zakres i cała tablica', 'A = [2,1,3,4,5]; [3,3) i [0,5)',
    J({ pusty: 0, cala: 15, bezpCala: 15 }), () => {
      const A = [2, 1, 3, 4, 5], P = PS.buildPrefix1D(A);
      return J({ pusty: PS.query1D(P, 3, 3), cala: PS.query1D(P, 0, 5), bezpCala: PS.naiveSum1D(A, 0, 5) });
    });
  add('T08', 'Brzegowe 1D', 'Liczby ujemne i suma równa zero', 'A = [-5,5,-20,20,-1]; [0,4), [0,3), [1,3)',
    J([0, -20, -15]), () => {
      const P = PS.buildPrefix1D([-5, 5, -20, 20, -1]);
      return J([PS.query1D(P, 0, 4), PS.query1D(P, 0, 3), PS.query1D(P, 1, 3)]);
    });
  add('T09', 'set 1D', 'Zmiana pierwszego i ostatniego elementu', 'A = [1,2,3,4]; set(0,-20); set(3,20); sum(0,4), sum(0,1), sum(3,4)',
    J({ P: [0, -20, -18, -15, 5], sumy: [5, -20, 20] }), () => {
      const pa = new PS.PrefixArray([1, 2, 3, 4]); pa.set(0, -20); pa.set(3, 20);
      return J({ P: pa.P, sumy: [pa.sum(0, 4), pa.sum(0, 1), pa.sum(3, 4)] });
    });

  // ---------- przypadki brzegowe 2D ----------
  add('T10', 'Brzegowe 2D', 'Macierz 1×1 oraz pusty prostokąt', 'M = [[7]]; [0,1)×[0,1) i [0,0)×[0,1)',
    J({ caly: 7, pusty: 0, bezpPusty: 0 }), () => {
      const P = PS.buildPrefix2D([[7]]);
      return J({ caly: PS.query2D(P, 0, 1, 0, 1), pusty: PS.query2D(P, 0, 0, 0, 1), bezpPusty: PS.naiveSum2D([[7]], 0, 0, 0, 1) });
    });
  add('T11', 'Brzegowe 2D', 'Pojedynczy wiersz i cały prostokąt', 'M = [[1,-2,3,-4]]; [0,1)×[1,3) i cała macierz',
    J({ srodek: 1, cala: -2 }), () => {
      const P = PS.buildPrefix2D([[1, -2, 3, -4]]);
      return J({ srodek: PS.query2D(P, 0, 1, 1, 3), cala: PS.query2D(P, 0, 1, 0, 4) });
    });
  add('T12', 'set 2D', 'Zmiana rogów macierzy i odbudowa P', 'M = [[1,2],[3,4]]; set(0,0,10); set(1,1,-4); cała macierz, [1,2)×[1,2)',
    J({ cala: 11, rog: -4, bezposrednia: 11 }), () => {
      const pm = new PS.PrefixMatrix([[1, 2], [3, 4]]); pm.set(0, 0, 10); pm.set(1, 1, -4);
      return J({ cala: pm.sum(0, 2, 0, 2), rog: pm.sum(1, 2, 1, 2), bezposrednia: PS.naiveSum2D(pm.M, 0, 2, 0, 2) });
    });

  // ---------- walidacja ----------
  add('T13', 'Walidacja', 'Błędne granice 1D', 'n = 5: [3,1), [-1,2), [0,6), [1.5,3)',
    J(Array(4).fill('ValidationError')), () => {
      const P = PS.buildPrefix1D([1, 2, 3, 4, 5]);
      return J([[3, 1], [-1, 2], [0, 6], [1.5, 3]].map(([l, r]) => err(() => PS.query1D(P, l, r))));
    });
  add('T14', 'Walidacja', 'Błędne granice 2D i metoda bezpośrednia', 'M 2×3: [1,0)×[0,1), [0,3)×[0,1), [0,1)×[2,1); bezpośrednia [0,1)×[0,4)',
    J(Array(4).fill('ValidationError')), () => {
      const M = [[1, 2, 3], [4, 5, 6]], P = PS.buildPrefix2D(M);
      return J([err(() => PS.query2D(P, 1, 0, 0, 1)), err(() => PS.query2D(P, 0, 3, 0, 1)), err(() => PS.query2D(P, 0, 1, 2, 1)), err(() => PS.naiveSum2D(M, 0, 1, 0, 4))]);
    });
  add('T15', 'Walidacja', 'Błędne dane i set', 'wartość 21, długość 65, 11 wierszy, wiersze nierówne, set(5,…) dla n=5, set(0,-21)',
    J(Array(6).fill('ValidationError')), () => {
      const pa = new PS.PrefixArray([1, 2, 3, 4, 5]);
      return J([
        err(() => PS.parseArray('1 2 21')),
        err(() => new PS.PrefixArray(new Array(65).fill(1))),
        err(() => new PS.PrefixMatrix(Array.from({ length: 11 }, () => [1]))),
        err(() => PS.parseMatrix('1 2\n3')),
        err(() => pa.set(5, 1)),
        err(() => pa.set(0, -21))
      ]);
    });
  add('T16', 'Walidacja', 'Odrzucona zmiana nie psuje danych', 'A = [1,2,3]; set(3,9) (błąd); sum(0,3)',
    J({ blad: 'ValidationError', suma: 6 }), () => {
      const pa = new PS.PrefixArray([1, 2, 3]); const b = err(() => pa.set(3, 9));
      return J({ blad: b, suma: pa.sum(0, 3) });
    });

  // ---------- stany pośrednie (wykonanie krokowe) ----------
  add('T17', 'Stan pośredni 1D', 'Budowa P po 3 krokach pętli', 'A = [2,1,3,4,5], migawka po zapisaniu P[3]',
    J([0, 2, 3, 6, null, null]), () => {
      const frames = Steps.runAll(Steps.prefix1d([2, 1, 3, 4, 5], 1, 4));
      const f = frames.filter(fr => fr.line === 3)[2]; // trzecie wykonanie P[i+1] ← P[i] + A[i]
      return J(f.P);
    });
  add('T18', 'Stan pośredni 2D', 'Budowa P po pierwszym wierszu', 'M = [[1,2,3],[4,5,6]], migawka po P[1][3]',
    J([[0, 0, 0, 0], [0, 1, 3, 6], [0, null, null, null]]), () => {
      const frames = Steps.runAll(Steps.prefix2d([[1, 2, 3], [4, 5, 6]], 0, 2, 1, 3));
      const f = frames.filter(fr => fr.line === 4)[2];
      return J(f.P);
    });
  add('T19', 'Stan pośredni 2D', 'Współczynniki pól po dwóch odejmowaniach', 'M 3×3 zer, prostokąt [1,3)×[1,3); migawka po −P[r2][c1]',
    J({ coef: [[-1, 0, 0], [0, 1, 1], [0, 1, 1]], posrednia: -0 + 0 }), () => {
      const M = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
      const fr = Steps.runAll(Steps.prefix2d(M, 1, 3, 1, 3)).filter(f => f.line === 7);
      return J({ coef: fr[2].coef, posrednia: fr[2].vars['częściowy wynik'] });
    });
  add('T20', 'Stan pośredni set', 'Po set P jest oznaczone jako nieaktualne, potem odbudowane', 'A = [2,1,3,4,5]; set(2,5); sum(1,4)',
    J({ nieaktualne: true, poOdbudowie: false, wynik: 10 }), () => {
      const fr = Steps.runAll(Steps.set1d([2, 1, 3, 4, 5], 2, 5, 1, 4));
      return J({ nieaktualne: fr.find(f => f.line === 2).Pstale, poOdbudowie: fr[fr.length - 1].Pstale, wynik: lastResult(fr) });
    });

  // ---------- liczniki i zgodność metod ----------
  add('T21', 'Liczniki', 'Liczba dodawań i odejmowań', 'n = 64: bezpośrednia [0,64), budowa, zapytanie; macierz 3×3: budowa, zapytanie',
    J({ bezposrednia: 64, budowa1D: 64, zapytanie1D: 1, budowa2D: { add: 18, sub: 9 }, zapytanie2D: { add: 1, sub: 2 } }), () => {
      const A = new Array(64).fill(1);
      const c1 = PS.newCounter(); PS.naiveSum1D(A, 0, 64, c1);
      const c2 = PS.newCounter(); const P = PS.buildPrefix1D(A, c2);
      const c3 = PS.newCounter(); PS.query1D(P, 0, 64, c3);
      const c4 = PS.newCounter(); const P2 = PS.buildPrefix2D([[1, 2, 3], [4, 5, 6], [7, 8, 9]], c4);
      const c5 = PS.newCounter(); PS.query2D(P2, 0, 3, 0, 3, c5);
      return J({ bezposrednia: c1.add, budowa1D: c2.add, zapytanie1D: c3.sub, budowa2D: c4, zapytanie2D: c5 });
    });
  add('T22', 'Zgodność', 'Losowe dane: prefiksy = metoda bezpośrednia (500 zapytań 1D, 500 2D)', 'ziarno 7, n ∈ 0…64, macierze do 10×10',
    'true', () => {
      const rand = PS.rng(7); let ok = true;
      for (let t = 0; t < 500; t++) {
        const n = PS.randInt(rand, 0, 64), A = Compare.randomArray(rand, n);
        const [[l, r]] = Compare.randomQueries(rand, n, 1);
        ok = ok && PS.naiveSum1D(A, l, r) === PS.query1D(PS.buildPrefix1D(A), l, r);
        const R = PS.randInt(rand, 1, 10), C = PS.randInt(rand, 1, 10), M = Compare.randomMatrix(rand, R, C);
        let a = PS.randInt(rand, 0, R), b = PS.randInt(rand, 0, R); if (a > b) [a, b] = [b, a];
        let c = PS.randInt(rand, 0, C), d = PS.randInt(rand, 0, C); if (c > d) [c, d] = [d, c];
        ok = ok && PS.naiveSum2D(M, a, b, c, d) === PS.query2D(PS.buildPrefix2D(M), a, b, c, d);
      }
      return String(ok);
    });
  add('T23', 'Zgodność', 'Wynik wykonania krokowego = wynik funkcji', 'przykład kontrolny, wszystkie 6 trybów',
    J([8, 8, 10, 16, 16, 13]), () => J([
      lastResult(Steps.runAll(Steps.naive1d([2, 1, 3, 4, 5], 1, 4))),
      lastResult(Steps.runAll(Steps.prefix1d([2, 1, 3, 4, 5], 1, 4))),
      lastResult(Steps.runAll(Steps.set1d([2, 1, 3, 4, 5], 2, 5, 1, 4))),
      lastResult(Steps.runAll(Steps.naive2d([[1, 2, 3], [4, 5, 6]], 0, 2, 1, 3))),
      lastResult(Steps.runAll(Steps.prefix2d([[1, 2, 3], [4, 5, 6]], 0, 2, 1, 3))),
      lastResult(Steps.runAll(Steps.set2d([[1, 2, 3], [4, 5, 6]], 1, 2, 3, 0, 2, 1, 3)))
    ]));
  add('T24', 'Walidacja', 'Wykonanie krokowe zatrzymuje się na błędnym zakresie', 'A = [1,2,3], zapytanie [2,1)',
    J({ blad: true, wynik: null }), () => {
      const fr = Steps.runAll(Steps.prefix1d([1, 2, 3], 2, 1));
      const last = fr[fr.length - 1];
      return J({ blad: !!last.error, wynik: last.result });
    });

  function runTests() {
    return T.map(t => {
      let got, status;
      try { got = t.run(); status = got === t.expected ? 'OK' : 'BŁĄD'; }
      catch (e) { got = 'wyjątek: ' + e.message; status = 'BŁĄD'; }
      return { id: t.id, group: t.group, name: t.name, input: t.input, expected: t.expected, got, status };
    });
  }

  return { runTests, count: T.length };
});
