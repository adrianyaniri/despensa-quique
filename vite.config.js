import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
    {
      name: 'dev-clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const pathname = req.url.split('?')[0];
          const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';

          if (pathname === '/precios' || pathname === '/precios/') {
            req.url = '/precios/index.html' + query;
          } else if (pathname === '/admin' || pathname === '/admin/') {
            req.url = '/index.html' + query;
          }
          next();
        });
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        precios: resolve(import.meta.dirname, 'precios/index.html'),
      },
    },
  },
});
