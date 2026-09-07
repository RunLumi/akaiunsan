// tsc emits require('./x.ts') verbatim; dist only contains .js files.
// Rewrite the extensions post-build so `node dist/app.js` resolves.
const fs = require('fs');
const path = require('path');

(function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.endsWith('.js')) {
      const src = fs.readFileSync(full, 'utf8');
      const out = src.replace(/require\((['"])(\.[^'"]*)\.ts\1\)/g, "require($1$2.js$1)");
      if (out !== src) fs.writeFileSync(full, out);
    }
  }
})(path.join(__dirname, '..', 'dist'));
// runtime assets tsc does not emit
for (const asset of ['config', 'mail-template']) {
  fs.cpSync(path.join(__dirname, '..', asset), path.join(__dirname, '..', 'dist', asset), { recursive: true });
}
console.log('dist requires fixed');
