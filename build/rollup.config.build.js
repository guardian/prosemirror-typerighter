import babel from "@rollup/plugin-babel";
import replace from "@rollup/plugin-replace";

import { defaultPlugins } from "./rollup.common.js";

const plugins = [
  ...defaultPlugins,
  babel(),
  replace({
    "process.env.NODE_ENV": JSON.stringify("production")
  })
];

export default [
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs"
    },
    plugins,
    external: ["snarkdown", "prosemirror-changeset"]
  },
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/index.m.js",
      format: "es"
    },
    plugins,
    external: ["snarkdown", "prosemirror-changeset"]
  }
];
