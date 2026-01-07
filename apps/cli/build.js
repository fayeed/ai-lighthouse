import * as esbuild from 'esbuild';
import { readFileSync, chmodSync } from 'fs';
import { readdir } from 'fs/promises';
import path from 'path';

// Get all node_modules to mark as external
const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
const external = [
  ...Object.keys(packageJson.dependencies || {}),
  ...Object.keys(packageJson.devDependencies || {}),
];

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'es2022',
  format: 'esm',
  outdir: 'dist',
  external,
  banner: {
    js: '#!/usr/bin/env node',
  },
  outExtension: { '.js': '.js' },
});

// Make executable
chmodSync('dist/index.js', '755');

console.log('✅ Build complete!');
