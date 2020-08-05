import scss from "rollup-plugin-scss";
import babel from "@rollup/plugin-babel";
import typescript from "@rollup/plugin-typescript";

const plugins = [
  typescript({ noEmitOnError: false }),
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
  }
];
