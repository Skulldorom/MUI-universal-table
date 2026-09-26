import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { transformAsync } from "@babel/core";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf8"));

const peerDependencyExternals = [
  /^react(?:\/.*)?$/,
  /^react-dom(?:\/.*)?$/,
  /^@mui\/(?:.*)$/,
  /^@emotion\/(?:.*)$/,
  /^prop-types(?:\/.*)?$/,
];

const babel = () => ({
  name: "babel",
  async transform(code, id) {
    if (!id.endsWith(".js") && !id.endsWith(".jsx")) return null;

    const result = await transformAsync(code, {
      filename: id,
      babelrc: false,
      configFile: false,
      presets: [
        ["@babel/preset-env", { modules: false }],
        ["@babel/preset-react", { runtime: "automatic" }],
      ],
      sourceMaps: true,
    });

    return { code: result.code, map: result.map };
  },
});

export default [
  {
    input: "src/index.js",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
        exports: "named",
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
        exports: "named",
      },
    ],
    onwarn(warning, warn) {
      // Suppress "use client" directive warnings from MUI components
      if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
        return;
      }
      warn(warning);
    },
    plugins: [
      peerDepsExternal(),
      resolve({
        extensions: [".js", ".jsx"],
      }),
      babel(),
      commonjs(),
    ],
    external: (id) =>
      peerDependencyExternals.some((pattern) => pattern.test(id)),
  },
];
