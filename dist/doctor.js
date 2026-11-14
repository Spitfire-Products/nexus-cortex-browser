// Built 2026-11-14T02:29:58.011Z from nexus-terminal/workers/nexus-browser/src/mcp.ts — do not edit; rebuild.
import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);
import {
  checkAll,
  installAll,
  readiness
} from "./chunk-SF6E3HBU.js";
import "./chunk-ZKJXZKW3.js";

// src/doctor.ts
var install = process.argv.includes("--install");
if (install) {
  const r = await installAll({ interactive: !!process.stdin.isTTY && !!process.stdout.isTTY, log: (l) => console.log(l) });
  for (const d of r.done) console.log(`  installed: ${d}`);
  for (const m of r.manual) console.log(`  NOT installed \u2014 ${m}`);
}
var rows = checkAll();
var pad = (s, n) => s.length > n ? s.slice(0, n - 1) + "\u2026" : s.padEnd(n);
console.log(`
nexus-browser doctor \u2014 ${process.platform}
`);
for (const r of rows) console.log(`${r.ok ? "  ok " : r.optional ? "  -- " : "  NO "} ${pad(r.area, 11)} ${pad(r.item, 46)} ${r.ok ? "" : r.fix ?? ""}`);
var ready = readiness(rows);
console.log(`
core tools: ${ready.core ? "READY" : "NOT READY"} \xB7 sandbox backend: ${ready.sandbox ? "READY" : "NOT READY"}${install ? "" : " \xB7 run with --install to install everything"}`);
process.exit(ready.core ? 0 : 1);
//# sourceMappingURL=doctor.js.map
