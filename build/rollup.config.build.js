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

const externalModules = [
  "prosemirror-example-setup",
  "prosemirror-history",
  "prosemirror-keymap",
  "prosemirror-menu",
  "prosemirror-model",
  "prosemirror-schema-basic",
  "prosemirror-state",
  "prosemirror-test-builder",
  "prosemirror-view",
  "prosemirror-transform",
  "preact",
  "prosemirror-tables",
  "prosemirror-utils",
  "uuid",
  "prop-types",
  "react-is",
  "hoist-non-react-statics",
  "diff"
];

const external = id =>
  /(lodash)/.test(id) || externalModules.includes(id);

export default [
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/index.js",
      format: "cjs"
    },
    plugins,
    external
  },
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/index.m.js",
      format: "es"
    },
    plugins,
    external
  }
];
