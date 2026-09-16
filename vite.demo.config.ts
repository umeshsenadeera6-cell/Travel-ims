// Builds a single self-contained HTML file (used for the hosted live demo).
import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import base from './vite.config';

export default mergeConfig(base, defineConfig({ plugins: [viteSingleFile()], build: { outDir: 'dist-demo' } }));
