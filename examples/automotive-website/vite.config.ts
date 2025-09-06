import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(process.cwd(), './src')
    }
  },
  build: {
    outDir: 'dist/public',
    lib: {
      entry: resolve(process.cwd(), 'src/components/index.ts'),
      name: 'Components',
      formats: ['umd'],
      fileName: () => 'components.js'
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
});
