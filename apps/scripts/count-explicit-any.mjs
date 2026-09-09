#!/usr/bin/env node
// any-ratchet (Phase 3, plan §140): counts explicit `any` occurrences in
// production source (src, excluding __tests__ and test-utils) using the same
// pattern the plan measured:  `: any` | `as any` | `any[`
//
// Usage:
//   node scripts/count-explicit-any.mjs                 # print per-file table
//   node scripts/count-explicit-any.mjs --check         # fail over the cap in ci/any-budget.json
//   node scripts/count-explicit-any.mjs --check --max N # fail over an explicit cap
//
// When the count drops (type-safety wins land), LOWER the cap in
// ci/any-budget.json in the same commit. The cap must never increase.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "src");
const budgetFile = path.join(root, "ci", "any-budget.json");
const PATTERN = /(: any\b|as any\b|any\[)/g;

const shouldCount = (rel) =>
  !rel.includes("__tests__") && !rel.includes("test-utils");

const walk = (dir, acc = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (/\.(ts|tsx)$/.test(e.name) && shouldCount(path.relative(srcDir, p))) acc.push(p);
  }
  return acc;
};

const rows = walk(srcDir)
  .map((file) => {
    const hits = fs.readFileSync(file, "utf8").match(PATTERN)?.length ?? 0;
    return { file: path.relative(root, file), hits };
  })
  .filter((r) => r.hits > 0)
  .sort((a, b) => b.hits - a.hits);

const total = rows.reduce((s, r) => s + r.hits, 0);
const args = process.argv.slice(2);
const check = args.includes("--check");
const maxIdx = args.indexOf("--max");
const cap =
  maxIdx !== -1 ? Number(args[maxIdx + 1]) : JSON.parse(fs.readFileSync(budgetFile, "utf8")).explicitAny;

console.log(`explicit-any count (production src): ${total} (cap ${cap})`);
for (const r of rows.slice(0, 15)) console.log(`  ${String(r.hits).padStart(3)}  ${r.file}`);
if (rows.length > 15) console.log(`  ... ${rows.length - 15} more files`);

if (check && total > cap) {
  console.error(
    `explicit-any budget exceeded: ${total} > ${cap}. ` +
      "Fix the regressions, or lower the cap in ci/any-budget.json in the same commit as your type-safety win."
  );
  process.exit(1);
}
if (check && total < cap) {
  console.log(
    `budget headroom available: ${cap - total}. ` +
      "Lower explicitAny in ci/any-budget.json to lock the win in."
  );
}
