import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import scss from "rollup-plugin-scss";
import babel from "@rollup/plugin-babel";
import typescript from '@rollup/plugin-typescript';

const plugins = [
  typescript(),
  scss({
    output: "dist/index.css"
  }),
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
  },
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
      resolve({ browser: true }),
      typescript(),
      scss({
        output: "pages/dist/styles.css"
      }),
      commonjs()
    ]
  }
];
