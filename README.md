# PrefiksLab: sumy prefiksowe i zapytania na zakresach

Mini-projekt M1 z przedmiotu Algorytmy i struktury danych I (2026/2027).

- Autor: Lukaš Radivilovič, nr albumu 93795, Informatyka
- Kod tematu: **ASD1-M1-13** (Sumy prefiksowe i zapytania na zakresach)
- Uczelnia: Filia Uniwersytetu w Białymstoku w Wilnie

Aplikacja pokazuje krok po kroku, jak liczyć sumę zakresu tablicy i sumę prostokąta macierzy: najpierw zwykłą pętlą, potem sumami prefiksowymi 1D i 2D, a na końcu po zmianie danych `set`. Liczy też dodawania i odejmowania, żeby było widać, kiedy przygotowanie się opłaca.

## Uruchomienie aplikacji

Nie trzeba nic instalować ani mieć internetu. Wystarczy otworzyć plik `index.html` w przeglądarce (Chrome, Edge albo Firefox), np. dwuklikiem.

Przydatne parametry adresu (używałem ich do zrzutów ekranu):
`index.html?tab=lab2&sc2=1&mode2=prefix2d&steps2=22` otwiera Laboratorium 2D, scenariusz 1, i wykonuje 22 kroki.

## Uruchomienie testów

Potrzebny jest Node.js (testowane na v26):

```
node tests/run-tests.js
```

Polecenie wypisuje dla każdego testu wejście, oczekiwany wynik, uzyskany wynik i status, a na końcu podsumowanie (obecnie 24/24). Wyniki zapisuje też do `tests/wyniki-testow.json`. Te same testy można uruchomić w aplikacji, w zakładce **Testy**.

Wyniki porównania kosztu (te same co w zakładce Porównanie) zapisuje:

```
node tools/export-results.js
```

## Struktura plików

| Plik | Co zawiera |
|---|---|
| `index.html` | widok aplikacji (zakładki) |
| `src/algorithms.js` | badane algorytmy: suma bezpośrednia, budowa i zapytania 1D/2D, `PrefixArray`/`PrefixMatrix` z `set`, walidacja, liczniki |
| `src/steps.js` | wykonanie krokowe (generatory), pseudokod |
| `src/compare.js` | eksperymenty z karty: n = 8/32/64, q = 1/10/100, macierze 3×3/6×6/10×10 |
| `src/app.js` | interfejs: odtwarzacz krokowy, rysowanie, pytania, porównanie, testy |
| `src/style.css` | wygląd |
| `tests/test-cases.js` | 24 testy automatyczne (wspólne dla Node i przeglądarki) |
| `tests/run-tests.js` | uruchamianie testów w Node |
| `tools/export-results.js` | zapis wyników porównania do `docs/wyniki-porownania.json` |

## Pliki do obrony

- `ASD1-M1-13_Radivilovic_prezentacja.pptx`: prezentacja (10 slajdów)
- `ASD1-M1-13_Radivilovic_dokumentacja.pdf`: dokumentacja (10 stron)
- `index.html`: aplikacja do pokazu po slajdach
- `tests/run-tests.js`: testy do pokazania na żywo

## Założenia z karty

Tablica ma 0–64 liczb całkowitych z zakresu −20…20, macierz od 1×1 do 10×10. Indeksy od 0, zakres `[l, r)` nie obejmuje `r`, pusty zakres ma sumę 0, prostokąt to `[r1, r2) × [c1, c2)`. Granice spoza danych i odwrócone zakresy są odrzucane. Zgodnie z kartą nie ma tu drzewa Fenwicka.

## Wykorzystanie AI

Przy pisaniu kodu i tekstów korzystałem z asystenta AI (Claude, Anthropic). Opis tego, co zrobiłem sam, i jak sprawdzałem kod, jest w dokumentacji (rozdział 10).
