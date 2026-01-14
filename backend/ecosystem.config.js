/**
 * ✅ CONFIGURACIÓN PM2 MEJORADA - PROCES MANAGER
 * Correcciones aplicadas:
 * 1. Configuración optimizada para producción
 * 2. Mejor manejo de memoria y CPU
 * 3. Logging mejorado
 * 4. Configuración específica por entorno
 */

module.exports = {
  apps: [{
    // ✅ MEJORA: Nombre descriptivo y único
    name: 'inventory-qr-backend',
    
    // ✅ MEJORA: Script de entrada con validación
    script: './server.js',
    
    // ✅ MEJORA: Instancias optimizadas según CPU
    instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
    
    // ✅ MEJORA: Modo de ejecución según entorno
    exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',
    
    // ✅ MEJORA: Configuración de autorestart mejorada
    autorestart: true,
    watch: process.env.NODE_ENV === 'development',
    
    // ✅ MEJORA: Excluir directorios del watch
    ignore_watch: [
      'node_modules',
      'logs',
      'uploads',
      '.git',
      'tests',
      'coverage'
    ],
    
    // ✅ MEJORA: Opciones de watch mejoradas
    watch_options: {
      followSymlinks: false,
      usePolling: false,
      interval: 1000
    },
    
    // ✅ MEJORA: Restart por memoria optimizado
    max_memory_restart: process.env.NODE_ENV === 'production' ? '1.5G' : '512M',
    
    // ✅ MEJORA: Configuraciones por entorno mejoradas
    env: {
      // Desarrollo
      NODE_ENV: 'development',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=512',
      DEBUG: 'app:*',
      LOG_LEVEL: 'debug'
    },
    
    env_production: {
      // Producción - Configuraciones optimizadas
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1536 --trace-warnings',
      UV_THREADPOOL_SIZE: 64,
      LOG_LEVEL: 'info',
      FORCE_COLOR: 0, // Sin colores en producción
      NODE_NO_WARNINGS: 1 // Suprimir warnings en producción
    },
    
    env_staging: {
      // Staging - Configuraciones intermedias
      NODE_ENV: 'staging',
      PORT: 3001,
      NODE_OPTIONS: '--max-old-space-size=1024',
      LOG_LEVEL: 'debug',
      NODE_NO_WARNINGS: 0 // Mostrar warnings en staging
    },
    
    env_test: {
      // Testing - Configuraciones para tests
      NODE_ENV: 'test',
      PORT: 3002,
      NODE_OPTIONS: '--max-old-space-size=512',
      LOG_LEVEL: 'error'
    },
    
    // ✅ MEJORA: Logging mejorado con rotación
    error_file: './logs/pm2/error.log',
    out_file: './logs/pm2/out.log',
    log_file: './logs/pm2/combined.log',
    
    // ✅ MEJORA: Configuración de logs avanzada
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    log_type: 'json', // Logs en formato JSON para mejor análisis
    log_size: 10485760, // 10MB por archivo de log
    
    // ✅ MEJORA: Configuración de tiempo optimizada
    kill_timeout: 8000, // Tiempo para shutdown graceful
    wait_ready: true, // Esperar señal ready de la app
    listen_timeout: 10000, // Timeout para listen
    shutdown_with_message: true, // Shutdown con mensaje
    
    // ✅ MEJORA: Configuración de restarts inteligente
    max_restarts: 10, // Máximo de restarts
    min_uptime: '30s', // Tiempo mínimo entre restarts
    restart_delay: 5000, // Delay entre restarts
    
    // ✅ MEJORA: Configuración de cron (para tareas programadas)
    cron_restart: process.env.NODE_ENV === 'production' ? '0 3 * * *' : '', // Restart diario a las 3AM
    
    // ✅ MEJORA: Variables de entorno adicionales
    env_staging_production: {
      NODE_ENV: 'staging',
      PORT: 3003,
      NODE_OPTIONS: '--max-old-space-size=1024'
    },
    
    // ✅ MEJORA: Post-update hooks
    post_update: ["npm install --production", "npm run migrate"],
    
    // ✅ MEJORA: Source map support para debugging
    source_map_support: true,
    
    // ✅ MEJORA: Configuración de interpreter
    interpreter: 'node',
    interpreter_args: process.env.NODE_ENV === 'production' ? 
      '--enable-source-maps' : '--inspect=0.0.0.0:9229',
    
    // ✅ MEJORA: Configuración de TZ (Time Zone)
    TZ: 'America/Costa_Rica',
    
    // ✅ MEJORA: Métricas de PM2
    pmx: true, // Habilitar module de métricas
    
    // ✅ MEJORA: Variables específicas de la aplicación
    instance_var: 'INSTANCE_ID'
  }],
  
  // ✅ MEJORA: Configuración de deploy (opcional)
  deploy: {
    production: {
      user: 'node',
      host: ['server1.example.com', 'server2.example.com'],
      ref: 'origin/main',
      repo: 'https://github.com/yourusername/inventory-qr-backend.git',
      path: '/var/www/inventory-qr-backend',
      'post-deploy': 'npm install --production && npm run migrate && pm2 reload ecosystem.config.js --env production',
      'pre-deploy-local': "echo 'Deploying to production servers'",
      env: {
        NODE_ENV: 'production'
      }
    },
    staging: {
      user: 'node',
      host: 'staging.example.com',
      ref: 'origin/develop',
      repo: 'https://github.com/yourusername/inventory-qr-backend.git',
      path: '/var/www/inventory-qr-backend-staging',
      'post-deploy': 'npm install --production && npm run migrate && pm2 reload ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};