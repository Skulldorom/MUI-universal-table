import { createRequire } from "node:module";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
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

const distributableJavaScript = ["dist/index.cjs", "dist/index.esm.js"];

for (const file of distributableJavaScript) {
  const bundle = await readFile(join(root, file), "utf8");

  if (bundle.includes("React.createElement")) {
    throw new Error(
      `${file} contains an unbound React.createElement call; use the automatic JSX runtime`,
    );
  }
  if (bundle.includes("jsxDEV") || bundle.includes("react/jsx-dev-runtime")) {
    throw new Error(`${file} contains the development JSX runtime`);
  }
  if (!bundle.includes("react/jsx-runtime")) {
    throw new Error(`${file} does not reference the automatic JSX runtime`);
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
const packResult = JSON.parse(packOutput);
const packInfo = Array.isArray(packResult)
  ? packResult[0]
  : Object.values(packResult)[0];
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

const packageTempDirectory = await mkdtemp(join(tmpdir(), "mui-universal-table-pack-"));
const packageExtractDirectory = await mkdtemp(
  join(tmpdir(), "mui-universal-table-extract-"),
);
try {
  const packageOutput = execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", packageTempDirectory],
    { cwd: root, encoding: "utf8" },
  );
  const packageResult = JSON.parse(packageOutput);
  const packageInfo = Array.isArray(packageResult)
    ? packageResult[0]
    : Object.values(packageResult)[0];
  const packedTarball = join(packageTempDirectory, packageInfo.filename);
  execFileSync("tar", ["-xzf", packedTarball, "-C", packageExtractDirectory]);

  const packedJavaScript = packageInfo.files
    .map(({ path }) => path)
    .filter((file) => file.endsWith(".js"));

  for (const file of packedJavaScript) {
    const packedBundle = await readFile(
      join(packageExtractDirectory, "package", file),
      "utf8",
    );
    if (
      packedBundle.includes("jsxDEV") ||
      packedBundle.includes("react/jsx-dev-runtime")
    ) {
      throw new Error(`Packed ${file} contains the development JSX runtime`);
    }
  }

  for (const file of distributableJavaScript) {
    const packedBundle = await readFile(
      join(packageExtractDirectory, "package", file),
      "utf8",
    );
    if (!packedBundle.includes("react/jsx-runtime")) {
      throw new Error(`Packed ${file} does not reference the automatic JSX runtime`);
    }
  }
} finally {
  await Promise.all([
    rm(packageTempDirectory, { recursive: true, force: true }),
    rm(packageExtractDirectory, { recursive: true, force: true }),
  ]);
}

console.log(
  "Smoke test passed: production entrypoints load and packed artifacts use the automatic JSX runtime.",
);
