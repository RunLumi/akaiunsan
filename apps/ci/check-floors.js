const fs = require("fs");
const path = require("path");

const summaryPath = path.join(process.env.GITHUB_WORKSPACE || "", "apps", "coverage", "coverage-summary.json");
if (!fs.existsSync(summaryPath)) {
  console.error("missing coverage json-summary at " + summaryPath);
  process.exit(1);
}

const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const total = summary.total;
const num = (p) => Number(p.pct || 0);

const floors = {
  overallLines: 50,
  dirs: [
    { re: /\/shared\//, name: "shared", lines: 80 },
    { re: /\/redux\//, name: "redux", lines: 80 },
    { re: /\/hooks\//, name: "hooks", lines: 80 },
  ],
};

const fail = (msg) => {
  console.error("coverage floor failed: " + msg);
  process.exit(1);
};

if (!total || typeof num(total.lines) !== "number") {
  fail("could not read total coverage row");
}

console.log(JSON.stringify({
  overall: { stmts: num(total.statements), br: num(total.branches), fn: num(total.functions), lines: num(total.lines) },
}));

if (num(total.lines) < floors.overallLines) {
  fail(`overall line coverage ${num(total.lines)}% below ${floors.overallLines}% floor`);
}

for (const dir of floors.dirs) {
  const rows = Object.entries(summary).filter(([p]) => dir.re.test(p));
  if (rows.length === 0) {
    fail(`no coverage rows matched ${dir.name} (regex ${dir.re})`);
  }
  const covered = rows.reduce((s, [, r]) => s + (r.lines.covered || 0), 0);
  const totalLines = rows.reduce((s, [, r]) => s + (r.lines.total || 0), 0);
  const linesPct = totalLines ? (covered / totalLines) * 100 : 0;
  console.log(`${dir.name}: ${rows.length} files, aggregate lines ${linesPct.toFixed(2)}%`);
  if (linesPct < dir.lines) {
    fail(`${dir.name} aggregate line coverage ${linesPct.toFixed(2)}% below ${dir.lines}% floor`);
  }
}

console.log("coverage floors OK");