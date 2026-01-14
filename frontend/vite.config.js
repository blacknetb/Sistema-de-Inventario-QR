import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  const isProduction = mode === "production";
  const isDevelopment = mode === "development";
  const backendUrl = env.VITE_API_URL || "http://localhost:3000";
  const useMockApi = env.VITE_USE_MOCK_API === "true";
  
  return {
    base: '/',
    
    publicDir: 'public',
    
    plugins: [
      react({
        babel: {
          plugins: []
        },
        jsxImportSource: 'react',
        jsxRuntime: 'automatic'
      }),
      
      env.VITE_FEATURE_PWA === "true" && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: env.VITE_APP_NAME || 'Sistema de Inventario QR',
          short_name: env.VITE_PWA_SHORT_NAME || 'Inventario QR',
          description: env.VITE_APP_DESCRIPTION || 'Sistema de gestión de inventario',
          theme_color: env.VITE_PWA_THEME_COLOR || '#3B82F6',
          background_color: env.VITE_PWA_BACKGROUND_COLOR || '#FFFFFF',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            }
          ]
        }
      })
    ].filter(Boolean),
    
    server: {
      port: Number.parseInt(env.VITE_PORT) || 5173,
      host: true,
      open: true,
      cors: true,
      
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path
        }
      }
    },
    
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      target: 'es2020',
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
            'ui-vendor': ['clsx', 'prop-types']
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-router-dom'],
      exclude: ['@vitejs/plugin-react']
    },
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@pages': path.resolve(__dirname, './src/pages'),
        '@layouts': path.resolve(__dirname, './src/layouts'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@api': path.resolve(__dirname, './src/api'),
        '@context': path.resolve(__dirname, './src/context'),
        '@assets': path.resolve(__dirname, './src/assets'),
        '@styles': path.resolve(__dirname, './src/styles')
      }
    },
    
    css: {
      modules: {
        localsConvention: 'camelCase'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `@import "${path.resolve(__dirname, './src/styles/variables.css')}";`
        }
      }
    },
    
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __APP_ENV__: JSON.stringify(mode),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'Sistema de Inventario QR'),
      __API_URL__: JSON.stringify(backendUrl),
      __MOCK_API__: JSON.stringify(useMockApi)
    }
  };
});