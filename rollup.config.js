import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import scss from "rollup-plugin-scss";
import babel from "rollup-plugin-babel";
import typescript from "rollup-plugin-typescript";

export default [
  {
    input: "src/ts/index.ts",
    output: {
      file: "dist/validation.js",
      format: "es"
    },
    plugins: [
      typescript(),
      scss({
        output: "dist/validation.css"
      }),
      babel()
    ]
  },
  {
    // Github pages
    input: "pages/index.ts",
    output: {
      file: "pages/dist/bundle.js",
      format: "iife",
      name: "Pages"
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
