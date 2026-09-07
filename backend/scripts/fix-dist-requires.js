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

// Generate version.json for healthcheck inspection
try {
  const { execSync } = require('child_process');
  let commit = process.env.GIT_COMMIT || process.env.GIT_COMMIT_SHA;
  let branch = process.env.GIT_BRANCH;
  try {
    if (!commit) commit = execSync('git rev-parse --short HEAD', { cwd: path.join(__dirname, '..') }).toString().trim();
    if (!branch) branch = execSync('git rev-parse --abbrev-ref HEAD', { cwd: path.join(__dirname, '..') }).toString().trim();
  } catch (e) {}

  let version = '1.0.0';
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    version = pkg.version || '1.0.0';
  } catch (e) {}

  const versionData = {
    version,
    commit: commit || 'unknown',
    branch: branch || 'unknown',
    buildTime: new Date().toISOString()
  };

  fs.writeFileSync(path.join(__dirname, '..', 'dist', 'version.json'), JSON.stringify(versionData, null, 2));
  fs.writeFileSync(path.join(__dirname, '..', 'version.json'), JSON.stringify(versionData, null, 2));
} catch (e) {
  console.warn('version.json generation warning:', e.message);
}

console.log('dist requires fixed and version.json written');
