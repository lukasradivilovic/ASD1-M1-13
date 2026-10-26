// Uruchomienie: node tests/run-tests.js
// Wypisuje tabelę testów i zapisuje wyniki do tests/wyniki-testow.json
const fs = require('fs');
const path = require('path');
const { runTests } = require('./test-cases.js');

const results = runTests();
for (const r of results) {
  console.log(`${r.status === 'OK' ? '[OK]  ' : '[BŁĄD]'} ${r.id} ${r.group} | ${r.name}`);
  console.log(`        wejście:    ${r.input}`);
  console.log(`        oczekiwane: ${r.expected}`);
  console.log(`        uzyskane:   ${r.got}`);
}
const ok = results.filter(r => r.status === 'OK').length;
console.log(`\nWynik: ${ok}/${results.length} testów zaliczonych.`);
fs.writeFileSync(path.join(__dirname, 'wyniki-testow.json'),
  JSON.stringify({ date: new Date().toISOString(), passed: ok, total: results.length, results }, null, 2), 'utf8');
process.exit(ok === results.length ? 0 : 1);
