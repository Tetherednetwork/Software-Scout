import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Replaced `process.cwd()` with `''` which resolves to the current
  // working directory and avoids a TypeScript type error with `process`.
  const env = loadEnv(mode, '', '');
  return {
    base: '/',
    plugins: [react()],
    // Supabase keys removed in favor of Firebase
  }
}
);