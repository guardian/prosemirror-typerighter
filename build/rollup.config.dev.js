import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import serve from "rollup-plugin-serve";
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
      commonjs(),
      serve({ port: 5000, contentBase: "pages/dist" })
    ]
  }
];
