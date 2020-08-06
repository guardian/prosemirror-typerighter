import babel from "@rollup/plugin-babel";
import { defaultPlugins } from "./rollup.common.js";

const plugins = [
  ...defaultPlugins,
  babel()
];

export default [
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs"
    },
    plugins
  },
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/index.m.js",
      format: "es"
    },
    plugins
  }
];
