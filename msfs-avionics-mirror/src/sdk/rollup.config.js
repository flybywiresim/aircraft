import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';

export default [
  {
    input: 'build/index.js',
    output: {
      file: 'dist/msfssdk.js',
      format: 'iife',
      name: 'msfssdk'
    },
    plugins: [resolve()]
  },
  {
    input: "build/index.d.ts",
    output: [{ file: "dist/msfssdk.d.ts", format: "es" }],
    plugins: [dts()],
  }
]