import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";
import scss from "rollup-plugin-scss";
import typescript from "@rollup/plugin-typescript";
import serve from "rollup-plugin-serve";

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
      resolve({ browser: true }),
      typescript({ noEmitOnError: false }),
      scss({
        output: "pages/dist/styles.css"
      }),
      commonjs(),
      serve({ port: 5000, contentBase: "pages/dist" })
    ]
  }
];
