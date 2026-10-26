// Zapisuje wyniki porównania kosztu do docs/wyniki-porownania.json
// Uruchomienie: node tools/export-results.js
const fs = require('fs');
const path = require('path');
const Compare = require('../src/compare.js');

const out = {
  seed: 2026,
  random1D: Compare.run1D({ seed: 2026 }),
  worst1D: Compare.run1D({ seed: 2026, worst: true }),
  matrix2D: Compare.run2D({ seed: 2026 })
};
fs.mkdirSync(path.join(__dirname, '..', 'docs'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'docs', 'wyniki-porownania.json'), JSON.stringify(out, null, 2), 'utf8');
console.table(out.random1D);
console.table(out.worst1D);
console.table(out.matrix2D);
