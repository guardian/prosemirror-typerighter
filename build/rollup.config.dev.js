import commonjs from "@rollup/plugin-commonjs";
import replace from "@rollup/plugin-replace";
import serve from "rollup-plugin-serve";
import { nodeResolve } from "@rollup/plugin-node-resolve";

import { defaultPlugins } from "./rollup.common.js";

export default [
  {
    // Github pages
    input: "pages/index.ts",
    output: {
      file: "pages/dist/bundle.js",
      format: "iife",
      name: "Pages",
      sourcemap: true
    },
    plugins: [
      ...defaultPlugins,
      nodeResolve({ browser: true }),
      replace({
        "process.env.NODE_ENV": JSON.stringify("development")
      }),
      commonjs(),
      serve({ port: 5000, contentBase: "pages/dist" })
    ]
  }
];
