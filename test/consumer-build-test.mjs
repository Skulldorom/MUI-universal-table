import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const root = process.cwd();
// Resolve npm's JS entrypoint and run it with the current Node binary. This
// avoids spawning npm.cmd/npx.cmd through a shell on Windows (which triggers
// Node's DEP0190 warning and shell-quoting hazards).
const npmCliPath =
  process.env.npm_execpath ||
  [
    join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    join(
      dirname(process.execPath),
      "..",
      "lib",
      "node_modules",
      "npm",
      "bin",
      "npm-cli.js",
    ),
  ].find((candidate) => existsSync(candidate));

if (!npmCliPath) {
  throw new Error("Could not locate npm-cli.js; run this test via an npm script.");
}

function runNpm(args, options) {
  return execFileSync(process.execPath, [npmCliPath, ...args], options);
}

const workspace = await mkdtemp(join(tmpdir(), "mui-universal-table-consumer-"));
const sourceDirectory = join(workspace, "src");

try {
  await writeFile(
    join(workspace, "package.json"),
    JSON.stringify(
      {
        private: true,
        type: "module",
        dependencies: {
          "@emotion/react": "^11.14.0",
          "@emotion/styled": "^11.14.1",
          "@mui/icons-material": "^9.2.0",
          "@mui/material": "^9.2.0",
          "mui-universal-table": "file:./package",
          "react": "^19.2.8",
          "react-dom": "^19.2.8",
        },
        devDependencies: {
          "@vitejs/plugin-react": "^6.1.1",
          vite: "^8.3.2",
        },
      },
      null,
      2,
    ),
  );
  await writeFile(
    join(workspace, "index.html"),
    '<div id="root"></div><script type="module" src="/src/main.jsx"></script>\n',
  );
  await writeFile(
    join(workspace, "vite.config.js"),
    'import { defineConfig } from "vite";\nimport react from "@vitejs/plugin-react";\nexport default defineConfig({ plugins: [react()] });\n',
  );
  await mkdir(sourceDirectory);
  await writeFile(
    join(sourceDirectory, "main.jsx"),
    'import React from "react";\nimport { createRoot } from "react-dom/client";\nimport { UniversalTable } from "mui-universal-table";\n\ncreateRoot(document.getElementById("root")).render(\n  <UniversalTable data={[]} headers={[]} name="Consumer smoke test" loading={false} />,\n);\n',
  );

  const packageOutput = runNpm(
    [
      "pack",
      "--json",
      "--ignore-scripts",
      "--pack-destination",
      workspace,
    ],
    { cwd: root, encoding: "utf8" },
  );
  const packageResult = JSON.parse(packageOutput);
  const packageInfo = Array.isArray(packageResult)
    ? packageResult[0]
    : Object.values(packageResult)[0];
  execFileSync("tar", [
    "-xzf",
    join(workspace, packageInfo.filename),
    "-C",
    workspace,
  ]);

  runNpm(["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: workspace,
    stdio: "inherit",
  });
  execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UniversalTable } from "mui-universal-table";

const markup = renderToStaticMarkup(
  React.createElement(UniversalTable, {
    data: [],
    headers: [],
    name: "Consumer runtime test",
    loading: false,
  }),
);
if (!markup.includes("Consumer runtime test")) {
  throw new Error("Packed UniversalTable did not render expected SSR output");
}
console.log("Packed package production runtime execution passed.");
`,
    ],
    { cwd: workspace, env: { ...process.env, NODE_ENV: "production" }, stdio: "inherit" },
  );
  const vitePackage = JSON.parse(
    await readFile(join(workspace, "node_modules", "vite", "package.json"), "utf8"),
  );
  const viteBin =
    typeof vitePackage.bin === "string"
      ? vitePackage.bin
      : vitePackage.bin.vite;
  execFileSync(
    process.execPath,
    [join(workspace, "node_modules", "vite", viteBin), "build"],
    { cwd: workspace, stdio: "inherit" },
  );

  const assetsDirectory = join(workspace, "dist", "assets");
  for (const asset of await readdir(assetsDirectory)) {
    if (!asset.endsWith(".js")) continue;
    const output = await readFile(join(assetsDirectory, asset), "utf8");
    if (output.includes("jsxDEV") || output.includes("react/jsx-dev-runtime")) {
      throw new Error(`Consumer production bundle contains the development JSX runtime: ${asset}`);
    }
  }
} finally {
  await rm(workspace, { recursive: true, force: true });
}

console.log("Consumer production build passed with the packed package.");
