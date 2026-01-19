import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  
  const isProduction = mode === "production";
  const isDevelopment = mode === "development";
  const backendUrl = env.VITE_API_URL || "http://localhost:3000";
  const useMockApi = env.VITE_USE_MOCK_API === "true";
  const analyzeBundle = env.VITE_BUILD_ANALYZE === "true";
  
  return {
    base: env.VITE_DEPLOY_BASE_PATH || '/',
    
    publicDir: 'public',
    
    plugins: [
      react({
        babel: {
          plugins: [
            'babel-plugin-macros',
            [
              '@emotion/babel-plugin-jsx-pragmatic',
              {
                export: 'jsx',
                import: '__cssprop',
                module: '@emotion/react'
              }
            ]
          ]
        },
        jsxImportSource: '@emotion/react',
        jsxRuntime: 'automatic'
      }),
      
      env.VITE_PWA_ENABLED === "true" && VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico', 
          'apple-touch-icon.png', 
          'masked-icon.svg',
          'robots.txt',
          'sitemap.xml'
        ],
        manifest: {
          name: env.VITE_APP_NAME || 'Sistema de Inventario QR',
          short_name: env.VITE_PWA_SHORT_NAME || 'Inventario QR',
          description: env.VITE_APP_DESCRIPTION || 'Sistema de gestión de inventario con códigos QR',
          theme_color: env.VITE_PWA_THEME_COLOR || '#3B82F6',
          background_color: env.VITE_PWA_BACKGROUND_COLOR || '#FFFFFF',
          display: env.VITE_PWA_DISPLAY || 'standalone',
          orientation: env.VITE_PWA_ORIENTATION || 'portrait',
          scope: env.VITE_PWA_SCOPE || '/',
          start_url: env.VITE_PWA_START_URL || '/',
          lang: env.VITE_PWA_LANG || 'es-ES',
          categories: [env.VITE_PWA_CATEGORY || 'business'],
          dir: env.VITE_PWA_DIR || 'ltr',
          icons: [
            {
              src: env.VITE_PWA_ICON_192 || '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: env.VITE_PWA_ICON_512 || '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: env.VITE_PWA_ICON_MASKABLE || '/maskable-icon.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: env.VITE_PWA_ICON_APPLE || '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-desktop.png',
              sizes: '1280x720',
              type: 'image/png',
              form_factor: 'wide'
            },
            {
              src: '/screenshot-mobile.png',
              sizes: '750x1334',
              type: 'image/png',
              form_factor: 'narrow'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,ttf,json}'],
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
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30
                }
              }
            },
            {
              urlPattern: /api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                networkTimeoutSeconds: 10,
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24
                }
              }
            }
          ],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB
        },
        devOptions: {
          enabled: false,
          type: 'module',
          navigateFallback: 'index.html'
        }
      }),
      
      analyzeBundle && visualizer({
        filename: './dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true
      })
    ].filter(Boolean),
    
    server: {
      port: Number.parseInt(env.VITE_PORT) || 5173,
      host: env.VITE_HOST || true,
      open: env.VITE_OPEN_BROWSER !== 'false',
      cors: true,
      strictPort: true,
      hmr: {
        overlay: true
      },
      
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, options) => {
            proxy.on('error', (err, req, res) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, res) => {
              if (isDevelopment) {
                console.log('📤 Proxy Request:', req.method, req.url);
              }
            });
            proxy.on('proxyRes', (proxyRes, req, res) => {
              if (isDevelopment) {
                console.log('📥 Proxy Response:', proxyRes.statusCode, req.url);
              }
            });
          }
        }
      }
    },
    
    build: {
      outDir: env.VITE_BUILD_OUT_DIR || 'dist',
      sourcemap: env.VITE_BUILD_SOURCEMAP !== 'false' && isDevelopment,
      minify: isProduction ? 'terser' : false,
      target: env.VITE_BUILD_TARGET || 'es2020',
      chunkSizeWarningLimit: Number.parseInt(env.VITE_BUILD_CHUNK_SIZE_WARNING_LIMIT) || 500,
      emptyOutDir: true,
      reportCompressedSize: true,
      cssCodeSplit: true,
      
      rollupOptions: {
        input: env.VITE_BUILD_ROLLUP_INPUT || 'src/main.jsx',
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react')) {
                return 'vendor-react';
              }
              if (id.includes('@emotion')) {
                return 'vendor-emotion';
              }
              if (id.includes('axios') || id.includes('fetch')) {
                return 'vendor-network';
              }
              if (id.includes('date-fns') || id.includes('moment')) {
                return 'vendor-dates';
              }
              if (id.includes('chart.js') || id.includes('recharts')) {
                return 'vendor-charts';
              }
              if (id.includes('qrcode') || id.includes('jsqr')) {
                return 'vendor-qr';
              }
              return 'vendor-other';
            }
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(name ?? '')) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/\.css$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          }
        }
      },
      
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.debug'] : []
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false
        }
      }
    },
    
    preview: {
      port: 4173,
      host: true,
      open: true
    },
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@emotion/react',
        '@emotion/styled',
        'clsx'
      ],
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
        '@styles': path.resolve(__dirname, './src/styles'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@constants': path.resolve(__dirname, './src/constants')
      },
      extensions: ['.js', '.jsx', '.json', '.ts', '.tsx']
    },
    
    css: {
      modules: {
        localsConvention: 'camelCase',
        generateScopedName: isProduction 
          ? '[hash:base64:8]' 
          : '[name]__[local]--[hash:base64:5]'
      },
      preprocessorOptions: {
        scss: {
          additionalData: `
            @import "${path.resolve(__dirname, './src/styles/variables.scss')}";
            @import "${path.resolve(__dirname, './src/styles/mixins.scss')}";
          `
        }
      },
      devSourcemap: isDevelopment
    },
    
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(env.VITE_APP_VERSION || '2.0.0'),
      'import.meta.env.VITE_APP_ENV': JSON.stringify(mode),
      'import.meta.env.VITE_APP_NAME': JSON.stringify(env.VITE_APP_NAME || 'Sistema de Inventario QR'),
      'import.meta.env.VITE_API_URL': JSON.stringify(backendUrl),
      'import.meta.env.VITE_MOCK_API': JSON.stringify(useMockApi),
      'import.meta.env.VITE_BUILD_TIMESTAMP': JSON.stringify(new Date().toISOString()),
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '2.0.0'),
      __APP_ENV__: JSON.stringify(mode),
      __APP_NAME__: JSON.stringify(env.VITE_APP_NAME || 'Sistema de Inventario QR'),
      __API_URL__: JSON.stringify(backendUrl),
      __MOCK_API__: JSON.stringify(useMockApi)
    },
    
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'html') {
          return { relative: true }
        }
        return { relative: false }
      }
    }
  };
});