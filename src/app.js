/*
 * Interfejs PrefiksLab. Ten plik tylko wyświetla migawki z generatorów
 * (src/steps.js) i wyniki funkcji (src/algorithms.js, src/compare.js).
 * Nie liczy sum samodzielnie, poza sprawdzaniem odpowiedzi w pytaniach.
 */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = v => v === null || v === undefined ? '?' : String(v);
  const isInt = Number.isInteger;

  // ------------------------------------------------------------------ zakładki
  let testsRan = false;
  function showTab(name) {
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
    document.querySelectorAll('.tab').forEach(s => s.classList.toggle('on', s.id === 'tab-' + name));
    if (name === 'quiz') renderQuiz();
    if (name === 'tests' && !testsRan) runTestsUI();
  }
  document.querySelectorAll('#tabs button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

  // ------------------------------------------------------------------ odtwarzacz
  const DELAYS = [1600, 1200, 900, 650, 480, 350, 250, 170, 110, 60];
  class Player {
    constructor(ctrl, makeGen, render) {
      this.ctrl = ctrl; this.makeGen = makeGen; this.render = render;
      this.timer = null; this.frame = null; this.stepNo = 0; this.finished = true;
      ctrl.querySelector('[data-act=step]').addEventListener('click', () => { this.pause(); this.step(); });
      ctrl.querySelector('[data-act=play]').addEventListener('click', () => this.toggle());
      ctrl.querySelector('[data-act=reset]').addEventListener('click', () => this.reset());
      this.speedEl = ctrl.querySelector('[data-act=speed]');
      this.speedEl.addEventListener('input', () => { this.showSpeed(); if (this.timer) { this.pause(); this.play(); } });
      this.showSpeed();
    }
    showSpeed() { this.ctrl.querySelector('[data-out=speed]').textContent = DELAYS[this.speedEl.value - 1] + ' ms/krok'; }
    /** Nowy przebieg: nowy generator, pierwsza migawka. */
    reset() {
      this.pause();
      this.gen = this.makeGen(); this.stepNo = 0; this.finished = false; this.frame = null;
      this.step();
    }
    step() {
      if (!this.gen || this.finished) return false;
      const r = this.gen.next();
      if (r.done) { this.finished = true; this.pause(); this.status(); return false; }
      this.frame = r.value; this.stepNo++;
      if (this.frame.done) { this.finished = true; this.pause(); }
      this.render(this.frame); this.status();
      return true;
    }
    play() {
      if (this.finished) this.reset();
      this.timer = setInterval(() => { if (!this.step()) this.pause(); }, DELAYS[this.speedEl.value - 1]);
      this.ctrl.querySelector('[data-act=play]').textContent = 'Pauza ❚❚';
    }
    pause() {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.ctrl.querySelector('[data-act=play]').textContent = 'Start ▶';
    }
    toggle() { this.timer ? this.pause() : this.play(); }
    status() {
      this.ctrl.querySelector('[data-out=status]').textContent =
        `Krok ${this.stepNo}` + (this.finished ? ' · koniec przebiegu' : '');
    }
  }

  // ------------------------------------------------------------------ wspólne fragmenty widoku
  function renderCode(el, lines, cur) {
    el.innerHTML = lines.map((t, k) => `<li class="${k === cur ? 'cur' : ''}">${esc(t)}</li>`).join('');
  }
  function renderVars(el, f) {
    let h = Object.entries(f.vars).map(([k, v]) => `<tr><td>${esc(k)}</td><td>${esc(fmt(v))}</td></tr>`).join('');
    h += `<tr class="sep"><td>dodawania (add)</td><td>${f.ops.add}</td></tr><tr><td>odejmowania (sub)</td><td>${f.ops.sub}</td></tr>`;
    if (f.result !== null) h += `<tr><td>WYNIK</td><td>${f.result}</td></tr>`;
    el.innerHTML = h;
  }
  function renderReason(el, f) {
    el.textContent = f.reason;
    el.classList.toggle('err', !!f.error);
  }
  function cellAttrs(base, hl) {
    let cls = base;
    let tag = '';
    if (hl) { cls += ' ' + hl.cls; tag = hl.tag || ''; }
    return `class="cell ${cls}"` + (tag ? ` data-tag="${esc(tag)}"` : '');
  }
  function predictBox(el, question, expected, explain) {
    if (question === null) { el.innerHTML = ''; return; }
    el.innerHTML = `<b>Przewidź:</b> ${esc(question)} <input class="num" type="number"> <button>Sprawdź</button> <span class="pm"></span>`;
    const inp = el.querySelector('input'), out = el.querySelector('.pm');
    const check = () => {
      const v = Number(inp.value);
      if (inp.value.trim() === '') { out.textContent = 'Wpisz liczbę.'; return; }
      out.innerHTML = v === expected ? `✔ Dobrze. ${esc(explain)}` : `✘ Nie, poprawna odpowiedź to ${expected}. ${esc(explain)}`;
    };
    el.querySelector('button').addEventListener('click', check);
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
  }

  // ------------------------------------------------------------------ LAB 1D
  const SC1 = [
    { name: 'Przykład z karty: [2,1,3,4,5], [1,4), set(2,5)', A: [2, 1, 3, 4, 5], l: 1, r: 4, i: 2, x: 5 },
    { name: 'Liczby ujemne, suma równa 0', A: [-5, 5, -20, 20, -1], l: 0, r: 4, i: 4, x: 7 },
    { name: 'Pusta tablica i pusty zakres', A: [], l: 0, r: 0, i: 0, x: 1 },
    { name: 'Cała tablica, zmiana ostatniego elementu', A: [3, -1, 4, -1, 5, -9, 2, 6], l: 0, r: 8, i: 7, x: -20 },
    { name: 'Zmiana pierwszego elementu', A: [7, 0, -3, 12, 4, -8], l: 2, r: 5, i: 0, x: -20 },
    { name: 'Błędne granice: odwrócony zakres [3,1)', A: [1, 2, 3, 4], l: 3, r: 1, i: 0, x: 0 }
  ];
  const st1 = { A: [], mode: 'prefix1d' };
  const num = id => { const v = $(id).value.trim(); return v === '' ? NaN : Number(v); };

  function read1() { return { l: num('l1'), r: num('r1'), i: num('i1'), x: num('x1') }; }
  function makeGen1() {
    const p = read1();
    if (st1.mode === 'naive1d') return Steps.naive1d(st1.A, p.l, p.r);
    if (st1.mode === 'prefix1d') return Steps.prefix1d(st1.A, p.l, p.r);
    return Steps.set1d(st1.A, p.i, p.x, p.l, p.r);
  }
  function render1(f) {
    const { l, r } = read1();
    const A = f.A, P = f.P, n = A.length;
    const rangeOk = isInt(l) && isInt(r) && 0 <= l && l <= r && r <= n;
    let h = `<div class="arr" style="grid-template-columns:64px repeat(${n + 1}, minmax(40px,46px))">`;
    h += '<div class="rl">indeks</div>';
    for (let k = 0; k <= n; k++) h += `<div class="h">${k}</div>`;
    h += '<div class="rl">A</div>';
    for (let k = 0; k < n; k++) {
      const inR = rangeOk && k >= l && k < r;
      h += `<div ${cellAttrs(inR ? 'in-range' : '', f.hlA[k])}>${A[k]}</div>`;
    }
    h += `<div class="cell ghost"></div>`;
    h += '<div class="rl">zakres</div>';
    for (let k = 0; k <= n; k++) {
      let t = '', cls = 'mark';
      if (rangeOk && k === l && k === r) t = '[l=r) pusty';
      else if (rangeOk && k === l) t = '[ l (wł.)';
      else if (rangeOk && k === r) { t = ') r (wył.)'; cls += ' excl'; }
      h += `<div class="${cls}">${esc(t)}</div>`;
    }
    if (P) {
      h += `<div class="rl">P${f.Pstale ? ' (stare)' : ''}</div>`;
      for (let k = 0; k <= n; k++) {
        const base = P[k] === null ? 'nullc' : (k === 0 ? 'zero' : '');
        h += `<div ${cellAttrs(base, f.hlP[k])}>${fmt(P[k])}</div>`;
      }
    }
    h += '</div>';
    h += `<p class="note">${n === 0 ? 'Tablica jest pusta (n = 0). ' : ''}` +
      (rangeOk ? `Zakres [${l}, ${r}) to elementy A[${l}]…A[${r - 1}] (${r - l} szt.). Element o indeksie r = ${r} nie należy do zakresu.` : 'Zakres jest niepoprawny, zapytanie zostanie odrzucone.') +
      (P ? ' P[k] = suma A[0]…A[k−1], więc P stoi „między” elementami i ma o jedno pole więcej niż A.' : ' Ta metoda nie buduje żadnej tablicy pomocniczej.') + '</p>';
    $('viz1').innerHTML = h;
    renderReason($('reason1'), f);
    renderCode($('code1'), Steps.PSEUDO[st1.mode], f.line);
    renderVars($('vars1'), f);
    // pytanie o następny krok
    if (f.done) return predictBox($('pred1'), null);
    if (P && P[0] !== null && P.indexOf(null) > 0) {
      const k = P.indexOf(null);
      return predictBox($('pred1'), `ile wyniesie P[${k}] w następnym kroku?`, P[k - 1] + A[k - 1],
        `P[${k}] = P[${k - 1}] + A[${k - 1}] = ${P[k - 1]} + (${A[k - 1]}).`);
    }
    try {
      const res = PS.naiveSum1D(A, l, r);
      return predictBox($('pred1'), `jaki będzie wynik zapytania o [${l}, ${r})?`, res, `To suma A[${l}]…A[${r - 1}].`);
    } catch (e) { return predictBox($('pred1'), null); }
  }
  const p1 = new Player(document.querySelector('[data-player=p1]'), makeGen1, render1);

  function load1(sc) {
    $('arr1').value = sc.A.join(', ');
    $('l1').value = sc.l; $('r1').value = sc.r; $('i1').value = sc.i; $('x1').value = sc.x;
    st1.A = sc.A.slice();
    msg('msg1', '');
    p1.reset();
  }
  function apply1() {
    try { st1.A = PS.parseArray($('arr1').value); msg('msg1', `Wczytano tablicę, n = ${st1.A.length}. Nowy przebieg.`, true); p1.reset(); }
    catch (e) { msg('msg1', e.message); }
  }
  function msg(id, t, ok) { $(id).textContent = t; $(id).classList.toggle('ok', !!ok); }
  $('sc1').innerHTML = SC1.map((s, k) => `<option value="${k}">${esc(s.name)}</option>`).join('');
  $('sc1').addEventListener('change', () => load1(SC1[$('sc1').value]));
  $('apply1').addEventListener('click', apply1);
  $('arr1').addEventListener('keydown', e => { if (e.key === 'Enter') apply1(); });
  $('rand1').addEventListener('click', () => {
    const rand = PS.rng(Date.now() & 0xffff);
    $('arr1').value = Compare.randomArray(rand, 8).join(', ');
    apply1();
  });
  $('mode1').addEventListener('change', () => { st1.mode = $('mode1').value; toggleSet(); p1.reset(); });
  ['l1', 'r1', 'i1', 'x1'].forEach(id => $(id).addEventListener('change', () => p1.reset()));

  // ------------------------------------------------------------------ LAB 2D
  const SC2 = [
    { name: 'Przykład z karty: [[1,2,3],[4,5,6]], [0,2)×[1,3)', M: [[1, 2, 3], [4, 5, 6]], q: [0, 2, 1, 3], s: [0, 1, 10] },
    { name: 'Prostokąt w środku (widać podwójne odejmowanie)', M: [[3, -1, 4, 1], [5, 9, -2, 6], [5, 3, 5, -8], [9, 7, -9, 3]], q: [1, 3, 2, 4], s: [0, 0, -5] },
    { name: 'Macierz 1×1', M: [[7]], q: [0, 1, 0, 1], s: [0, 0, -3] },
    { name: 'Pojedynczy wiersz', M: [[1, -2, 3, -4, 5]], q: [0, 1, 1, 4], s: [0, 4, -20] },
    { name: 'Cały prostokąt, zmiana ostatniego pola', M: [[2, -2, 0], [-7, 7, 1], [4, 4, -4]], q: [0, 3, 0, 3], s: [2, 2, 20] },
    { name: 'Błędne granice: r2 = 4 dla 3 wierszy', M: [[1, 2, 3], [4, 5, 6], [7, 8, 9]], q: [0, 4, 0, 1], s: [1, 1, 0] }
  ];
  const st2 = { M: [[1]], mode: 'prefix2d' };
  function read2() { return { r1: num('r1_2'), r2: num('r2_2'), c1: num('c1_2'), c2: num('c2_2'), i: num('i2'), j: num('j2'), x: num('x2') }; }
  function makeGen2() {
    const p = read2();
    if (st2.mode === 'naive2d') return Steps.naive2d(st2.M, p.r1, p.r2, p.c1, p.c2);
    if (st2.mode === 'prefix2d') return Steps.prefix2d(st2.M, p.r1, p.r2, p.c1, p.c2);
    return Steps.set2d(st2.M, p.i, p.j, p.x, p.r1, p.r2, p.c1, p.c2);
  }
  function render2(f) {
    const { r1, r2, c1, c2 } = read2();
    const M = f.A, P = f.P, R = M.length, C = M[0].length;
    const ok = [r1, r2, c1, c2].every(isInt) && 0 <= r1 && r1 <= r2 && r2 <= R && 0 <= c1 && c1 <= c2 && c2 <= C;
    const key = (i, j) => i + ',' + j;
    let h = '<div class="mats"><div><h4>Macierz M (' + R + '×' + C + ')</h4>';
    h += `<div class="mat" style="grid-template-columns:28px repeat(${C}, 46px)"><div></div>`;
    for (let j = 0; j < C; j++) h += `<div class="h">${j}</div>`;
    for (let i = 0; i < R; i++) {
      h += `<div class="h">${i}</div>`;
      for (let j = 0; j < C; j++) {
        const inR = ok && i >= r1 && i < r2 && j >= c1 && j < c2;
        let badge = '';
        if (f.coef) {
          const k = f.coef[i][j];
          badge = `<span class="coef ${k === 0 ? 'z' : (k < 0 ? 'neg' : '')}">×${k}</span>`;
        }
        h += `<div ${cellAttrs(inR ? 'in-range' : '', f.hlA[key(i, j)])}>${M[i][j]}${badge}</div>`;
      }
    }
    h += '</div></div>';
    if (P) {
      h += `<div><h4>Sumy prefiksowe P (${R + 1}×${C + 1})${f.Pstale ? ' — nieaktualne!' : ''}</h4>`;
      h += `<div class="mat" style="grid-template-columns:28px repeat(${C + 1}, 46px)"><div></div>`;
      for (let j = 0; j <= C; j++) h += `<div class="h">${j}</div>`;
      for (let i = 0; i <= R; i++) {
        h += `<div class="h">${i}</div>`;
        for (let j = 0; j <= C; j++) {
          const base = P[i][j] === null ? 'nullc' : (i === 0 || j === 0 ? 'zero' : '');
          h += `<div ${cellAttrs(base, f.hlP[key(i, j)])}>${fmt(P[i][j])}</div>`;
        }
      }
      h += '</div></div>';
    }
    h += '</div>';
    h += '<p class="note">' + (ok ? `Prostokąt [${r1}, ${r2}) × [${c1}, ${c2}): wiersze ${r1}…${r2 - 1}, kolumny ${c1}…${c2 - 1}. Wiersz r2 i kolumna c2 nie należą do prostokąta.` : 'Granice prostokąta są niepoprawne, zapytanie zostanie odrzucone.') +
      (P ? ' P[i][j] = suma pól M w [0, i) × [0, j); wiersz 0 i kolumna 0 to zera.' : ' Ta metoda nie buduje P.') +
      (f.coef ? ' Liczby ×k w rogu pól M pokazują, ile razy pole jest w tej chwili wliczone do wyniku.' : '') + '</p>';
    $('viz2').innerHTML = h;
    renderReason($('reason2'), f);
    renderCode($('code2'), Steps.PSEUDO[st2.mode], f.line);
    renderVars($('vars2'), f);
    if (f.done) return predictBox($('pred2'), null);
    if (P && P[0][0] !== null) {
      for (let i = 1; i <= R; i++) for (let j = 1; j <= C; j++) if (P[i][j] === null) {
        const e = M[i - 1][j - 1] + P[i - 1][j] + P[i][j - 1] - P[i - 1][j - 1];
        return predictBox($('pred2'), `ile wyniesie P[${i}][${j}] w następnym kroku?`, e,
          `M[${i - 1}][${j - 1}] + P[${i - 1}][${j}] + P[${i}][${j - 1}] − P[${i - 1}][${j - 1}] = ${M[i - 1][j - 1]} + ${P[i - 1][j]} + ${P[i][j - 1]} − ${P[i - 1][j - 1]}.`);
      }
    }
    try {
      const res = PS.naiveSum2D(M, r1, r2, c1, c2);
      return predictBox($('pred2'), `jaka będzie suma prostokąta [${r1}, ${r2}) × [${c1}, ${c2})?`, res, 'To suma wszystkich pól w zaznaczonym prostokącie.');
    } catch (e) { return predictBox($('pred2'), null); }
  }
  const p2 = new Player(document.querySelector('[data-player=p2]'), makeGen2, render2);

  function load2(sc) {
    $('mat2').value = sc.M.map(r => r.join(' ')).join('\n');
    [$('r1_2').value, $('r2_2').value, $('c1_2').value, $('c2_2').value] = sc.q;
    [$('i2').value, $('j2').value, $('x2').value] = sc.s;
    st2.M = sc.M.map(r => r.slice());
    msg('msg2', '');
    p2.reset();
  }
  function apply2() {
    try { st2.M = PS.parseMatrix($('mat2').value); msg('msg2', `Wczytano macierz ${st2.M.length}×${st2.M[0].length}. Nowy przebieg.`, true); p2.reset(); }
    catch (e) { msg('msg2', e.message); }
  }
  $('sc2').innerHTML = SC2.map((s, k) => `<option value="${k}">${esc(s.name)}</option>`).join('');
  $('sc2').addEventListener('change', () => load2(SC2[$('sc2').value]));
  $('apply2').addEventListener('click', apply2);
  $('rand2').addEventListener('click', () => {
    const rand = PS.rng(Date.now() & 0xffff);
    $('mat2').value = Compare.randomMatrix(rand, 4, 5).map(r => r.join(' ')).join('\n');
    apply2();
  });
  $('mode2').addEventListener('change', () => { st2.mode = $('mode2').value; toggleSet(); p2.reset(); });
  ['r1_2', 'r2_2', 'c1_2', 'c2_2', 'i2', 'j2', 'x2'].forEach(id => $(id).addEventListener('change', () => p2.reset()));

  function toggleSet() {
    $('setbox1').style.display = st1.mode === 'set1d' ? '' : 'none';
    $('setbox2').style.display = st2.mode === 'set2d' ? '' : 'none';
  }

  // ------------------------------------------------------------------ PORÓWNANIE
  function runCompare() {
    const seed = Number($('seed').value) || 2026, worst = $('worst').checked;
    const rows = Compare.run1D({ seed, worst });
    let h = '<tr><th>n</th><th>q</th><th>Bezpośrednio<br>add+sub</th><th>Prefiksy:<br>budowa</th><th>Prefiksy:<br>zapytania</th><th>Prefiksy:<br>razem</th><th>Pamięć dod.<br>bezp. / P</th><th>Mniej operacji</th><th>Wyniki<br>zgodne</th></tr>';
    for (const r of rows) {
      const win = r.naiveOps < r.prefixTotal ? 'n' : (r.naiveOps > r.prefixTotal ? 'p' : '');
      h += `<tr class="win-${win}"><td>${r.n}</td><td>${r.q}</td><td class="n">${r.naiveOps}</td><td>${r.buildOps}</td><td>${r.queryOps}</td><td class="p">${r.prefixTotal}</td><td>${r.naiveMem} / ${r.prefixMem}</td><td class="l">${win === 'n' ? 'bezpośrednio' : win === 'p' ? 'prefiksy' : 'remis'}</td><td>${r.agree ? '✔ tak' : '✘ NIE'}</td></tr>`;
    }
    $('cmp1').innerHTML = h;
    $('chart1').innerHTML = chart(rows);
    const rows2 = Compare.run2D({ seed });
    let g = '<tr><th>Macierz</th><th>Prostokąt</th><th>Zmiana</th><th>Bezpośrednio<br>(set + zapytanie)</th><th>Prefiksy:<br>budowa</th><th>Prefiksy:<br>odbudowa po set</th><th>Prefiksy:<br>zapytanie</th><th>Prefiksy:<br>razem</th><th>Pamięć P</th><th>Zgodne</th></tr>';
    for (const r of rows2) {
      g += `<tr><td>${r.size}</td><td class="l">${r.rect}</td><td class="l">${r.set}</td><td>${r.naiveOps}</td><td>${r.buildOps}</td><td>${r.updateOps}</td><td>${r.queryOps}</td><td>${r.prefixTotal}</td><td>${r.prefixMem}</td><td>${r.agree ? '✔' : '✘'}</td></tr>`;
    }
    $('cmp2').innerHTML = g;
    const big = rows.find(r => r.n === 64 && r.q === 100), small = rows.find(r => r.n === 8 && r.q === 1);
    $('concl').innerHTML = `<h3>Co z tego wynika</h3>
      <p>Przy n = 64 i 100 zapytaniach metoda bezpośrednia wykonała ${big.naiveOps} operacji, a sumy prefiksowe ${big.prefixTotal} (budowa ${big.buildOps} + ${big.queryOps} zapytań), czyli około ${(big.naiveOps / big.prefixTotal).toFixed(1).replace('.', ',')} razy mniej.
      Przy n = 8 i jednym zapytaniu jest odwrotnie: ${small.naiveOps} operacji metodą bezpośrednią i ${small.prefixTotal} z prefiksami, bo sama budowa kosztuje więcej niż jedno krótkie zapytanie.</p>
      <p>Budowa opłaca się, gdy zapytań jest dużo i są długie. W macierzach z jedną zmianą i jednym zapytaniem prefiksy zawsze przegrywają: płacimy budowę dwa razy (na początku i po set), a korzyść z szybkiego zapytania jest jedna. Dlatego przy częstych zmianach lepiej liczyć bezpośrednio albo użyć innej struktury.</p>`;
  }
  function chart(rows) {
    const W = 880, H = 270, pad = 40, gw = (W - pad - 10) / rows.length;
    const maxv = Math.max(...rows.map(r => Math.max(r.naiveOps, r.prefixTotal)));
    const y = v => H - 30 - (Math.log10(v + 1) / Math.log10(maxv + 1)) * (H - 75);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Wykres liczby operacji (skala logarytmiczna)">`;
    for (const t of [1, 10, 100, 1000, 10000]) if (t <= maxv * 1.5) s += `<line x1="${pad}" x2="${W}" y1="${y(t)}" y2="${y(t)}" stroke="#dde"/><text x="${pad - 4}" y="${y(t) + 4}" font-size="11" text-anchor="end">${t}</text>`;
    rows.forEach((r, k) => {
      const x = pad + k * gw + 8, bw = (gw - 20) / 2;
      s += `<rect x="${x}" y="${y(r.naiveOps)}" width="${bw}" height="${H - 30 - y(r.naiveOps)}" fill="#f0a35e" stroke="#f0a35e" fill-opacity=".85"/>`;
      s += `<rect x="${x + bw}" y="${y(r.prefixTotal)}" width="${bw}" height="${H - 30 - y(r.prefixTotal)}" fill="#1f4e8c" stroke="#1f4e8c" fill-opacity=".85"><title>prefiksy ${r.prefixTotal}</title></rect>`;
      s += `<text x="${x + bw / 2}" y="${y(r.naiveOps) - 3}" font-size="10" text-anchor="middle">${r.naiveOps}</text>`;
      s += `<text x="${x + 1.5 * bw}" y="${y(r.prefixTotal) - 3}" font-size="10" text-anchor="middle">${r.prefixTotal}</text>`;
      s += `<text x="${x + bw}" y="${H - 14}" font-size="11" text-anchor="middle">n=${r.n}, q=${r.q}</text>`;
    });
    s += `<rect x="${pad + 4}" y="4" width="12" height="12" fill="#f0a35e"/><text x="${pad + 20}" y="14" font-size="12">B — bezpośrednio (lewy słupek)</text>`;
    s += `<rect x="${pad + 220}" y="4" width="12" height="12" fill="#1f4e8c"/><text x="${pad + 236}" y="14" font-size="12">P — prefiksy z budową (prawy słupek)</text>`;
    s += `<text x="${W - 4}" y="14" font-size="11" text-anchor="end">oś Y: skala logarytmiczna</text></svg>`;
    return s;
  }
  function runOwn() {
    const q = Math.max(1, Math.min(1000, Number($('ownQ').value) || 1));
    const A = st1.A, queries = Compare.randomQueries(PS.rng(Number($('seed').value) || 2026), A.length, q);
    const r = Compare.experiment1D(A, queries);
    $('cmpOwn').innerHTML = `<tr><th>n</th><th>q</th><th>Bezpośrednio</th><th>Prefiksy: budowa</th><th>zapytania</th><th>razem</th><th>Zgodne</th></tr>
      <tr><td>${r.n}</td><td>${r.q}</td><td>${r.naiveOps}</td><td>${r.buildOps}</td><td>${r.queryOps}</td><td>${r.prefixTotal}</td><td>${r.agree ? '✔' : '✘'}</td></tr>`;
  }
  $('runCmp').addEventListener('click', runCompare);
  $('worst').addEventListener('change', runCompare);
  $('runOwn').addEventListener('click', runOwn);

  // ------------------------------------------------------------------ PYTANIA
  let q2k = null;
  function mcQuestion(no, text, opts, good, explain) {
    const name = 'q' + no;
    return `<div class="q" data-good="${good}"><h3>Pytanie ${no}</h3><p>${esc(text)}</p><div class="opts">` +
      opts.map((o, k) => `<label><input type="radio" name="${name}" value="${k}"> <span>${String.fromCharCode(65 + k)}) ${esc(o)}</span></label>`).join('') +
      `</div><button data-check="mc">Sprawdź</button><div class="ans" data-expl="${esc(explain)}"></div></div>`;
  }
  function numQuestion(no, text, expected, explain, extra) {
    return `<div class="q" data-exp="${expected}"><h3>Pytanie ${no} <small>(aktualny stan)</small></h3><p>${esc(text)}</p>` +
      `<input class="num" type="number"> <button data-check="num">Sprawdź</button> ${extra || ''}<div class="ans" data-expl="${esc(explain)}"></div></div>`;
  }
  function renderQuiz() {
    let h = '';
    h += mcQuestion(1, 'Dlaczego w sumie prostokąta trzeba raz dodać obszar odjęty dwukrotnie?', [
      'Bo lewy-górny obszar [0, r1) × [0, c1) należy i do pasa nad prostokątem, i do pasa na lewo od niego, więc odjęliśmy go dwa razy.',
      'Bo P ma dodatkowy zerowy wiersz i zerową kolumnę.',
      'Bo P[r2][c2] nie obejmuje lewego-górnego rogu macierzy.',
      'Żeby wynik nigdy nie był ujemny.'
    ], 0, 'P[r2][c2] liczy róg raz. Odejmujemy P[r1][c2] (róg −1) i P[r2][c1] (róg znowu −1), więc róg ma współczynnik −1. Dodanie P[r1][c1] ustawia go na 0. Widać to w Laboratorium 2D w scenariuszu „Prostokąt w środku” jako liczby ×k.');
    // pytanie 2: aktualna tablica z Laboratorium 1D
    const A = st1.A, n = A.length;
    let k, note = '';
    const fr = p1.frame;
    if (fr && fr.P && fr.P[0] !== null && fr.P.indexOf(null) > 0) { k = fr.P.indexOf(null); note = ' (to kolejny prefiks, który policzy trwający przebieg w Laboratorium 1D)'; }
    else { if (q2k === null || q2k > n) q2k = Math.min(3, n); k = q2k; }
    let pk = 0; for (let t = 0; t < k; t++) pk += A[t];
    const parts = A.slice(0, k).map(v => v < 0 ? `(${v})` : v).join(' + ') || '0 (pusty prefiks)';
    h += numQuestion(2, `Aktualna tablica w Laboratorium 1D: A = [${A.join(', ')}]. Ile wynosi P[${k}]${note}?`, pk,
      `P[${k}] to suma pierwszych ${k} elementów: ${parts} = ${pk}.`, `<button data-new="q2">Inne k</button>`);
    // pytanie 3: aktualna macierz i prostokąt z Laboratorium 2D
    const M = st2.M, p = read2(); let rect = [p.r1, p.r2, p.c1, p.c2], rectNote = '';
    try { PS.validateRect(M.length, M[0].length, ...rect); } catch (e) { rect = [0, M.length, 0, M[0].length]; rectNote = ' (prostokąt z laboratorium jest błędny, więc pytam o całą macierz)'; }
    const P = PS.buildPrefix2D(M), [a, b, c, d] = rect;
    const val = PS.query2D(P, a, b, c, d);
    h += numQuestion(3, `Aktualna macierz w Laboratorium 2D: ${JSON.stringify(M)}. Ile wynosi suma prostokąta [${a}, ${b}) × [${c}, ${d})${rectNote}?`, val,
      `P[${b}][${d}] − P[${a}][${d}] − P[${b}][${c}] + P[${a}][${c}] = ${P[b][d]} − ${P[a][d]} − ${P[b][c]} + ${P[a][c]} = ${val}.`);
    h += mcQuestion(4, 'Tablica ma n = 64 elementy, dane się nie zmieniają, zadajemy 100 zapytań o całą tablicę. Ile operacji (dodawań i odejmowań) wykonają obie metody łącznie?', [
      'Bezpośrednio 6400, prefiksy 164', 'Bezpośrednio 6400, prefiksy 100', 'Bezpośrednio 64, prefiksy 1', 'Obie po 6400'
    ], 0, 'Metodą bezpośrednią każde zapytanie to 64 dodawania, razem 100 · 64 = 6400. Prefiksy: budowa 64 dodawania + 100 odejmowań = 164. Tak samo wychodzi w zakładce Porównanie z zaznaczonym najgorszym przypadkiem.');
    h += mcQuestion(5, 'Po set(i, x) w tablicy o n elementach, które pola P mają inną wartość niż przed zmianą (gdy x ≠ A[i])?', [
      'P[i+1], P[i+2], …, P[n]', 'Tylko P[i]', 'Tylko P[i+1]', 'Wszystkie, od P[0] do P[n]'
    ], 0, 'P[k] zawiera A[i] tylko wtedy, gdy i < k. Prefiksy P[0]…P[i] się nie zmieniają. Aplikacja i tak odbudowuje całe P, bo tak każe karta i to zawsze jest bezpieczne, ale to kosztuje O(n).');
    $('quiz').innerHTML = h;
    $('quiz').querySelectorAll('[data-check]').forEach(btn => btn.addEventListener('click', () => {
      const q = btn.closest('.q'), ans = q.querySelector('.ans');
      let good;
      if (btn.dataset.check === 'mc') {
        const sel = q.querySelector('input:checked');
        if (!sel) { ans.className = 'ans show bad'; ans.textContent = 'Wybierz odpowiedź.'; return; }
        good = Number(sel.value) === Number(q.dataset.good);
      } else {
        const v = q.querySelector('input.num').value.trim();
        if (v === '') { ans.className = 'ans show bad'; ans.textContent = 'Wpisz liczbę.'; return; }
        good = Number(v) === Number(q.dataset.exp);
      }
      ans.className = 'ans show ' + (good ? 'good' : 'bad');
      ans.textContent = (good ? '✔ Dobrze. ' : '✘ Niestety nie. ') + ans.dataset.expl;
    }));
    const nb = $('quiz').querySelector('[data-new=q2]');
    if (nb) nb.addEventListener('click', () => { q2k = n === 0 ? 0 : 1 + Math.floor(Math.random() * n); if (p1.frame && p1.frame.P && p1.frame.P.indexOf(null) > 0) p1.reset(); renderQuiz(); });
  }

  // ------------------------------------------------------------------ TESTY
  function runTestsUI() {
    testsRan = true;
    const res = TestCases.runTests();
    const ok = res.filter(r => r.status === 'OK').length;
    $('testSummary').textContent = `Zaliczone: ${ok} / ${res.length}`;
    $('testTable').innerHTML = '<tr><th>ID</th><th>Grupa</th><th>Test</th><th>Wejście</th><th>Oczekiwane</th><th>Uzyskane</th><th>Status</th></tr>' +
      res.map(r => `<tr><td>${r.id}</td><td>${esc(r.group)}</td><td>${esc(r.name)}</td><td class="code">${esc(r.input)}</td><td class="code">${esc(r.expected)}</td><td class="code">${esc(r.got)}</td><td class="${r.status === 'OK' ? 'pass' : 'fail'}">${r.status === 'OK' ? '✔ OK' : '✘ BŁĄD'}</td></tr>`).join('');
  }
  $('runTests').addEventListener('click', runTestsUI);

  // ------------------------------------------------------------------ start (+ parametry adresu do zrzutów ekranu)
  const qs = new URLSearchParams(location.search);
  st1.mode = qs.get('mode1') || 'prefix1d'; $('mode1').value = st1.mode;
  st2.mode = qs.get('mode2') || 'prefix2d'; $('mode2').value = st2.mode;
  toggleSet();
  const s1 = Number(qs.get('sc1') || 0), s2 = Number(qs.get('sc2') || 0);
  $('sc1').value = s1; $('sc2').value = s2;
  load1(SC1[s1]); load2(SC2[s2]);
  for (let t = 0; t < Number(qs.get('steps1') || 0); t++) p1.step();
  for (let t = 0; t < Number(qs.get('steps2') || 0); t++) p2.step();
  runCompare(); runOwn();
  if (qs.get('worst') === '1') { $('worst').checked = true; runCompare(); }
  showTab(qs.get('tab') || 'lab1');
})();
