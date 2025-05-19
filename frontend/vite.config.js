// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss({
      /* inline your Tailwind config here: */
      config: {
        content: [
          './index.html',
          './src/**/*.{js,jsx,ts,tsx}',
        ],
        theme: {
          extend: {
            colors: {
              // now you can use `bg-pet-white` (or `bg-default-white`)
              'pet-white': '#FFFDE7',

            },
          },
        },
        // you can still add plugins here if you need them:
        plugins: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
