import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
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

  const packageOutput = execFileSync(
    "npm",
    ["pack", "--json", "--ignore-scripts", "--pack-destination", workspace],
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

  execFileSync("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund"], {
    cwd: workspace,
    stdio: "inherit",
  });
  execFileSync("npx", ["vite", "build"], { cwd: workspace, stdio: "inherit" });

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
