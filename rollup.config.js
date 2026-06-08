import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
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
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        extensions: [".js", ".jsx"],
        presets: ["@babel/preset-env", "@babel/preset-react"],
      }),
      commonjs(),
    ],
    external: (id) =>
      peerDependencyExternals.some((pattern) => pattern.test(id)),
  },
];
