# Składa prezentację ASD1-M1-13 (10 slajdów) z python-pptx.
# Uruchomienie: python tools/make_slides.py
import json, os
from pptx import Presentation
from pptx.util import Mm, Pt
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.chart.data import CategoryChartData
from pptx.enum.chart import XL_CHART_TYPE, XL_LEGEND_POSITION

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMG = os.path.join(ROOT, 'docs', 'img')
res = json.load(open(os.path.join(ROOT, 'docs', 'wyniki-porownania.json'), encoding='utf-8'))
tests = json.load(open(os.path.join(ROOT, 'tests', 'wyniki-testow.json'), encoding='utf-8'))

GREEN = RGBColor(0x1F, 0x4E, 0x8C); INK = RGBColor(0x17, 0x2A, 0x45); MUTED = RGBColor(0x5A, 0x6B, 0x85)  # GREEN = główny kolor (granat)
LIGHT = RGBColor(0xEE, 0xF3, 0xFA); WHITE = RGBColor(0xFF, 0xFF, 0xFF)
C_RANGE = RGBColor(0xE3, 0xF1, 0xFF); C_USE = RGBColor(0xE8, 0xD2, 0xFF); C_MINUS = RGBColor(0xFF, 0xC9, 0xC9)
C_WRITE = RGBColor(0xB8, 0xF0, 0xC8); C_ORANGE = RGBColor(0xF0, 0xA3, 0x5E); C_TEAL = RGBColor(0x1F, 0x4E, 0x8C)

prs = Presentation()
prs.slide_width, prs.slide_height = Mm(338.7), Mm(190.5)
BLANK = prs.slide_layouts[6]
W, H = prs.slide_width, prs.slide_height


def text(slide, x, y, w, h, lines, size=20, color=INK, bold=False, align=PP_ALIGN.LEFT, font='Segoe UI', anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame; tf.word_wrap = True; tf.vertical_anchor = anchor
    tf.margin_left = tf.margin_right = Mm(1.5)
    if isinstance(lines, str): lines = [lines]
    for k, ln in enumerate(lines):
        p = tf.paragraphs[0] if k == 0 else tf.add_paragraph()
        if isinstance(ln, tuple): ln, opt = ln
        else: opt = {}
        r = p.add_run(); r.text = ln
        r.font.size = Pt(opt.get('size', size)); r.font.bold = opt.get('bold', bold)
        r.font.color.rgb = opt.get('color', color); r.font.name = opt.get('font', font)
        p.alignment = align; p.space_after = Pt(opt.get('after', 6))
    return tb


def bullets(slide, x, y, w, h, items, size=20):
    return text(slide, x, y, w, h, [('•  ' + i if not i.startswith('   ') else i, {'size': size if not i.startswith('   ') else size - 3, 'color': INK if not i.startswith('   ') else MUTED}) for i in items], size=size)


def box(slide, x, y, w, h, fill, label='', size=14, color=INK, line=None, bold=False, shape=MSO_SHAPE.RECTANGLE, font='Consolas'):
    s = slide.shapes.add_shape(shape, int(x), int(y), int(w), int(h))
    s.fill.solid(); s.fill.fore_color.rgb = fill
    s.line.color.rgb = line or RGBColor(0xA7, 0xB6, 0xCC); s.line.width = Pt(1.25)
    s.shadow.inherit = False
    tf = s.text_frame; tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = Mm(0.8)
    tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = label; r.font.size = Pt(size); r.font.color.rgb = color; r.font.bold = bold; r.font.name = font
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    return s


def frame(slide, no, title):
    bg = slide.background.fill; bg.solid(); bg.fore_color.rgb = WHITE
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, Mm(24)); bar.fill.solid(); bar.fill.fore_color.rgb = GREEN; bar.line.fill.background()
    text(slide, Mm(12), Mm(4), Mm(290), Mm(16), title, size=28, color=WHITE, bold=True, anchor=MSO_ANCHOR.MIDDLE)
    text(slide, Mm(12), H - Mm(11), Mm(220), Mm(8), 'ASD1-M1-13 · PrefiksLab · Lukaš Radivilovič (93795)', size=11, color=MUTED)
    text(slide, W - Mm(40), H - Mm(11), Mm(30), Mm(8), f'{no} / 10', size=11, color=MUTED, align=PP_ALIGN.RIGHT)


def notes(slide, t): slide.notes_slide.notes_text_frame.text = t


def array_row(slide, x, y, vals, cw=Mm(15), ch=Mm(12), fills=None, label=None, idx=True, size=16):
    if label: text(slide, x - Mm(16), y, Mm(15), ch, label, size=16, bold=True, color=GREEN, anchor=MSO_ANCHOR.MIDDLE, align=PP_ALIGN.RIGHT)
    for k, v in enumerate(vals):
        f = (fills or {}).get(k, WHITE)
        box(slide, x + k * cw, y, cw - Mm(1), ch, f, str(v), size=size)
        if idx: text(slide, x + k * cw, y - Mm(7), cw, Mm(6), str(k), size=10, color=MUTED, align=PP_ALIGN.CENTER)


# ---------------------------------------------------------------- 1. tytuł
s = prs.slides.add_slide(BLANK)
bg = s.background.fill; bg.solid(); bg.fore_color.rgb = GREEN
text(s, Mm(20), Mm(22), Mm(300), Mm(10), 'Algorytmy i struktury danych I · Mini-projekt M1 · 2026/2027', size=16, color=RGBColor(0xD5, 0xE2, 0xF5))
text(s, Mm(20), Mm(40), Mm(300), Mm(40), ['ASD1-M1-13', ('Sumy prefiksowe i zapytania na zakresach', {'size': 40, 'bold': True, 'color': WHITE})], size=24, color=RGBColor(0xD5, 0xE2, 0xF5))
text(s, Mm(20), Mm(92), Mm(300), Mm(12), 'Aplikacja: PrefiksLab (HTML + CSS + JavaScript)', size=20, color=WHITE)
text(s, Mm(20), Mm(128), Mm(300), Mm(30), ['Lukaš Radivilovič', 'nr indeksu 93795 · Informatyka', 'Uniwersytet w Białymstoku, Filia w Wilnie'], size=18, color=WHITE)
for k, (v, f) in enumerate([(0, WHITE), (2, WHITE), (3, C_MINUS), (6, WHITE), (10, C_USE), (15, WHITE)]):
    box(s, Mm(225) + k * Mm(16), Mm(128), Mm(15), Mm(12), f, str(v), size=16)
text(s, Mm(225), Mm(143), Mm(100), Mm(8), 'P[4] − P[1] = 10 − 2 = 8', size=14, color=WHITE, font='Consolas')
notes(s, 'Dzień dobry. Temat ASD1-M1-13, sumy prefiksowe i zapytania na zakresach. Pokażę aplikację PrefiksLab, w której obie metody liczenia sum widać krok po kroku. Liczby w prawym dolnym rogu to przykład z karty: suma zakresu [1, 4) z tablicy P.')

# ---------------------------------------------------------------- 2. problem i cel
s = prs.slides.add_slide(BLANK); frame(s, 2, 'Problem i cel')
bullets(s, Mm(12), Mm(32), Mm(160), Mm(120), [
    'Wiele pytań: „ile wynosi suma A[l..r−1]?”',
    'Pętla za każdym razem: koszt = długość zakresu',
    'Sumy prefiksowe: raz przygotuj, potem 1 odejmowanie',
    'Odbiorca: student 1. roku, zna pętle i tablice',
    'Ma umieć: zbudować P, policzyć P[r] − P[l], wyjaśnić wzór 2D i ocenić, kiedy budowa się opłaca'], size=20)
A = [2, 1, 3, 4, 5]
array_row(s, Mm(200), Mm(55), A, fills={1: C_RANGE, 2: C_RANGE, 3: C_RANGE}, label='A')
array_row(s, Mm(200), Mm(90), [0, 2, 3, 6, 10, 15], fills={1: C_MINUS, 4: C_USE}, label='P')
text(s, Mm(185), Mm(108), Mm(140), Mm(30), ['zakres [1, 4): 1 + 3 + 4 = 8', 'P[4] − P[1] = 10 − 2 = 8', 'P[k] = suma pierwszych k elementów'], size=15, font='Consolas')
notes(s, 'Problem jest prosty: mamy dużo zapytań o sumę fragmentu tablicy. Metodą bezpośrednią każde zapytanie kosztuje tyle, ile ma elementów. Sumy prefiksowe płacą raz za budowę i potem każde zapytanie to jedno odejmowanie. Odbiorcą jest student pierwszego roku. Rysunek po prawej: P[k] to suma pierwszych k elementów, więc suma od 1 do 3 to P[4] minus P[1].')

# ---------------------------------------------------------------- 3. zakres
s = prs.slides.add_slide(BLANK); frame(s, 3, 'Zakres projektu')
cols = [
    ('Sumowanie bez przygotowania', ['pętla po zakresie, 1D i 2D', 'punkt odniesienia dla testów']),
    ('Sumy prefiksowe 1D', ['P z zerem na początku', 'suma [l, r) = P[r] − P[l]']),
    ('Sumy prefiksowe 2D', ['zerowy wiersz i kolumna', 'prostokąt z 4 pól P']),
    ('Zmiana danych', ['set(i, x) i set(i, j, x)', 'pełna odbudowa, P nieaktualne ✗']),
]
for k, (t, it) in enumerate(cols):
    x = Mm(12) + k * Mm(80)
    box(s, x, Mm(32), Mm(76), Mm(14), GREEN, t, size=15, color=WHITE, bold=True, font='Segoe UI')
    text(s, x, Mm(48), Mm(76), Mm(28), ['• ' + i for i in it], size=15)
text(s, Mm(12), Mm(84), Mm(310), Mm(10), 'Co faktycznie działa w aplikacji', size=20, bold=True, color=GREEN)
bullets(s, Mm(12), Mm(96), Mm(155), Mm(80), [
    '2 laboratoria (1D i 2D), po 3 metody',
    'Krok, Start/Pauza, Reset, tempo',
    '6 + 6 gotowych scenariuszy, własne dane',
    'pseudokod z bieżącym wierszem i „Dlaczego ten krok”'], size=17)
bullets(s, Mm(170), Mm(96), Mm(155), Mm(80), [
    'porównanie kosztu z karty + własny eksperyment',
    '5 pytań, w tym 2 z aktualnego stanu + pole „Przewidź”',
    '24 testy w Node i w przeglądarce',
    'oznaczenia znakami, nie tylko kolorem'], size=17)
notes(s, 'Wszystkie cztery podtematy z karty są w jednej aplikacji. Na dole jest to, co rzeczywiście działa: dwa laboratoria, sterowanie krokowe, scenariusze, porównanie, pytania i testy.')

# ---------------------------------------------------------------- 4. algorytmy
s = prs.slides.add_slide(BLANK); frame(s, 4, 'Algorytmy i mechanizmy')
code = ['build(A):  P[0] ← 0', '  dla i: P[i+1] ← P[i] + A[i]', 'query(l, r): P[r] − P[l]', '',
        'build2D(M): P ← zera (R+1)×(C+1)', '  P[i+1][j+1] ← M[i][j]', '     + P[i][j+1] + P[i+1][j] − P[i][j]', '',
        'query2D: P[r2][c2] − P[r1][c2]', '         − P[r2][c1] + P[r1][c1]']
cb = box(s, Mm(12), Mm(32), Mm(160), Mm(98), LIGHT, '', line=RGBColor(0xCB, 0xD6, 0xE6))
text(s, Mm(15), Mm(34), Mm(155), Mm(95), code, size=15, font='Consolas')
text(s, Mm(12), Mm(134), Mm(165), Mm(40), [
    ('Różnice: bezpośrednio O(r − l) na zapytanie i darmowy set; prefiksy: budowa O(n), zapytanie O(1), set = odbudowa', {'size': 13}),
    ('Kiedy prefiksy: dużo zapytań, rzadkie zmiany, operacja odwracalna (suma, XOR; nie min/max)', {'size': 13, 'bold': True, 'color': GREEN})], size=13)
# schemat odejmowania obszarów
ox, oy, u = Mm(200), Mm(38), Mm(21)
box(s, ox, oy, 5 * u, 4 * u, RGBColor(0xF7, 0xF9, 0xF9), '')
box(s, ox, oy, 2 * u, 1.5 * u, C_MINUS, 'róg\n−1 −1 +1 = ×0', size=11, font='Segoe UI')
box(s, ox + 2 * u, oy, 3 * u, 1.5 * u, RGBColor(0xFF, 0xE4, 0xC4), 'pas nad: −P[r1][c2]', size=11, font='Segoe UI')
box(s, ox, oy + 1.5 * u, 2 * u, 2.5 * u, RGBColor(0xFF, 0xE4, 0xC4), 'pas z lewej:\n−P[r2][c1]', size=11, font='Segoe UI')
box(s, ox + 2 * u, oy + 1.5 * u, 3 * u, 2.5 * u, C_RANGE, 'szukany prostokąt\n×1', size=14, bold=True, line=RGBColor(0x15, 0x65, 0xC0), font='Segoe UI')
text(s, ox, int(oy + 4 * u + Mm(2)), Mm(120), Mm(20), ['całość [0,r2)×[0,c2) = P[r2][c2]', 'róg odjęty dwa razy → dodaj P[r1][c1]'], size=13)
notes(s, 'W 1D: P[i+1] to P[i] plus A[i], zapytanie to jedno odejmowanie. W 2D przy budowie dodaję prefiks z góry i z lewej i odejmuję ich wspólną część. Przy zapytaniu biorę cały obszar od rogu macierzy, odejmuję pas nad prostokątem i pas z lewej. Lewy-górny róg jest w obu pasach, więc odjąłem go dwa razy i muszę raz dodać. Warunek stosowania: dużo zapytań, rzadkie zmiany, operacja odwracalna.')

# ---------------------------------------------------------------- 5. struktury
s = prs.slides.add_slide(BLANK); frame(s, 5, 'Struktury danych')
bullets(s, Mm(12), Mm(32), Mm(165), Mm(120), [
    'A: number[], długość 0…64',
    'P: number[], długość n + 1, P[0] = 0',
    'M, P2D: number[][], P ma (R+1)×(C+1)',
    'PrefixArray / PrefixMatrix:',
    '   dane, P, liczniki {add, sub}',
    '   version i builtFor: różne = P nieaktualne',
    'Migawka kroku: line, A, P, hlA/hlP, vars, ops, coef, reason',
    'Dlaczego tablice: dostęp O(1), małe rozmiary, suma ≤ 2000'], size=18)
tbl = s.shapes.add_table(5, 3, Mm(185), Mm(34), Mm(140), Mm(60)).table
rows = [('Struktura', 'Pamięć', 'Po set'), ('brak (bezpośrednio)', 'O(1)', 'nic'), ('P 1D', 'n + 1', 'P[i+1..n] ✗'), ('P 2D', '(R+1)(C+1)', 'P[a][b], a>i, b>j ✗'), ('migawka', 'kopia na krok', 'nowy przebieg')]
for r, row in enumerate(rows):
    for c, v in enumerate(row):
        cell = tbl.cell(r, c); cell.text = v
        para = cell.text_frame.paragraphs[0]; para.runs[0].font.size = Pt(14); para.runs[0].font.bold = r == 0
notes(s, 'Wszystko to zwykłe tablice JavaScriptu. Ważny jest mechanizm wersji: set zwiększa numer wersji danych, a zapytanie sprawdza, czy P zbudowano dla tej samej wersji. Dzięki temu nie da się użyć nieaktualnych sum. Migawka to stan jednego kroku, który rysuje interfejs.')

# ---------------------------------------------------------------- 6. technologie i architektura
s = prs.slides.add_slide(BLANK); frame(s, 6, 'Technologie i architektura')
bullets(s, Mm(12), Mm(32), Mm(115), Mm(120), [
    'HTML + CSS: widok, siatki komórek',
    'JavaScript: algorytmy i generatory function*',
    'Node.js: testy z terminala',
    'bez bibliotek, bez internetu',
    'Git + GitHub'], size=18)
mods = [('algorithms.js', 'badane algorytmy\nwalidacja, liczniki', Mm(140), Mm(34)),
        ('steps.js', 'generatory kroków\npseudokod', Mm(140), Mm(76)),
        ('compare.js', 'eksperymenty\nz karty', Mm(240), Mm(34)),
        ('test-cases.js', '24 testy\nNode + przeglądarka', Mm(240), Mm(76)),
        ('app.js + index.html', 'odtwarzacz Player, rysowanie,\npytania, porównanie, testy', Mm(170), Mm(122))]
for name, desc, x, y in mods:
    box(s, x, y, Mm(85), Mm(10), GREEN, name, size=14, color=WHITE, bold=True)
    box(s, x, y + Mm(10), Mm(85), Mm(18), LIGHT, desc, size=12, font='Segoe UI')
for (x1, y1, x2, y2) in [(Mm(182), Mm(62), Mm(182), Mm(76)), (Mm(225), Mm(48), Mm(240), Mm(48)), (Mm(225), Mm(90), Mm(240), Mm(90)), (Mm(182), Mm(104), Mm(200), Mm(122)), (Mm(282), Mm(104), Mm(240), Mm(122))]:
    ln = s.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2); ln.line.color.rgb = MUTED; ln.line.width = Pt(2)
notes(s, 'Bez bibliotek: komórki to div w siatce CSS, wykres to SVG. Kluczowe są generatory: funkcja wykonuje prawdziwy algorytm i po każdej instrukcji oddaje migawkę. Przycisk Krok wywołuje next(). Te same pliki ładuje przeglądarka i Node, więc testy sprawdzają kod, który widać w aplikacji.')

# ---------------------------------------------------------------- 7. realizacja i interfejs
s = prs.slides.add_slide(BLANK); frame(s, 7, 'Realizacja i interfejs')
s.shapes.add_picture(os.path.join(IMG, 'lab2_query.png'), Mm(10), Mm(34), width=Mm(163))
bullets(s, Mm(178), Mm(32), Mm(150), Mm(140), [
    'Etapy: algorytmy → kroki → testy → interfejs → porównanie',
    'Krok = next() generatora',
    'Zmiana danych = nowy generator',
    'Podświetlony wiersz pseudokodu ▶',
    '„Dlaczego ten krok” z liczbami',
    '×k: ile razy pole jest wliczone',
    'Znaki + − = ✗ ✎ ? obok kolorów'], size=17)
notes(s, 'To mój zrzut z Laboratorium 2D, w trakcie zapytania po dwóch odejmowaniach. Na macierzy M widać ×−1 w lewym-górnym rogu. Po prawej podświetlony wiersz pseudokodu i zmienne. Każdy krok wynika z wykonania kodu.')

# ---------------------------------------------------------------- 8. testy i porównanie
s = prs.slides.add_slide(BLANK); frame(s, 8, 'Testy i porównanie')
cd = CategoryChartData()
rows = res['random1D']
cd.categories = [f"n={r['n']}, q={r['q']}" for r in rows]
cd.add_series('bezpośrednio', [r['naiveOps'] for r in rows])
cd.add_series('prefiksy (budowa + zapytania)', [r['prefixTotal'] for r in rows])
ch = s.shapes.add_chart(XL_CHART_TYPE.COLUMN_CLUSTERED, Mm(10), Mm(28), Mm(200), Mm(120), cd).chart
ch.has_legend = True; ch.legend.position = XL_LEGEND_POSITION.TOP; ch.legend.include_in_layout = False
ch.legend.font.size = Pt(12)
ch.category_axis.tick_labels.font.size = Pt(10); ch.value_axis.tick_labels.font.size = Pt(11)
ch.plots[0].series[0].format.fill.solid(); ch.plots[0].series[0].format.fill.fore_color.rgb = C_ORANGE
ch.plots[0].series[1].format.fill.solid(); ch.plots[0].series[1].format.fill.fore_color.rgb = C_TEAL
ch.plots[0].has_data_labels = True; ch.plots[0].data_labels.font.size = Pt(9)
text(s, Mm(12), Mm(150), Mm(200), Mm(20), 'Liczba dodawań + odejmowań, te same losowe zapytania (ziarno 2026). Macierze 10×10, 1 set + 1 zapytanie: bezpośrednio 20–100, prefiksy 603.', size=12, color=MUTED)
bullets(s, Mm(218), Mm(32), Mm(112), Mm(140), [
    f"Testy: {tests['passed']}/{tests['total']} OK",
    '   karta, brzegowe, walidacja',
    '   4 stany pośrednie (T17–T20)',
    '   1000 losowych: prefiksy = bezpośrednio',
    'Licznik add = liczba +, sub = liczba −',
    'Liczniki pomijają walidację i animację',
    'q = 1: bezpośrednio taniej',
    'q ≥ 10: prefiksy taniej'], size=16)
notes(s, 'Wszystkie 24 testy przechodzą, w tym cztery stany pośrednie i test losowy. Liczniki to dodawania i odejmowania samego algorytmu. Na wykresie: przy jednym zapytaniu wygrywa metoda bezpośrednia, bo budowa kosztuje n. Od 10 zapytań wygrywają prefiksy. W macierzach z jedną zmianą prefiksy zawsze przegrywają, bo płacą dwie budowy.')

# ---------------------------------------------------------------- 9. wnioski
s = prs.slides.add_slide(BLANK); frame(s, 9, 'Wnioski i ograniczenia')
text(s, Mm(12), Mm(30), Mm(155), Mm(10), 'Co wykazałem', size=20, bold=True, color=GREEN)
bullets(s, Mm(12), Mm(42), Mm(155), Mm(60), [
    'n = 64, q = 100: 2245 → 164 operacji',
    'budowa zwraca się dopiero przy wielu zapytaniach',
    'częste set psują zysk (pełna odbudowa)'], size=16)
text(s, Mm(12), Mm(92), Mm(155), Mm(10), 'Ograniczenia', size=20, bold=True, color=GREEN)
bullets(s, Mm(12), Mm(104), Mm(155), Mm(60), [
    'koszt w operacjach, nie w milisekundach',
    'set odbudowuje całe P (wystarczy P[i+1..n])',
    'małe rozmiary z karty'], size=16)
text(s, Mm(175), Mm(30), Mm(155), Mm(10), 'Własny wkład, źródła, AI', size=20, bold=True, color=GREEN)
bullets(s, Mm(175), Mm(42), Mm(155), Mm(120), [
    'wkład: koncepcja wizualizacji (×k, „Przewidź”), liczniki i porównanie, dobór testów, weryfikacja wyników',
    'źródła: USACO Guide (Prefix Sums), CPH rozdz. 9.1, karta tematu',
    'AI: Claude (Anthropic) jako narzędzie pomocnicze przy kodzie, tekstach i slajdach',
    'kontrola: wyniki z karty i liczone ręcznie w testach, test losowy, porównanie kroków z funkcjami'], size=15)
notes(s, 'Najważniejszy wniosek: sumy prefiksowe są szybkie dopiero wtedy, gdy zapytań jest dużo, a zmian mało. Ograniczenia: mierzę operacje, nie czas, i set odbudowuje całe P. Claude był dla mnie narzędziem pomocniczym. Poprawność sprawdzają testy z wartościami z karty i policzonymi ręcznie.')

# ---------------------------------------------------------------- 10. plan demonstracji
s = prs.slides.add_slide(BLANK); frame(s, 10, 'Plan demonstracji produktu')
steps = [
    ('1', 'Teoria', 'cel, działanie, zastosowania, ograniczenia'),
    ('2', 'Laboratorium 1D krok po kroku', 'przykład z karty: P = [0,2,3,6,10,15], suma 8'),
    ('3', 'Zmiana danych na żywo', 'set(2,5) → P nieaktualne ✗ → odbudowa → 10'),
    ('4', 'Laboratorium 2D', 'prostokąt w środku: ×k, róg odjęty dwa razy'),
    ('5', 'Przypadek brzegowy', 'pusta tablica, odwrócony zakres [3,1)'),
    ('6', 'Porównanie', 'n = 8/32/64, q = 1/10/100, macierze'),
    ('7', 'Pytanie dla odbiorcy', 'dlaczego dodajemy róg z powrotem?'),
    ('8', 'Testy', 'node tests/run-tests.js → 24/24'),
]
for k, (n, t, d) in enumerate(steps):
    col, row = k // 4, k % 4
    x, y = Mm(12) + col * Mm(160), Mm(34) + row * Mm(34)
    box(s, x, y, Mm(16), Mm(16), GREEN, n, size=20, color=WHITE, bold=True, shape=MSO_SHAPE.OVAL, font='Segoe UI')
    text(s, x + Mm(20), y - Mm(2), Mm(135), Mm(10), t, size=19, bold=True)
    text(s, x + Mm(20), y + Mm(8), Mm(135), Mm(10), d, size=14, color=MUTED)
text(s, Mm(12), H - Mm(26), Mm(310), Mm(10), 'Teraz uruchamiam aplikację: index.html', size=18, bold=True, color=GREEN)
notes(s, 'Po tym slajdzie otwieram index.html. Kolejność: teoria, jeden przykład w 1D dokładnie krok po kroku, zmiana danych na żywo przez set, 2D z odejmowaniem obszarów, przypadek brzegowy, porównanie, pytanie dla odbiorcy i testy.')

import sys
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'ASD1-M1-13_Radivilovic_prezentacja.pptx')
prs.save(out)
print('zapisano', out, 'slajdy:', len(prs.slides))
