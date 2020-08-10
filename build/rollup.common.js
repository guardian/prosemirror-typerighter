import { nodeResolve } from "@rollup/plugin-node-resolve";
import alias from "@rollup/plugin-alias";
import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import sass from "@csstools/postcss-sass";

export const defaultPlugins = [
  typescript(),
  postcss({
    extract: true,
    plugins: [sass]
  }),
  nodeResolve({ browser: true }),
  alias({
    entries: {
      react: "preact/compat",
      "react-dom": "preact/compat",
      '@material-ui/icons': '@material-ui/icons/esm',
    }
  }),
];
