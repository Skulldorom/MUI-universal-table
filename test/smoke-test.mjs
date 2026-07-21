import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const requiredFiles = [
  "dist/index.cjs",
  "dist/index.cjs.map",
  "dist/index.esm.js",
  "dist/index.esm.js.map",
  "src/index.d.ts",
  "README.md",
  "LICENSE",
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Expected release file is missing: ${file}`);
  }
}

const esmEntry = await import(join(root, "dist/index.esm.js"));
if (typeof esmEntry.default !== "function") {
  throw new Error("ESM default export is not a component function");
}
if (typeof esmEntry.UniversalTable !== "function") {
  throw new Error("ESM UniversalTable named export is not a component function");
}

const require = createRequire(import.meta.url);
const cjsEntry = require(join(root, "dist/index.cjs"));
if (typeof cjsEntry.default !== "function") {
  throw new Error("CommonJS default export is not a component function");
}
if (typeof cjsEntry.UniversalTable !== "function") {
  throw new Error("CommonJS UniversalTable named export is not a component function");
}

const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
const packOutput = execFileSync(
  "npm",
  ["pack", "--dry-run", "--json", "--ignore-scripts"],
  { encoding: "utf8" },
);
const [packInfo] = JSON.parse(packOutput);
const packedFiles = new Set(packInfo.files.map((file) => file.path));

for (const file of packageJson.files) {
  const normalized = file.replace(/\/$/, "");
  const hasPackedFile =
    packedFiles.has(normalized) ||
    [...packedFiles].some((packedFile) => packedFile.startsWith(`${normalized}/`));

  if (!hasPackedFile) {
    throw new Error(`package.json files entry is not included by npm pack: ${file}`);
  }
}

for (const file of requiredFiles) {
  if (!packedFiles.has(file)) {
    throw new Error(`Expected release file is missing from npm pack: ${file}`);
  }
}

console.log("Smoke test passed: package entrypoints load and npm pack contains release files.");
