import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    base: './',
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY),
      'process.env.OPENAI_API_KEY': JSON.stringify(env.VITE_OPENAI_API_KEY),
      'process.env.AZURE_API_KEY': JSON.stringify(env.VITE_AZURE_API_KEY),
      'process.env.AZURE_ENDPOINT': JSON.stringify(env.VITE_AZURE_ENDPOINT),
      'process.env.DEEPSEEK_API_KEY': JSON.stringify(env.VITE_DEEPSEEK_API_KEY),
      'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
    }
  }
});