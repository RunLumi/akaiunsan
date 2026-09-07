#!/usr/bin/env node
/**
 * Codemod: insert `: any` annotations for implicit-any errors (TS7006/TS7005/TS7031)
 * from `tsc --noEmit` output. Usage:
 *   yarn typecheck 2>&1 | grep "error TS" > /tmp/errs.txt && node scripts/codemod-implicit-any.mjs /tmp/errs.txt
 */
import fs from "fs";

const errFile = process.argv[2];
if (!errFile) {
  console.error("usage: node codemod-implicit-any.mjs <tsc-output-file>");
  process.exit(1);
}

const byFile = new Map();
for (const line of fs.readFileSync(errFile, "utf8").split("\n")) {
  const m = line.match(/^(.+?)\((\d+),(\d+)\): error (TS\d+):/);
  if (!m) continue;
  const [, file, lineNo, colNo, code] = m;
  if (!["TS7006", "TS7005", "TS7031"].includes(code)) continue;
  if (!byFile.has(file)) byFile.set(file, []);
  byFile.get(file).push({ line: Number(lineNo), col: Number(colNo), code });
}

let total = 0;
for (const [file, errs] of byFile) {
  let src = fs.readFileSync(file, "utf8");
  const lines = src.split("\n");
  // group by line, apply rightmost-first
  const byLine = new Map();
  for (const e of errs) {
    if (!byLine.has(e.line)) byLine.set(e.line, []);
    byLine.get(e.line).push(e);
  }
  for (const [lineNo, lineErrs] of [...byLine].sort((a, b) => b[0] - a[0])) {
    const text = lines[lineNo - 1];
    if (text === undefined) continue;
    // dedupe cols, rightmost first
    const cols = [...new Set(lineErrs.map((e) => e.col))].sort((a, b) => b - a);
    let out = text;
    for (const col of cols) {
      const e = lineErrs.find((x) => x.col === col);
      const idx = col - 1; // 0-based
      if (e.code === "TS7031") {
        // binding element inside destructuring: find matching close brace from col
        let depth = 0;
        let end = -1;
        for (let i = idx; i < out.length; i++) {
          if (out[i] === "{" || out[i] === "(") depth++;
          else if (out[i] === "}" || out[i] === ")") {
            depth--;
            if (depth === 0) { end = i; break; }
          }
        }
        if (end !== -1) {
          out = out.slice(0, end + 1) + ": any" + out.slice(end + 1);
          total++;
        }
      } else {
        // simple identifier param/variable: insert after identifier chars end
        let end = idx;
        while (end < out.length && /[A-Za-z0-9_$]/.test(out[end])) end++;
        if (end > idx) {
          out = out.slice(0, end) + ": any" + out.slice(end);
          total++;
        }
      }
    }
    lines[lineNo - 1] = out;
  }
  fs.writeFileSync(file, lines.join("\n"));
  console.log(`${file}: ${errs.length} annotations`);
}
console.log(`total annotations: ${total}`);
