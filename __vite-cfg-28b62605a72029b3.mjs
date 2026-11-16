import { mergeConfig, defineConfig } from 'vite';
import base from './vite.config.js';
export default defineConfig(async (env) => mergeConfig(typeof base === 'function' ? await base(env) : await base, { cacheDir: "/tmp/tohong-vite-MvIvUx" }));
