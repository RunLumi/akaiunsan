#!/usr/bin/env node
// Incremental ESM converter — converts the require/module.exports forms used
// in this codebase to ESM imports/exports. Line-anchored on purpose: no
// unbounded multiline regex (a previous attempt corrupted files that way).
//
// Usage: node scripts/esmify.js <glob-relative-dir> [dir2 ...]
const fs = require('fs');
const path = require('path');

const dirs = process.argv.slice(2);
if (!dirs.length) {
  console.error('usage: node scripts/esmify.js <dir> ...');
  process.exit(1);
}

const files = [];
for (const dir of dirs) {
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (['node_modules', 'dist'].includes(e.name)) continue;
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.ts')) files.push(full);
    }
  })(dir);
}

const manual = [];
let convertedImports = 0, convertedExports = 0;

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8');
  const rel = path.relative(process.cwd(), file);
  const imports = [];

  // ---- 1. dynamic config require -> cwd-relative fs read -------------------
  s = s.replace(
    /(?:const|let|var) (\w+) = require\(`[^`]*config\/\$\{NODE_ENV\}\.json`\);?/g,
    (m, name) => {
      if (!imports.includes("import fs from 'fs';")) imports.push("import fs from 'fs';");
      return `const ${name} = JSON.parse(fs.readFileSync(\`config/\${NODE_ENV}.json\`, 'utf8'));`;
    }
  );

  // ---- 2. static requires -> imports (line-anchored, chained forms first) --
  const lines = s.split('\n');
  const outLines = [];
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // chained: const { a } = require('sequelize').Op;
    let m = line.match(/^(?:const|let|var) (\{[^}]*\}) = require\((['"][^'"]+['"])\)\.(\w+);?\s*$/);
    if (m) {
      const [, binding, , prop] = m;
      const tmp = `__esModuleChain_${prop}`;
      imports.push(`import ${tmp} from 'sequelize';`);
      outLines.push(`const ${binding} = (${tmp} as any).${prop};`);
      convertedImports++;
      continue;
    }
    // chained: const model = require('../models/index.ts').sequelize;
    m = line.match(/^(?:const|let|var) (\w+) = require\((['"][^'"]+['"])\)\.(\w+);?\s*$/);
    if (m) {
      const [, name, quoted, prop] = m;
      const spec = quoted.slice(1, -1);
      const base = `__interop_${name}`;
      imports.push(`import ${base} from '${spec}';`);
      outLines.push(`const ${name} = (${base} as any).${prop};`);
      convertedImports++;
      continue;
    }
    // single-line: const X = require('pkg'); / const { a, b } = require('pkg');
    m = line.match(/^(?:const|let|var) (\{[^}]*\}|[A-Za-z_$][\w$]*) = require\((['"][^'"]+['"])\);?\s*$/);
    if (m && !/\$\{/.test(m[2])) {
      const [, binding, quoted] = m;
      const spec = quoted.slice(1, -1);
      const isDefault = !binding.startsWith('{');
      imports.push(`import ${binding.replace(/\s+/g, ' ')} from '${spec}';`);
      convertedImports++;
      continue;
    }
    // multi-line destructure: join up to 8 following lines until `} = require(`
    if (/^(?:const|let|var) \{\s*$/.test(line) || /^(?:const|let|var) \{[^}]*$/.test(line)) {
      let joined = line;
      let j = i;
      let done = false;
      for (let k = 1; k <= 8 && i + k < lines.length; k++) {
        joined += ' ' + lines[i + k].trim();
        if (/\} = require\((['"][^'"]+['"])\);?\s*$/.test(joined) && !/\$\{/.test(joined)) {
          j = i + k;
          done = true;
          break;
        }
      }
      if (done) {
        const mm = joined.match(/^(?:const|let|var) (\{.*\}) = require\((['"][^'"]+['"])\);?$/);
        if (mm) {
          imports.push(`import ${mm[1].replace(/\s+/g, ' ')} from '${mm[2].slice(1, -1)}';`);
          convertedImports++;
          i = j;
          continue;
        }
      }
    }
    // callable require (route registration): require('./x.ts')(app);
    m = line.match(/^require\((['"][^'"]+['"])\)\(([^)]*)\);?\s*$/);
    if (m) {
      const [, quoted, args] = m;
      const spec = quoted.slice(1, -1);
      const safe = 'r_' + path.basename(spec, '.ts').replace(/[^A-Za-z0-9_]/g, '_');
      imports.push(`import ${safe} from '${spec}';`);
      outLines.push(`${safe}(${args});`);
      convertedImports++;
      continue;
    }
    outLines.push(line);
  }
  s = outLines.join('\n');

  // dedupe fs import if file also had it, drop leftover `const fs = require('fs')`
  const uniq = [...new Set(imports)];
  if (uniq.some((i) => i.startsWith('import fs '))) {
    s = s.replace(/^const fs = require\('fs'\);\s*\n/gm, '');
    s = s.replace(/^const path = require\('path'\);\s*\n/gm, '');
  }

  // ---- 3. exports -----------------------------------------------------------
  // identifier default
  s = s.replace(/^module\.exports = ([A-Za-z_$][\w$]*);\s*$/m, (m, id) => {
    convertedExports++;
    return `export default ${id};`;
  });
  // function/arrow default
  s = s.replace(/^module\.exports = (async )?(function\b|\(?[A-Za-z_$][\w$]*\s*=>)/m, (m, asy, kind) => {
    convertedExports++;
    return `export default ${asy || ''}${kind.startsWith('function') ? kind : kind}`;
  });
  // object of names (single or multiline, entries are identifiers or a:b)
  s = s.replace(/^module\.exports = \{([^{}]*)\};?\s*$/m, (m, body) => {
    const parts = body.split(',').map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean);
    const names = parts.map((p) => {
      const mm = p.match(/^([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)$/);
      if (mm) return `${mm[2]} as ${mm[1]}`;
      return /^[A-Za-z_$][\w$]*$/.test(p) ? p : null;
    });
    if (names.some((n) => n === null)) return m;
    convertedExports++;
    return `export { ${names.join(', ')} };`;
  });
  // multiline object-of-names export: module.exports = {\n a,\n b,\n};
  if (/^module\.exports = \{\s*$/m.test(s)) {
    const start = s.search(/^module\.exports = \{\s*$/m);
    const end = s.indexOf('};', start);
    if (end !== -1) {
      const body = s.slice(start, end).replace(/^module\.exports = \{/, '').trim();
      const parts = body.split(',').map((p) => p.trim().replace(/\s+/g, ' ')).filter(Boolean);
      const names = parts.map((p) => {
        const mm = p.match(/^([A-Za-z_$][\w$]*)\s*:\s*([A-Za-z_$][\w$]*)$/);
        if (mm) return `${mm[2]} as ${mm[1]}`;
        return /^[A-Za-z_$][\w$]*$/.test(p) ? p : null;
      });
      if (!names.some((n) => n === null)) {
        s = s.slice(0, start) + `export { ${names.join(', ')} };` + s.slice(end + 2);
        convertedExports++;
      }
    }
  }

  if (/module\.exports/.test(s) || /= require\(|^require\(/m.test(s)) {
    manual.push(rel);
  }

  const final = uniq.length ? uniq.join('\n') + '\n' + s : s;
  fs.writeFileSync(file, final);
}

console.log(JSON.stringify({ files: files.length, convertedImports, convertedExports, manual }, null, 2));
