import { build } from 'esbuild'
import packageJSON from './package.json' with { type: "json" }
import { dtsPlugin } from 'esbuild-plugin-d.ts';

build({
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  minify: true,
  platform: 'node',
  target: 'es2020',
  external: Object.keys(packageJSON.dependencies || {}),
  plugins: [dtsPlugin({
    outDir: 'dist/',
    experimentalBundling: true,
  })]
}).catch(() => process.exit(1))