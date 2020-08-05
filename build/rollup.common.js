import typescript from "@rollup/plugin-typescript";
import postcss from 'rollup-plugin-postcss'
import sass from '@csstools/postcss-sass';

export const defaultPlugins = [
  typescript({ noEmitOnError: false }),
  postcss({
    extract: true,
    plugins: [sass]
  })
]
