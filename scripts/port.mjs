#!/usr/bin/env node
/**
 * port.mjs — converts a Claude-artifact JSX file into the deployable component.
 *
 * Usage:
 *   npm run port                      → looks for ./NutritionDashboard.jsx in project root
 *   npm run port -- path/to/file.jsx → explicit path
 *
 * It applies exactly two mechanical transforms:
 *   1. Prepends `"use client";` (required by Next.js App Router)
 *   2. Rewrites every direct Anthropic API URL to the secure local proxy `/api/analyze`
 *      (the proxy adds your API key server-side, so the key never reaches the browser)
 *
 * Nothing else is changed — the artifact file and the deployed component stay
 * line-for-line identical apart from those two edits.
 */
import { readFileSync, writeFileSync, existsSync, renameSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const argPath = process.argv[2];
const src = resolve(argPath || "./NutritionDashboard.jsx");
const dest = resolve("./components/NutritionDashboard.jsx");

if (!existsSync(src)) {
  console.error(`✗ Source not found: ${src}
  Save the newest artifact file as NutritionDashboard.jsx in the project root, then re-run.`);
  process.exit(1);
}

let code = readFileSync(src, "utf8");

// transform 1: use client directive
if (!code.trimStart().startsWith('"use client"')) {
  code = '"use client";\n\n' + code;
}

// transform 2: route ALL direct Anthropic calls through the secure proxy
const before = (code.match(/api\.anthropic\.com/g) || []).length;
code = code.replaceAll("https://api.anthropic.com/v1/messages", "/api/analyze");

// safety: warn if any anthropic reference survives (unexpected pattern)
const leftover = (code.match(/api\.anthropic\.com/g) || []).length;

// backup previous component, then write
mkdirSync(resolve("./components"), { recursive: true });
if (existsSync(dest)) renameSync(dest, dest + ".bak");
writeFileSync(dest, code);

console.log(`✓ Ported ${src.split("/").pop()} → components/NutritionDashboard.jsx`);
console.log(`  • "use client" header: ensured`);
console.log(`  • API calls rewritten to /api/analyze: ${before}`);
if (leftover) console.warn(`  ⚠ ${leftover} anthropic reference(s) not rewritten — check manually`);
console.log(`  • previous version backed up to components/NutritionDashboard.jsx.bak

Next: git add . && git commit -m "update dashboard" && git push`);
