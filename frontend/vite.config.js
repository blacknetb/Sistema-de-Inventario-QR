/**
 * vite.config.js - Configuración de Vite para Inventory QR System
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import compression from 'vite-plugin-compression';

export default defineConfig(({ command, mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
        plugins: [
            react({
                babel: {
                    plugins: [
                        ['@babel/plugin-proposal-decorators', { legacy: true }],
                        ['@babel/plugin-transform-runtime']
                    ]
                }
            }),
            compression({
                algorithm: 'gzip',
                ext: '.gz'
            }),
            compression({
                algorithm: 'brotliCompress',
                ext: '.br'
            }),
            // Visualizador de bundle (solo en análisis)
            mode === 'analyze' && visualizer({
                open: true,
                filename: 'dist/stats.html',
                gzipSize: true,
                brotliSize: true
            })
        ].filter(Boolean),
        
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
                '@components': path.resolve(__dirname, './src/components'),
                '@pages': path.resolve(__dirname, './src/pages'),
                '@services': path.resolve(__dirname, './src/services'),
                '@utils': path.resolve(__dirname, './src/utils'),
                '@hooks': path.resolve(__dirname, './src/hooks'),
                '@context': path.resolve(__dirname, './src/context'),
                '@assets': path.resolve(__dirname, './src/assets'),
                '@styles': path.resolve(__dirname, './src/styles')
            }
        },
        
        server: {
            port: 8080,
            host: true,
            open: true,
            cors: true,
            proxy: {
                '/api': {
                    target: env.VITE_API_URL || 'http://localhost:3000',
                    changeOrigin: true,
                    secure: false,
                    rewrite: (path) => path.replace(/^\/api/, '/api/v1')
                }
            }
        },
        
        build: {
            outDir: 'dist',
            sourcemap: mode === 'development',
            minify: 'terser',
            terserOptions: {
                compress: {
                    drop_console: mode === 'production',
                    drop_debugger: mode === 'production'
                }
            },
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['@fortawesome/react-fontawesome', 'react-hot-toast'],
                        utils: ['axios', 'date-fns', 'dayjs'],
                        qr: ['qrcode', 'html5-qrcode']
                    }
                }
            },
            target: 'es2020',
            chunkSizeWarningLimit: 1000
        },
        
        optimizeDeps: {
            include: [
                'react',
                'react-dom',
                'react-router-dom',
                'axios',
                'date-fns',
                'dayjs'
            ]
        },
        
        define: {
            'process.env': env
        },
        
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: './src/test/setup.js',
            coverage: {
                provider: 'v8',
                reporter: ['text', 'json', 'html'],
                exclude: [
                    'node_modules/**',
                    'dist/**',
                    '**/*.test.js',
                    '**/*.config.js'
                ]
            }
        }
    };
});