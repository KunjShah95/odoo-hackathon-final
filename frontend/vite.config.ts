import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': '/src/components',
      '@styles': '/src/styles',
      '@utils': '/src/utils',
      '@types': '/src/types',
      '@constants': '/src/constants'
    }
  }
});