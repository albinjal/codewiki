import { build } from "bun";
import { writeFileSync, chmodSync, mkdirSync } from "fs";

mkdirSync("bin", { recursive: true });

const result = await build({
  entrypoints: ["src/cli.ts"],
  target: "node",
  packages: "external",
});

if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

const output = result.outputs[0];
const code = await output.text();
writeFileSync("bin/codewiki", `#!/usr/bin/env node\n${code}`);
chmodSync("bin/codewiki", 0o755);
console.log(`Built bin/codewiki (${(code.length / 1024).toFixed(1)} KB)`);
